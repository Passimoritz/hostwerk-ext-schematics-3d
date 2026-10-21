'use strict';
/* Material list (counts, stacks of 64, copy text) and layer counts for the slider. */
const test = require('node:test');
const assert = require('node:assert');

test('material list: biggest first, stacks of 64, readable names, copy text', async () => {
  const { materials, asText, blockLabel } = await import('../ui/src/materials.mjs');
  const list = materials(['minecraft:oak_planks', 'minecraft:glass', 'minecraft:stone'], [130, 5, 0]);
  assert.deepStrictEqual(list.map((m) => [m.label, m.count, m.stacks, m.rest]), [['Oak planks', 130, 2, 2], ['Glass', 5, 0, 5]]);
  assert.strictEqual(blockLabel('mymod:red_thing'), 'Red thing');
  const txt = asText(list, { title: 'Materials', locale: 'de-DE', stacksWord: 'Stapel' });
  assert.strictEqual(txt, 'Materials\nOak planks: 130 (2 Stapel + 2)\nGlass: 5\n');
  assert.ok(asText(materials(['a:b'], [1500]), { locale: 'de-DE' }).includes('1.500'), 'numbers in the given language');
});

test('layer slider: blocks at or below each level', async () => {
  const { countsUpTo } = await import('../ui/src/materials.mjs');
  assert.deepStrictEqual(countsUpTo([0, 0, 1, 3], 4), [2, 3, 3, 4]);
  assert.deepStrictEqual(countsUpTo([], 2), [0, 0]);
});

test('CSV: Kopfzeile, Semikolon, Anführungszeichen nur wo nötig, BOM für Tabellenprogramme', async () => {
  const { asCsv, materials } = await import('../ui/src/materials.mjs');
  const csv = asCsv(materials(['minecraft:stone', 'minecraft:oak;odd'], [130, 3]), { header: ['Block', 'Anzahl', 'Stapel', 'Shulkerkisten'] });
  const lines = csv.replace(/^\uFEFF/, '').trim().split('\r\n');
  assert.deepStrictEqual(lines, ['Block;Anzahl;Stapel;Shulkerkisten', 'Stone;130;2 + 2;0.1', '"Oak;odd";3;;0']);
  assert.ok(csv.startsWith('\uFEFF'));
});

test('Vergleich: nur geänderte Blöcke, größte Änderung zuerst', async () => {
  const { diffMaterials, materials } = await import('../ui/src/materials.mjs');
  const a = materials(['minecraft:stone', 'minecraft:dirt', 'minecraft:glass'], [100, 5, 7]);
  const b = materials(['minecraft:stone', 'minecraft:dirt', 'minecraft:sand'], [40, 5, 2]);
  assert.deepStrictEqual(diffMaterials(a, b).map((x) => [x.label, x.a, x.b, x.delta]), [['Stone', 100, 40, 60], ['Glass', 7, 0, 7], ['Sand', 0, 2, -2]]);
  assert.deepStrictEqual(diffMaterials(a, a), []);
});
