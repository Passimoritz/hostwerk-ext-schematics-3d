/*
 * Block colours for the 3D view. Why fixed colours: the viewer draws plain cubes without Minecraft's textures, so every
 * block gets the average colour of its vanilla texture (roughly what Minecraft's own map colours show). These colours
 * stand for game content, not for Hostwerk's interface – that is why they do not follow the theme tokens.
 * Order matters: the first matching rule wins. Specific materials come first (redstone, end_stone, glowstone …),
 * the broad families (stone, wood, colours) last – otherwise "stone" would catch "redstone_block" or "end_stone".
 * Rules match the block id without "minecraft:" and test whole words (between "_" or the ends).
 */
const W = (alt) => new RegExp(`(^|_)(${alt})(_|$)`);

export const COLORS = [
  // Flüssigkeiten und Durchsichtiges (mit Deckkraft)
  [W('water|bubble_column'), '#3f76e4', 0.55], [W('lava'), '#e2621b'], [W('glass|glass_pane|tinted_glass'), '#cfe8f3', 0.35], [W('ice|packed_ice|blue_ice|frosted_ice'), '#9cc0f2', 0.7],
  [W('leaves|azalea|flowering_azalea'), '#4b8b2f', 0.9],
  // Besondere Blöcke vor den Familien
  [W('redstone|redstone_block|redstone_ore|redstone_lamp|redstone_wire|redstone_torch'), '#b51a1a'], [W('end_stone|end_stone_bricks'), '#dbde9e'], [W('purpur'), '#a97ea9'],
  [W('glowstone|shroomlight|sea_lantern'), '#e8c56a'], [W('netherrack|nether_bricks|nether_brick|crimson_nylium|nether_wart_block'), '#7a2a2a'], [W('warped_nylium|warped_wart_block'), '#2b7a6f'],
  [W('soul_sand|soul_soil'), '#51402f'], [W('obsidian|crying_obsidian'), '#20172d'], [W('bedrock'), '#555555'],
  [W('gold_block|gold_ore|deepslate_gold_ore|nether_gold_ore|raw_gold_block'), '#f0c943'], [W('iron_block|iron_ore|deepslate_iron_ore|raw_iron_block|iron_bars|iron_door'), '#d5d5d5'],
  [W('diamond_block|diamond_ore|deepslate_diamond_ore'), '#5fe0d7'], [W('emerald_block|emerald_ore|deepslate_emerald_ore'), '#2fc46b'], [W('lapis_block|lapis_ore|deepslate_lapis_ore'), '#2a49a8'],
  [W('coal_block|coal_ore|deepslate_coal_ore'), '#2b2b2b'], [W('copper|copper_block|cut_copper|copper_ore|raw_copper_block'), '#c06e4c'], [W('exposed_copper|weathered_copper|oxidized_copper'), '#5f9e86'],
  [W('quartz|quartz_block|quartz_bricks|quartz_pillar|smooth_quartz'), '#e8e6e1'], [W('prismarine|dark_prismarine|prismarine_bricks'), '#5aa497'], [W('amethyst_block|budding_amethyst'), '#8a65c4'],
  [W('bookshelf|chiseled_bookshelf'), '#9c7f4e'], [W('tnt'), '#c4382b'], [W('hay_block'), '#c9a82f'], [W('pumpkin|carved_pumpkin|jack_o_lantern'), '#d9862a'], [W('melon'), '#7aa52f'],
  [W('red_sandstone|cut_red_sandstone|smooth_red_sandstone|chiseled_red_sandstone'), '#b5622c'], [W('sandstone|cut_sandstone|smooth_sandstone|chiseled_sandstone'), '#dbcf9a'], [W('red_sand'), '#b5622c'], [W('sand|suspicious_sand'), '#dbcf9a'],
  [W('grass_block|moss_block|moss_carpet'), '#6aa84f'], [W('snow|snow_block|powder_snow'), '#f4f8fb'], [W('clay'), '#a0a6b3'],
  [W('dirt|coarse_dirt|rooted_dirt|mud|podzol|farmland|dirt_path|mycelium'), '#8a6040'],
  [/^(bricks|brick_(stairs|slab|wall)|mud_bricks|mud_brick_(stairs|slab|wall))$/, '#9a4f3c'], [W('terracotta'), '#a0614a'],
  [W('deepslate|blackstone|basalt|polished_blackstone|cobbled_deepslate'), '#3e3f45'],
  [W('granite|polished_granite'), '#9b6b58'], [W('diorite|polished_diorite|calcite'), '#e3e1dc'], [W('andesite|polished_andesite'), '#888888'],
  // Holz: erst Stämme (oak_log), dann Bretter und Verarbeitetes (oak_planks, oak_door …)
  [W('log|wood|stem|hyphae'), '#6e5232'],
  [W('oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|pale_oak|planks'), '#b08a54'],
  // Pflanzen
  [W('short_grass|tall_grass|fern|large_fern|vine|lily_pad'), '#5f9a3a', 0.9],
  // Breite Familie Stein – nach allen Sonderfällen
  [W('stone|cobblestone|mossy_cobblestone|stone_bricks|smooth_stone|tuff|gravel|cobble'), '#8c8c8c'],
  // Farben (Wolle, Beton, gefärbtes Glas …)
  [W('white'), '#e9ecec'], [W('orange'), '#e37a1f'], [W('magenta'), '#bf4dbd'], [/^light_blue(_|$)/, '#3aafd9'], [/^light_gray(_|$)/, '#9d9d97'], [W('yellow'), '#efc931'], [W('lime'), '#70b919'], [W('pink'), '#ee8dac'],
  [W('gray|grey'), '#5e6468'], [W('cyan'), '#158991'], [W('purple'), '#7a3cad'], [W('blue'), '#35399d'], [W('brown'), '#7a4f2c'], [W('green'), '#546d1b'],
  [W('red'), '#a02722'], [W('black'), '#1f1f24'],
];
export const FALLBACK = ['#9aa0a6', 1];

/** Colour and opacity of a block id ("minecraft:redstone_block" → red). */
export function colorOf(name) {
  const id = String(name || '').replace(/^[a-z0-9_.-]+:/, '');
  for (const [re, c, a] of COLORS) if (re.test(id)) return [c, a ?? 1];
  return FALLBACK;
}
