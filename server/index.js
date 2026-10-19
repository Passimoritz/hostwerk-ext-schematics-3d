'use strict';
/*
 * Native part of "Schematics in 3D" (SDK 2.7):
 *   GET /api/files/schematic?root=&path=   visible blocks of one build (same address as when it was built in)
 *   GET /api/schematics                    every build file found in the Minecraft server folders
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('./schematic');

const EXT = /\.(schem|schematic|litematic)$/i;
const SKIP = /^(world|world_nether|world_the_end|libraries|cache|logs|crash-reports|versions|\.hostwerk.*|node_modules)$/i;

/** Build files below a folder (depth 5, at most 300) – plugins/WorldEdit/schematics, schematics/, config/… */
function findBuilds(base, max = 300) {
  const out = [];
  const walk = (dir, rel, depth) => {
    if (depth > 5 || out.length >= max) return;
    let list = []; try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of list) {
      if (out.length >= max) return;
      if (e.isDirectory()) { if (!SKIP.test(e.name)) walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name, depth + 1); continue; }
      if (!EXT.test(e.name)) continue;
      let st = null; try { st = fs.statSync(path.join(dir, e.name)); } catch { continue; }
      out.push({ path: rel ? `${rel}/${e.name}` : e.name, name: e.name, size: st.size, mtime: st.mtimeMs });
    }
  };
  walk(base, '', 0);
  return out.sort((a, b) => b.mtime - a.mtime);
}

function activate(host) {
  const { ctx } = host;
  host.router.get('/files/schematic', (req, res, next) => {
    try {
      const { full } = ctx.files.resolve(req.query.root, req.query.path);
      if (fs.statSync(full).size > 30 * 1024 * 1024) throw host.error(413, 'The file is too big for the preview (over 30 MB).');
      res.json({ ok: true, ...parse(full) });
    } catch (e) {
      if (e.status) return next(e);
      res.json({ ok: false, error: e.unknownFormat ? host.t('Unknown schematic format.') : e.message });
    }
  });
  host.router.get('/schematics', (req, res) => {
    const roots = ctx.files.roots().filter((r) => r.kind === 'mc');
    res.json(roots.map((r) => ({ root: r.id, label: r.label.replace(/^Minecraft: /, ''), files: findBuilds(r.path) })).filter((r) => r.files.length));
  });
}

module.exports = { activate, findBuilds };
