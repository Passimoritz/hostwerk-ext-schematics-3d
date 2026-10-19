'use strict';
/*
 * Reads Minecraft builds (schematics) for the 3D view:
 *   .schem       Sponge format v2 (Palette + BlockData) and v3 (Blocks { Palette, Data }) – indexes as VarInt
 *   .schematic   old MCEdit format (Blocks + Data, numeric ids)
 *   .litematic   Litematica (regions, BlockStatePalette, BlockStates as densely packed longs)
 * Result: { format, size: { x, y, z }, palette: [block name …], blocks: [x, y, z, paletteIndex, …], total, shown }
 * Only visible blocks are sent (at least one side touches air) – so even big builds stay smooth.
 */
const nbt = require('./nbt');

const AIR = /^minecraft:(air|cave_air|void_air|structure_void)$|^air$/;
const MAX_BLOCKS = 250000;
const MAX_VOLUME = 64 * 1024 * 1024;

const get = (c, name) => { const hit = (c || []).find(([k]) => k === name); return hit ? hit[1].v : undefined; };
const num = (v) => (typeof v === 'bigint' ? Number(v) : Number(v || 0));
const stripState = (s) => String(s || '').replace(/\[.*$/, '');

// Old numeric ids (MCEdit) → names for the colours
const LEGACY = { 1: 'stone', 2: 'grass_block', 3: 'dirt', 4: 'cobblestone', 5: 'oak_planks', 7: 'bedrock', 8: 'water', 9: 'water', 10: 'lava', 11: 'lava', 12: 'sand', 13: 'gravel', 14: 'gold_ore', 15: 'iron_ore', 16: 'coal_ore', 17: 'oak_log', 18: 'oak_leaves', 20: 'glass', 22: 'lapis_block', 24: 'sandstone', 35: 'white_wool', 41: 'gold_block', 42: 'iron_block', 45: 'bricks', 47: 'bookshelf', 48: 'mossy_cobblestone', 49: 'obsidian', 53: 'oak_stairs', 57: 'diamond_block', 79: 'ice', 80: 'snow_block', 82: 'clay', 87: 'netherrack', 89: 'glowstone', 98: 'stone_bricks', 102: 'glass_pane', 112: 'nether_bricks', 121: 'end_stone', 133: 'emerald_block', 152: 'redstone_block', 155: 'quartz_block', 159: 'terracotta', 162: 'acacia_log', 168: 'prismarine', 172: 'terracotta', 174: 'packed_ice', 251: 'white_concrete' };

function readVarints(buf, count) {
  const out = new Uint32Array(count);
  let p = 0;
  for (let i = 0; i < count && p < buf.length; i++) {
    let v = 0; let shift = 0; let b;
    do { b = buf[p++]; v |= (b & 0x7f) << shift; shift += 7; } while (b & 0x80 && p < buf.length);
    out[i] = v >>> 0;
  }
  return out;
}

/** Litematica: values of "bits" bits, packed densely across long boundaries. */
function unpackLitematic(longs, bits, count) {
  const out = new Uint32Array(count);
  const words = longs.map((x) => BigInt.asUintN(64, BigInt(x)));
  const mask = (1n << BigInt(bits)) - 1n;
  for (let i = 0; i < count; i++) {
    const startBit = BigInt(i) * BigInt(bits);
    const w = Number(startBit >> 6n); const off = startBit & 63n;
    let v = (words[w] || 0n) >> off;
    if (off + BigInt(bits) > 64n) v |= (words[w + 1] || 0n) << (64n - off);
    out[i] = Number(v & mask);
  }
  return out;
}

function parse(file) {
  const { root } = nbt.read(file);
  let c = root.v;
  if (get(c, 'Schematic')) c = get(c, 'Schematic'); // Sponge v3 lives under "Schematic"
  // ---------- Litematica ----------
  const regions = get(c, 'Regions');
  if (regions) {
    const parts = [];
    for (const [, node] of regions) {
      const r = node.v;
      const pos = get(r, 'Position'); const sz = get(r, 'Size');
      const sx = num(get(sz, 'x')); const sy = num(get(sz, 'y')); const sz2 = num(get(sz, 'z'));
      const ax = Math.abs(sx); const ay = Math.abs(sy); const az = Math.abs(sz2);
      const min = { x: num(get(pos, 'x')) + (sx < 0 ? sx + 1 : 0), y: num(get(pos, 'y')) + (sy < 0 ? sy + 1 : 0), z: num(get(pos, 'z')) + (sz2 < 0 ? sz2 + 1 : 0) };
      const pal = ((get(r, 'BlockStatePalette') || { items: [] }).items).map((it) => String(get(it, 'Name') || 'minecraft:air'));
      const bits = Math.max(2, Math.ceil(Math.log2(Math.max(1, pal.length))));
      const idx = unpackLitematic(get(r, 'BlockStates') || [], bits, ax * ay * az);
      parts.push({ min, ax, ay, az, pal, idx });
    }
    const lo = { x: Math.min(...parts.map((p) => p.min.x)), y: Math.min(...parts.map((p) => p.min.y)), z: Math.min(...parts.map((p) => p.min.z)) };
    const hi = { x: Math.max(...parts.map((p) => p.min.x + p.ax)), y: Math.max(...parts.map((p) => p.min.y + p.ay)), z: Math.max(...parts.map((p) => p.min.z + p.az)) };
    const size = { x: hi.x - lo.x, y: hi.y - lo.y, z: hi.z - lo.z };
    const palette = []; const pmap = new Map();
    const cell = (name) => { if (!pmap.has(name)) { pmap.set(name, palette.length); palette.push(name); } return pmap.get(name); };
    const grid = makeGrid(size);
    for (const p of parts) for (let y = 0; y < p.ay; y++) for (let z = 0; z < p.az; z++) for (let x = 0; x < p.ax; x++) {
      const name = p.pal[p.idx[(y * p.az + z) * p.ax + x]] || 'minecraft:air';
      if (AIR.test(name)) continue;
      grid.set(p.min.x - lo.x + x, p.min.y - lo.y + y, p.min.z - lo.z + z, cell(stripState(name)) + 1);
    }
    return finish('litematic', size, palette, grid);
  }
  // ---------- Sponge ----------
  const W = num(get(c, 'Width')); const H = num(get(c, 'Height')); const L = num(get(c, 'Length'));
  if (!W || !H || !L) throw Object.assign(new Error('Unknown schematic format.'), { unknownFormat: true });
  const size = { x: W, y: H, z: L };
  const blocks3 = get(c, 'Blocks');
  const palC = Array.isArray(blocks3) ? get(blocks3, 'Palette') : get(c, 'Palette');
  const dataC = Array.isArray(blocks3) ? get(blocks3, 'Data') : get(c, 'BlockData');
  if (palC && dataC) {
    const byIdx = [];
    for (const [name, node] of palC) byIdx[num(node.v)] = stripState(name);
    const idx = readVarints(dataC, W * H * L);
    const palette = []; const pmap = new Map(); const grid = makeGrid(size);
    for (let i = 0; i < idx.length; i++) {
      const name = byIdx[idx[i]] || 'minecraft:air';
      if (AIR.test(name)) continue;
      if (!pmap.has(name)) { pmap.set(name, palette.length); palette.push(name); }
      const x = i % W; const z = Math.floor(i / W) % L; const y = Math.floor(i / (W * L));
      grid.set(x, y, z, pmap.get(name) + 1);
    }
    return finish('sponge', size, palette, grid);
  }
  // ---------- MCEdit (.schematic) ----------
  const ids = get(c, 'Blocks');
  if (ids && Buffer.isBuffer(ids)) {
    const add = get(c, 'AddBlocks');
    const palette = []; const pmap = new Map(); const grid = makeGrid(size);
    for (let i = 0; i < ids.length; i++) {
      let id = ids[i] & 0xff;
      if (add && Buffer.isBuffer(add)) id |= ((i & 1 ? add[i >> 1] & 0x0f : (add[i >> 1] & 0xf0) >> 4) << 8);
      if (!id) continue;
      const name = `minecraft:${LEGACY[id] || `legacy_${id}`}`;
      if (!pmap.has(name)) { pmap.set(name, palette.length); palette.push(name); }
      const x = i % W; const z = Math.floor(i / W) % L; const y = Math.floor(i / (W * L));
      grid.set(x, y, z, pmap.get(name) + 1);
    }
    return finish('mcedit', size, palette, grid);
  }
  throw Object.assign(new Error('Unknown schematic format.'), { unknownFormat: true });
}

/** Occupancy as a dense array (up to 64 M cells) or a map (bigger). Values: 0 = air, otherwise palette index + 1. */
function makeGrid(size) {
  const vol = size.x * size.y * size.z;
  if (vol <= MAX_VOLUME) {
    const a = new Uint16Array(vol);
    const i = (x, y, z) => (y * size.z + z) * size.x + x;
    return { set: (x, y, z, v) => { a[i(x, y, z)] = v; }, get: (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= size.x || y >= size.y || z >= size.z ? 0 : a[i(x, y, z)]), each: (fn) => { for (let k = 0; k < a.length; k++) if (a[k]) fn(k % size.x, Math.floor(k / (size.x * size.z)), Math.floor(k / size.x) % size.z, a[k]); } };
  }
  const m = new Map(); const key = (x, y, z) => `${x},${y},${z}`;
  return { set: (x, y, z, v) => m.set(key(x, y, z), v), get: (x, y, z) => m.get(key(x, y, z)) || 0, each: (fn) => { for (const [k, v] of m) { const [x, y, z] = k.split(',').map(Number); fn(x, y, z, v); } } };
}

function finish(format, size, palette, grid) {
  const blocks = []; let total = 0; let shown = 0;
  const transparent = new Set(palette.map((n, i) => (/glass|leaves|water|ice|fence|pane|bars|torch|flower|grass$|fern|vine|rail|slab|stairs|door|trapdoor|sign|carpet|button|lever/.test(n) ? i + 1 : 0)).filter(Boolean));
  const open = (x, y, z) => { const v = grid.get(x, y, z); return !v || transparent.has(v); };
  grid.each((x, y, z, v) => {
    total++;
    if (shown >= MAX_BLOCKS) return;
    if (!(open(x + 1, y, z) || open(x - 1, y, z) || open(x, y + 1, z) || open(x, y - 1, z) || open(x, y, z + 1) || open(x, y, z - 1))) return; // fully hidden
    blocks.push(x, y, z, v - 1); shown++;
  });
  return { format, size, palette, blocks, total, shown, truncated: shown >= MAX_BLOCKS };
}

module.exports = { parse, readVarints, unpackLitematic };
