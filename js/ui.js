/**
 * OOTD – Rendering der Garderobe, Formular-Logik, Toasts.
 *
 * Alles, was DOM anfasst. Importiert Daten (catalog, store, seed-data)
 * und Darstellung (svg), aber niemals umgekehrt.
 */

import {
  CATEGORIES, CATEGORY_BY_KEY, SUBTYPES, COLOR_PRESETS, PATTERNS,
  FORMALITY_LABELS, WARMTH_LABELS, colorNameFor,
} from './catalog.js';
import {
  getGarments, getGarment, addGarment, updateGarment, removeGarment,
  replaceGarments, isPersistent,
} from './store.js';
import { garmentSvg, patternSwatch } from './svg.js';
import { SEED_GARMENTS } from './seed-data.js';

const el = (id) => document.getElementById(id);

const dom = {};
let currentFilter = 'all';
let editingId = null;

/* --------------------------------------------------------------------------
   Toasts
   -------------------------------------------------------------------------- */

export function toast(message) {
  const stack = el('toast-stack');
  if (!stack) return;
  const node = document.createElement('p');
  node.className = 'toast';
  node.textContent = message;
  stack.append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    setTimeout(() => node.remove(), 320);
  }, 2400);
}

/* --------------------------------------------------------------------------
   Bestätigungsdialog
   -------------------------------------------------------------------------- */

function confirmDelete(name) {
  const dialog = el('confirm-dialog');
  el('confirm-text').textContent = `„${name}“ wird aus deiner Garderobe entfernt.`;

  return new Promise((resolve) => {
    const finish = (answer) => {
      dialog.removeEventListener('click', onClick);
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
      document.body.classList.remove('has-modal');
      resolve(answer);
    };
    const onClick = (event) => {
      const button = event.target.closest('[data-confirm]');
      if (button) finish(button.dataset.confirm === 'yes');
    };
    const onCancel = () => finish(false);

    dialog.addEventListener('click', onClick);
    dialog.addEventListener('cancel', onCancel);
    document.body.classList.add('has-modal');
    dialog.showModal();
  });
}

/* --------------------------------------------------------------------------
   Garderobe rendern
   -------------------------------------------------------------------------- */

function formalityDots(level) {
  return Array.from({ length: 3 }, (_, i) =>
    `<span class="dot-scale__dot${i < level ? ' is-on' : ''}"></span>`).join('');
}

function garmentCard(garment) {
  const category = CATEGORY_BY_KEY[garment.category];
  const patternLabel = PATTERNS.find((p) => p.key === garment.pattern)?.label || '';
  const subtitle = [garment.subtype, garment.colorName].filter(Boolean).join(' · ');

  return `
    <article class="garment" data-id="${garment.id}">
      <div class="garment__figure">${garmentSvg(garment)}</div>
      <div class="garment__body">
        <h3 class="garment__name">${escapeHtml(garment.name)}</h3>
        <p class="garment__sub">${escapeHtml(subtitle)}</p>
        <p class="garment__tags">
          <span class="badge">${category ? category.label : ''}</span>
          ${garment.pattern !== 'solid' ? `<span class="badge badge--soft">${patternLabel}</span>` : ''}
        </p>
        <p class="dot-scale" title="Anlass: ${FORMALITY_LABELS[garment.formality]}">
          <span class="dot-scale__label">${FORMALITY_LABELS[garment.formality]}</span>
          ${formalityDots(garment.formality)}
        </p>
      </div>
      <div class="garment__actions">
        <button class="icon-btn icon-btn--sm" type="button" data-action="edit"
                aria-label="${escapeHtml(garment.name)} bearbeiten">✎</button>
        <button class="icon-btn icon-btn--sm" type="button" data-action="delete"
                aria-label="${escapeHtml(garment.name)} löschen">🗑</button>
      </div>
    </article>`;
}

export function renderWardrobe() {
  const all = getGarments();
  const visible = currentFilter === 'all' ? all : all.filter((g) => g.category === currentFilter);

  dom.grid.innerHTML = visible.map(garmentCard).join('');
  dom.count.textContent = all.length === 1 ? '1 Teil' : `${all.length} Teile`;

  dom.emptyAll.hidden = all.length > 0;
  dom.emptyFilter.hidden = all.length === 0 || visible.length > 0;
  dom.fab.hidden = !document.getElementById('panel-wardrobe').classList.contains('is-active');
}

/* --------------------------------------------------------------------------
   Formular: Optionen aufbauen
   -------------------------------------------------------------------------- */

function buildCategoryOptions() {
  dom.categoryRow.innerHTML = CATEGORIES.map((c) => `
    <label class="opt">
      <input type="radio" name="category" value="${c.key}">
      <span class="opt__box">
        <span class="opt__icon" aria-hidden="true">${c.icon}</span>
        <span class="opt__text">${c.label}</span>
      </span>
    </label>`).join('');
}

