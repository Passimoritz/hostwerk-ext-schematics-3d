'use strict';
/*
 * Schematic reader: Sponge v2/v3 (VarInt), MCEdit (numeric ids), Litematica (longs packed across boundaries),
 * only visible blocks, file search in server folders.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const nbt = require('../server/nbt');
const schem = require('../server/schematic');
const { findBuilds } = require('../server/index');
const de = require('../locales/de.json');

const { T } = nbt;
const C = (o) => ({ t: T.COMPOUND, v: Object.entries(o) });
const I = (v) => ({ t: T.INT, v }); const S = (v) => ({ t: T.SHORT, v }); const STR = (v) => ({ t: T.STRING, v });
const BYTES = (b) => ({ t: T.BYTES, v: Buffer.from(b) });
const LONGS = (a) => ({ t: T.LONGS, v: a });
const LIST = (lt, items) => ({ t: T.LIST, v: { lt, items } });
const varints = (arr) => { const out = []; for (let v of arr) { do { let b = v & 0x7f; v >>>= 7; if (v) b |= 0x80; out.push(b); } while (v); } return out; };
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'hw-schem-'));

test('Sponge v2 and v3 (VarInt), only visible blocks', () => {
  const pal = { 'minecraft:air': I(0), 'minecraft:stone': I(1) };
  const v2 = path.join(DIR, 'w2.schem');
  nbt.write(v2, { name: 'Schematic', root: C({ Version: I(2), Width: S(3), Height: S(3), Length: S(3), Palette: C(pal), BlockData: BYTES(varints(Array(27).fill(1))) }) });
  const r2 = schem.parse(v2);
  assert.strictEqual(r2.total, 27);
  assert.strictEqual(r2.shown, 26, 'the hidden centre block must not be sent');
  assert.deepStrictEqual(r2.size, { x: 3, y: 3, z: 3 });
  assert.deepStrictEqual(r2.palette, ['minecraft:stone']);
  const v3 = path.join(DIR, 'w3.schem');
  nbt.write(v3, { name: '', root: C({ Schematic: C({ Version: I(3), Width: S(2), Height: S(1), Length: S(1), Blocks: C({ Palette: C({ 'minecraft:air': I(0), 'minecraft:oak_planks[x=1]': I(130) }), Data: BYTES(varints([130, 0])) }) }) }) });
  const r3 = schem.parse(v3);
  assert.strictEqual(r3.total, 1);
  assert.deepStrictEqual(r3.palette, ['minecraft:oak_planks']);
  assert.deepStrictEqual(r3.blocks.slice(0, 3), [0, 0, 0]);
});

test('MCEdit (numeric ids) and Litematica (packed longs across boundaries)', () => {
  const mc = path.join(DIR, 'old.schematic');
  nbt.write(mc, { name: 'Schematic', root: C({ Width: S(2), Height: S(1), Length: S(1), Blocks: BYTES([1, 20]), Data: BYTES([0, 0]) }) });
  assert.deepStrictEqual(schem.parse(mc).palette.sort(), ['minecraft:glass', 'minecraft:stone']);
  // 5 palette entries → 3 bits; 25 values = 75 bits → two longs, value 22 crosses the boundary
  const values = Array.from({ length: 25 }, (_, i) => (i % 4) + 1);
  let big = 0n; values.forEach((v, i) => { big |= BigInt(v) << BigInt(i * 3); });
  const lo = BigInt.asIntN(64, big & ((1n << 64n) - 1n)); const hi = BigInt.asIntN(64, big >> 64n);
  const lite = path.join(DIR, 'house.litematic');
  nbt.write(lite, { name: '', root: C({ Regions: C({ House: C({ Position: C({ x: I(0), y: I(0), z: I(0) }), Size: C({ x: I(5), y: I(1), z: I(5) }), BlockStatePalette: LIST(T.COMPOUND, [C({ Name: STR('minecraft:air') }).v, C({ Name: STR('minecraft:stone') }).v, C({ Name: STR('minecraft:glass') }).v, C({ Name: STR('minecraft:dirt') }).v, C({ Name: STR('minecraft:oak_log') }).v]), BlockStates: LONGS([lo, hi]) }) }) }) });
  const rl = schem.parse(lite);
  assert.strictEqual(rl.total, 25);
  assert.strictEqual(rl.palette.length, 4);
  const at = (i) => { const x = i % 5; const z = Math.floor(i / 5); for (let k = 0; k < rl.blocks.length; k += 4) if (rl.blocks[k] === x && rl.blocks[k + 2] === z) return rl.palette[rl.blocks[k + 3]]; return null; };
  assert.strictEqual(at(21), ['minecraft:stone', 'minecraft:glass', 'minecraft:dirt', 'minecraft:oak_log'][21 % 4]);
});

test('unknown format is reported, not crashing', () => {
  const f = path.join(DIR, 'x.schem');
  nbt.write(f, { name: '', root: C({ Hello: I(1) }) });
  assert.throws(() => schem.parse(f), (e) => e.unknownFormat === true);
});

test('finds build files in server folders, skips worlds', () => {
  const base = path.join(DIR, 'server');
  fs.mkdirSync(path.join(base, 'plugins', 'WorldEdit', 'schematics'), { recursive: true });
  fs.mkdirSync(path.join(base, 'world', 'region'), { recursive: true });
  fs.writeFileSync(path.join(base, 'plugins', 'WorldEdit', 'schematics', 'tower.schem'), 'x');
  fs.writeFileSync(path.join(base, 'world', 'region', 'trap.schem'), 'x');
  const found = findBuilds(base);
  assert.deepStrictEqual(found.map((f) => f.path), ['plugins/WorldEdit/schematics/tower.schem']);
});

test('every German text has a value', () => {
  for (const [k, v] of Object.entries(de)) if (k !== '$patterns') assert.ok(typeof v === 'string' && v.trim(), k);
});

test('vanilla structure (.nbt): size, palette, blocks with pos and state; several palettes take the first', () => {
  const f = path.join(DIR, 'hut.nbt');
  const block = (x, y, z, state) => C({ pos: LIST(T.INT, [x, y, z]), state: I(state) }).v;
  const pal = LIST(T.COMPOUND, [C({ Name: STR('minecraft:air') }).v, C({ Name: STR('minecraft:oak_planks') }).v, C({ Name: STR('minecraft:glass_pane') }).v]);
  nbt.write(f, { name: '', root: C({ DataVersion: I(3700), size: LIST(T.INT, [2, 1, 2]), palette: pal, blocks: LIST(T.COMPOUND, [block(0, 0, 0, 1), block(1, 0, 0, 1), block(0, 0, 1, 2), block(1, 0, 1, 0), block(9, 9, 9, 1)]) }) });
  const r = schem.parse(f);
  assert.strictEqual(r.format, 'structure');
  assert.deepStrictEqual(r.size, { x: 2, y: 1, z: 2 });
  assert.strictEqual(r.total, 3, 'air and blocks outside the size are left out');
  assert.deepStrictEqual(Object.fromEntries(r.palette.map((n, i) => [n, r.counts[i]])), { 'minecraft:oak_planks': 2, 'minecraft:glass_pane': 1 });
  const multi = path.join(DIR, 'wreck.nbt');
  nbt.write(multi, { name: '', root: C({ size: LIST(T.INT, [1, 1, 1]), palettes: LIST(T.LIST, [{ lt: T.COMPOUND, items: [C({ Name: STR('minecraft:stone') }).v] }]), blocks: LIST(T.COMPOUND, [block(0, 0, 0, 0)]) }) });
  assert.deepStrictEqual(schem.parse(multi).palette, ['minecraft:stone']);
  const base = path.join(DIR, 'srv2');
  fs.mkdirSync(path.join(base, 'structures'), { recursive: true });
  fs.copyFileSync(f, path.join(base, 'structures', 'hut.nbt'));
  assert.deepStrictEqual(findBuilds(base).map((x) => x.path), ['structures/hut.nbt']);
});

test('material list counts hidden blocks too', () => {
  const pal = { 'minecraft:air': I(0), 'minecraft:stone': I(1) };
  const f = path.join(DIR, 'cube.schem');
  nbt.write(f, { name: 'Schematic', root: C({ Version: I(2), Width: S(3), Height: S(3), Length: S(3), Palette: C(pal), BlockData: BYTES(varints(Array(27).fill(1))) }) });
  const r = schem.parse(f);
  assert.deepStrictEqual(r.counts, [27]);
  assert.strictEqual(r.shown, 26);
});
