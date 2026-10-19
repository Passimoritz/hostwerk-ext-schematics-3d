import { useState } from 'react';
import { Box, FileBox, Search, FolderOpen } from 'lucide-react';
import { useApi, fmtBytes, fmtDate } from '@hostwerk/api';
import { Empty, Loading, InfoTip } from '@hostwerk/ui';
import Viewer from './Viewer';
import './style.css';

/*
 * Schematics in 3D: a page with every build file of your Minecraft servers and a 3D viewer, plus the 3D view in
 * Hostwerk's file preview (slot "files.preview") for .schem, .schematic and .litematic.
 */
function SchematicsPage() {
  const d = useApi('/schematics', [], { live: false });
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState('');
  const groups = (d.data || []).map((g) => ({ ...g, files: g.files.filter((f) => !q || f.path.toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.files.length);
  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1><Box /> Schematics in 3D</h1>
          <p>Look at Minecraft builds before you place them – from WorldEdit, Litematica and MCEdit.</p>
        </div>
        <div className="actions">
          <InfoTip title="Where do the files come from?">Hostwerk looks through the folders of your Minecraft servers (for example plugins/WorldEdit/schematics or schematics/). Any build file in the file browser opens in 3D as well.</InfoTip>
        </div>
      </div>
      {!d.data ? <Loading /> : d.data.length === 0 ? (
        <Empty icon={FileBox} title="No builds found" text="Put .schem, .schematic or .litematic files into a Minecraft server folder – or open one in the file browser." action={<a className="btn" href="#/files"><FolderOpen size={14} />Open files</a>} />
      ) : (
        <div className="schem-layout">
          <div className="card schem-list">
            <div className="card-body"><label className="ext-search"><Search size={15} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search builds …" aria-label="Search builds" /></label></div>
            {groups.map((g) => (
              <div key={g.root}>
                <div className="schem-group">{g.label}</div>
                {g.files.map((f) => (
                  <button type="button" key={f.path} className={`list-item schem-item ${sel && sel.root === g.root && sel.path === f.path ? 'on' : ''}`} onClick={() => setSel({ root: g.root, path: f.path, name: f.name })}>
                    <FileBox size={15} className="muted" />
                    <div className="grow" style={{ minWidth: 0, textAlign: 'left' }}><div className="small bold ellipsis">{f.name}</div><div className="tiny muted ellipsis">{f.path} · {fmtBytes(f.size)} · {fmtDate(f.mtime)}</div></div>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="card">
            {sel ? <div className="card-body"><div className="bold" style={{ marginBottom: 8 }}>{sel.name}</div><Viewer root={sel.root} path={sel.path} /></div> : <Empty icon={Box} title="Pick a build" text="Choose a file on the left – it opens here in 3D." />}
          </div>
        </div>
      )}
    </div>
  );
}

export default {
  pages: { main: SchematicsPage },
  slots: {
    // Hostwerk's file preview offers "3D" for these files as soon as this extension is installed
    'files.preview': [{ id: 'schematic-3d', title: '3D', match: /\.(schem|schematic|litematic)$/i, Component: Viewer }],
  },
};
