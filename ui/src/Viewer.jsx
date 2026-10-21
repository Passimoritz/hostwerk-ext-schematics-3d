import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, ListChecks, Copy, ImageDown, RefreshCw } from 'lucide-react';
import { get } from '@hostwerk/api';
import { THREE, OrbitControls } from '@hostwerk/three';
import { Btn, toast } from '@hostwerk/ui';
import { t } from '@hostwerk/i18n';
import { colorOf } from './colors.mjs';
import { materials, asText, countsUpTo, STACK } from './materials.mjs';

/*
 * 3D view of a Minecraft build (.schem, .schematic, .litematic, vanilla .nbt): every visible block as a cube in one draw
 * call per opacity (InstancedMesh), coloured by block type (colors.mjs). Drag rotates, the mouse wheel zooms.
 * Layer slider (layer by layer from the bottom), material list (all blocks, also hidden ones) and a PNG picture.
 * three.js comes from Hostwerk.
 */
export { colorOf };
const locale = () => (document.documentElement.lang === 'en' ? 'en-GB' : 'de-DE');
const num = (v) => Number(v || 0).toLocaleString(locale());

export default function Viewer({ root, path, name }) {
  const host = useRef(null);
  const scene3d = useRef(null); // { meshes: [{ mesh, upTo }], snapshot() }
  const [st, setSt] = useState({ busy: true, error: null, data: null });
  const [level, setLevel] = useState(null);
  const [showList, setShowList] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true; let cleanup = () => {};
    setSt({ busy: true, error: null, data: null }); setLevel(null); scene3d.current = null;
    get(`/files/schematic?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`).then((d) => {
      if (!alive) return;
      if (!d.ok) { setSt({ busy: false, error: d.error, data: null }); return; }
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
      // One instance group per opacity (see-through: glass, water …), sorted by height – then the layer slider only
      // has to shorten each group (mesh.count) instead of rebuilding anything
      const groups = new Map();
      const n = d.blocks.length / 4;
      for (let i = 0; i < n; i++) { const [, a] = colorOf(d.palette[d.blocks[i * 4 + 3]] || ''); const k = a < 1 ? `t${a}` : 'o'; if (!groups.has(k)) groups.set(k, { a, list: [] }); groups.get(k).list.push(i); }
      const m4 = new THREE.Matrix4(); const col = new THREE.Color();
      const cx = d.size.x / 2; const cz = d.size.z / 2;
      const meshes = [];
      for (const [, g] of groups) {
        g.list.sort((p, q) => d.blocks[p * 4 + 1] - d.blocks[q * 4 + 1]);
        const mat = new THREE.MeshLambertMaterial({ transparent: g.a < 1, opacity: g.a, depthWrite: g.a >= 1 });
        const mesh = new THREE.InstancedMesh(geo, mat, g.list.length);
        g.list.forEach((i, k) => { m4.makeTranslation(d.blocks[i * 4] - cx + 0.5, d.blocks[i * 4 + 1] + 0.5, d.blocks[i * 4 + 2] - cz + 0.5); mesh.setMatrixAt(k, m4); mesh.setColorAt(k, col.set(colorOf(d.palette[d.blocks[i * 4 + 3]] || '')[0])); });
        scene.add(mesh);
        meshes.push({ mesh, upTo: countsUpTo(g.list.map((i) => d.blocks[i * 4 + 1]), d.size.y) });
      }
      const r = Math.max(d.size.x, d.size.y, d.size.z) || 1;
      cam.position.set(r * 1.1, d.size.y * 0.9 + r * 0.5, r * 1.3);
      controls.target.set(0, d.size.y / 3, 0); controls.update();
      let raf = 0;
      const loop = () => { controls.update(); renderer.render(scene, cam); raf = requestAnimationFrame(loop); };
      loop();
      const ro = new ResizeObserver(() => { const W = el.clientWidth; const H = el.clientHeight; if (!W || !H) return; renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); });
      ro.observe(el);
      // Bild: direkt nach dem Zeichnen auslesen (ohne preserveDrawingBuffer, das jedes Bild langsamer machte)
      scene3d.current = { meshes, snapshot: () => { renderer.render(scene, cam); return renderer.domElement.toDataURL('image/png'); } };
      setSt({ busy: false, error: null, data: d });
      cleanup = () => { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); geo.dispose(); scene.traverse((o) => { if (o.material) o.material.dispose(); }); el.innerHTML = ''; scene3d.current = null; };
    }).catch((e) => alive && setSt({ busy: false, error: e.message, data: null }));
    return () => { alive = false; cleanup(); };
  }, [root, path, attempt]);

  // Ebenen-Schieber: nur Blöcke bis zu dieser Höhe zeigen
  useEffect(() => {
    const s = scene3d.current; if (!s || !st.data) return;
    const top = level == null ? st.data.size.y - 1 : level;
    for (const { mesh, upTo } of s.meshes) mesh.count = upTo[Math.max(0, Math.min(top, upTo.length - 1))] || 0;
  }, [level, st.data]);

  const d = st.data;
  const list = useMemo(() => (d ? materials(d.palette, d.counts || []) : []), [d]);
  const fileName = (name || String(path).split('/').pop() || 'build').replace(/\.[^.]+$/, '');
  const copyList = async () => {
    try { await navigator.clipboard.writeText(asText(list, { title: t('Materials for {name}', { name: fileName }), locale: locale(), stacksWord: t('stacks') })); toast.success(t('Material list copied')); } catch { toast.error(t('Could not copy')); }
  };
  const savePng = () => {
    const s = scene3d.current; if (!s) return;
    const a = document.createElement('a'); a.href = s.snapshot(); a.download = `${fileName}.png`; document.body.appendChild(a); a.click(); a.remove();
  };
  const info = d ? t('{x} × {y} × {z} blocks · {total} blocks, {shown} visible · {kinds} block types', { x: d.size.x, y: d.size.y, z: d.size.z, total: num(d.total), shown: num(d.shown), kinds: d.palette.length }) + (d.truncated ? ` · ${t('shortened')}` : '') : '';
  const top = d ? (level == null ? d.size.y - 1 : level) : 0;
  return (
    <div className="schem-view">
      <div ref={host} className="schem-canvas" role="img" aria-label={t('3D view of the build')} />
      {st.busy ? <div className="tiny muted">{t('Reading the build …')}</div>
        : st.error ? <div className="small c-err row-tight">{st.error}<Btn className="xs" icon={RefreshCw} onClick={() => setAttempt((x) => x + 1)}>Try again</Btn></div>
          : <div className="tiny muted">{`${info} · ${t('Drag to rotate, scroll to zoom')}`}</div>}
      {d && (
        <div className="schem-tools">
          {d.size.y > 1 && (
            <label className="schem-layer small">
              <Layers size={14} aria-hidden="true" />
              <span>{t('Layer {n} of {all}', { n: top + 1, all: d.size.y })}</span>
              <input type="range" min={0} max={d.size.y - 1} value={top} aria-label={t('Show layers up to')} onChange={(e) => setLevel(Number(e.target.value))} />
            </label>
          )}
          <Btn className="sm" icon={ListChecks} aria-expanded={showList} onClick={() => setShowList((x) => !x)}>Material list</Btn>
          <Btn className="sm" icon={ImageDown} onClick={savePng}>Save as picture</Btn>
        </div>
      )}
      {d && showList && (
        <div className="schem-materials">
          <div className="row-tight"><b className="small grow">{t('{n} block types, {total} blocks', { n: list.length, total: num(d.total) })}</b><Btn className="xs" icon={Copy} onClick={copyList}>Copy</Btn></div>
          <table className="table small"><thead><tr><th>Block</th><th className="right">Count</th><th className="right">Stacks</th></tr></thead>
            <tbody>{list.map((m) => <tr key={m.name}><td><span className="schem-swatch" style={{ background: colorOf(m.name)[0] }} aria-hidden="true" />{m.label}</td><td className="right mono">{num(m.count)}</td><td className="right mono">{m.count >= STACK ? `${num(m.stacks)} × 64${m.rest ? ` + ${num(m.rest)}` : ''}` : '–'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