function buildPatternOptions() {
  dom.patternRow.innerHTML = PATTERNS.map((p) => `
    <label class="opt opt--pattern">
      <input type="radio" name="pattern" value="${p.key}">
      <span class="opt__box">
        <span class="opt__swatch" data-pattern="${p.key}"></span>
        <span class="opt__text">${p.label}</span>
      </span>
    </label>`).join('');
}

function colorRowMarkup(groupName) {
  return COLOR_PRESETS.map((c) => `
    <label class="color-opt">
      <input type="radio" name="${groupName}" value="${c.hex}">
      <span class="color-opt__dot" style="--swatch:${c.hex}" title="${c.name}"></span>
      <span class="visually-hidden">${c.name}</span>
    </label>`).join('');
}

/** Muster-Plättchen in den Chips an die aktuell gewählten Farben anpassen. */
function refreshPatternSwatches(color, patternColor) {
  for (const holder of dom.patternRow.querySelectorAll('.opt__swatch')) {
    holder.innerHTML = patternSwatch(holder.dataset.pattern, color, patternColor);
  }
}

function populateSubtypes(category, selected) {
  const list = SUBTYPES[category] || [];
  dom.subtype.innerHTML = [
    ...list.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`),
    '<option value="__custom">Andere …</option>',
  ].join('');

  if (selected && list.includes(selected)) {
    dom.subtype.value = selected;
    dom.subtypeCustom.hidden = true;
    dom.subtypeCustom.value = '';
  } else if (selected) {
    dom.subtype.value = '__custom';
    dom.subtypeCustom.hidden = false;
    dom.subtypeCustom.value = selected;
  } else {
    dom.subtype.selectedIndex = 0;
    dom.subtypeCustom.hidden = true;
    dom.subtypeCustom.value = '';
  }
}

/* --------------------------------------------------------------------------
   Formular: lesen, spiegeln, Vorschau
   -------------------------------------------------------------------------- */

function checkedValue(name, fallback) {
  return dom.form.querySelector(`input[name="${name}"]:checked`)?.value ?? fallback;
}

function readForm() {
  const category = checkedValue('category', 'top');
  const pattern = checkedValue('pattern', 'solid');
  const color = checkedValue('color', null) ?? dom.colorCustom.value;
  const patternColor = checkedValue('patternColor', null) ?? dom.patternColorCustom.value;
  const subtype = dom.subtype.value === '__custom'
    ? dom.subtypeCustom.value.trim()
    : dom.subtype.value;

  return {
    name: dom.name.value.trim(),
    category,
    subtype,
    color,
    colorName: colorNameFor(color),
    pattern,
    patternColor: pattern === 'solid' ? null : patternColor,
    formality: Number(checkedValue('formality', 2)),
    warmth: Number(dom.warmth.value),
  };
}

/** Preset-Auswahl und Color-Input synchron halten. */
function selectColor(groupName, hex, customInput) {
  const radios = dom.form.querySelectorAll(`input[name="${groupName}"]`);
  let matched = false;
  for (const radio of radios) {
    radio.checked = radio.value.toLowerCase() === hex.toLowerCase();
    if (radio.checked) matched = true;
  }
  if (!matched) for (const radio of radios) radio.checked = false;
  customInput.value = hex;
}

function updatePreview() {
  const draft = readForm();
  dom.previewFrame.innerHTML = garmentSvg({ ...draft, color: draft.color });
  dom.previewCaption.textContent = draft.name || 'Vorschau';
  dom.colorName.textContent = draft.colorName;
  dom.warmthOut.textContent = WARMTH_LABELS[draft.warmth];
  dom.patternColorField.hidden = draft.pattern === 'solid';
  refreshPatternSwatches(draft.color, draft.patternColor || '#F2E9DC');
}

/* --------------------------------------------------------------------------
   Dialog öffnen / speichern
   -------------------------------------------------------------------------- */

function openDialog(garment = null) {
  editingId = garment ? garment.id : null;
  const data = garment || {
    name: '', category: 'top', subtype: '', color: '#22334E',
    pattern: 'solid', patternColor: '#F2E9DC', formality: 2, warmth: 2,
  };

  el('garment-dialog-title').textContent = garment ? 'Kleidungsstück bearbeiten' : 'Neues Kleidungsstück';
  el('btn-save-garment').textContent = garment ? 'Änderungen sichern' : 'Speichern';

  dom.name.value = data.name;
  for (const radio of dom.form.querySelectorAll('input[name="category"]')) {
    radio.checked = radio.value === data.category;
  }
  populateSubtypes(data.category, data.subtype);
  for (const radio of dom.form.querySelectorAll('input[name="pattern"]')) {
    radio.checked = radio.value === data.pattern;
  }
  for (const radio of dom.form.querySelectorAll('input[name="formality"]')) {
    radio.checked = Number(radio.value) === Number(data.formality);
  }
  selectColor('color', data.color, dom.colorCustom);
  selectColor('patternColor', data.patternColor || '#F2E9DC', dom.patternColorCustom);
  dom.warmth.value = String(data.warmth);

  updatePreview();
  document.body.classList.add('has-modal');
  dom.dialog.showModal();
  // Auf dem Desktop direkt ins Namensfeld; mobil würde das die Tastatur aufreißen.
  if (window.matchMedia('(min-width: 641px)').matches) dom.name.focus();
}

function closeDialog() {
  if (dom.dialog.open) dom.dialog.close();
  document.body.classList.remove('has-modal');
}

function saveFromForm() {
  const data = readForm();
  if (!data.name) return;

  if (editingId) {
    updateGarment(editingId, data);
    toast('Änderungen gesichert');
  } else {
    addGarment(data);
    toast(`„${data.name}“ hinzugefügt`);
  }
  editingId = null;
  renderWardrobe();
}

/* --------------------------------------------------------------------------
   Initialisierung
   -------------------------------------------------------------------------- */

export function initUI() {
  Object.assign(dom, {
    grid: el('wardrobe-grid'),
    count: el('wardrobe-count'),
    emptyAll: el('wardrobe-empty'),
    emptyFilter: el('filter-empty'),
    fab: el('btn-add-garment'),
    dialog: el('garment-dialog'),
    form: el('garment-form'),
    name: el('g-name'),
    categoryRow: el('g-category'),
    subtype: el('g-subtype'),
    subtypeCustom: el('g-subtype-custom'),
    colorRow: el('g-color'),
    colorCustom: el('g-color-custom'),
    colorName: el('g-color-name'),
    patternRow: el('g-pattern'),
    patternColorField: el('g-pattern-color-field'),
    patternColorRow: el('g-pattern-color'),
    patternColorCustom: el('g-pattern-color-custom'),
    formalityRow: el('g-formality'),
    warmth: el('g-warmth'),
    warmthOut: el('g-warmth-out'),
    previewFrame: el('preview-frame'),
    previewCaption: el('preview-caption'),
  });

  buildCategoryOptions();
  buildPatternOptions();
  dom.colorRow.innerHTML = colorRowMarkup('color');
  dom.patternColorRow.innerHTML = colorRowMarkup('patternColor');
  dom.formalityRow.innerHTML = Object.entries(FORMALITY_LABELS).map(([value, label]) => `
    <label class="segmented__opt">
      <input type="radio" name="formality" value="${value}">
      <span>${label}</span>
    </label>`).join('');

  // Kategorie wechseln lädt passende Subtypen nach.
  dom.form.addEventListener('change', (event) => {
    if (event.target.name === 'category') {
      populateSubtypes(event.target.value, '');
    }
    if (event.target.id === 'g-subtype') {
      const custom = event.target.value === '__custom';
      dom.subtypeCustom.hidden = !custom;
      if (custom) dom.subtypeCustom.focus();
    }
    updatePreview();
  });
  dom.form.addEventListener('input', (event) => {
    if (event.target === dom.colorCustom) selectColor('color', dom.colorCustom.value, dom.colorCustom);
    if (event.target === dom.patternColorCustom) {
      selectColor('patternColor', dom.patternColorCustom.value, dom.patternColorCustom);
    }
    updatePreview();
  });

  dom.form.addEventListener('submit', () => {
    saveFromForm();
    document.body.classList.remove('has-modal');
  });
  dom.dialog.addEventListener('cancel', () => document.body.classList.remove('has-modal'));
  el('btn-close-dialog').addEventListener('click', closeDialog);
  el('btn-cancel-dialog').addEventListener('click', closeDialog);

  // Öffnen
  dom.fab.addEventListener('click', () => openDialog());
  el('btn-add-first').addEventListener('click', () => openDialog());

  el('btn-load-seed').addEventListener('click', () => {
    replaceGarments(SEED_GARMENTS);
    renderWardrobe();
    toast('Beispiel-Garderobe geladen');
  });

  // Karten: bearbeiten / löschen
  dom.grid.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = button.closest('.garment').dataset.id;
    const garment = getGarment(id);
    if (!garment) return;

    if (button.dataset.action === 'edit') {
      openDialog(garment);
    } else if (await confirmDelete(garment.name)) {
      removeGarment(id);
      renderWardrobe();
      toast(`„${garment.name}“ entfernt`);
    }
  });

  // Filter
  for (const chip of document.querySelectorAll('#wardrobe-filters .chip')) {
    chip.addEventListener('click', () => {
      currentFilter = chip.dataset.filter;
      for (const other of document.querySelectorAll('#wardrobe-filters .chip')) {
        other.classList.toggle('is-active', other === chip);
      }
      renderWardrobe();
    });
  }

  if (!isPersistent()) {
    toast('Speichern nicht möglich – Daten gelten nur für diese Sitzung');
  }

  renderWardrobe();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
