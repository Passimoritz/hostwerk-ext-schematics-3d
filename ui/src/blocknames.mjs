/*
 * Deutsche Blocknamen für die Materialliste – ohne Minecrafts Sprachdateien (die müsste man herunterladen): die
 * häufigsten Baublöcke einzeln, Holzarten, Farben und Stein-Treppen/-Stufen/-Mauern aus Bausteinen zusammengesetzt.
 * Unbekannte Blöcke (z. B. aus Mods) bleiben beim englisch abgeleiteten Namen. Reine Logik, getestet in tests/materials.test.js.
 */

const SINGLE = {
  air: 'Luft', cave_air: 'Höhlenluft', void_air: 'Leere', barrier: 'Barriere', light: 'Licht', structure_void: 'Strukturleere',
  stone: 'Stein', cobblestone: 'Bruchstein', mossy_cobblestone: 'Bemooster Bruchstein', smooth_stone: 'Glatter Stein',
  stone_bricks: 'Steinziegel', mossy_stone_bricks: 'Bemooste Steinziegel', cracked_stone_bricks: 'Rissige Steinziegel', chiseled_stone_bricks: 'Gemeißelte Steinziegel',
  granite: 'Granit', polished_granite: 'Polierter Granit', diorite: 'Diorit', polished_diorite: 'Polierter Diorit', andesite: 'Andesit', polished_andesite: 'Polierter Andesit',
  deepslate: 'Tiefenschiefer', cobbled_deepslate: 'Bruchtiefenschiefer', polished_deepslate: 'Polierter Tiefenschiefer', deepslate_bricks: 'Tiefenschieferziegel', deepslate_tiles: 'Tiefenschieferfliesen', chiseled_deepslate: 'Gemeißelter Tiefenschiefer',
  tuff: 'Tuffstein', calcite: 'Kalzit', dripstone_block: 'Tropfsteinblock', bedrock: 'Grundgestein', obsidian: 'Obsidian', crying_obsidian: 'Weinender Obsidian',
  dirt: 'Erde', coarse_dirt: 'Grobe Erde', rooted_dirt: 'Wurzelerde', grass_block: 'Grasblock', podzol: 'Podsol', mycelium: 'Myzel', dirt_path: 'Trampelpfad', farmland: 'Ackerboden',
  mud: 'Schlamm', packed_mud: 'Fester Schlamm', mud_bricks: 'Schlammziegel', clay: 'Ton', gravel: 'Kies', sand: 'Sand', red_sand: 'Roter Sand',
  sandstone: 'Sandstein', smooth_sandstone: 'Glatter Sandstein', cut_sandstone: 'Geschnittener Sandstein', chiseled_sandstone: 'Gemeißelter Sandstein',
  red_sandstone: 'Roter Sandstein', smooth_red_sandstone: 'Glatter roter Sandstein', cut_red_sandstone: 'Geschnittener roter Sandstein',
  bricks: 'Ziegelsteine', terracotta: 'Keramik', glass: 'Glas', glass_pane: 'Glasscheibe', tinted_glass: 'Getöntes Glas',
  quartz_block: 'Quarzblock', smooth_quartz: 'Glatter Quarzblock', quartz_pillar: 'Quarzsäule', quartz_bricks: 'Quarzziegel', chiseled_quartz_block: 'Gemeißelter Quarzblock',
  netherrack: 'Netherrack', nether_bricks: 'Netherziegel', red_nether_bricks: 'Rote Netherziegel', soul_sand: 'Seelensand', soul_soil: 'Seelenerde', magma_block: 'Magmablock',
  blackstone: 'Schwarzstein', polished_blackstone: 'Polierter Schwarzstein', polished_blackstone_bricks: 'Polierte Schwarzsteinziegel', basalt: 'Basalt', polished_basalt: 'Polierter Basalt', smooth_basalt: 'Glatter Basalt',
  end_stone: 'Endstein', end_stone_bricks: 'Endsteinziegel', purpur_block: 'Purpurblock', purpur_pillar: 'Purpursäule',
  prismarine: 'Prismarin', prismarine_bricks: 'Prismarinziegel', dark_prismarine: 'Dunkler Prismarin', sea_lantern: 'Seelaterne',
  glowstone: 'Leuchtstein', shroomlight: 'Pilzlicht', lantern: 'Laterne', soul_lantern: 'Seelenlaterne', torch: 'Fackel', wall_torch: 'Fackel', soul_torch: 'Seelenfackel', soul_wall_torch: 'Seelenfackel', end_rod: 'Endstab',
  redstone_wire: 'Redstone-Leitung', redstone_block: 'Redstone-Block', redstone_torch: 'Redstone-Fackel', redstone_wall_torch: 'Redstone-Fackel', redstone_lamp: 'Redstone-Lampe',
  repeater: 'Redstone-Verstärker', comparator: 'Redstone-Komparator', lever: 'Hebel', piston: 'Kolben', sticky_piston: 'Klebriger Kolben', observer: 'Beobachter',
  hopper: 'Trichter', dispenser: 'Werfer', dropper: 'Spender', target: 'Zielblock', note_block: 'Notenblock', jukebox: 'Plattenspieler', tnt: 'TNT',
  chest: 'Truhe', trapped_chest: 'Redstone-Truhe', ender_chest: 'Endertruhe', barrel: 'Fass', crafting_table: 'Werkbank', furnace: 'Ofen', blast_furnace: 'Schmelzofen', smoker: 'Räucherofen',
  anvil: 'Amboss', enchanting_table: 'Zaubertisch', bookshelf: 'Bücherregal', ladder: 'Leiter', scaffolding: 'Gerüst', cauldron: 'Kessel', bell: 'Glocke', campfire: 'Lagerfeuer', flower_pot: 'Blumentopf', beacon: 'Leuchtfeuer',
  iron_block: 'Eisenblock', gold_block: 'Goldblock', diamond_block: 'Diamantblock', emerald_block: 'Smaragdblock', lapis_block: 'Lapislazuliblock', coal_block: 'Kohleblock', netherite_block: 'Netheritblock',
  copper_block: 'Kupferblock', iron_bars: 'Eisengitter', iron_door: 'Eisentür', iron_trapdoor: 'Eisenfalltür', chain: 'Kette',
  water: 'Wasser', lava: 'Lava', ice: 'Eis', packed_ice: 'Packeis', blue_ice: 'Blaueis', snow: 'Schnee', snow_block: 'Schneeblock', powder_snow: 'Pulverschnee',
  hay_block: 'Strohballen', moss_block: 'Moosblock', moss_carpet: 'Moosteppich', short_grass: 'Gras', grass: 'Gras', tall_grass: 'Hohes Gras', fern: 'Farn', large_fern: 'Großer Farn', vine: 'Ranken',
  dandelion: 'Löwenzahn', poppy: 'Mohn', cobweb: 'Spinnennetz', sponge: 'Schwamm', wet_sponge: 'Nasser Schwamm', slime_block: 'Schleimblock', honey_block: 'Honigblock',
  bone_block: 'Knochenblock', dried_kelp_block: 'Getrockneter Seetangblock', rail: 'Schiene', powered_rail: 'Antriebsschiene', detector_rail: 'Sensorschiene', activator_rail: 'Aktivierungsschiene',
  stripped_bamboo_block: 'Geschälter Bambusblock', bamboo_block: 'Bambusblock', bamboo_mosaic: 'Bambusmosaik',
};

