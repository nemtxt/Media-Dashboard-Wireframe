/* Media Dashboard V3.1 — visual motion layer.
   Non-destructive decoration: all records, filters, routes and modals stay managed by index.html.
   Zero dependencies. No network calls or Airtable writes. */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const storageKey = 'media-dashboard-motion';
  const isReduced = () => !!media?.matches;
  let saved = null;
  try { saved = window.localStorage.getItem(storageKey); } catch (_) {}
  let manualPreference = saved === 'off' ? false : saved === 'on' ? true : null;
  let enabled = false;

  const actions = document.querySelector('.top-actions');
  if (!actions || document.getElementById('motionToggle')) return;

  const button = document.createElement('button');
  button.id = 'motionToggle';
  button.type = 'button';
  button.className = 'motion-toggle';
  button.innerHTML =
    '<span class="motion-toggle-icon" aria-hidden="true"><i></i><i></i><i></i></span>'+
    '<span class="motion-toggle-label">Motion on</span>';
  const badge = actions.querySelector('.demo');
  if (badge) actions.insertBefore(button, badge);
  else actions.prepend(button);

  function updateToggle() {
    enabled = !isReduced() && manualPreference !== false;
    root.classList.toggle('motion-paused', !enabled);
    button.setAttribute('aria-pressed', String(enabled));
    if (isReduced()) {
      button.disabled = true;
      button.querySelector('.motion-toggle-label').textContent = 'Reduced motion';
      button.setAttribute('aria-label', 'Reduced motion is enabled in your device settings');
      button.title = 'Motion effects are disabled by system accessibility preferences';
    } else {
      button.disabled = false;
      button.querySelector('.motion-toggle-label').textContent = enabled ? 'Motion on' : 'Motion off';
      button.setAttribute('aria-label', enabled ? 'Pause decorative motion effects' : 'Enable decorative motion effects');
      button.title = enabled ? 'Pause motion graphics' : 'Enable motion graphics';
    }
  }
  button.addEventListener('click', () => {
    if (isReduced()) return;
    manualPreference = !enabled;
    try { window.localStorage.setItem(storageKey, manualPreference ? 'on' : 'off'); } catch (_) {}
    updateToggle();
    if (enabled) activateVisibleCharts();
  });
  if (media) {
    if (typeof media.addEventListener === 'function')
      media.addEventListener('change', updateToggle);
    else if (typeof media.addListener === 'function')
      media.addListener(updateToggle);
  }
  updateToggle();

  const heroArt = [
    '<div class="studio-light" aria-hidden="true"></div>',
    '<div class="studio-motion-art" aria-hidden="true">',
      '<div class="studio-halo"></div>',
      '<div class="studio-core"><span>MEDIA</span>',
        '<div class="studio-equalizer"><i></i><i></i><i></i><i></i></div>',
      '</div>',
      '<span class="studio-note studio-note--top">CREATE</span>',
      '<span class="studio-note studio-note--bottom">PUBLISH</span>',
      '<span class="studio-star"></span>',
    '</div>'
  ].join('');

  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || !entry.target.closest('.page.active')) return;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -12px 0px' });
  }

  const watched = new WeakSet();
  const animatedNumbers = new WeakSet();
  function animateNumber(el) {
    if (!enabled || !window.requestAnimationFrame || animatedNumbers.has(el)) return;
    const finalText = el.textContent.trim();
    const match = /^([₱$]?)([\d,]+(?:\.\d+)?)(\s*[^\d]*)$/.exec(finalText);
    if (!match) return;
    const target = Number(match[2].replaceAll(',', ''));
    if (!Number.isFinite(target) || target < 0 || target > 10000000) return;
    const fractionDigits = (match[2].split('.')[1] || '').length;
    const formatting = {minimumFractionDigits:fractionDigits,maximumFractionDigits:fractionDigits};
    const format = n => match[1] + n.toLocaleString('en-US', formatting) + match[3];
    const begin = performance.now();
    const duration = 660;
    animatedNumbers.add(el);
    function frame(t) {
      if (!el.isConnected || !enabled) {
        if (el.isConnected) el.textContent = finalText;
        return;
      }
      const phase = Math.min(1, (t - begin) / duration);
      const ease = 1 - Math.pow(1 - phase, 3);
      el.textContent = format(target * ease);
      if (phase < 1) window.requestAnimationFrame(frame);
      else el.textContent = finalText;
    }
    window.requestAnimationFrame(frame);
  }

  function activateVisibleCharts() {
    const active = document.querySelector('.page.active');
    if (!active) return;
    active.querySelectorAll('.panel').forEach(panel => {
      if (watched.has(panel)) return;
      watched.add(panel);
      if (observer) observer.observe(panel);
      else panel.classList.add('is-inview');
    });
  }

  function decorate() {
    const hero = document.querySelector('#overview .hero');
    if (hero && !hero.querySelector('.studio-motion-art')) {
      hero.insertAdjacentHTML('beforeend', heroArt);
      hero.addEventListener('pointermove', e => {
        if (!enabled || e.pointerType === 'touch') return;
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--studio-x', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
        hero.style.setProperty('--studio-y', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
      }, {passive:true});
      hero.addEventListener('pointerleave', () => {
        hero.style.removeProperty('--studio-x');
        hero.style.removeProperty('--studio-y');
      }, {passive:true});
    }
    const active = document.querySelector('.page.active');
    if (!active) return;
    active.querySelectorAll('.ticket-thumb').forEach(thumb => {
      if (thumb.querySelector('.studio-preview-mark')) return;
      const kind = thumb.querySelector('.thumb-type')?.textContent.trim().toLowerCase() || '';
      const art = kind === 'production' ? '▶' : kind === 'content' ? '✦' : kind === 'request' ? 'R' : '✳';
      const lines = document.createElement('span');
      lines.className = 'studio-preview-lines';
      lines.setAttribute('aria-hidden','true');
      const mark = document.createElement('span');
      mark.className = 'studio-preview-mark';
      mark.setAttribute('aria-hidden','true');
      mark.textContent = art;
      thumb.append(lines,mark);
    });
    activateVisibleCharts();
    active.querySelectorAll('.stat > strong').forEach(animateNumber);
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    const defer = window.requestAnimationFrame || (fn => Promise.resolve().then(fn));
    defer(() => {pending = false;decorate();});
  }

  const target = document.querySelector('.content') || document.querySelector('.main');
  if (target && 'MutationObserver' in window) {
    const changes = new MutationObserver(records => {
      if (records.some(r => r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].some(n => n.nodeType === 1)))
        schedule();
    });
    changes.observe(target, {subtree:true,childList:true});
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
})();