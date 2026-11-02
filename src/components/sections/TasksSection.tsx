import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { PHASES } from '../../data/catalog';
import { applyCostTemplate, pertTemplateTasks } from '../../data/templates';
import { resolveHourlyRate, taskHours, validTask } from '../../lib/templates';
import { UniformRateControl } from '../UniformRateControl';
import { formatNumber, useMoney } from '../../lib/money';
import { uid } from '../../lib/storage';
import type { CalcResult } from '../../lib/calc';
import type { PhaseId, ProjectState, TaskEstimate, Updater } from '../../types';
import { Button, Card, NumberField, Segmented, Select, TextArea, TextField, Toggle } from '../ui';

export function TasksSection({ state, set, result }: { state: ProjectState; set: Updater; result: CalcResult }) {
  const money = useMoney();
  const active = state.estimationMode === 'tasks';
  const patch = (id: string, patch: Partial<TaskEstimate>) => set((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) }));
  const tp = state.taskPricing;
  return <div className="space-y-5">
    <Card title="Estimación y costos por tarea" icon={<ClipboardList className="h-4 w-4" />}
      subtitle="Basado en las plantillas TodoCode de estimaciones y costos. Todos los precios por hora están en la moneda base.">
      <Segmented value={state.estimationMode} onChange={(estimationMode) => set((s) => ({ ...s, estimationMode }))}
        options={[{ value: 'automatic', label: 'Por alcance (actual)' }, { value: 'tasks', label: 'Por tareas (TodoCode)' }]} />
      <p className="mt-3 text-sm text-slate-500">{active
        ? 'El presupuesto usa únicamente estas tareas y la reserva de horas por riesgo. Las horas por alcance, tecnologías y factores se conservan para el otro modo.'
        : 'El presupuesto usa las horas por alcance. Activá el modo por tareas para cotizar con esta lista.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => {
          if (confirm(`¿Cargar el ejemplo de costos TodoCode? Reemplaza tareas, costos de terceros, impuestos y ajustes de precio actuales. Los importes se toman como ejemplos en ${state.currency.base}.`)) set(applyCostTemplate);
        }}>Ejemplo de costos: 1.588 {state.currency.base}</Button>
        <Button onClick={() => {
          if (confirm('¿Cargar las 10 tareas de estimación TodoCode? Reemplaza la lista de tareas y activa el modo por tareas.'))
            set((s) => ({ ...s, estimationMode: 'tasks', tasks: pertTemplateTasks(), taskPricing: { ...s.taskPricing, riskHours: 1 } }));
        }}>Ejemplo de estimación PERT</Button>
      </div>
      <p className="mt-3 text-xs text-slate-500">PERT: tiempo esperado = (optimista + 4 × probable + pesimista) / 6. Los ejemplos son editables y no representan tarifas de mercado.</p>
    </Card>

    <UniformRateControl state={state} set={set} result={result} />

    <Card title="Tareas del proyecto" subtitle={`${state.tasks.length} tareas · elegí horas directas o una estimación de tres tiempos.`}
      actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => set((s) => ({ ...s, tasks: [...s.tasks, {
        id: uid(), phase: 'backend', name: '', method: 'pert', hours: 1, optimistic: 1, probable: 2, pessimistic: 3, hourlyRate: null, notes: '',
      }] }))}>Agregar tarea</Button>}>
      <div className="space-y-4">
        {state.tasks.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Agregá las tareas de tu trabajo o cargá uno de los ejemplos para empezar.</p>}
        {state.tasks.map((task, i) => <div key={task.id} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-indigo-600">Tarea {i + 1}</span>
            <Button variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== task.id) }))}>Eliminar tarea {i + 1}</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={`Descripción de tarea ${i + 1}`} value={task.name} placeholder="Ej.: Crear el carrito de compras" onChange={(name) => patch(task.id, { name })} />
            <label><span className="mb-1 block text-sm font-medium text-slate-700">Etapa de tarea {i + 1}</span>
              <Select<PhaseId> ariaLabel={`Etapa de tarea ${i + 1}`} value={task.phase} onChange={(phase) => patch(task.id, { phase })} options={PHASES.map((p) => ({ value: p.id, label: p.label }))} /></label>
          </div>
          <div className="my-3"><Segmented value={task.method} onChange={(method) => patch(task.id, { method })} options={[{ value: 'fixed', label: 'Horas directas' }, { value: 'pert', label: 'Tres tiempos (PERT)' }]} /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {task.method === 'pert' ? <>
              <NumberField label={`Optimista · tarea ${i + 1}`} suffix="h" value={task.optimistic} onChange={(optimistic) => patch(task.id, { optimistic })} />
              <NumberField label={`Probable · tarea ${i + 1}`} suffix="h" value={task.probable} onChange={(probable) => patch(task.id, { probable })} />
              <NumberField label={`Pesimista · tarea ${i + 1}`} suffix="h" value={task.pessimistic} onChange={(pessimistic) => patch(task.id, { pessimistic })} />
            </> : <NumberField label={`Horas · tarea ${i + 1}`} suffix="h" value={task.hours} onChange={(hours) => patch(task.id, { hours })} />}
          </div>
          {!validTask(task) && <p role="alert" className="mt-2 text-sm text-rose-600">Revisá los tiempos: optimista ≤ probable ≤ pesimista. Esta tarea está excluida del total hasta corregirla.</p>}
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-2">
            {tp.useUniformRate ? <p className="text-sm text-slate-500">Se aplica la tarifa única del proyecto.</p> : <div className="space-y-2">
              <Toggle label={`Tarifa propia · tarea ${i + 1}`} checked={task.hourlyRate !== null} onChange={(own) => patch(task.id, { hourlyRate: own ? result.rates.costRate : null })} />
              {task.hourlyRate !== null && <NumberField label={`Precio por hora · tarea ${i + 1} (${state.currency.base})`} value={task.hourlyRate} onChange={(hourlyRate) => patch(task.id, { hourlyRate })} />}
            </div>}
            <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
              {validTask(task) ? <><strong>{formatNumber(taskHours(task), 2)} h · {money.fmt(taskHours(task) * resolveHourlyRate(task.hourlyRate, result.rates.costRate, tp.useUniformRate), 2)}</strong>
                <div className="text-xs">{money.fmt(resolveHourlyRate(task.hourlyRate, result.rates.costRate, tp.useUniformRate), 2)}/h {tp.useUniformRate ? '· tarifa única' : task.hourlyRate === null ? '· tarifa base' : '· tarifa propia'}</div></> : 'Pendiente de corregir'}
            </div>
          </div>
          <TextArea className="mt-3" rows={2} label={`Consideraciones y dependencias · tarea ${i + 1}`} value={task.notes} onChange={(notes) => patch(task.id, { notes })} />
        </div>)}
      </div>
    </Card>

    <Card title="Reserva por riesgos" subtitle="Horas adicionales explícitas, como en la plantilla de estimaciones. Se asignan a Análisis en el resumen por etapas.">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Horas por riesgos" suffix="h" value={tp.riskHours} onChange={(riskHours) => set((s) => ({ ...s, taskPricing: { ...s.taskPricing, riskHours } }))} />
        {tp.useUniformRate ? <p className="text-sm text-slate-500">Las horas de riesgo usan la tarifa única: {money.fmt(result.rates.costRate, 2)}/h.</p> : <div className="space-y-2"><Toggle label="Usar tarifa propia para riesgos" checked={tp.riskHourlyRate !== null} onChange={(own) => set((s) => ({ ...s, taskPricing: { ...s.taskPricing, riskHourlyRate: own ? result.rates.costRate : null } }))} />
          {tp.riskHourlyRate !== null && <NumberField label={`Tarifa de riesgos (${state.currency.base}/h)`} value={tp.riskHourlyRate} onChange={(riskHourlyRate) => set((s) => ({ ...s, taskPricing: { ...s.taskPricing, riskHourlyRate } }))} />}</div>}
      </div>
      {tp.riskHours > 0 && state.pricing.contingencyPct > 0 && <p className="mt-3 text-sm text-amber-700">Además de estas horas tenés una reserva del {state.pricing.contingencyPct}% en Costos y margen. Revisá si necesitás ambas.</p>}
    </Card>
  </div>;
}
