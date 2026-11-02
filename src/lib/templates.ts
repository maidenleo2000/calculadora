import type { SaaSSettings, TaskEstimate } from '../types';
import { ceilTo } from './calc';

export function resolveHourlyRate(ownRate: number | null, baseRate: number, uniform: boolean): number {
  return uniform ? baseRate : (ownRate ?? baseRate);
}

export function taskHours(task: TaskEstimate): number {
  return task.method === 'pert' ? (task.optimistic + 4 * task.probable + task.pessimistic) / 6 : task.hours;
}

export function validTask(task: TaskEstimate): boolean {
  const values = task.method === 'pert' ? [task.optimistic, task.probable, task.pessimistic] : [task.hours];
  return values.every((v) => Number.isFinite(v) && v >= 0)
    && (task.hourlyRate === null || (Number.isFinite(task.hourlyRate) && task.hourlyRate >= 0))
    && (task.method !== 'pert' || (task.optimistic <= task.probable && task.probable <= task.pessimistic));
}

export function calculateSaaS(s: SaaSSettings, projectCost: number) {
  const warnings: string[] = [];
  if (!Number.isInteger(s.clients) || s.clients <= 0) warnings.push('Ingresá una cantidad entera de clientes mayor a cero.');
  if (s.recoveryMonths <= 0) warnings.push('Los meses de recuperación deben ser mayores a cero.');
  const valid = warnings.length === 0;
  const development = s.useProjectCost ? projectCost : s.developmentCost;
  const recovery = s.recoveryMonths > 0 ? development / s.recoveryMonths : null;
  const shared = valid ? (recovery! + s.infrastructureMonthly) / s.clients : null;
  const support = s.supportHours * s.supportHourlyRate;
  const base = shared === null ? null : shared + support;
  const markup = base === null ? null : base * s.markupPct / 100;
  const extras = s.extraHours * s.extraHourlyRate + s.otherExtras;
  const plans = s.plans.map((p) => {
    const unrounded = base === null ? null : base + markup! + p.variableCost;
    const rounded = unrounded === null ? null : ceilTo(unrounded, s.rounding);
    return { ...p, unrounded, rounded, monthly: rounded === null ? null : rounded + extras };
  });
  return { development, recovery, shared, support, base, markup, extras, plans, warnings };
}