// Holzarten: Vorsilbe für „…holz“-Wörter, Stamm/Laub/Setzling; Karmesin/Wirr haben Stiele und Bretter ohne „holz“
const WOOD = {
  oak: ['Eichen', 'Eichenholz', 'Eichenstamm', 'Eichenlaub'],
  spruce: ['Fichten', 'Fichtenholz', 'Fichtenstamm', 'Fichtennadeln'],
  birch: ['Birken', 'Birkenholz', 'Birkenstamm', 'Birkenlaub'],
  jungle: ['Tropen', 'Tropenholz', 'Tropenbaumstamm', 'Tropenbaumlaub'],
  acacia: ['Akazien', 'Akazienholz', 'Akazienstamm', 'Akazienlaub'],
  dark_oak: ['Schwarzeichen', 'Schwarzeichenholz', 'Schwarzeichenstamm', 'Schwarzeichenlaub'],
  mangrove: ['Mangroven', 'Mangrovenholz', 'Mangrovenstamm', 'Mangrovenlaub'],
  cherry: ['Kirsch', 'Kirschholz', 'Kirschstamm', 'Kirschblätter'],
  pale_oak: ['Blasseichen', 'Blasseichenholz', 'Blasseichenstamm', 'Blasseichenlaub'],
  bamboo: ['Bambus', 'Bambus', null, null],
  crimson: ['Karmesin', 'Karmesin', 'Karmesinstiel', null],
  warped: ['Wirr', 'Wirr', 'Wirrstiel', null],
};
// Teil hinter der Holzart → Wort hinter „…holz“ (planks → Eichenholzbretter)
const WOOD_PART = { planks: 'bretter', stairs: 'treppe', slab: 'stufe', fence: 'zaun', fence_gate: 'zauntor', door: 'tür', trapdoor: 'falltür', button: 'knopf', pressure_plate: 'druckplatte', sign: 'schild', wall_sign: 'schild', hanging_sign: 'hängeschild', wall_hanging_sign: 'hängeschild' };

// Farben: Stamm des Adjektivs (ohne Endung); „rosa“ bleibt unverändert
const COLOR = { white: 'weiß', orange: 'orangefarben', magenta: 'magentafarben', light_blue: 'hellblau', yellow: 'gelb', lime: 'hellgrün', pink: 'rosa', gray: 'grau', light_gray: 'hellgrau', cyan: 'türkis', purple: 'violett', blue: 'blau', brown: 'braun', green: 'grün', red: 'rot', black: 'schwarz' };
// Teil hinter der Farbe → [Nomen, Geschlecht f/m/n]
const COLOR_PART = {
  wool: ['Wolle', 'f'], carpet: ['Teppich', 'm'], concrete: ['Beton', 'm'], concrete_powder: ['Trockenbeton', 'm'], terracotta: ['Keramik', 'f'], glazed_terracotta: ['glasierte Keramik', 'f'],
  stained_glass: ['Glas', 'n'], stained_glass_pane: ['Glasscheibe', 'f'], bed: ['Bett', 'n'], banner: ['Banner', 'n'], wall_banner: ['Banner', 'n'], candle: ['Kerze', 'f'], shulker_box: ['Shulker-Kiste', 'f'],
};
const END = { f: 'e', m: 'er', n: 'es' };

