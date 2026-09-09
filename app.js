import { defaults, normalizePreferences, calculateFrame, fitRenderer } from './layout.js';

const $ = (id) => document.getElementById(id);
const viewport = $('viewport');
const frame = $('terminal');
const panel = $('settings');
const key = 'ptt-pocket-layout-v1';
let preferences;
try { preferences = normalizePreferences(JSON.parse(localStorage.getItem(key))); }
catch { preferences = { ...defaults }; }
let scheduled = false;

function updateLayout() {
  scheduled = false;
  const vv = window.visualViewport;
  const width = vv?.width ?? document.documentElement.clientWidth;
  const height = vv?.height ?? window.innerHeight;
  // Absolute positioning uses page coordinates, including browser focus panning.
  Object.assign(viewport.style, {
    width: `${width}px`, height: `${height}px`,
    left: `${vv?.pageLeft ?? window.scrollX}px`,
    top: `${vv?.pageTop ?? window.scrollY}px`,
  });
  const stage = $('stage');
  const box = calculateFrame(stage.clientWidth, stage.clientHeight, preferences);
  const renderer = fitRenderer(box);
  Object.assign(frame.style, {
    left: `${box.left}px`, top: `${box.top}px`,
    width: `${renderer.width}px`, height: `${renderer.height}px`,
    transform: `scale(${renderer.scale})`,
  });
  const facts = [
    ['可見區域', `${Math.round(width)} × ${Math.round(height)}`],
    ['終端框架', `${Math.round(box.width)} × ${Math.round(box.height)}`],
    ['框架縮放', `${Math.round(renderer.scale * 100)}%`],
    ['可見區域位移', `${Math.round(vv?.offsetTop ?? 0)} px`],
    ['自動調整', vv ? 'Visual Viewport' : '視窗尺寸（備援）'],
  ];
  $('diagnostics').replaceChildren(...facts.flatMap(([name, value]) => {
    const dt = document.createElement('dt'); dt.textContent = name;
    const dd = document.createElement('dd'); dd.textContent = value;
    return [dt, dd];
  }));
}
function scheduleLayout() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateLayout); }
}
function syncControls() {
  for (const name of ['width', 'topSpace']) $(name).value = preferences[name];
}
function savePreferences(sync = true) {
  try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Private mode can deny storage. */ }
  if (sync) syncControls();
  scheduleLayout();
}
function setPanel(open) {
  panel.hidden = !open;
  $('settings-toggle').setAttribute('aria-expanded', String(open));
  if (open) $('settings-close').focus();
  else $('settings-toggle').focus();
}
$('settings-toggle').addEventListener('click', () => setPanel(panel.hidden));
$('settings-close').addEventListener('click', () => setPanel(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !panel.hidden) setPanel(false);
});
for (const name of ['width', 'topSpace']) {
  const input = $(name);
  input.addEventListener('input', () => {
    // Allow temporary empty/invalid text while typing; only apply valid integers.
    if (!input.validity.valid || !Number.isSafeInteger(input.valueAsNumber)) return;
    preferences = normalizePreferences({ ...preferences, [name]: input.valueAsNumber });
    savePreferences(false);
  });
  input.addEventListener('blur', () => {
    const value = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : preferences[name];
    preferences = normalizePreferences({ ...preferences, [name]: value });
    savePreferences();
  });
}
$('reset').addEventListener('click', () => { preferences = { ...defaults }; savePreferences(); });
frame.addEventListener('load', () => {
  // Cross-origin iframe load does not prove that the terminal or WebSocket works.
  $('load-status').textContent = '框架載入事件已收到；連線是否成功，請以終端畫面為準。';
});
for (const event of ['resize', 'scroll']) {
  window.addEventListener(event, scheduleLayout, { passive: true });
  window.visualViewport?.addEventListener(event, scheduleLayout, { passive: true });
}
window.addEventListener('pageshow', scheduleLayout);
window.addEventListener('orientationchange', scheduleLayout);
if ('ResizeObserver' in window) new ResizeObserver(scheduleLayout).observe($('toolbar'));
syncControls();
updateLayout();
