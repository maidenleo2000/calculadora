import { describe, expect, it } from 'vitest';
import { createExampleState } from '../data/defaults';
import { applyCostTemplate, DEFAULT_SAAS, pertTemplateTasks } from '../data/templates';
import { calculate, splitPayment } from './calc';
import { normalize } from './storage';
import { calculateSaaS, taskHours } from './templates';

describe('plantillas TodoCode', () => {
  it('tarifa única reemplaza todas las tarifas por tarea y riesgo sin borrarlas', () => {
    const s = applyCostTemplate(createExampleState());
    s.rate.mode = 'manual';
    s.rate.manualHourlyRate = 30;
    s.taskPricing.riskHours = 2;
    s.taskPricing.riskHourlyRate = 100;
    const before = structuredClone(s.tasks);
    const individual = calculate(s);
    expect(individual.selected.labor).toBe(1238);
    s.taskPricing.useUniformRate = true;
    const r = calculate(s);
    expect(r.totalHours).toBe(61);
    expect(r.selected.labor).toBe(1830);
    expect(r.selected.price).toBe(2380);
    for (const phase of r.phases) expect(phase.labor).toBeCloseTo(phase.total * 30, 8);
    expect(s.tasks).toEqual(before);
    expect(s.taskPricing.riskHourlyRate).toBe(100);
    s.taskPricing.useUniformRate = false;
    expect(calculate(s).selected.price).toBe(individual.selected.price);
  });

  it('tarifa única usa el valor automático y respeta una tarifa manual de cero', () => {
    const s = applyCostTemplate(createExampleState());
    s.taskPricing.useUniformRate = true;
    s.rate.mode = 'auto';
    s.rate.desiredMonthlyIncome = 2000;
    s.rate.monthlyExpenses = 500;
    s.rate.billableHoursPerMonth = 100;
    expect(calculate(s).selected.labor).toBe(59 * 25);
    s.rate.mode = 'manual';
    s.rate.manualHourlyRate = 0;
    expect(calculate(s).selected.labor).toBe(0);
  });

  it('tarifa única funciona con PERT y se conserva al guardar un proyecto', () => {
    const s = applyCostTemplate(createExampleState());
    s.tasks = pertTemplateTasks();
    s.tasks.forEach((task) => { task.hourlyRate = 999; });
    s.taskPricing.useUniformRate = true;
    s.rate.mode = 'manual';
    s.rate.manualHourlyRate = 20;
    const restored = normalize(JSON.parse(JSON.stringify(s)))!;
    expect(restored.taskPricing.useUniformRate).toBe(true);
    expect(calculate(restored).selected.labor).toBeCloseTo(16.533333333333 * 20, 8);
    const previous = JSON.parse(JSON.stringify(s));
    delete previous.taskPricing.useUniformRate;
    expect(normalize(previous)!.taskPricing.useUniformRate).toBe(false);
  });
  it('anticipo y saldo concilian a centavos con el total mostrado', () => {
    expect(splitPayment(1729.332, 50)).toEqual({ total: 1729.33, deposit: 864.67, balance: 864.66 });
    expect(splitPayment(1729332, 50)).toEqual({ total: 1729332, deposit: 864666, balance: 864666 });
  });
  it('reproduce los subtotales de costos y el presupuesto de 1.588', () => {
    const r = calculate(applyCostTemplate(createExampleState()));
    expect(r.totalHours).toBe(59);
    expect(r.phases.filter((p) => p.total > 0).map((p) => p.labor)).toEqual([225, 216, 360, 75, 162]);
    expect(r.selected.labor).toBe(1038);
    expect(r.selected.direct).toBe(250);
    expect(r.selected.margin).toBe(300);
    expect(r.selected.price).toBe(1588);
    expect(r.scenarios.minimum.price).toBe(1288);
    expect(r.scenarios.premium.price).toBeGreaterThan(1588);
  });

  it('calcula PERT con precisión y agrega una sola vez las horas de riesgo', () => {
    const s = applyCostTemplate(createExampleState());
    s.tasks = pertTemplateTasks();
    s.taskPricing.riskHours = 1;
    s.rate.mode = 'manual';
    s.rate.manualHourlyRate = 20;
    const expected = s.tasks.reduce((sum, t) => sum + taskHours(t), 0);
    expect(expected).toBeCloseTo(16.5333333333, 8);
    const r = calculate(s);
    expect(r.totalHours).toBe(17.53);
    expect(r.selected.labor).toBeCloseTo((expected + 1) * 20, 8);
    s.scope.features = 1000;
    s.selectedTechs = ['docker'];
    expect(calculate(s).totalHours).toBe(r.totalHours);
  });

  it('informa y excluye un intervalo PERT inválido', () => {
    const s = applyCostTemplate(createExampleState());
    s.tasks = pertTemplateTasks().slice(0, 1);
    s.tasks[0].optimistic = 5;
    const r = calculate(s);
    expect(r.totalHours).toBe(0);
    expect(r.warnings.some((w) => w.includes('optimista'))).toBe(true);
  });

  it('gestión porcentual, descuento e IVA concilian con el total', () => {
    const s = applyCostTemplate(createExampleState());
    s.taskPricing.managementMode = 'percentage';
    s.taskPricing.discountPct = 10;
    s.taskPricing.vatPct = 21;
    s.pricing.marginOnDirectCosts = true;
    s.rate.taxRate = 12;
    s.pricing.rounding = 10;
    s.urgency = 'urgent';
    for (const sc of Object.values(calculate(s).scenarios)) {
      expect(sc.labor + sc.contingency + sc.direct + sc.margin + sc.surcharge + sc.taxes + sc.rounding + sc.vat - sc.discountNet).toBeCloseTo(sc.price, 8);
      expect(sc.client.services + sc.client.thirdParty + sc.client.urgency - sc.discount + sc.vat).toBeCloseTo(sc.price, 8);
      expect(sc.vat).toBeCloseTo(sc.price / 1.21 * 0.21, 8);
    }
  });

  it('descontar 100% da cero y advierte sobre la pérdida', () => {
    const s = applyCostTemplate(createExampleState());
    s.taskPricing.discountPct = 100;
    s.taskPricing.vatPct = 21;
    const r = calculate(s);
    expect(r.selected.price).toBe(0);
    expect(r.selected.profit).toBe(-1288);
    expect(r.warnings.some((w) => w.includes('descuento'))).toBe(true);
  });

  it('reproduce los cuatro planes SaaS de la plantilla', () => {
    const r = calculateSaaS(structuredClone(DEFAULT_SAAS), 0);
    expect(r.base).toBeCloseTo(48.6666666667, 8);
    expect(r.plans.map((p) => p.monthly)).toEqual([79, 94, 119, 219]);
  });

  it('SaaS usa el costo de proyecto y suma extras después del redondeo', () => {
    const r = calculateSaaS({ ...structuredClone(DEFAULT_SAAS), useProjectCost: true, extraHours: 2, otherExtras: 5 }, 4000);
    expect(r.development).toBe(4000);
    expect(r.plans.map((p) => p.monthly)).toEqual([108, 123, 148, 248]);
  });

  it.each([{ clients: 0 }, { recoveryMonths: 0 }, { clients: 1.5 }])('SaaS incompleto no muestra precios válidos: %o', (patch) => {
    const r = calculateSaaS({ ...structuredClone(DEFAULT_SAAS), ...patch }, 0);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.plans.every((p) => p.monthly === null)).toBe(true);
  });

  it('carga proyectos anteriores sin alterar su precio y conserva los nuevos campos', () => {
    const old = createExampleState();
    const price = calculate(old).selected.price;
    const input = JSON.parse(JSON.stringify(old));
    delete input.tasks; delete input.estimationMode; delete input.taskPricing; delete input.saas;
    const restored = normalize(input)!;
    expect(restored.estimationMode).toBe('automatic');
    expect(calculate(restored).selected.price).toBe(price);
    const s = applyCostTemplate(old);
    s.saas.clients = 25;
    expect(normalize(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});
