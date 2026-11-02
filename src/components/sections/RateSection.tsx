import { ArrowRight, Coins, Wallet } from 'lucide-react';
import type { CalcResult } from '../../lib/calc';
import { convert } from '../../lib/calc';
import { useMoney } from '../../lib/money';
import type { Currency, ProjectState, RateSettings, Updater } from '../../types';
import { Card, NumberField, Segmented, TextField } from '../ui';
import { UniformRateControl } from '../UniformRateControl';

export function RateSection({ state, set, result }: { state: ProjectState; set: Updater; result: CalcResult }) {
  const money = useMoney();
  const r = state.rate;
  const base = state.currency.base;
  const setRate = (patch: Partial<RateSettings>) => set((s) => ({ ...s, rate: { ...s.rate, ...patch } }));
  const t = r.taxRate / 100;
  const m = state.pricing.marginPct / 100;

  const changeBase = (next: Currency) =>
    set((s) => {
      const k = convert(1, s.currency.base, next, s.currency.arsPerUsd);
      if (k === null) return s;
      return {
        ...s,
        currency: { ...s.currency, base: next },
        rate: {
          ...s.rate,
          desiredMonthlyIncome: Math.round(s.rate.desiredMonthlyIncome * k),
          monthlyExpenses: Math.round(s.rate.monthlyExpenses * k),
          manualHourlyRate: Math.round(s.rate.manualHourlyRate * k * 100) / 100,
        },
        tasks: s.tasks.map((task) => ({ ...task, hourlyRate: task.hourlyRate === null ? null : task.hourlyRate * k })),
        taskPricing: { ...s.taskPricing, managementFixed: s.taskPricing.managementFixed * k,
          riskHourlyRate: s.taskPricing.riskHourlyRate === null ? null : s.taskPricing.riskHourlyRate * k },
        saas: { ...s.saas, developmentCost: s.saas.developmentCost * k,
          infrastructureMonthly: s.saas.infrastructureMonthly * k, supportHourlyRate: s.saas.supportHourlyRate * k,
          extraHourlyRate: s.saas.extraHourlyRate * k, otherExtras: s.saas.otherExtras * k,
          rounding: s.saas.rounding * k, plans: s.saas.plans.map((p) => ({ ...p, variableCost: p.variableCost * k })) },
      };
    });
  const hasRate = !!state.currency.arsPerUsd && state.currency.arsPerUsd > 0;

  return (
    <div className="space-y-5">
      <UniformRateControl state={state} set={set} result={result} />
      <Card title="Tarifa por hora" icon={<Wallet className="h-4 w-4" />} subtitle="Calculala desde tus números o ingresala manualmente.">
        <div className="mb-5">
          <Segmented
            value={r.mode}
            onChange={(mode) => setRate({ mode })}
            options={[
              { value: 'auto', label: 'Calcular desde mis ingresos' },
              { value: 'manual', label: 'Ingresar tarifa manual' },
            ]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Ingreso neto mensual deseado" prefix={base} value={r.desiredMonthlyIncome} max={1e10} disabled={r.mode === 'manual'}
            hint="Lo que querés cobrar por mes para vos, después de impuestos." onChange={(v) => setRate({ desiredMonthlyIncome: v })} />
          <NumberField label="Gastos operativos mensuales" prefix={base} value={r.monthlyExpenses} max={1e10} disabled={r.mode === 'manual'}
            hint="Software, equipos, internet, coworking, contador, obra social. No incluyas costos de un proyecto puntual." onChange={(v) => setRate({ monthlyExpenses: v })} />
          <NumberField label="Horas facturables por mes" suffix="h" value={r.billableHoursPerMonth} min={1} max={400} disabled={r.mode === 'manual'}
            hint="Horas que realmente cobrás. Restá reuniones comerciales, administración y formación." onChange={(v) => setRate({ billableHoursPerMonth: v })} />
          <NumberField label="Impuestos estimados sobre facturación" suffix="%" value={r.taxRate} max={90} step={0.5}
            hint="Porcentaje aproximado de lo facturado que se va en impuestos (IIBB, ganancias, monotributo, etc.). Consultá con tu contador." onChange={(v) => setRate({ taxRate: v })} />
          {r.mode === 'manual' && (
            <NumberField className="sm:col-span-2" label="Tarifa base por hora (costo de tu hora)" prefix={base} value={r.manualHourlyRate} max={1e8} step={0.5}
              hint="Lo que vale tu hora antes de margen e impuestos. El margen y los impuestos se agregan sobre el proyecto." onChange={(v) => setRate({ manualHourlyRate: v })} />
          )}
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Escalera de tarifas</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <RateStep label="Tarifa base (costo)" value={money.fmt(result.rates.costRate, 2)}
              formula={r.mode === 'auto' ? '(ingreso + gastos) ÷ horas' : 'manual'} />
            <RateStep label="Mínima a facturar" value={money.fmt(result.rates.minimumBilled, 2)} formula={`base ÷ (1 − ${r.taxRate}%)`} arrow />
            <RateStep label="Recomendada" value={money.fmt(result.rates.recommendedBilled, 2)} formula={`base × (1 + ${state.pricing.marginPct}%) ÷ (1 − imp.)`} arrow highlight />
            <RateStep label="Premium" value={money.fmt(result.rates.premiumBilled, 2)} formula={`margen ${state.pricing.premiumMarginPct}%`} arrow />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {state.estimationMode === 'tasks' && <>{state.taskPricing.useUniformRate ? 'Todas las tareas y horas de riesgo usan la tarifa base. ' : 'Las tareas con tarifa propia usan su propio precio por hora. Esta escalera es una referencia para la tarifa base. '}</>}
            La tarifa base ya incluye tu ingreso y gastos. El margen ({Math.round(m * 100)}%) y los impuestos ({Math.round(t * 1000) / 10}%) se aplican
            una sola vez sobre el proyecto; por eso no se suman a la tarifa base del cálculo.
            {r.mode === 'manual' && result.rates.autoCostRate > 0 && <> Tarifa calculada desde tus ingresos: {money.fmt(result.rates.autoCostRate, 2)}/h.</>}
          </p>
        </div>
      </Card>

      <Card title="Moneda y cotización" icon={<Coins className="h-4 w-4" />} subtitle="La app no usa cotizaciones automáticas: cargá la que quieras usar.">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Cotización: ARS por 1 USD" prefix="ARS" value={state.currency.arsPerUsd ?? 0} max={1e9} step={1}
            hint="Dejalo en 0 si no querés convertir. Sin cotización, los costos en otra moneda no se suman y se avisa."
            onChange={(v) => set((s) => ({ ...s, currency: { ...s.currency, arsPerUsd: v > 0 ? v : null } }))} />
          <TextField label="Referencia de la cotización" value={state.currency.rateNote} placeholder="Ej: dólar MEP del 31/10, fuente…"
            onChange={(v) => set((s) => ({ ...s, currency: { ...s.currency, rateNote: v } }))} />
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Moneda base (en la que cargás tus valores)</span>
            <Segmented<Currency> value={base} onChange={changeBase}
              options={[{ value: 'USD', label: 'USD', disabled: !hasRate && base !== 'USD' }, { value: 'ARS', label: 'ARS', disabled: !hasRate && base !== 'ARS' }]} />
            <p className="mt-1 text-xs text-slate-500">Al cambiarla se convierten ingresos, gastos, tarifas por tarea, gestión fija e importes SaaS. Los costos de terceros conservan su moneda.</p>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Mostrar resultados en</span>
            <Segmented<Currency> value={state.currency.display}
              onChange={(display) => set((s) => ({ ...s, currency: { ...s.currency, display } }))}
              options={[{ value: 'USD', label: 'USD', disabled: !hasRate && base !== 'USD' }, { value: 'ARS', label: 'ARS', disabled: !hasRate && base !== 'ARS' }]} />
            {!hasRate && <p className="mt-1 text-xs text-amber-700">Cargá una cotización para convertir entre monedas.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function RateStep({ label, value, formula, arrow, highlight }: { label: string; value: string; formula: string; arrow?: boolean; highlight?: boolean }) {
  return (
    <div className="relative">
      {arrow && <ArrowRight className="absolute -left-3 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-slate-300 sm:block" />}
      <div className={`h-full rounded-lg p-3 ${highlight ? 'bg-indigo-600 text-white' : 'bg-surface ring-1 ring-slate-200'}`}>
        <div className={`text-xs ${highlight ? 'text-indigo-100' : 'text-slate-500'}`}>{label}</div>
        <div className="mt-1 text-lg font-bold tabular-nums">{value}<span className="text-xs font-normal">/h</span></div>
        <div className={`mt-1 text-[11px] ${highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{formula}</div>
      </div>
    </div>
  );
}
