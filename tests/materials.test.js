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
  // Deutsch: Dezimalkomma (sonst macht Excel aus 1.5 ein Datum)
  const de = asCsv(materials(['minecraft:stone'], [2600]), { locale: 'de-DE' }).replace(/^\uFEFF/, '').trim().split('\r\n');
  assert.strictEqual(de[1], 'Stone;2600;40 + 40;1,5');
});

test('Vergleich: nur geänderte Blöcke, größte Änderung zuerst', async () => {
  const { diffMaterials, materials } = await import('../ui/src/materials.mjs');
  const a = materials(['minecraft:stone', 'minecraft:dirt', 'minecraft:glass'], [100, 5, 7]);
  const b = materials(['minecraft:stone', 'minecraft:dirt', 'minecraft:sand'], [40, 5, 2]);
  assert.deepStrictEqual(diffMaterials(a, b).map((x) => [x.label, x.a, x.b, x.delta]), [['Stone', 100, 40, 60], ['Glass', 7, 0, 7], ['Sand', 0, 2, -2]]);
  assert.deepStrictEqual(diffMaterials(a, a), []);
});

test('Blocknamen auf Deutsch (Holz, Farben, Stein-Treppen), Mods englisch, Suche über deutschen und englischen Namen', async () => {
  const { germanBlockName } = await import('../ui/src/blocknames.mjs');
  const { materials, matches, blockLabel } = await import('../ui/src/materials.mjs');
  assert.strictEqual(germanBlockName('minecraft:oak_planks'), 'Eichenholzbretter');
  assert.strictEqual(germanBlockName('minecraft:stripped_spruce_log'), 'Entrindeter Fichtenstamm');
  assert.strictEqual(germanBlockName('minecraft:light_blue_concrete'), 'Hellblauer Beton');
  assert.strictEqual(germanBlockName('minecraft:white_wool'), 'Weiße Wolle');
  assert.strictEqual(germanBlockName('minecraft:polished_andesite_stairs'), 'Polierte Andesittreppe');
  assert.strictEqual(germanBlockName('minecraft:cobblestone_wall'), 'Bruchsteinmauer');
  assert.strictEqual(germanBlockName('mymod:oak_planks'), null, 'Mod-Blöcke behalten ihren Namen');
  assert.strictEqual(blockLabel('minecraft:unknown_thing', 'de-DE'), 'Unknown thing', 'Unbekanntes: englisch abgeleitet');
  const de = materials(['minecraft:oak_planks', 'minecraft:glass'], [10, 2], { lang: 'de-DE' });
  assert.deepStrictEqual(de.map((m) => m.label), ['Eichenholzbretter', 'Glas']);
  assert.ok(matches(de[0], 'eiche') && matches(de[0], 'oak') && matches(de[0], 'minecraft:oak_planks'));
  assert.ok(!matches(de[1], 'eiche'));
  assert.strictEqual(materials(['minecraft:oak_planks'], [1])[0].label, 'Oak planks', 'Englisch bleibt wie bisher');
});
