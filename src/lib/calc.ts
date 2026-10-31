import { CUSTOMIZABLE_PHASES, PHASES, phases } from '../data/catalog';
import type {
  Currency,
  EstimationParams,
  PhaseHours,
  PhaseId,
  ProjectState,
  Recurrence,
  Scope,
  ScenarioId,
  Technology,
} from '../types';

/*
 * Modelo de precio, en capas (todo en moneda base):
 *
 *   COSTOS
 *     desarrollo     = horas totales × tarifa base (costo de tu hora)
 *     imprevistos    = desarrollo × % reserva
 *     terceros       = infraestructura + APIs + licencias (al costo)
 *   GANANCIA
 *     margen         = (desarrollo + imprevistos [+ terceros]) × % margen
 *   RECARGOS
 *     urgencia       = (desarrollo + imprevistos) × (1 + % margen) × % urgencia
 *   IMPUESTOS
 *     precio         = subtotal / (1 − % impuestos)   (gross-up: impuestos sobre lo facturado)
 *     redondeo       = diferencia por redondear hacia arriba (queda como ganancia extra)
 *
 * La tarifa base ya incluye tu ingreso deseado y tus gastos operativos, por eso
 * el margen y los impuestos NO están dentro de la tarifa: se aplican una sola vez
 * sobre el proyecto. Así nada se cuenta dos veces.
 */

export interface PhaseRow {
  id: PhaseId;
  label: string;
  base: number;
  scope: number;
  tech: number;
  subtotal: number;
  factor: number;
  factorDelta: number;
  manual: number;
  total: number;
}

export interface DirectCostLine {
  key: string;
  name: string;
  recurrence: Recurrence;
  unitAmount: number;
  currency: Currency;
  quantity: number;
  /** Total convertido a moneda base. null si falta la cotización. */
  baseTotal: number | null;
  /** Monto mensual en moneda base (sólo recurrentes). */
  baseMonthly: number | null;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  marginPct: number;
  labor: number;
  contingency: number;
  direct: number;
  totalCost: number;
  margin: number;
  surcharge: number;
  preTax: number;
  taxes: number;
  rounding: number;
  price: number;
  /** Ganancia por encima de tu ingreso deseado: margen + redondeo. */
  profit: number;
  marginOnPrice: number;
  effectiveHourly: number;
  /** Partes del precio para mostrar al cliente. */
  client: { services: number; thirdParty: number; urgency: number };
}

export interface CalcResult {
  phases: PhaseRow[];
  totalHours: number;
  rates: {
    autoCostRate: number;
    costRate: number;
    minimumBilled: number;
    recommendedBilled: number;
    premiumBilled: number;
  };
  direct: {
    lines: DirectCostLine[];
    oneTime: number;
    recurringMonthly: number;
    total: number;
    missingRate: boolean;
  };
  scenarios: Record<ScenarioId, Scenario>;
  selected: Scenario;
  maintenanceMonthly: number;
  suggestedWeeks: number;
  warnings: string[];
}

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  minimum: 'Mínimo',
  recommended: 'Recomendado',
  premium: 'Premium',
};

const MAX_TAX = 90;

export const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;
const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

function addScaled(target: PhaseHours, per: Partial<PhaseHours>, qty: number) {
  for (const [k, v] of Object.entries(per) as [PhaseId, number][]) target[k] += num(v) * qty;
}

export function scopeHours(scope: Scope, p: EstimationParams): PhaseHours {
  const h = phases();
  addScaled(h, p.perScreen, num(scope.screens));
  addScaled(h, p.perFeature, num(scope.features));
  addScaled(h, p.perIntegration, num(scope.integrations));
  addScaled(h, p.perAiFlow, num(scope.aiFlows));
  addScaled(h, p.perRevision, num(scope.revisions));
  return h;
}

export function techHours(techs: Technology[]): PhaseHours {
  const h = phases();
  for (const t of techs) addScaled(h, t.hours, 1);
  return h;
}

