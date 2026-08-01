/**
 * OOTD – Bootstrap und Tab-Routing.
 */

import { initUI, renderAll } from './ui.js';

const tabs = Array.from(document.querySelectorAll('.tab'));
const pill = document.querySelector('.tabs__pill');

/** Schiebt die Hintergrund-Pille unter den aktiven Tab. */
function movePill(tab) {
  if (!pill || !tab) return;
  // offsetLeft ist bereits relativ zur positionierten .tabs__list.
  pill.style.width = `${tab.offsetWidth}px`;
  pill.style.transform = `translateX(${tab.offsetLeft}px)`;
}

function activateTab(name, { focus = false } = {}) {
  const tab = tabs.find((t) => t.dataset.tab === name);
  if (!tab) return;

  for (const t of tabs) {
    const isActive = t === tab;
    t.classList.toggle('is-active', isActive);
    t.setAttribute('aria-selected', String(isActive));
    t.tabIndex = isActive ? 0 : -1;

    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
    if (isActive) {
      // Einblend-Animationen bei jedem Wechsel neu abspielen.
      for (const node of panel.querySelectorAll('.fade-up')) {
        node.style.animation = 'none';
        void node.offsetWidth;
        node.style.animation = '';
      }
    }
  }

  movePill(tab);
  if (focus) tab.focus();
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

for (const tab of tabs) {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
}

// Pfeiltasten-Navigation zwischen den Tabs (WAI-ARIA Tabs-Pattern).
document.querySelector('.tabs__list')?.addEventListener('keydown', (event) => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  event.preventDefault();
  const current = tabs.findIndex((t) => t.classList.contains('is-active'));
  const next = tabs[(current + step + tabs.length) % tabs.length];
  activateTab(next.dataset.tab, { focus: true });
});

// Querverweise aus dem Inhalt heraus, z. B. "Zur Garderobe".
for (const link of document.querySelectorAll('[data-goto-tab]')) {
  link.addEventListener('click', () => activateTab(link.dataset.gotoTab, { focus: true }));
}
// Dasselbe aus dynamisch erzeugtem Markup, das ui.js als Ereignis meldet.
document.addEventListener('ootd:goto-tab', (event) => activateTab(event.detail, { focus: true }));

/** Datum ausgeschrieben in den Kopf des Heute-Tabs schreiben. */
function renderTodayDate() {
  const node = document.getElementById('today-date');
  if (!node) return;
  node.textContent = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function syncPill() {
  movePill(tabs.find((t) => t.classList.contains('is-active')));
}

window.addEventListener('resize', syncPill);
document.fonts?.ready.then(syncPill);

renderTodayDate();
initUI();
activateTab('today');
