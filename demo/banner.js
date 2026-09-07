/**
 * Small persistent badge that tells the viewer this build has no backend.
 * Only rendered in demo mode.
 */
import { DEMO } from './mode.js'

if (DEMO) {
  const onPage = /\/pages\//.test(location.pathname)
  const menuHref = onPage ? './main-menu.html' : './pages/main-menu.html'
  const isEntry = !onPage || /login\.html$/.test(location.pathname)

  const style = document.createElement('style')
  style.textContent = `
    .demo-badge{position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;align-items:center;
      gap:10px;padding:8px 12px;border-radius:999px;background:rgba(15,7,25,.86);
      border:1px solid rgba(192,132,252,.45);color:#e9d5ff;font:600 12px/1.2 system-ui,sans-serif;
      backdrop-filter:blur(6px);box-shadow:0 6px 20px rgba(0,0,0,.4)}
    .demo-badge__dot{width:8px;height:8px;border-radius:50%;background:#c084fc;
      box-shadow:0 0 8px #c084fc;flex:none}
    .demo-badge a{color:#f5d0fe;text-decoration:underline;text-underline-offset:2px}
    @media (max-width:640px){.demo-badge{left:8px;bottom:8px;font-size:11px;padding:6px 10px}}
  `
  document.head.appendChild(style)

  const badge = document.createElement('div')
  badge.className = 'demo-badge'
  badge.innerHTML = `<span class="demo-badge__dot"></span><span>Static demo — fixture data, no server${
    isEntry ? ` · <a href="${menuHref}">enter as DemoPlayer</a>` : ''
  }</span>`
  document.body.appendChild(badge)
}
