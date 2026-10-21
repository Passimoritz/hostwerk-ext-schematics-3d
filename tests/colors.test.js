'use strict';
/* Colour rules: the first match wins – specific blocks before the broad families (redstone is not stone). */
const test = require('node:test');
const assert = require('node:assert');

test('specific blocks win over the broad families', async () => {
  const { colorOf, FALLBACK } = await import('../ui/src/colors.mjs');
  const c = (n) => colorOf(`minecraft:${n}`)[0];
  const stone = c('stone');
  for (const n of ['redstone_block', 'redstone_ore', 'end_stone', 'end_stone_bricks', 'glowstone', 'sandstone', 'red_sandstone', 'blackstone']) assert.notStrictEqual(c(n), stone, n);
  assert.strictEqual(c('redstone_block'), c('redstone_ore'));
  assert.strictEqual(c('stone_bricks'), stone, 'stone bricks are stone, not red bricks');
  assert.notStrictEqual(c('bricks'), stone);
  assert.notStrictEqual(c('oak_log'), c('oak_planks'), 'logs are darker than planks');
  assert.notStrictEqual(c('light_gray_wool'), c('gray_wool'));
  assert.notStrictEqual(c('light_blue_concrete'), c('blue_concrete'));
  assert.notStrictEqual(c('red_sand'), c('sand'));
  assert.ok(colorOf('minecraft:glass')[1] < 1 && colorOf('minecraft:water')[1] < 1, 'see-through');
  assert.deepStrictEqual(colorOf('minecraft:unknown_thing'), FALLBACK);
  assert.strictEqual(colorOf('mymod:redstone_block')[0], c('redstone_block'), 'other namespaces too');
});
