import { Download, FolderOpen, Save, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { deleteProject, listSaved, normalize, saveProject, type SavedProject } from '../lib/storage';
import type { ProjectState } from '../types';
import { Button, TextField } from './ui';

export function SavedProjects({ state, onLoad }: { state: ProjectState; onLoad: (s: ProjectState) => void }) {
  const [list, setList] = useState<SavedProject[]>(listSaved);
  const [name, setName] = useState(state.quote.projectName || 'Proyecto');
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(state.quote.projectName || 'presupuesto').replace(/[^\w-]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = normalize(JSON.parse(await file.text()));
      if (!parsed) throw new Error();
      onLoad(parsed);
      setMsg('Proyecto importado.');
    } catch {
      setMsg('El archivo no es un proyecto válido.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-2">
        <TextField className="flex-1" label="Guardar proyecto actual como" value={name} onChange={setName} />
        <Button variant="primary" icon={<Save className="h-4 w-4" />}
          onClick={() => { if (name.trim()) { setList(saveProject(name.trim(), state)); setMsg(`Guardado como “${name.trim()}”.`); } }}>
          Guardar
        </Button>
      </div>
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Proyectos guardados en este navegador</h3>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no guardaste proyectos.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {list.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{new Date(p.savedAt).toLocaleString('es-AR')}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" icon={<FolderOpen className="h-4 w-4" />} onClick={() => { const s = normalize(p.state); if (s) onLoad(s); }}>Abrir</Button>
                  <Button variant="danger" title="Eliminar" icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => { if (confirm(`¿Eliminar “${p.name}”?`)) setList(deleteProject(p.id)); }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button icon={<Download className="h-4 w-4" />} onClick={exportJson}>Exportar JSON</Button>
        <Button icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Importar JSON</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}
