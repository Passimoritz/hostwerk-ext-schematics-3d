import { useEffect, useRef, useState } from 'react';
import { get } from '@hostwerk/api';
import { THREE, OrbitControls } from '@hostwerk/three';
import { t } from '@hostwerk/i18n';

/*
 * 3D view of a Minecraft build (.schem, .schematic, .litematic): every visible block as a cube in one draw call per
 * opacity (InstancedMesh), coloured by block type. Drag rotates, the mouse wheel zooms. three.js comes from Hostwerk.
 */
const COLORS = [
  [/water/, '#3f76e4', 0.55], [/lava/, '#e2621b'], [/glass/, '#cfe8f3', 0.35], [/ice/, '#9cc0f2', 0.7], [/leaves|azalea/, '#4b8b2f', 0.9],
  [/grass_block|moss/, '#6aa84f'], [/snow/, '#f4f8fb'], [/sandstone|sand(?!_)|^minecraft:sand$/, '#dbcf9a'], [/dirt|mud|podzol|farmland|path/, '#8a6040'],
  [/(oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped)_(planks|stairs|slab|fence|door|trapdoor)|planks|bookshelf/, '#b08a54'],
  [/log|wood|stem|hyphae/, '#6e5232'], [/deepslate|blackstone|basalt/, '#3e3f45'], [/cobble|andesite|stone_brick|stone|tuff|gravel/, '#8c8c8c'],
  [/granite/, '#9b6b58'], [/diorite|calcite|quartz|white/, '#e8e6e1'], [/brick/, '#9a4f3c'], [/terracotta/, '#a0614a'], [/obsidian|crying/, '#20172d'],
  [/netherrack|nether_brick|red/, '#7a2a2a'], [/end_stone|purpur/, '#d8d39a'], [/prismarine/, '#5aa497'], [/gold/, '#f0c943'], [/iron/, '#d5d5d5'],
  [/diamond/, '#5fe0d7'], [/emerald/, '#2fc46b'], [/redstone/, '#b51a1a'], [/lapis|blue/, '#2a49a8'], [/copper/, '#c06e4c'], [/orange/, '#e37a1f'],
  [/magenta|pink/, '#d470ad'], [/light_blue|cyan/, '#3aa6c7'], [/yellow/, '#efc931'], [/lime|green/, '#66a531'], [/gray|grey/, '#5e6468'],
  [/purple/, '#7a3cad'], [/brown/, '#7a4f2c'], [/black/, '#1f1f24'],
];
export const colorOf = (name) => { for (const [re, c, a] of COLORS) if (re.test(name)) return [c, a ?? 1]; return ['#9aa0a6', 1]; };

export default function Viewer({ root, path }) {
  const host = useRef(null);
  const [st, setSt] = useState({ busy: true, error: null, info: '' });
  useEffect(() => {
    let alive = true; let cleanup = () => {};
    setSt({ busy: true, error: null, info: '' });
    get(`/files/schematic?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`).then((d) => {
      if (!alive) return;
      if (!d.ok) { setSt({ busy: false, error: d.error, info: '' }); return; }
      const el = host.current; if (!el) return;
      const w = el.clientWidth || 640; const h = el.clientHeight || 440;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(w, h);
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100000);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(0.6, 1, 0.4); scene.add(sun);
      const controls = new OrbitControls(cam, renderer.domElement); controls.enableDamping = true;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      // One instance group per opacity (see-through: glass, water …)
      const groups = new Map();
      const n = d.blocks.length / 4;
      for (let i = 0; i < n; i++) { const [, a] = colorOf(d.palette[d.blocks[i * 4 + 3]] || ''); const k = a < 1 ? `t${a}` : 'o'; if (!groups.has(k)) groups.set(k, { a, list: [] }); groups.get(k).list.push(i); }
      const m4 = new THREE.Matrix4(); const col = new THREE.Color();
      const cx = d.size.x / 2; const cz = d.size.z / 2;
      for (const [, g] of groups) {
        const mat = new THREE.MeshLambertMaterial({ transparent: g.a < 1, opacity: g.a, depthWrite: g.a >= 1 });
        const mesh = new THREE.InstancedMesh(geo, mat, g.list.length);
        g.list.forEach((i, k) => { m4.makeTranslation(d.blocks[i * 4] - cx + 0.5, d.blocks[i * 4 + 1] + 0.5, d.blocks[i * 4 + 2] - cz + 0.5); mesh.setMatrixAt(k, m4); mesh.setColorAt(k, col.set(colorOf(d.palette[d.blocks[i * 4 + 3]] || '')[0])); });
        scene.add(mesh);
      }
      const r = Math.max(d.size.x, d.size.y, d.size.z) || 1;
      cam.position.set(r * 1.1, d.size.y * 0.9 + r * 0.5, r * 1.3);
      controls.target.set(0, d.size.y / 3, 0); controls.update();
      let raf = 0;
      const loop = () => { controls.update(); renderer.render(scene, cam); raf = requestAnimationFrame(loop); };
      loop();
      const ro = new ResizeObserver(() => { const W = el.clientWidth; const H = el.clientHeight; if (!W || !H) return; renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); });
      ro.observe(el);
      const num = (v) => v.toLocaleString();
      setSt({ busy: false, error: null, info: t('{x} × {y} × {z} blocks · {total} blocks, {shown} visible · {kinds} block types', { x: d.size.x, y: d.size.y, z: d.size.z, total: num(d.total), shown: num(d.shown), kinds: d.palette.length }) + (d.truncated ? ` · ${t('shortened')}` : '') });
      cleanup = () => { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); geo.dispose(); scene.traverse((o) => { if (o.material) o.material.dispose(); }); el.innerHTML = ''; };
    }).catch((e) => alive && setSt({ busy: false, error: e.message, info: '' }));
    return () => { alive = false; cleanup(); };
  }, [root, path]);
  return (
    <div className="schem-view">
      <div ref={host} className="schem-canvas" role="img" aria-label="3D view of the build" />
      <div className="tiny muted">{st.busy ? t('Reading the build …') : st.error ? <span className="c-err">{st.error}</span> : `${st.info} · ${t('Drag to rotate, scroll to zoom')}`}</div>
    </div>
  );
}
