/* Media Dashboard V3.11 — navigation reliability and keyboard accessibility.
 * A read-only enhancement over V3.9. No new data sources, page routes or records.
 */
(() => {
  'use strict';
  const bridge = window.MediaDashboardV35Bridge;
  const sidebar = document.getElementById('sidebar');
  const menu = document.getElementById('menubtn');
  const shade = document.getElementById('mobileShade');
  const heading = document.getElementById('page-title');
  const overlay = document.getElementById('overlay');
  const headerSearch = document.getElementById('search');
  const mobileSearch = document.getElementById('mobileSearch');
  if (!bridge || !sidebar || !menu || !heading) return;

  const routes = ['overview','content','performance','ads','website','strategy','calendar','settings'];
  const labels = {
    overview:'Overview',content:'Content Pipeline',performance:'Performance',
    ads:'Paid Ads',website:'Website & SEO',strategy:'Strategy & Ops',
    calendar:'Calendar & Team',settings:'Settings & Data'
  };
  const pages = routes.map(id => document.getElementById(id)).filter(Boolean);
  const smallScreen = window.matchMedia('(max-width:1020px)');
  const narrowScreen = window.matchMedia('(max-width:700px)');

  // V3.6 hides the legacy .filters container; V2's mobile search lived there.
  // Move the existing, already-wired search field into the visible page heading.
  // This preserves a single source of search state and prevents a mobile-only dead end.
  const mobileSearchWrapper = mobileSearch?.closest('.mobile-search');
  const pageHeading = document.querySelector('.pageheading');
  if (mobileSearchWrapper && pageHeading) pageHeading.appendChild(mobileSearchWrapper);

  const skip = document.createElement('a');
  skip.className = 'v310-skip';
  skip.href = '#page-title';
  skip.textContent = 'Skip to dashboard content';
  document.body.insertBefore(skip, document.body.firstChild);
  heading.setAttribute('tabindex','-1');
  skip.addEventListener('click', event => {
    event.preventDefault(); // Preserve the dashboard URL hash.
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start',behavior:'instant'});
  });

  const status = document.createElement('span');
  status.className = 'v310-sr-only';
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  status.setAttribute('aria-atomic','true');
  document.querySelector('.topbar')?.appendChild(status);

  menu.setAttribute('aria-controls','sidebar');
  menu.setAttribute('aria-haspopup','true');
  function syncMenu() {
    const mobile = smallScreen.matches;
    if (!mobile && sidebar.classList.contains('show')) {
      sidebar.classList.remove('show');
      shade?.classList.remove('show');
    }
    const open = mobile && sidebar.classList.contains('show');
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    sidebar.inert = mobile && !open;
    const collapse = document.getElementById('collapseNav');
    if (collapse) {
      collapse.setAttribute('aria-controls','sidebar');
      collapse.setAttribute('aria-expanded',String(!document.body.classList.contains('nav-collapsed')));
    }
  }
  const menuObserver = new MutationObserver(syncMenu);
  menuObserver.observe(sidebar,{attributes:true,attributeFilter:['class']});
  menuObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  smallScreen.addEventListener?.('change',syncMenu);
  syncMenu();

  menu.addEventListener('click',() => {
    queueMicrotask(() => {
      syncMenu();
      if (smallScreen.matches && sidebar.classList.contains('show')) {
        sidebar.querySelector('.navbtn.active')?.focus({preventScroll:true});
      }
    });
  });
  shade?.addEventListener('click',() => {
    queueMicrotask(() => {syncMenu();menu.focus({preventScroll:true});});
  });

  let lastPage = pages.find(p => p.classList.contains('active'))?.id || 'overview';
  let comingFromURL = false;
  function routeInURL() {
    if (!location.hash) return 'overview';
    if (!location.hash.startsWith('#/')) return null;
    const key = location.hash.slice(2);
    return routes.includes(key) ? key : null;
  }
  function updateDocumentTitle(id) {
    document.title = labels[id]+' · Media Dashboard V3.13';
  }
  updateDocumentTitle(lastPage);

  function syncRoute() {
    const now = pages.find(p => p.classList.contains('active'))?.id;
    if (!now || now === lastPage) return;
    lastPage = now;
    updateDocumentTitle(now);
    status.textContent = labels[now]+' dashboard loaded';
    if (comingFromURL) {
      comingFromURL = false;
      return;
    }
    if (routeInURL() === now) return;
    try {
      history.pushState(history.state,'',location.pathname+location.search+'#/'+now);
    } catch (_) { /* Static file previews can refuse history mutations. */ }
  }
  const routeObserver = new MutationObserver(syncRoute);
  pages.forEach(el => routeObserver.observe(el,{attributes:true,attributeFilter:['class']}));

  function restoreURLRoute() {
    const route = routeInURL();
    if (!route || route === pages.find(p => p.classList.contains('active'))?.id) return;
    comingFromURL = true;
    bridge.navigate(route);
  }
  window.addEventListener('popstate',restoreURLRoute);
  window.addEventListener('hashchange',restoreURLRoute);
  restoreURLRoute();

  // Move focus out of a menu that is about to become hidden after navigation.
  sidebar.addEventListener('click',event => {
    if (!event.target.closest('[data-open]')) return;
    requestAnimationFrame(() => {
      if (!overlay?.classList.contains('open')) heading.focus({preventScroll:true});
      syncMenu();
    });
  });

  const editable = el => Boolean(el?.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'));
  document.addEventListener('keydown',event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey &&
        !editable(event.target) && !overlay?.classList.contains('open')) {
      const search = narrowScreen.matches ? mobileSearch : headerSearch;
      if (search) {event.preventDefault();search.focus();search.select();}
      return;
    }
    if (event.key === 'Escape' && event.target === (narrowScreen.matches ? mobileSearch : headerSearch) &&
        event.target.value && !overlay?.classList.contains('open')) {
      event.target.value = '';
      event.target.dispatchEvent(new Event('input',{bubbles:true}));
      event.target.blur();
    }
    if (event.key === 'Escape' && smallScreen.matches && sidebar.classList.contains('show') &&
        !overlay?.classList.contains('open')) {
      queueMicrotask(() => menu.focus({preventScroll:true}));
    }
    if (event.key !== 'Tab' || !smallScreen.matches || !sidebar.classList.contains('show') ||
        overlay?.classList.contains('open')) return;
    const focusable = [...sidebar.querySelectorAll('button:not([disabled]),a[href]')]
      .filter(el => !el.inert && getComputedStyle(el).display !== 'none');
    if (!focusable.length) return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
      event.preventDefault();last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
      event.preventDefault();first.focus();
    }
  },true);

  const scopeStatus = document.getElementById('v36ScopeStatus');
  scopeStatus?.setAttribute('aria-live','polite');
  window.MediaDashboardV310 = Object.freeze({version:'3.10.0',readOnly:true,routes:[...routes]});
})();
