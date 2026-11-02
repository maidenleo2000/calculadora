import type { CalcResult, Scenario } from '../lib/calc';
import { formatNumber, useMoney } from '../lib/money';
import type { ScenarioId } from '../types';
import { Card, cx } from './ui';

export const PART_COLORS = {
  labor: '#4f46e5',
  contingency: '#a5b4fc',
  direct: '#0ea5e9',
  margin: '#10b981',
  surcharge: '#f59e0b',
  taxes: '#94a3b8',
  rounding: '#6ee7b7',
  vat: '#c084fc',
} as const;

type PartKey = keyof typeof PART_COLORS;

export const PART_LABELS: Record<PartKey, string> = {
  labor: 'Desarrollo',
  contingency: 'Imprevistos',
  direct: 'Terceros',
  margin: 'Margen',
  surcharge: 'Recargo urgencia',
  taxes: 'Impuestos',
  rounding: 'Redondeo',
  vat: 'IVA',
};

const partsOf = (s: Scenario) =>
  (Object.keys(PART_COLORS) as PartKey[]).map((k) => ({ key: k, value: Math.max(0, s[k]) })).filter((p) => p.value > 0.005);

function Donut({ scenario }: { scenario: Scenario }) {
  const money = useMoney();
  const parts = partsOf(scenario);
  const total = parts.reduce((a, p) => a + p.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0" role="img" aria-label="Composición del precio">
        <circle cx="90" cy="90" r={R} fill="none" className="stroke-slate-100" strokeWidth="22" />
        {total > 0 &&
          parts.map((p) => {
            const len = (p.value / total) * C;
            const el = (
              <circle key={p.key} cx="90" cy="90" r={R} fill="none" stroke={PART_COLORS[p.key]} strokeWidth="22"
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`} strokeDashoffset={-offset} transform="rotate(-90 90 90)">
                <title>{`${PART_LABELS[p.key]}: ${money.fmt(p.value)}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        <text x="90" y="84" textAnchor="middle" className="fill-slate-500 text-[10px]">{scenario.discount > 0 ? 'Suma de conceptos' : 'Precio'}</text>
        <text x="90" y="102" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">{money.fmt(total)}</text>
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PART_COLORS[p.key] }} />
              {PART_LABELS[p.key]}
            </span>
            <span className="tabular-nums text-slate-900">
              {money.fmt(p.value)} <span className="text-xs text-slate-400">{formatNumber((p.value / total) * 100, 0)}%</span>
            </span>
          </li>
        ))}
        {scenario.discount > 0 && <li className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-rose-600"><span>Descuento sin impuestos</span><span>−{money.fmt(scenario.discountNet)}</span></li>}
      </ul>
    </div>
  );
}

function HoursBars({ result }: { result: CalcResult }) {
  const rows = result.phases.filter((p) => p.total > 0).sort((a, b) => b.total - a.total);
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[120px_1fr_56px] items-center gap-3 text-sm">
          <span className="truncate text-slate-600">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${(r.total / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-slate-900">{formatNumber(r.total)} h</span>
        </li>
      ))}
      {rows.length === 0 && <li className="text-sm text-slate-500">Sin horas estimadas.</li>}
    </ul>
  );
}

function ScenarioBars({ result, selected, onSelect }: { result: CalcResult; selected: ScenarioId; onSelect: (id: ScenarioId) => void }) {
  const money = useMoney();
  const list = Object.values(result.scenarios);
  const max = Math.max(...list.map((s) => s.price), 1);
  return (
    <div className="space-y-4">
      {list.map((s) => (
        <button key={s.id} type="button" onClick={() => onSelect(s.id)}
          className={cx('block w-full rounded-xl p-3 text-left transition', selected === s.id ? 'bg-indigo-50 ring-2 ring-indigo-500/30' : 'hover:bg-slate-50')}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-800">{s.label} <span className="font-normal text-slate-400">· ganancia {money.fmt(s.margin)}</span></span>
            <span className="font-bold tabular-nums text-slate-900">{money.fmt(s.price)}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" style={{ width: `${(s.price / max) * 100}%` }}>
            {partsOf(s).map((p) => (
              <span key={p.key} title={`${PART_LABELS[p.key]}: ${money.fmt(p.value)}`} style={{ width: `${(p.value / (s.price + s.discountNet || 1)) * 100}%`, background: PART_COLORS[p.key] }} />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-slate-500">
            <span>{money.fmt(s.effectiveHourly, 2)}/h efectivo</span>
            <span>Ganancia {money.fmt(s.profit)}</span>
            <span>{formatNumber(s.marginOnPrice * 100, 1)}% del precio</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function Analytics({ result, selected, onSelect }: { result: CalcResult; selected: ScenarioId; onSelect: (id: ScenarioId) => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card title="Composición del precio" subtitle={`Escenario ${result.selected.label.toLowerCase()}`}>
        <Donut scenario={result.selected} />
      </Card>
      <Card title="Horas por etapa" subtitle={`${formatNumber(result.totalHours)} h en total`}>
        <HoursBars result={result} />
      </Card>
      <Card title="Escenarios comparativos" subtitle="Hacé clic para elegir el escenario del presupuesto">
        <ScenarioBars result={result} selected={selected} onSelect={onSelect} />
      </Card>
    </div>
  );
}
