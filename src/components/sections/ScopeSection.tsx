import { ChevronDown, ListChecks, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { COMPLEXITY_LABELS, CUSTOMIZATION_LABELS, PHASES, URGENCY_LABELS } from '../../data/catalog';
import { DEFAULT_PARAMS } from '../../data/defaults';
import { formatNumber } from '../../lib/money';
import type { EstimationParams, PhaseHours, PhaseId, ProjectState, Scope, Updater } from '../../types';
import { Button, Card, NumberField } from '../ui';

type UnitKey = 'perScreen' | 'perFeature' | 'perIntegration' | 'perAiFlow' | 'perRevision';

const DRIVERS: { key: keyof Scope; unit: UnitKey; label: string; hint: string }[] = [
  { key: 'screens', unit: 'perScreen', label: 'Pantallas / páginas', hint: 'Vistas únicas a diseñar y maquetar' },
  { key: 'features', unit: 'perFeature', label: 'Funcionalidades', hint: 'Ej: login, carrito, reportes, notificaciones' },
  { key: 'integrations', unit: 'perIntegration', label: 'Integraciones', hint: 'APIs externas: pagos, CRM, email, ERP' },
  { key: 'aiFlows', unit: 'perAiFlow', label: 'Agentes / flujos de IA', hint: 'Cada agente, flujo o pipeline de IA' },
  { key: 'revisions', unit: 'perRevision', label: 'Rondas de revisión', hint: 'Rondas de cambios incluidas en el precio' },
];

const unitTotal = (per: Partial<PhaseHours>) => Object.values(per).reduce((a, v) => a + (v ?? 0), 0);

export function ScopeSection({ state, set }: { state: ProjectState; set: Updater }) {
  const [open, setOpen] = useState(false);
  const p = state.params;
  const setParams = (fn: (p: EstimationParams) => EstimationParams) => set((s) => ({ ...s, params: fn(s.params) }));
  const setUnit = (unit: UnitKey, phase: PhaseId, v: number) =>
    setParams((pp) => ({ ...pp, [unit]: { ...pp[unit], [phase]: v } }));

  return (
    <div className="space-y-5">
      <Card title="Alcance" icon={<ListChecks className="h-4 w-4" />} subtitle="Cada unidad suma horas según los parámetros de abajo.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DRIVERS.map((d) => {
            const perUnit = unitTotal(p[d.unit]);
            return (
              <div key={d.key} className="rounded-xl border border-slate-200 p-3">
                <NumberField
                  label={d.label}
                  hint={d.hint}
                  value={state.scope[d.key]}
                  max={500}
                  onChange={(v) => set((s) => ({ ...s, scope: { ...s.scope, [d.key]: v } }))}
                />
                <p className="mt-2 text-xs text-slate-500">
                  {formatNumber(perUnit)} h por unidad · <span className="font-medium text-slate-700">{formatNumber(perUnit * state.scope[d.key])} h</span>
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="Parámetros de estimación"
        icon={<SlidersHorizontal className="h-4 w-4" />}
        subtitle="Horas por unidad de alcance y factores. Ajustalos a tu velocidad real."
        actions={
          <Button variant="ghost" onClick={() => setOpen((o) => !o)} icon={<ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />}>
            {open ? 'Ocultar' : 'Editar'}
          </Button>
        }
      >
        {!open ? (
          <p className="text-sm text-slate-500">Desplegá para editar cuántas horas suma cada pantalla, funcionalidad o integración en cada etapa.</p>
        ) : (
          <div className="space-y-6">
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-medium">Etapa</th>
                    {DRIVERS.map((d) => (
                      <th key={d.key} className="px-1 py-2 text-right font-medium">{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PHASES.map((ph) => (
                    <tr key={ph.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-3 text-slate-700">{ph.label}</td>
                      {DRIVERS.map((d) => (
                        <td key={d.key} className="px-1 py-1">
                          <NumberField compact ariaLabel={`${d.label} – ${ph.label}`} value={p[d.unit][ph.id] ?? 0} max={200} onChange={(v) => setUnit(d.unit, ph.id, v)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <FactorGroup title="Factor por complejidad" labels={COMPLEXITY_LABELS} values={p.complexity} prefix="×" step={0.05} max={5}
                onChange={(k, v) => setParams((pp) => ({ ...pp, complexity: { ...pp.complexity, [k]: v } }))} />
              <FactorGroup title="Factor por personalización" labels={CUSTOMIZATION_LABELS} values={p.customization} prefix="×" step={0.05} max={5}
                onChange={(k, v) => setParams((pp) => ({ ...pp, customization: { ...pp.customization, [k]: v } }))} />
              <FactorGroup title="Recargo por urgencia" labels={URGENCY_LABELS} values={p.urgency} suffix="%" step={1} max={200}
                onChange={(k, v) => setParams((pp) => ({ ...pp, urgency: { ...pp.urgency, [k]: v } }))} />
            </div>
            <Button variant="ghost" onClick={() => setParams(() => structuredClone(DEFAULT_PARAMS))}>Restaurar parámetros por defecto</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function FactorGroup<K extends string>({ title, labels, values, onChange, prefix, suffix, step, max }: {
  title: string;
  labels: Record<K, { label: string }>;
  values: Record<K, number>;
  onChange: (k: K, v: number) => void;
  prefix?: string;
  suffix?: string;
  step: number;
  max: number;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="space-y-2">
        {(Object.keys(labels) as K[]).map((k) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">{labels[k].label}</span>
            <NumberField compact className="w-28" ariaLabel={`${title} ${labels[k].label}`} value={values[k]} step={step} max={max} prefix={prefix} suffix={suffix}
              min={prefix ? 0.1 : 0} onChange={(v) => onChange(k, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
