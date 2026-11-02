import { Clock, RotateCcw } from 'lucide-react';
import { PHASES, phases } from '../../data/catalog';
import type { CalcResult } from '../../lib/calc';
import { formatNumber, useMoney } from '../../lib/money';
import type { ProjectState, Updater } from '../../types';
import { Button, Card, NumberField, cx } from '../ui';

export function HoursSection({ state, set, result }: { state: ProjectState; set: Updater; result: CalcResult }) {
  const money = useMoney();
  const totals = result.phases.reduce(
    (a, p) => ({ base: a.base + p.base, scope: a.scope + p.scope, tech: a.tech + p.tech, delta: a.delta + p.factorDelta, manual: a.manual + p.manual }),
    { base: 0, scope: 0, tech: 0, delta: 0, manual: 0 },
  );
  const signed = (n: number) => (n === 0 ? '—' : `${n > 0 ? '+' : ''}${formatNumber(n)}`);

  return (
    <Card
      title="Estimación de horas por etapa"
      icon={<Clock className="h-4 w-4" />}
      subtitle={state.estimationMode === 'tasks' ? 'Resumen de tareas por etapa. Editá las horas y tarifas en Tareas y estimación. La reserva de riesgos se incluye en Análisis.' : 'Total = (base + alcance + tecnologías) × factores + ajuste manual. Editá las horas base y los ajustes.'}
      actions={state.estimationMode !== 'tasks' && <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => set((s) => ({ ...s, manualAdjust: phases() }))}>Limpiar ajustes</Button>}
    >
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-right text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3 text-left font-medium">Etapa</th>
              <th className="w-24 px-1 py-2 font-medium">Base</th>
              <th className="px-2 py-2 font-medium">Alcance</th>
              <th className="px-2 py-2 font-medium">Tecnologías</th>
              <th className="px-2 py-2 font-medium">Factores</th>
              <th className="w-24 px-1 py-2 font-medium">Ajuste ±</th>
              <th className="px-2 py-2 font-medium">Total</th>
              <th className="px-2 py-2 font-medium">Costo</th>
            </tr>
          </thead>
          <tbody>
            {result.phases.map((p) => {
              const meta = PHASES.find((x) => x.id === p.id)!;
              return (
                <tr key={p.id} className={cx('border-t border-slate-100', p.total === 0 && 'text-slate-400')}>
                  <td className="py-1.5 pr-3">
                    <div className="font-medium text-slate-800">{p.label}</div>
                    <div className="text-xs text-slate-400">{meta.hint}</div>
                  </td>
                  <td className="px-1 py-1">
                    <NumberField compact disabled={state.estimationMode === 'tasks'} ariaLabel={`Horas base ${p.label}`} value={state.estimationMode === 'tasks' ? p.base : state.baseHours[p.id]} max={2000}
                      onChange={(v) => set((s) => ({ ...s, baseHours: { ...s.baseHours, [p.id]: v } }))} />
                  </td>
                  <td className="px-2 text-right tabular-nums">{signed(p.scope)}</td>
                  <td className="px-2 text-right tabular-nums">{signed(p.tech)}</td>
                  <td className="px-2 text-right tabular-nums" title={`×${formatNumber(p.factor, 3)}`}>
                    {signed(p.factorDelta)}
                    {p.factor !== 1 && <span className="ml-1 text-xs text-slate-400">×{formatNumber(p.factor, 2)}</span>}
                  </td>
                  <td className="px-1 py-1">
                    <NumberField compact disabled={state.estimationMode === 'tasks'} ariaLabel={`Ajuste ${p.label}`} value={state.estimationMode === 'tasks' ? p.manual : state.manualAdjust[p.id]} min={-2000} max={2000}
                      onChange={(v) => set((s) => ({ ...s, manualAdjust: { ...s.manualAdjust, [p.id]: v } }))} />
                  </td>
                  <td className="px-2 text-right font-semibold tabular-nums text-slate-900">{formatNumber(p.total)} h</td>
                  <td className="px-2 text-right tabular-nums text-slate-500">{money.fmt(p.labor)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 text-right font-semibold text-slate-900">
              <td className="py-2 pr-3 text-left">Total</td>
              <td className="px-2 tabular-nums">{formatNumber(totals.base)}</td>
              <td className="px-2 tabular-nums">{signed(totals.scope)}</td>
              <td className="px-2 tabular-nums">{signed(totals.tech)}</td>
              <td className="px-2 tabular-nums">{signed(totals.delta)}</td>
              <td className="px-2 tabular-nums">{signed(totals.manual)}</td>
              <td className="px-2 tabular-nums text-indigo-700">{formatNumber(result.totalHours)} h</td>
              <td className="px-2 tabular-nums">{money.fmt(result.selected.labor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {state.estimationMode === 'tasks' && !state.taskPricing.useUniformRate ? 'Costo = suma de horas × tarifa de cada tarea + horas de riesgo. ' : `Costo = horas × tarifa base (${money.fmt(result.rates.costRate, 2)}/h). `}Es costo de desarrollo, sin imprevistos, margen ni impuestos.
        Plazo estimado con tu capacidad facturable: ~{result.suggestedWeeks} semanas.
      </p>
    </Card>
  );
}
