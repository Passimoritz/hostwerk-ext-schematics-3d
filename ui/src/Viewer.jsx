import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, ListChecks, Copy, ImageDown, RefreshCw, FileDown, GitCompare, Keyboard } from 'lucide-react';
import { get } from '@hostwerk/api';
import { THREE, OrbitControls } from '@hostwerk/three';
import { Btn, toast } from '@hostwerk/ui';
import { t } from '@hostwerk/i18n';
import { colorOf } from './colors.mjs';
import { materials, asText, asCsv, diffMaterials, countsUpTo, STACK } from './materials.mjs';

/*
 * 3D view of a Minecraft build (.schem, .schematic, .litematic, vanilla .nbt): every visible block as a cube in one draw
 * call per opacity (InstancedMesh), coloured by block type (colors.mjs). Drag rotates, the mouse wheel zooms.
 * Layer slider (layer by layer from the bottom, or just one layer as a slice), material list (all blocks, also hidden
 * ones) to copy or save as CSV, comparison with another build (what changed in the material), a PNG picture and keyboard
 * control (arrows rotate, + / - zoom, Page up/down change the layer, 0 resets). three.js comes from Hostwerk.
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
  const [slice, setSlice] = useState(false); // nur die gewählte Ebene zeigen (Schnitt)
  const [other, setOther] = useState(null); // Vergleich: { path, data | error }
  const [siblings, setSiblings] = useState(null);
  useEffect(() => {
    let alive = true; let cleanup = () => {};
    setSt({ busy: true, error: null, data: null }); setLevel(null); scene3d.current = null;
    get(`/files/schematic?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`).then((d) => {
      if (!alive) return;
      if (!d.ok) { setSt({ busy: false, error: d.error, data: null }); return; }
      const el = host.current; if (!el) return;
      const w = el.clientWidth || 640; const h = el.clientHeight || 440;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.localClippingEnabled = true; // Schnitt: eine Ebene allein zeigen
      const below = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // schneidet alles unter der Ebene weg (nur im Schnitt aktiv)
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
        const mat = new THREE.MeshLambertMaterial({ transparent: g.a < 1, opacity: g.a, depthWrite: g.a >= 1, clippingPlanes: [] });
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
      const home = { pos: cam.position.clone(), target: controls.target.clone() };
      // Tastatur: um die Mitte drehen, heran/weg zoomen, Ausgangsansicht
      const orbit = (dAz, dEl) => { const off = cam.position.clone().sub(controls.target); const sph = new THREE.Spherical().setFromVector3(off); sph.theta += dAz; sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi + dEl)); off.setFromSpherical(sph); cam.position.copy(controls.target).add(off); };
      const zoom = (f) => { const off = cam.position.clone().sub(controls.target).multiplyScalar(f); cam.position.copy(controls.target).add(off); };
      const reset = () => { cam.position.copy(home.pos); controls.target.copy(home.target); };
      const cut = (on, y) => { below.constant = -y; for (const { mesh } of meshes) { mesh.material.clippingPlanes = on ? [below] : []; mesh.material.needsUpdate = true; } };
      scene3d.current = { meshes, orbit, zoom, reset, cut, snapshot: () => { renderer.render(scene, cam); return renderer.domElement.toDataURL('image/png'); } };
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
    s.cut(slice, top); // Schnitt: alles unter der Ebene weg – oben begrenzt schon der Schieber
  }, [level, slice, st.data]);

  // Vergleich: andere Bauwerke im selben Ordner zur Auswahl (erst wenn gewünscht)
  const dir = String(path).includes('/') ? String(path).slice(0, String(path).lastIndexOf('/')) : '';
  const full = (n) => (dir ? `${dir}/${n}` : n);
  const loadSiblings = () => get(`/files/list?root=${encodeURIComponent(root)}&path=${encodeURIComponent(dir)}`)
    .then((l) => setSiblings((Array.isArray(l) ? l : []).filter((f) => !f.dir && /\.(schem|schematic|litematic|nbt)$/i.test(f.name) && full(f.name) !== path).map((f) => full(f.name))))
    .catch(() => setSiblings([]));
  const compareWith = (p) => {
    if (!p) { setOther(null); return; }
    setOther({ path: p, data: null });
    get(`/files/schematic?root=${encodeURIComponent(root)}&path=${encodeURIComponent(p)}`).then((r) => setOther(r.ok ? { path: p, data: r } : { path: p, error: r.error })).catch((e) => setOther({ path: p, error: e.message }));
  };
  const onKey = (e) => {
    const s = scene3d.current; if (!s || !st.data) return;
    const step = e.shiftKey ? 0.4 : 0.12;
    const k = e.key;
    const maxY = st.data.size.y - 1;
    if (k === 'ArrowLeft') s.orbit(-step, 0); else if (k === 'ArrowRight') s.orbit(step, 0);
    else if (k === 'ArrowUp') s.orbit(0, -step); else if (k === 'ArrowDown') s.orbit(0, step);
    else if (k === '+' || k === '=') s.zoom(0.85); else if (k === '-' || k === '_') s.zoom(1.18);
    else if (k === 'PageUp') setLevel((v) => Math.min(maxY, (v == null ? maxY : v) + 1));
    else if (k === 'PageDown') setLevel((v) => Math.max(0, (v == null ? maxY : v) - 1));
    else if (k === '0' || k === 'Home') s.reset();
    else return;
    e.preventDefault();
  };

  const d = st.data;
  const list = useMemo(() => (d ? materials(d.palette, d.counts || []) : []), [d]);
  const fileName = (name || String(path).split('/').pop() || 'build').replace(/\.[^.]+$/, '');
  const copyList = async () => {
    try { await navigator.clipboard.writeText(asText(list, { title: t('Materials for {name}', { name: fileName }), locale: locale(), stacksWord: t('stacks') })); toast.success(t('Material list copied')); } catch { toast.error(t('Could not copy')); }
  };
  const saveCsv = () => {
    const blob = new Blob([asCsv(list, { header: [t('Block'), t('Count'), t('Stacks'), t('Shulker boxes')] })], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fileName}-materials.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const diff = useMemo(() => (d && other && other.data ? diffMaterials(materials(d.palette, d.counts || []), materials(other.data.palette, other.data.counts || [])) : null), [d, other]);
  const savePng = () => {
    const s = scene3d.current; if (!s) return;
    const a = document.createElement('a'); a.href = s.snapshot(); a.download = `${fileName}.png`; document.body.appendChild(a); a.click(); a.remove();
  };
  const info = d ? t('{x} × {y} × {z} blocks · {total} blocks, {shown} visible · {kinds} block types', { x: d.size.x, y: d.size.y, z: d.size.z, total: num(d.total), shown: num(d.shown), kinds: d.palette.length }) + (d.truncated ? ` · ${t('shortened')}` : '') : '';
  const top = d ? (level == null ? d.size.y - 1 : level) : 0;
  return (
    <div className="schem-view">
      <div ref={host} className="schem-canvas" role="application" tabIndex={0} onKeyDown={onKey} aria-label={t('3D view of the build – arrow keys rotate, plus and minus zoom, Page up and Page down change the layer, 0 resets the view')} />
      {st.busy ? <div className="tiny muted">{t('Reading the build …')}</div>
        : st.error ? <div className="small c-err row-tight">{st.error}<Btn className="xs" icon={RefreshCw} onClick={() => setAttempt((x) => x + 1)}>Try again</Btn></div>
          : <div className="tiny muted row-tight">{`${info} · ${t('Drag to rotate, scroll to zoom')}`}<Keyboard size={12} aria-hidden="true" /><span>{t('or click and use the arrow keys')}</span></div>}
      {d && (
        <div className="schem-tools">
          {d.size.y > 1 && (
            <label className="schem-layer small">
              <Layers size={14} aria-hidden="true" />
              <span>{t('Layer {n} of {all}', { n: top + 1, all: d.size.y })}</span>
              <input type="range" min={0} max={d.size.y - 1} value={top} aria-label={t('Show layers up to')} onChange={(e) => setLevel(Number(e.target.value))} />
            </label>
          )}
          {d.size.y > 1 && <label className="row-tight small schem-slice"><input type="checkbox" checked={slice} onChange={(e) => setSlice(e.target.checked)} />{t('Only this layer')}</label>}
          <Btn className="sm" icon={ListChecks} aria-expanded={showList} onClick={() => setShowList((x) => !x)}>Material list</Btn>
          <Btn className="sm" icon={ImageDown} onClick={savePng}>Save as picture</Btn>
          {siblings === null ? <Btn className="sm ghost" icon={GitCompare} onClick={loadSiblings}>Compare …</Btn> : (
            <select className="select schem-compare" aria-label={t('Compare with')} value={other ? other.path : ''} onChange={(e) => compareWith(e.target.value)}>
              <option value="">{siblings.length ? t('Compare with …') : t('No other build in this folder')}</option>
              {siblings.map((p) => <option key={p} value={p}>{p.split('/').pop()}</option>)}
            </select>
          )}
        </div>
      )}
      {other && (
        <div className="schem-materials">
          {other.error ? <div className="small c-err">{other.error}</div> : !diff ? <div className="tiny muted">{t('Reading the build …')}</div> : (
            <>
              <b className="small">{t('Compared with {name}: {n} block types changed', { name: other.path.split('/').pop(), n: diff.length })}</b>
              {diff.length === 0 ? <p className="small muted">{t('Same material – both builds use the same blocks in the same amounts.')}</p> : (
                <table className="table small"><thead><tr><th>Block</th><th className="right">This build</th><th className="right">Other</th><th className="right">Difference</th></tr></thead>
                  <tbody>{diff.map((m) => <tr key={m.name}><td><span className="schem-swatch" style={{ background: colorOf(m.name)[0] }} aria-hidden="true" />{m.label}</td><td className="right mono">{num(m.a)}</td><td className="right mono">{num(m.b)}</td><td className={`right mono ${m.delta > 0 ? 'c-ok' : 'c-err'}`}>{m.delta > 0 ? `+${num(m.delta)}` : `−${num(-m.delta)}`}</td></tr>)}</tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}
      {d && showList && (
        <div className="schem-materials">
          <div className="row-tight"><b className="small grow">{t('{n} block types, {total} blocks', { n: list.length, total: num(d.total) })}</b><Btn className="xs" icon={Copy} onClick={copyList}>Copy</Btn><Btn className="xs" icon={FileDown} onClick={saveCsv}>Save as CSV</Btn></div>
          <table className="table small"><thead><tr><th>Block</th><th className="right">Count</th><th className="right">Stacks</th></tr></thead>
            <tbody>{list.map((m) => <tr key={m.name}><td><span className="schem-swatch" style={{ background: colorOf(m.name)[0] }} aria-hidden="true" />{m.label}</td><td className="right mono">{num(m.count)}</td><td className="right mono">{m.count >= STACK ? `${num(m.stacks)} × 64${m.rest ? ` + ${num(m.rest)}` : ''}` : '–'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
