import { AlertTriangle, Percent, Plus, Server, Trash2 } from 'lucide-react';
import type { CalcResult } from '../../lib/calc';
import { useMoney } from '../../lib/money';
import { uid } from '../../lib/storage';
import type { CostItem, Currency, PricingSettings, ProjectState, Recurrence, Updater } from '../../types';
import { Button, Card, NumberField, Select, Toggle } from '../ui';

export function CostsSection({ state, set, result }: { state: ProjectState; set: Updater; result: CalcResult }) {
  const money = useMoney();
  const pr = state.pricing;
  const setPricing = (patch: Partial<PricingSettings>) => set((s) => ({ ...s, pricing: { ...s.pricing, ...patch } }));
  const patchItem = (id: string, patch: Partial<CostItem>) =>
    set((s) => ({ ...s, costItems: s.costItems.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const lineFor = (key: string) => result.direct.lines.find((l) => l.key === key);
  const techLines = result.direct.lines.filter((l) => !state.costItems.some((i) => i.id === l.key));

  return (
    <div className="space-y-5">
      <Card
        title="Infraestructura, APIs y licencias"
        icon={<Server className="h-4 w-4" />}
        subtitle="Costos de terceros que pagás por el proyecto. Se trasladan al costo, sin margen salvo que lo actives."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />}
            onClick={() => set((s) => ({ ...s, costItems: [...s.costItems, { id: uid(), name: '', amount: 0, currency: s.currency.base, recurrence: 'monthly' }] }))}>
            Agregar costo
          </Button>
        }
      >
        <div className="mb-4 max-w-xs">
          <NumberField label="Meses de costos recurrentes incluidos" suffix="meses" value={pr.infraMonths} max={60}
            hint="Cuántos meses de hosting, APIs o suscripciones incluye el precio del proyecto (desarrollo + primeros meses)." onChange={(v) => setPricing({ infraMonths: v })} />
        </div>

        {state.costItems.length === 0 && techLines.length === 0 ? (
          <p className="text-sm text-slate-500">Sin costos de terceros.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2 font-medium">Concepto</th>
                  <th className="w-32 px-1 font-medium">Monto</th>
                  <th className="w-24 px-1 font-medium">Moneda</th>
                  <th className="w-32 px-1 font-medium">Frecuencia</th>
                  <th className="px-2 text-right font-medium">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {state.costItems.map((i) => {
                  const line = lineFor(i.id);
                  return (
                    <tr key={i.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2">
                        <input aria-label="Concepto" value={i.name} placeholder="Ej: Hosting, API de OpenAI, dominio"
                          onChange={(e) => patchItem(i.id, { name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500" />
                      </td>
                      <td className="px-1"><NumberField compact ariaLabel="Monto" value={i.amount} max={1e10} onChange={(v) => patchItem(i.id, { amount: v })} /></td>
                      <td className="px-1">
                        <Select<Currency> ariaLabel="Moneda" value={i.currency} onChange={(v) => patchItem(i.id, { currency: v })}
                          options={[{ value: 'USD', label: 'USD' }, { value: 'ARS', label: 'ARS' }]} />
                      </td>
                      <td className="px-1">
                        <Select<Recurrence> ariaLabel="Frecuencia" value={i.recurrence} onChange={(v) => patchItem(i.id, { recurrence: v })}
                          options={[{ value: 'once', label: 'Pago único' }, { value: 'monthly', label: 'Mensual' }]} />
                      </td>
                      <td className="px-2 text-right tabular-nums">
                        {line?.baseTotal === null ? (
                          <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />Falta cotización</span>
                        ) : (
                          <>
                            {money.fmt(line?.baseTotal ?? 0)}
                            {i.recurrence === 'monthly' && <div className="text-xs text-slate-400">× {pr.infraMonths} meses</div>}
                          </>
                        )}
                      </td>
                      <td className="text-right">
                        <button type="button" aria-label="Eliminar" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => set((s) => ({ ...s, costItems: s.costItems.filter((x) => x.id !== i.id) }))}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {techLines.map((l) => (
                  <tr key={l.key} className="border-t border-slate-100 text-slate-500">
                    <td className="py-2 pr-2">{l.name} <span className="text-xs">(desde Tecnologías)</span></td>
                    <td className="px-2 tabular-nums">{money.raw(l.unitAmount, l.currency, 2)}</td>
                    <td className="px-2">{l.currency}</td>
                    <td className="px-2">{l.recurrence === 'once' ? 'Pago único' : 'Mensual'}</td>
                    <td className="px-2 text-right tabular-nums">{l.baseTotal === null ? 'Falta cotización' : money.fmt(l.baseTotal)}</td>
                    <td />
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold">
                  <td className="py-2" colSpan={4}>Total costos de terceros</td>
                  <td className="px-2 text-right tabular-nums">{money.fmt(result.direct.total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card title="Imprevistos, margen y redondeo" icon={<Percent className="h-4 w-4" />} subtitle="Distinguí costo (imprevistos), ganancia (margen) y redondeo.">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Reserva para imprevistos" suffix="%" value={pr.contingencyPct} max={100}
            hint="Costo: cubre el error de estimación de horas. Se calcula sobre el costo de desarrollo." onChange={(v) => setPricing({ contingencyPct: v })} />
          <NumberField label="Margen recomendado" suffix="%" value={pr.marginPct} max={500}
            hint="Ganancia sobre el costo (markup), además de tu ingreso deseado." onChange={(v) => setPricing({ marginPct: v })} />
          <NumberField label="Margen premium" suffix="%" value={pr.premiumMarginPct} max={500}
            hint="Para clientes que valoran prioridad, experiencia o exclusividad." onChange={(v) => setPricing({ premiumMarginPct: v })} />
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Redondear precio hacia arriba</span>
            <Select<string> ariaLabel="Redondeo" className="py-2" value={String(pr.rounding)} onChange={(v) => setPricing({ rounding: Number(v) })}
              options={[0, 1, 10, 50, 100, 1000, 10000, 100000].map((n) => ({ value: String(n), label: n === 0 ? 'Sin redondeo' : `Múltiplo de ${n.toLocaleString('es-AR')} ${state.currency.base}` }))} />
          </div>
          <NumberField label="Mantenimiento mensual" suffix="h/mes" value={pr.maintenanceHoursPerMonth} max={500}
            hint="Plan opcional posterior a la entrega. Se cotiza aparte del proyecto." onChange={(v) => setPricing({ maintenanceHoursPerMonth: v })} />
          <div className="flex items-end pb-2">
            <Toggle checked={pr.marginOnDirectCosts} onChange={(v) => setPricing({ marginOnDirectCosts: v })} label="Aplicar margen a costos de terceros"
              hint="Activalo si cobrás un fee por gestionar proveedores. Por defecto se trasladan al costo." />
          </div>
        </div>
      </Card>
    </div>
  );
}