// Stein-Familien für Treppe/Stufe/Mauer (alle weiblich: „Polierte Andesittreppe“)
const STEM = {
  stone: 'Stein', cobblestone: 'Bruchstein', stone_brick: 'Steinziegel', brick: 'Ziegel', sandstone: 'Sandstein', red_sandstone: 'Rote Sandstein', quartz: 'Quarz',
  nether_brick: 'Netherziegel', red_nether_brick: 'Rote Netherziegel', purpur: 'Purpur', prismarine: 'Prismarin', prismarine_brick: 'Prismarinziegel', dark_prismarine: 'Dunkle Prismarin',
  andesite: 'Andesit', diorite: 'Diorit', granite: 'Granit', blackstone: 'Schwarzstein', polished_blackstone_brick: 'Polierte Schwarzsteinziegel', deepslate_brick: 'Tiefenschieferziegel', deepslate_tile: 'Tiefenschieferfliesen',
  cobbled_deepslate: 'Bruchtiefenschiefer', mud_brick: 'Schlammziegel', end_stone_brick: 'Endsteinziegel', tuff: 'Tuffstein', tuff_brick: 'Tuffsteinziegel',
  mossy_cobblestone: 'Bemooste Bruchstein', mossy_stone_brick: 'Bemooste Steinziegel', smooth_stone: 'Glatte Stein', smooth_sandstone: 'Glatte Sandstein', smooth_red_sandstone: 'Glatte rote Sandstein', smooth_quartz: 'Glatte Quarz',
  cut_sandstone: 'Geschnittene Sandstein', cut_red_sandstone: 'Geschnittene rote Sandstein',
  polished_andesite: 'Polierte Andesit', polished_diorite: 'Polierte Diorit', polished_granite: 'Polierte Granit', polished_blackstone: 'Polierte Schwarzstein', polished_deepslate: 'Polierte Tiefenschiefer', polished_tuff: 'Polierte Tuffstein',
};
const STONE_PART = { stairs: 'treppe', slab: 'stufe', wall: 'mauer' };

/** Zusammengesetzt: Adjektiv-Teil („Polierte “) bleibt getrennt, der Rest wird zum Wort („Andesit“ + „treppe“). */
const join = (stem, part) => { const i = stem.lastIndexOf(' '); return i < 0 ? stem + part : stem.slice(0, i + 1) + stem.slice(i + 1) + part; };

/** Deutscher Name für eine Block-ID ("minecraft:oak_planks") oder null, wenn unbekannt. */
export function germanBlockName(name) {
  const full = String(name || '');
  if (full.includes(':') && !full.startsWith('minecraft:')) return null; // Mods: eigener Name bleibt
  const id = full.replace(/^minecraft:/, '').replace(/\[.*$/, '');
  if (SINGLE[id]) return SINGLE[id];
  // Farben (längste Farbe zuerst: light_blue vor blue)
  for (const c of Object.keys(COLOR).sort((a, b) => b.length - a.length)) {
    if (!id.startsWith(`${c}_`)) continue;
    const part = COLOR_PART[id.slice(c.length + 1)];
    if (!part) break;
    const adj = COLOR[c] === 'rosa' ? 'rosa' : COLOR[c] + END[part[1]];
    const s = `${adj} ${part[0]}`;
    return s[0].toUpperCase() + s.slice(1);
  }
  // Holz
  for (const w of Object.keys(WOOD).sort((a, b) => b.length - a.length)) {
    const [pre, holz, log, leaves] = WOOD[w];
    const strip = id.startsWith('stripped_') ? 'Entrindeter ' : '';
    const rest = id.replace(/^stripped_/, '');
    if (!rest.startsWith(`${w}_`)) continue;
    const p = rest.slice(w.length + 1);
    if ((p === 'log' || p === 'stem') && log) return strip + log;
    if ((p === 'wood' || p === 'hyphae') && holz) { const base = holz === pre ? `${pre}hyphen` : holz; return strip ? `${holz === pre ? 'Entrindete' : 'Entrindetes'} ${base}` : base; }
    if (strip) break;
    if (p === 'leaves' && leaves) return leaves;
    if (p === 'sapling') return `${pre}setzling`;
    if (WOOD_PART[p]) return holz + WOOD_PART[p];
    break;
  }
  // Stein: Treppe/Stufe/Mauer
  const m = id.match(/^(.+)_(stairs|slab|wall)$/);
  if (m && STEM[m[1]]) return join(STEM[m[1]], STONE_PART[m[2]]);
  return null;
}
