import { Check, Cpu, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PHASES, TECH_CATEGORIES } from '../../data/catalog';
import { uid } from '../../lib/storage';
import { formatNumber } from '../../lib/money';
import type { Currency, PhaseId, ProjectState, TechCategory, Technology, Updater } from '../../types';
import { Button, Card, NumberField, Select, TextField, cx } from '../ui';

const hoursOf = (t: Technology) => Object.values(t.hours).reduce((a, v) => a + (v ?? 0), 0);

export function TechSection({ state, set }: { state: ProjectState; set: Updater }) {
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<TechCategory>('other');
  const selected = state.technologies.filter((t) => state.selectedTechs.includes(t.id));

  const toggle = (id: string) =>
    set((s) => ({
      ...s,
      selectedTechs: s.selectedTechs.includes(id) ? s.selectedTechs.filter((x) => x !== id) : [...s.selectedTechs, id],
    }));
  const patch = (id: string, fn: (t: Technology) => Technology) =>
    set((s) => ({ ...s, technologies: s.technologies.map((t) => (t.id === id ? fn(t) : t)) }));
  const remove = (id: string) =>
    set((s) => ({ ...s, technologies: s.technologies.filter((t) => t.id !== id), selectedTechs: s.selectedTechs.filter((x) => x !== id) }));
  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const id = `custom-${uid()}`;
    set((s) => ({
      ...s,
      technologies: [...s.technologies, { id, name, category: newCat, hours: { backend: 2 }, oneTimeCost: 0, monthlyCost: 0, currency: 'USD', custom: true }],
      selectedTechs: [...s.selectedTechs, id],
    }));
    setNewName('');
  };

  const groups = (Object.keys(TECH_CATEGORIES) as TechCategory[])
    .map((c) => ({ c, items: state.technologies.filter((t) => t.category === c) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-5">
      <Card title="Tecnologías" icon={<Cpu className="h-4 w-4" />} subtitle="Cada tecnología suma horas concretas de setup y configuración, y opcionalmente costos de licencia. Sin multiplicadores.">
        <div className="space-y-4">
          {groups.map(({ c, items }) => (
            <div key={c}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{TECH_CATEGORIES[c]}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((t) => {
                  const on = state.selectedTechs.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(t.id)}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition',
                        on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-surface text-slate-700 hover:border-slate-400',
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {t.name}
                      <span className={cx('text-xs', on ? 'text-indigo-200' : 'text-slate-400')}>+{formatNumber(hoursOf(t))}h</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
            <TextField className="min-w-[180px] flex-1" label="Agregar otra tecnología" value={newName} onChange={setNewName} placeholder="Ej: Laravel, Flutter, Strapi" />
            <Select<TechCategory> ariaLabel="Categoría" className="w-44 py-2" value={newCat} onChange={setNewCat}
              options={(Object.keys(TECH_CATEGORIES) as TechCategory[]).map((c) => ({ value: c, label: TECH_CATEGORIES[c] }))} />
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={add}>Agregar</Button>
          </div>
        </div>
      </Card>

      <Card title="Impacto de las tecnologías seleccionadas" subtitle="Horas que suma cada una por etapa y costos de licencia (se suman a costos de terceros).">
        {selected.length === 0 ? (
          <p className="text-sm text-slate-500">No hay tecnologías seleccionadas.</p>
        ) : (
          <div className="space-y-3">
            {selected.map((t) => (
              <TechEditor key={t.id} tech={t} onChange={(fn) => patch(t.id, fn)} onRemove={t.custom ? () => remove(t.id) : undefined} onUnselect={() => toggle(t.id)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TechEditor({ tech, onChange, onRemove, onUnselect }: {
  tech: Technology;
  onChange: (fn: (t: Technology) => Technology) => void;
  onRemove?: () => void;
  onUnselect: () => void;
}) {
  const [addPhase, setAddPhase] = useState<PhaseId | ''>('');
  const used = PHASES.filter((p) => tech.hours[p.id] !== undefined);
  const unused = PHASES.filter((p) => tech.hours[p.id] === undefined);
  const setHours = (id: PhaseId, v: number | undefined) =>
    onChange((t) => {
      const hours = { ...t.hours };
      if (v === undefined) delete hours[id];
      else hours[id] = v;
      return { ...t, hours };
    });

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-semibold text-slate-900">
          {tech.name} <span className="ml-1 text-sm font-normal text-slate-500">+{formatNumber(hoursOf(tech))} h</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={onUnselect}>Quitar</Button>
          {onRemove && <Button variant="danger" onClick={onRemove} icon={<Trash2 className="h-4 w-4" />} title="Eliminar del catálogo" />}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {used.map((p) => (
          <div key={p.id} className="w-32">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">{p.label}</span>
              <button type="button" className="text-slate-400 hover:text-rose-600" aria-label={`Quitar ${p.label}`} onClick={() => setHours(p.id, undefined)}>×</button>
            </div>
            <NumberField compact value={tech.hours[p.id] ?? 0} suffix="h" max={500} ariaLabel={`${tech.name} ${p.label}`} onChange={(v) => setHours(p.id, v)} />
          </div>
        ))}
        {unused.length > 0 && (
          <div className="w-40">
            <Select<PhaseId | ''> ariaLabel="Agregar etapa" value={addPhase}
              onChange={(v) => { if (v) { setHours(v, 1); setAddPhase(''); } }}
              options={[{ value: '', label: '+ Etapa…' }, ...unused.map((p) => ({ value: p.id, label: p.label }))]} />
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
        <NumberField label="Licencia pago único" value={tech.oneTimeCost} max={1e9} onChange={(v) => onChange((t) => ({ ...t, oneTimeCost: v }))} />
        <NumberField label="Suscripción mensual" value={tech.monthlyCost} max={1e9} onChange={(v) => onChange((t) => ({ ...t, monthlyCost: v }))} />
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Moneda</span>
          <Select<Currency> ariaLabel="Moneda licencia" className="py-2" value={tech.currency} onChange={(v) => onChange((t) => ({ ...t, currency: v }))}
            options={[{ value: 'USD', label: 'USD' }, { value: 'ARS', label: 'ARS' }]} />
        </div>
      </div>
    </div>
  );
}
