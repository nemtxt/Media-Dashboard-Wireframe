/* Media Dashboard V3.2 · cinematic intro controller
   UI only. No remote calls, no data mutation, no third-party runtime. */
(() => {
  'use strict';
  const root = document.documentElement;
  const intro = document.getElementById('introSplash');
  const skip = document.getElementById('introSkip');
  const app = document.querySelector('.app');
  const actions = document.querySelector('.top-actions');
  if (!intro || !skip || !app || !actions) return;

  const storageKey = 'media-dashboard-intro-v32';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const hasReducedMotion = () => !!reduced?.matches;
  const INTRO_DURATION = 2850;
  const EXIT_DURATION = 720;
  let introTimer = null;
  let exitTimer = null;
  let playing = false;
  let exiting = false;
  let replaySource = null;
  let initial = true;
  let previousOverflow = '';

  function markSeen() {
    try { window.sessionStorage.setItem(storageKey, 'seen'); } catch (_) {}
  }
  function focusDashboard() {
    const title = document.getElementById('page-title');
    if (!title) return;
    title.setAttribute('tabindex','-1');
    title.focus({preventScroll:true});
  }
  function restoreFocus() {
    if (replaySource?.isConnected) {
      replaySource.focus({preventScroll:true});
    } else if (initial) {
      focusDashboard();
    }
    replaySource = null;
  }
  function finish() {
    window.clearTimeout(introTimer);
    window.clearTimeout(exitTimer);
    if (!playing) return;
    playing = false;
    exiting = false;
    root.classList.add('intro-skip');
    root.classList.remove('intro-active');
    intro.classList.remove('is-exiting');
    intro.setAttribute('aria-hidden','true');
    app.inert = false;
    document.body.style.overflow = previousOverflow;
    markSeen();
    restoreFocus();
    initial = false;
  }
  function exit({immediate=false}={}) {
    if (!playing || exiting) return;
    window.clearTimeout(introTimer);
    if (immediate || hasReducedMotion()) { finish(); return; }
    exiting = true;
    intro.classList.add('is-exiting');
    exitTimer = window.setTimeout(finish, EXIT_DURATION);
  }
  function start(source=null) {
    if (playing) return;
    if (hasReducedMotion()) {
      root.classList.add('intro-skip');
      intro.setAttribute('aria-hidden','true');
      markSeen();
      return;
    }
    replaySource = source;
    previousOverflow = document.body.style.overflow;
    intro.classList.remove('is-exiting','is-complete');
    intro.setAttribute('aria-hidden','false');
    // Restart CSS keyframes for every manual replay.
    root.classList.add('intro-skip');
    void intro.offsetWidth;
    root.classList.remove('intro-skip');
    root.classList.add('intro-active');
    app.inert = true;
    document.body.style.overflow = 'hidden';
    playing = true;
    exiting = false;
    skip.focus({preventScroll:true});
    introTimer = window.setTimeout(()=>exit(), INTRO_DURATION);
  }

  const replay = document.createElement('button');
  replay.type = 'button';
  replay.id = 'introReplay';
  replay.className = 'intro-replay-btn';
  replay.setAttribute('aria-label','Replay creative splash screen');
  replay.setAttribute('title','Replay the opening animation');
  replay.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z"/></svg>'+
    '<span>Replay intro</span>';
  const before = actions.querySelector('#motionToggle') || actions.querySelector('.demo');
  actions.insertBefore(replay, before);
  function syncReduced() {
    replay.disabled = hasReducedMotion();
    replay.title = hasReducedMotion() ? 'Intro motion disabled by device accessibility preferences' : 'Replay the opening animation';
    if (playing && hasReducedMotion()) exit({immediate:true});
  }
  syncReduced();
  reduced?.addEventListener?.('change',syncReduced);
  replay.addEventListener('click',()=>start(replay));
  skip.addEventListener('click',()=>exit({immediate:true}));
  intro.addEventListener('keydown',event=>{
    if (event.key==='Escape') {
      event.preventDefault();
      exit({immediate:true});
    }
    if (event.key==='Tab' && playing) {
      // The splash exposes one interactive control; keep focus within it.
      event.preventDefault();
      skip.focus({preventScroll:true});
    }
  });

  let seen = root.classList.contains('intro-skip');
  try {
    if (window.sessionStorage.getItem(storageKey)==='seen'
        && !new URLSearchParams(window.location.search).has('intro')) seen = true;
  } catch (_) {}
  if (hasReducedMotion()) seen = true;
  if (seen) {
    root.classList.add('intro-skip');
    intro.setAttribute('aria-hidden','true');
    markSeen();
    initial=false;
  } else {
    start();
  }
})();