/** Convierte entre monedas con la cotización del usuario. null si falta. */
export function convert(amount: number, from: Currency, to: Currency, arsPerUsd: number | null): number | null {
  if (from === to) return amount;
  if (!arsPerUsd || arsPerUsd <= 0) return null;
  return from === 'USD' ? amount * arsPerUsd : amount / arsPerUsd;
}

export function ceilTo(value: number, step: number): number {
  if (!step || step <= 0) return value;
  return Math.ceil(value / step - 1e-9) * step;
}

export function calculate(s: ProjectState): CalcResult {
  const warnings: string[] = [];
  const { params, pricing, rate, currency } = s;

  // ---- Horas ----
  const techs = s.technologies.filter((t) => s.selectedTechs.includes(t.id));
  const sh = scopeHours(s.scope, params);
  const th = techHours(techs);
  const cf = num(params.complexity[s.complexity]) || 1;
  const kf = num(params.customization[s.customization]) || 1;

  const phaseRows: PhaseRow[] = PHASES.map(({ id, label }) => {
    const base = num(s.baseHours[id]);
    const subtotal = base + sh[id] + th[id];
    const factor = cf * (CUSTOMIZABLE_PHASES.includes(id) ? kf : 1);
    const adjusted = subtotal * factor;
    const manual = num(s.manualAdjust[id]);
    return {
      id,
      label,
      base,
      scope: round1(sh[id]),
      tech: th[id],
      subtotal: round1(subtotal),
      factor,
      factorDelta: round1(adjusted - subtotal),
      manual,
      total: Math.max(0, round1(adjusted + manual)),
    };
  });
  const totalHours = round1(phaseRows.reduce((a, p) => a + p.total, 0));
  if (totalHours <= 0) warnings.push('El proyecto no tiene horas estimadas.');

  // ---- Tarifas ----
  const t = Math.min(Math.max(num(rate.taxRate), 0), MAX_TAX) / 100;
  const billable = num(rate.billableHoursPerMonth);
  const autoCostRate = billable > 0 ? (num(rate.desiredMonthlyIncome) + num(rate.monthlyExpenses)) / billable : 0;
  const costRate = rate.mode === 'manual' ? num(rate.manualHourlyRate) : autoCostRate;
  const m = num(pricing.marginPct) / 100;
  const mp = num(pricing.premiumMarginPct) / 100;

  if (rate.mode === 'auto' && billable <= 0) warnings.push('Definí horas facturables mayores a 0 para calcular tu tarifa.');
  if (billable > 140) warnings.push('Más de 140 h facturables por mes suele ser poco realista: reuniones, ventas y administración no se facturan.');
  if (rate.mode === 'manual' && autoCostRate > 0 && costRate < autoCostRate)
    warnings.push('Tu tarifa manual está por debajo de la tarifa que cubre tu ingreso deseado y tus gastos.');
  if (costRate <= 0) warnings.push('La tarifa base por hora es 0: el precio no cubre tu trabajo.');

  // ---- Costos de terceros ----
  const months = Math.max(0, num(pricing.infraMonths));
  const rawLines: Omit<DirectCostLine, 'quantity' | 'baseTotal' | 'baseMonthly'>[] = [
    ...s.costItems.map((i) => ({
      key: i.id,
      name: i.name || 'Sin nombre',
      recurrence: i.recurrence,
      unitAmount: num(i.amount),
      currency: i.currency,
    })),
    ...techs.flatMap((tc) => [
      ...(tc.oneTimeCost > 0
        ? [{ key: `${tc.id}-once`, name: `Licencia ${tc.name}`, recurrence: 'once' as const, unitAmount: tc.oneTimeCost, currency: tc.currency }]
        : []),
      ...(tc.monthlyCost > 0
        ? [{ key: `${tc.id}-mo`, name: `Suscripción ${tc.name}`, recurrence: 'monthly' as const, unitAmount: tc.monthlyCost, currency: tc.currency }]
        : []),
    ]),
  ];
  let missingRate = false;
  const lines: DirectCostLine[] = rawLines.map((l) => {
    const quantity = l.recurrence === 'monthly' ? months : 1;
    const baseUnit = convert(l.unitAmount, l.currency, currency.base, currency.arsPerUsd);
    if (baseUnit === null) missingRate = true;
    return {
      ...l,
      quantity,
      baseTotal: baseUnit === null ? null : baseUnit * quantity,
      baseMonthly: l.recurrence === 'monthly' && baseUnit !== null ? baseUnit : null,
    };
  });
  const oneTime = lines.filter((l) => l.recurrence === 'once').reduce((a, l) => a + (l.baseTotal ?? 0), 0);
  const recurringTotal = lines.filter((l) => l.recurrence === 'monthly').reduce((a, l) => a + (l.baseTotal ?? 0), 0);
  const recurringMonthly = lines.reduce((a, l) => a + (l.baseMonthly ?? 0), 0);
  const direct = oneTime + recurringTotal;
  if (missingRate)
    warnings.push('Hay costos en otra moneda y no cargaste la cotización: esos costos no se están sumando.');

  // ---- Escenarios ----
  const labor = totalHours * costRate;
  const contingency = labor * (num(pricing.contingencyPct) / 100);
  const service = labor + contingency;
  const u = num(params.urgency[s.urgency]) / 100;

  const build = (id: ScenarioId, marginPct: number): Scenario => {
    const mm = marginPct / 100;
    const margin = service * mm + (pricing.marginOnDirectCosts ? direct * mm : 0);
    const surcharge = service * (1 + mm) * u;
    const totalCost = service + direct;
    const preTax = totalCost + margin + surcharge;
    const exact = t < 1 ? preTax / (1 - t) : preTax;
    const price = ceilTo(exact, num(pricing.rounding));
    const taxes = price * t;
    const rounding = price - taxes - preTax;
    const thirdParty = (direct * (1 + (pricing.marginOnDirectCosts ? mm : 0))) / (1 - t);
    const urgency = surcharge / (1 - t);
    return {
      id,
      label: SCENARIO_LABELS[id],
      marginPct,
      labor,
      contingency,
      direct,
      totalCost,
      margin,
      surcharge,
      preTax,
      taxes,
      rounding,
      price,
      profit: margin + rounding,
      marginOnPrice: price > 0 ? (margin + rounding) / price : 0,
      effectiveHourly: totalHours > 0 ? price / totalHours : 0,
      client: { services: price - thirdParty - urgency, thirdParty, urgency },
    };
  };

  const scenarios: Record<ScenarioId, Scenario> = {
    minimum: build('minimum', 0),
    recommended: build('recommended', num(pricing.marginPct)),
    premium: build('premium', num(pricing.premiumMarginPct)),
  };
  if (mp < m) warnings.push('El margen premium es menor que el recomendado.');

  // ---- Mantenimiento mensual (aparte del proyecto) ----
  const maintenanceMonthly =
    (num(pricing.maintenanceHoursPerMonth) * costRate * (1 + m) + recurringMonthly) / (1 - t);

  const weeklyCapacity = billable > 0 ? billable / 4.33 : 25;
  const suggestedWeeks = totalHours > 0 ? Math.ceil(totalHours / weeklyCapacity) : 0;

  return {
    phases: phaseRows,
    totalHours,
    rates: {
      autoCostRate,
      costRate,
      minimumBilled: costRate / (1 - t),
      recommendedBilled: (costRate * (1 + m)) / (1 - t),
      premiumBilled: (costRate * (1 + mp)) / (1 - t),
    },
    direct: { lines, oneTime, recurringMonthly, total: direct, missingRate },
    scenarios,
    selected: scenarios[pricing.selectedScenario] ?? scenarios.recommended,
    maintenanceMonthly,
    suggestedWeeks,
    warnings,
  };
}
