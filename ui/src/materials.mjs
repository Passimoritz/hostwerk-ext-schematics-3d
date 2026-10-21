/*
 * Material list of a build: how many blocks of each kind – also the hidden ones inside – with stacks of 64 and
 * shulker boxes (27 stacks), sorted by count. Pure logic, tested in tests/materials.test.js.
 */
export const STACK = 64;
export const SHULKER = 27 * STACK;

/** "minecraft:oak_planks" → "Oak planks" (readable without Minecraft's language files). */
export const blockLabel = (name) => {
  const id = String(name || '').replace(/^[a-z0-9_.-]+:/, '').replace(/_/g, ' ');
  return id ? id[0].toUpperCase() + id.slice(1) : '';
};

/** [{ name, label, count, stacks, rest, shulkers }] sorted by count (biggest first), then name. */
export function materials(palette, counts) {
  return (palette || []).map((name, i) => {
    const count = Number((counts || [])[i]) || 0;
    return { name, label: blockLabel(name), count, stacks: Math.floor(count / STACK), rest: count % STACK, shulkers: count / SHULKER };
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
