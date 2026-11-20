/* V3.15: move the previously wired collapse button into the dashboard top bar.
 * Preserve the original event, focus behavior, and mobile hamburger. */
(() => {
 'use strict';
 const button=document.getElementById('collapseNav');
 const topbar=document.querySelector('.main .topbar');
 const breadcrumb=topbar?.querySelector('.breadcrumb');
 if(!button||!topbar||!breadcrumb)return;
 topbar.insertBefore(button,breadcrumb);
 button.classList.remove('v313-edge-toggle');
 button.classList.add('v315-top-toggle');
 button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M9.5 5v14"/></svg>';
 button.setAttribute('aria-controls','sidebar');
 window.MediaDashboardV315=Object.freeze({readOnly:true,sidebarStyle:'black-reference',topBarCollapse:true});
})();
