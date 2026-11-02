import { Plus, Repeat, Trash2 } from 'lucide-react';
import type { CalcResult } from '../../lib/calc';
import { calculateSaaS } from '../../lib/templates';
import { useMoney } from '../../lib/money';
import { uid } from '../../lib/storage';
import type { ProjectState, SaaSSettings, Updater } from '../../types';
import { Button, Card, NumberField, TextField, Toggle } from '../ui';

export function SaaSSection({ state, set, result }: { state: ProjectState; set: Updater; result: CalcResult }) {
  const money = useMoney();
  const s = state.saas;
  const patch = (p: Partial<SaaSSettings>) => set((state) => ({ ...state, saas: { ...state.saas, ...p } }));
  const r = calculateSaaS(s, result.selected.totalCost);
  const fmt = (n: number | null) => n === null ? 'Pendiente' : money.fmt(n, 2);
  return <div className="space-y-5">
    <Card title="¿Cuánto cobrar por tu SaaS?" icon={<Repeat className="h-4 w-4" />}
      subtitle="Abonos mensuales por cliente según la plantilla TodoCode. Este cálculo es independiente del presupuesto de desarrollo.">
      <p className="mb-4 text-sm text-slate-500">Distribuí la recuperación del desarrollo y la infraestructura entre tus clientes. Sumá soporte por cliente, ganancia, costo variable del plan y extras. Importes en {state.currency.base}.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Costo de desarrollo inicial" value={r.development} disabled={s.useProjectCost} onChange={(developmentCost) => patch({ developmentCost })} />
        <NumberField label="Meses para recuperar el desarrollo" value={s.recoveryMonths} onChange={(recoveryMonths) => patch({ recoveryMonths })} />
        <NumberField label="Cantidad de clientes" value={s.clients} onChange={(clients) => patch({ clients })} />
        <NumberField label="Infraestructura mensual compartida" value={s.infrastructureMonthly} onChange={(infrastructureMonthly) => patch({ infrastructureMonthly })} />
        <NumberField label="Soporte por cliente" suffix="h/mes" value={s.supportHours} onChange={(supportHours) => patch({ supportHours })} />
        <NumberField label="Costo por hora de soporte" value={s.supportHourlyRate} onChange={(supportHourlyRate) => patch({ supportHourlyRate })} />
        <NumberField label="Ganancia sobre el costo base" suffix="%" value={s.markupPct} onChange={(markupPct) => patch({ markupPct })} />
        <NumberField label="Redondear abono hacia arriba a múltiplos de" value={s.rounding} hint="0 = sin redondeo. Se redondea antes de sumar extras, como en la plantilla." onChange={(rounding) => patch({ rounding })} />
      </div>
      <div className="mt-4"><Toggle label="Usar el costo total del proyecto actual como inversión inicial" checked={s.useProjectCost} onChange={(useProjectCost) => patch({ useProjectCost })} /></div>
      {s.useProjectCost && result.direct.missingRate && <p className="mt-3 text-sm text-amber-700">El costo del proyecto está incompleto porque falta la cotización de moneda.</p>}
    </Card>
    <Card title="Costo base mensual por cliente" subtitle="(Desarrollo ÷ meses + infraestructura) ÷ clientes + soporte por cliente.">
      <dl className="space-y-2 text-sm text-slate-600">
        <div className="flex justify-between gap-3"><dt>Recuperación del desarrollo por mes (total)</dt><dd>{fmt(r.recovery)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Desarrollo e infraestructura por cliente</dt><dd>{fmt(r.shared)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Soporte por cliente</dt><dd>{fmt(r.support)}</dd></div>
        <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 font-semibold text-slate-900"><dt>Costo base por cliente</dt><dd>{fmt(r.base)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Ganancia ({s.markupPct}%)</dt><dd>{fmt(r.markup)}</dd></div>
      </dl>
      {r.warnings.map((w) => <p key={w} role="alert" className="mt-3 text-sm text-amber-700">{w}</p>)}
    </Card>
    <Card title="Extras mensuales por cliente" subtitle="Se suman después del redondeo del plan.">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Horas extras" value={s.extraHours} onChange={(extraHours) => patch({ extraHours })} />
        <NumberField label="Precio por hora extra" value={s.extraHourlyRate} onChange={(extraHourlyRate) => patch({ extraHourlyRate })} />
        <NumberField label="Otros extras" value={s.otherExtras} onChange={(otherExtras) => patch({ otherExtras })} />
      </div>
    </Card>
    <Card title="Abonos por plan" subtitle="Precios mensuales por cliente, antes de impuestos. No se agrega el IVA ni el descuento del presupuesto de desarrollo."
      actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => patch({ plans: [...s.plans, { id: uid(), name: 'Nuevo plan', variableCost: 0 }] })}>Agregar plan</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">{r.plans.map((p) => <div key={p.id} className="rounded-xl border border-slate-200 p-4">
        <TextField label="Nombre del plan" value={p.name} onChange={(name) => patch({ plans: s.plans.map((x) => x.id === p.id ? { ...x, name } : x) })} />
        <NumberField className="mt-3" label={`Costo variable de ${p.name}`} value={p.variableCost} onChange={(variableCost) => patch({ plans: s.plans.map((x) => x.id === p.id ? { ...x, variableCost } : x) })} />
        <div className="mt-4 text-2xl font-bold text-indigo-600">{fmt(p.monthly)}<span className="text-sm font-normal"> / mes</span></div>
        <p className="mt-1 text-xs text-slate-500">Base + ganancia + variable: {fmt(p.unrounded)}. Redondeado: {fmt(p.rounded)}. Extras: {fmt(r.extras)}.</p>
        <Button variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => patch({ plans: s.plans.filter((x) => x.id !== p.id) })}>Eliminar {p.name}</Button>
      </div>)}</div>
      {s.plans.length === 0 && <p className="text-sm text-slate-500">Agregá un plan para calcular su abono mensual.</p>}
    </Card>
  </div>;
}
