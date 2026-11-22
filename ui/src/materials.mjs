/*
 * Material list of a build: how many blocks of each kind – also the hidden ones inside – with stacks of 64 and
 * shulker boxes (27 stacks), sorted by count. Pure logic, tested in tests/materials.test.js.
 */
import { germanBlockName } from './blocknames.mjs';

export const STACK = 64;
export const SHULKER = 27 * STACK;

/** "minecraft:oak_planks" → "Oak planks" (readable without Minecraft's language files); lang "de…" → "Eichenholzbretter" where known. */
export const blockLabel = (name, lang = 'en') => {
  if (/^de/i.test(lang)) { const de = germanBlockName(name); if (de) return de; }
  const id = String(name || '').replace(/^[a-z0-9_.-]+:/, '').replace(/_/g, ' ');
  return id ? id[0].toUpperCase() + id.slice(1) : '';
};

/** Search in the material list: translated name, English name and block ID ("oak", "eiche", "minecraft:oak_planks"). */
export const matches = (m, q) => { const s = String(q || '').trim().toLowerCase(); return !s || m.label.toLowerCase().includes(s) || blockLabel(m.name).toLowerCase().includes(s) || String(m.name).toLowerCase().includes(s); };

/** [{ name, label, count, stacks, rest, shulkers }] sorted by count (biggest first), then name. */
export function materials(palette, counts, { lang = 'en' } = {}) {
  return (palette || []).map((name, i) => {
    const count = Number((counts || [])[i]) || 0;
    return { name, label: blockLabel(name, lang), count, stacks: Math.floor(count / STACK), rest: count % STACK, shulkers: count / SHULKER };
  }).filter((m) => m.count > 0).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Plain text for copying (e.g. into a chat): one line per block, numbers in the given locale. */
export function asText(list, { title = '', locale = 'en', stacksWord = 'stacks' } = {}) {
  const nf = new Intl.NumberFormat(locale);
  const lines = list.map((m) => `${m.label}: ${nf.format(m.count)}${m.count >= STACK ? ` (${nf.format(m.stacks)} ${stacksWord}${m.rest ? ` + ${nf.format(m.rest)}` : ''})` : ''}`);
  return `${title ? `${title}\n` : ''}${lines.join('\n')}\n`;
}

/** Layer slider: for instances sorted by height, how many lie at or below each level (index = level). */
export function countsUpTo(heights, levels) {
  const out = new Array(levels).fill(0);
  for (const y of heights) if (y >= 0 && y < levels) out[y]++;
  for (let i = 1; i < levels; i++) out[i] += out[i - 1];
  return out;
}

/** CSV (Semikolon, für Tabellenprogramme in DE und EN): Block; Anzahl; Stapel; Shulkerkisten (1 Nachkommastelle,
 *  Dezimalzeichen der Sprache – ein deutsches Excel liest „1.5“ sonst als Datum). */
export function asCsv(list, { header = ['Block', 'Count', 'Stacks', 'Shulker boxes'], locale = 'en' } = {}) {
  const dec = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, useGrouping: false });
  const q = (v) => { const x = String(v); return /[;"\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
  const rows = list.map((m) => [m.label, m.count, m.count >= STACK ? `${m.stacks}${m.rest ? ` + ${m.rest}` : ''}` : '', dec.format(Math.round(m.shulkers * 10) / 10)]);
  return `\uFEFF${[header, ...rows].map((r) => r.map(q).join(';')).join('\r\n')}\r\n`;
}

/** Vergleich zweier Materiallisten: nur geänderte Blöcke, größte Änderung zuerst. → [{ name, label, a, b, delta }] (delta = a − b) */
export function diffMaterials(a, b) {
  const map = new Map();
  for (const m of a || []) map.set(m.name, { name: m.name, label: m.label, a: m.count, b: 0 });
  for (const m of b || []) { const x = map.get(m.name) || { name: m.name, label: m.label, a: 0, b: 0 }; x.b = m.count; map.set(m.name, x); }
  return [...map.values()].map((x) => ({ ...x, delta: x.a - x.b })).filter((x) => x.delta !== 0).sort((p, q) => Math.abs(q.delta) - Math.abs(p.delta) || p.label.localeCompare(q.label));
}
