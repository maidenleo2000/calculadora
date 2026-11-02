import { Wallet } from 'lucide-react';
import type { CalcResult } from '../lib/calc';
import { useMoney } from '../lib/money';
import type { ProjectState, Updater } from '../types';
import { Card, NumberField, Toggle } from './ui';

export function UniformRateControl({ state, set, result }: { state: ProjectState; set: Updater; result: CalcResult }) {
  const money = useMoney();
  const uniform = state.taskPricing.useUniformRate;
  return <Card title="Una tarifa para todas las horas" icon={<Wallet className="h-4 w-4" />}
    subtitle="Elegí si querés usar el mismo valor por hora en todo el proyecto.">
    <Toggle label="Aplicar la misma tarifa a todas las horas del proyecto" checked={uniform}
      onChange={(useUniformRate) => set((s) => ({
        ...s, taskPricing: { ...s.taskPricing, useUniformRate },
        rate: useUniformRate ? { ...s.rate, mode: 'manual', manualHourlyRate: result.rates.costRate } : s.rate,
      }))} />
    {uniform ? <>
      <NumberField className="mt-4 max-w-sm" label="Tarifa única por hora" prefix={state.currency.base} value={result.rates.costRate} max={1e8}
        onChange={(manualHourlyRate) => set((s) => ({ ...s, rate: { ...s.rate, mode: 'manual', manualHourlyRate } }))} />
      <p className="mt-3 text-sm text-slate-600">Todas las etapas, tareas y horas de riesgo usan {money.fmt(result.rates.costRate, 2)}/h. Las tarifas individuales quedan guardadas y vuelven a aplicarse si desactivás esta opción.</p>
      <p className="mt-2 text-xs text-slate-500">Es la tarifa base antes de ganancia e impuestos. El mantenimiento del proyecto usa la misma tarifa base. Los costos de terceros y las tarifas de soporte y extras del apartado SaaS se configuran aparte.</p>
    </> : <p className="mt-3 text-sm text-slate-500">En el modo por tareas, cada tarea puede tener su tarifa; si no tiene una propia, usa la tarifa base. El modo por alcance ya usa la tarifa base en todas sus horas.</p>}
  </Card>;
}
