import { useState } from 'react';
import { Box, FileBox, Search, FolderOpen, RefreshCw } from 'lucide-react';
import { useApi, fmtBytes, fmtDate } from '@hostwerk/api';
import { Btn, Empty, Loading, InfoTip } from '@hostwerk/ui';
import Viewer from './Viewer';
import './style.css';

/*
 * Schematics in 3D: a page with every build file of your Minecraft servers and a 3D viewer, a tab "Builds" in Hostwerk's
 * Minecraft area (slot "minecraft.tabs", with a choice of server), plus the 3D view in Hostwerk's file preview
 * (slot "files.preview") for .schem, .schematic, .litematic and vanilla .nbt structures.
 */
function Builds({ compact = false }) {
  const d = useApi('/schematics', [], { live: false });
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState('');
  const [server, setServer] = useState('');
  if (d.error && !d.data) return <Empty icon={FileBox} title="Couldn't look for builds" text={String(d.error.message || d.error)} action={<Btn className="sm" icon={RefreshCw} onClick={() => d.reload()}>Try again</Btn>} />;
  if (!d.data) return <Loading />;
  if (d.data.length === 0) return <Empty icon={FileBox} title="No builds found" text="Put .schem, .schematic, .litematic or .nbt files into a Minecraft server folder – or open one in the file browser." action={<a className="btn" href="#/files"><FolderOpen size={14} />Open files</a>} />;
  const groups = d.data.filter((g) => !server || g.root === server).map((g) => ({ ...g, files: g.files.filter((f) => !q || f.path.toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.files.length);
  return (
    <div className={`schem-layout ${compact ? 'schem-compact' : ''}`}>
      <div className="card schem-list">
        <div className="card-body stack schem-filter">
          {d.data.length > 1 && (
            <select className="select" value={server} aria-label="Server" onChange={(e) => setServer(e.target.value)}>
              <option value="">All servers</option>
              {d.data.map((g) => <option key={g.root} value={g.root}>{g.label}</option>)}
            </select>
          )}
          <label className="ext-search"><Search size={15} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search builds …" aria-label="Search builds" /></label>
        </div>
        {groups.length === 0 && <p className="small muted schem-none">No build matches.</p>}
        {groups.map((g) => (
          <div key={g.root}>
            <div className="schem-group">{g.label}</div>
            {g.files.map((f) => (
              <button type="button" key={f.path} className={`list-item schem-item ${sel && sel.root === g.root && sel.path === f.path ? 'on' : ''}`} aria-current={sel && sel.root === g.root && sel.path === f.path ? 'true' : undefined} onClick={() => setSel({ root: g.root, path: f.path, name: f.name })}>
                <FileBox size={15} className="muted" />
                <div className="grow schem-item-text"><div className="small bold ellipsis">{f.name}</div><div className="tiny muted ellipsis">{f.path} · {fmtBytes(f.size)} · {fmtDate(f.mtime)}</div></div>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="card">
        {sel ? <div className="card-body"><div className="bold schem-title">{sel.name}</div><Viewer root={sel.root} path={sel.path} name={sel.name} /></div> : <Empty icon={Box} title="Pick a build" text="Choose a file on the left – it opens here in 3D." />}
      </div>
    </div>
  );
}

function SchematicsPage() {
  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1><Box /> Schematics in 3D</h1>
          <p>Look at Minecraft builds before you place them – from WorldEdit, Litematica, MCEdit and structure blocks.</p>
        </div>
        <div className="actions">
          <InfoTip title="Where do the files come from?">Hostwerk looks through the folders of your Minecraft servers (for example plugins/WorldEdit/schematics, schematics/ or structures/). Any build file in the file browser opens in 3D as well.</InfoTip>
        </div>
      </div>
      <Builds />
    </div>
  );
}

export default {
  pages: { main: SchematicsPage },
  slots: {
    // Hostwerk's file preview offers "3D" for these files as soon as this extension is installed
    'files.preview': [{ id: 'schematic-3d', title: '3D', match: /\.(schem|schematic|litematic|nbt)$/i, Component: Viewer }],
    // Reiter „Bauwerke“ im Minecraft-Bereich – mit Auswahl des Servers
    'minecraft.tabs': [{ id: 'builds', title: 'Builds', icon: Box, Component: () => <Builds compact /> }],
  },
};
