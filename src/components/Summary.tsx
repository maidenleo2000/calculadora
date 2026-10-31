import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CalcResult } from '../lib/calc';
import { formatNumber, useMoney } from '../lib/money';
import type { ProjectState, ScenarioId, Updater } from '../types';
import { PART_COLORS } from './Charts';
import { Segmented } from './ui';

function Line({ label, value, detail, color, strong, sign = '+' }: {
  label: string;
  value: string;
  detail?: ReactNode;
  color?: string;
  strong?: boolean;
  sign?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 py-1.5 ${strong ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      <div className="flex items-start gap-2">
        {color ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} /> : <span className="w-2" />}
        <div>
          <div className="text-sm">{label}</div>
          {detail && <div className="text-xs font-normal text-slate-400">{detail}</div>}
        </div>
      </div>
      <div className="text-sm tabular-nums">
        {!strong && <span className="mr-0.5 text-slate-400">{sign}</span>}
        {value}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      {children}
    </div>
  );
}

export function Summary({ state, set, result }: { state: ProjectState; set: Updater; result: CalcResult }) {
  const money = useMoney();
  const sc = result.selected;
  const pr = state.pricing;
  const taxPct = state.rate.taxRate;

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="rounded-t-2xl bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700 p-5 text-white">
          <div className="text-xs font-medium uppercase tracking-wider text-indigo-100">Precio final del proyecto</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{money.fmt(sc.price)}</div>
          <div className="mt-1 text-sm text-indigo-100">
            {formatNumber(result.totalHours)} h · {money.fmt(sc.effectiveHourly, 2)}/h efectivo
          </div>
          <div className="mt-4">
            <Segmented<ScenarioId>
              size="sm"
              value={pr.selectedScenario}
              onChange={(v) => set((s) => ({ ...s, pricing: { ...s.pricing, selectedScenario: v } }))}
              options={Object.values(result.scenarios).map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
        </div>

        <div className="space-y-2 p-5">
          <Group title="Costos">
            <Line label="Desarrollo" color={PART_COLORS.labor} value={money.fmt(sc.labor)}
              detail={`${formatNumber(result.totalHours)} h × ${money.fmt(result.rates.costRate, 2)}`} />
            <Line label="Reserva para imprevistos" color={PART_COLORS.contingency} value={money.fmt(sc.contingency)}
              detail={`${pr.contingencyPct}% del desarrollo`} />
            <Line label="Infraestructura, APIs y licencias" color={PART_COLORS.direct} value={money.fmt(sc.direct)}
              detail={result.direct.missingRate ? 'Hay costos sin convertir' : 'Costos de terceros al costo'} />
            <Line strong label="Costo total" value={money.fmt(sc.totalCost)} />
          </Group>
          <Group title="Ganancia">
            <Line label="Margen" color={PART_COLORS.margin} value={money.fmt(sc.margin)}
              detail={`${sc.marginPct}% sobre ${pr.marginOnDirectCosts ? 'costo total' : 'desarrollo + imprevistos'}`} />
          </Group>
          {sc.surcharge > 0 && (
            <Group title="Recargos">
              <Line label="Urgencia" color={PART_COLORS.surcharge} value={money.fmt(sc.surcharge)}
                detail={`${state.params.urgency[state.urgency]}% sobre servicios`} />
            </Group>
          )}
          <Group title="Impuestos">
            <Line label="Impuestos estimados" color={PART_COLORS.taxes} value={money.fmt(sc.taxes)} detail={`${taxPct}% del precio facturado`} />
            {sc.rounding > 0.005 && <Line label="Ajuste por redondeo" color={PART_COLORS.rounding} value={money.fmt(sc.rounding)} detail="Queda como ganancia" />}
          </Group>
          <div className="flex items-center justify-between border-t-2 border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{money.fmt(sc.price)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-center">
            <div className="rounded-lg bg-emerald-50 p-2">
              <div className="text-[11px] text-emerald-700">Ganancia neta</div>
              <div className="font-semibold tabular-nums text-emerald-800">{money.fmt(sc.profit)}</div>
              <div className="text-[11px] text-emerald-600">{formatNumber(sc.marginOnPrice * 100, 1)}% del precio</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <div className="text-[11px] text-slate-500">Mantenimiento</div>
              <div className="font-semibold tabular-nums text-slate-800">{money.fmt(result.maintenanceMonthly)}</div>
              <div className="text-[11px] text-slate-500">por mes (aparte)</div>
            </div>
          </div>
          <p className="pt-1 text-[11px] leading-snug text-slate-400">
            Tu ingreso deseado ya está dentro del costo de desarrollo. La ganancia es adicional a ese ingreso.
          </p>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          {result.warnings.map((w) => (
            <p key={w} className="flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
}
