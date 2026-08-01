/**
 * OOTD – Persistenz in localStorage (Bauplan §4).
 *
 * Hält den State im Modul-Cache und schreibt bei jeder Mutation zurück.
 * Fällt bei gesperrtem/vollem Storage auf reinen Speicherbetrieb zurück,
 * damit die App auch im Privatmodus benutzbar bleibt.
 */

import { computePreppyScore, colorNameFor } from './catalog.js';

const KEY = 'ootd.v1';
const SCHEMA_VERSION = 1;

function emptyState() {
  return { schemaVersion: SCHEMA_VERSION, garments: [], history: [], settings: { name: '' } };
}

let state = null;
let storageAvailable = true;

function migrate(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    schemaVersion: SCHEMA_VERSION,
    garments: Array.isArray(raw.garments) ? raw.garments : [],
    history: Array.isArray(raw.history) ? raw.history : [],
    settings: { ...base.settings, ...(raw.settings || {}) },
  };
}

export function loadState() {
  if (state) return state;
  try {
    state = migrate(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    storageAvailable = false;
    state = emptyState();
  }
  return state;
}

function persist() {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageAvailable = false;
  }
}

export function isPersistent() {
  return storageAvailable;
}

function newId() {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Rohdaten aus dem Formular in ein vollständiges Garment normalisieren. */
function normalize(data, id) {
  const pattern = data.pattern || 'solid';
  const garment = {
    id,
    name: String(data.name || '').trim(),
    category: data.category,
    subtype: String(data.subtype || '').trim(),
    color: data.color,
    colorName: data.colorName || colorNameFor(data.color),
    pattern,
    patternColor: pattern === 'solid' ? null : (data.patternColor || '#FFFDF7'),
    formality: Number(data.formality) || 2,
    warmth: Number(data.warmth) || 2,
  };
  garment.preppyScore = computePreppyScore(garment);
  return garment;
}

export function getGarments() {
  return loadState().garments;
}

export function getGarment(id) {
  return getGarments().find((g) => g.id === id) || null;
}

export function addGarment(data) {
  const garment = normalize(data, newId());
  loadState().garments.push(garment);
  persist();
  return garment;
}

export function updateGarment(id, data) {
  const s = loadState();
  const index = s.garments.findIndex((g) => g.id === id);
  if (index === -1) return null;
  s.garments[index] = normalize(data, id);
  persist();
  return s.garments[index];
}

export function removeGarment(id) {
  const s = loadState();
  const index = s.garments.findIndex((g) => g.id === id);
  if (index === -1) return null;
  const [removed] = s.garments.splice(index, 1);
  persist();
  return removed;
}

/** Ersetzt die gesamte Garderobe, z. B. beim Laden der Beispieldaten. */
export function replaceGarments(list) {
  const s = loadState();
  s.garments = list.map((item) => normalize(item, item.id || newId()));
  persist();
  return s.garments;
}

/* --- History (ab Phase 4 genutzt) ------------------------------------- */

export function getHistory() {
  return loadState().history;
}

export function getHistoryEntry(date) {
  return getHistory().find((entry) => entry.date === date) || null;
}

export function saveHistoryEntry(entry) {
  const s = loadState();
  const index = s.history.findIndex((e) => e.date === entry.date);
  if (index === -1) s.history.push(entry);
  else s.history[index] = { ...s.history[index], ...entry };
  s.history.sort((a, b) => a.date.localeCompare(b.date));
  if (s.history.length > 60) s.history = s.history.slice(-60);
  persist();
}
