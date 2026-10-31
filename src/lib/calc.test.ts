import { describe, expect, it } from 'vitest';
import { calculate, ceilTo, convert } from './calc';
import { createExampleState } from '../data/defaults';
import { phases } from '../data/catalog';
import type { ProjectState } from '../types';

function simple(over: (s: ProjectState) => void = () => {}): ProjectState {
  const s = createExampleState();
  s.baseHours = phases({ backend: 100 });
  s.scope = { screens: 0, features: 0, integrations: 0, aiFlows: 0, revisions: 0 };
  s.selectedTechs = [];
  s.costItems = [];
  s.rate = { mode: 'manual', manualHourlyRate: 20, desiredMonthlyIncome: 0, monthlyExpenses: 0, billableHoursPerMonth: 100, taxRate: 0 };
  s.pricing = { ...s.pricing, contingencyPct: 0, marginPct: 0, premiumMarginPct: 0, rounding: 0, marginOnDirectCosts: false };
  s.urgency = 'normal';
  s.complexity = 'medium';
  over(s);
  return s;
}

describe('calculate', () => {
  it('precio = horas × tarifa cuando no hay recargos', () => {
    const r = calculate(simple());
    expect(r.totalHours).toBe(100);
    expect(r.selected.price).toBe(2000);
  });

  it('la suma de las partes es igual al precio en todos los escenarios', () => {
    const s = createExampleState();
    s.urgency = 'urgent';
    s.pricing.marginOnDirectCosts = true;
    const r = calculate(s);
    for (const sc of Object.values(r.scenarios)) {
      const sum = sc.labor + sc.contingency + sc.direct + sc.margin + sc.surcharge + sc.taxes + sc.rounding;
      expect(sum).toBeCloseTo(sc.price, 6);
      expect(sc.rounding).toBeGreaterThanOrEqual(-1e-9);
      const c = sc.client;
      expect(c.services + c.thirdParty + c.urgency).toBeCloseTo(sc.price, 6);
    }
  });

  it('impuestos por gross-up: lo que queda después de impuestos cubre el subtotal', () => {
    const r = calculate(simple((s) => (s.rate.taxRate = 20)));
    expect(r.selected.price).toBeCloseTo(2500, 6);
    expect(r.selected.taxes).toBeCloseTo(500, 6);
    expect(r.selected.price - r.selected.taxes).toBeCloseTo(r.selected.preTax, 6);
  });

  it('tarifa automática = (ingreso + gastos) / horas facturables', () => {
    const r = calculate(
      simple((s) => {
        s.rate.mode = 'auto';
        s.rate.desiredMonthlyIncome = 2000;
        s.rate.monthlyExpenses = 500;
        s.rate.billableHoursPerMonth = 100;
        s.rate.taxRate = 0;
      }),
    );
    expect(r.rates.costRate).toBe(25);
    expect(r.selected.labor).toBe(2500);
  });

  it('el margen no se aplica a terceros salvo que se indique', () => {
    const base = simple((s) => {
      s.pricing.marginPct = 50;
      s.costItems = [{ id: 'x', name: 'API', amount: 100, currency: 'USD', recurrence: 'once' }];
    });
    const r1 = calculate(base);
    expect(r1.scenarios.recommended.margin).toBe(1000);
    expect(r1.scenarios.recommended.direct).toBe(100);
    const r2 = calculate({ ...base, pricing: { ...base.pricing, marginOnDirectCosts: true } });
    expect(r2.scenarios.recommended.margin).toBe(1050);
  });

  it('el escenario mínimo no tiene ganancia', () => {
    const r = calculate(simple((s) => (s.pricing.marginPct = 30)));
    expect(r.scenarios.minimum.margin).toBe(0);
    expect(r.scenarios.minimum.profit).toBe(0);
    expect(r.scenarios.recommended.price).toBeGreaterThan(r.scenarios.minimum.price);
  });

  it('recargo por urgencia sobre servicios, no sobre terceros', () => {
    const r = calculate(
      simple((s) => {
        s.urgency = 'urgent';
        s.params.urgency.urgent = 10;
        s.costItems = [{ id: 'x', name: 'Licencia', amount: 500, currency: 'USD', recurrence: 'once' }];
      }),
    );
    expect(r.selected.surcharge).toBe(200);
  });

  it('costos mensuales se multiplican por los meses incluidos', () => {
    const r = calculate(
      simple((s) => {
        s.pricing.infraMonths = 6;
        s.costItems = [{ id: 'x', name: 'Hosting', amount: 10, currency: 'USD', recurrence: 'monthly' }];
      }),
    );
    expect(r.direct.total).toBe(60);
    expect(r.direct.recurringMonthly).toBe(10);
  });

  it('sin cotización, los costos en otra moneda se marcan y no se suman', () => {
    const r = calculate(
      simple((s) => {
        s.currency.arsPerUsd = null;
        s.costItems = [{ id: 'x', name: 'Servidor', amount: 10000, currency: 'ARS', recurrence: 'once' }];
      }),
    );
    expect(r.direct.missingRate).toBe(true);
    expect(r.direct.total).toBe(0);
    const r2 = calculate(
      simple((s) => {
        s.currency.arsPerUsd = 1000;
        s.costItems = [{ id: 'x', name: 'Servidor', amount: 10000, currency: 'ARS', recurrence: 'once' }];
      }),
    );
    expect(r2.direct.total).toBe(10);
  });

  it('las tecnologías suman horas, no multiplican', () => {
    const s = simple((st) => (st.selectedTechs = ['docker']));
    const r = calculate(s);
    expect(r.totalHours).toBe(104);
  });

  it('el redondeo siempre es hacia arriba', () => {
    const r = calculate(simple((s) => ((s.rate.manualHourlyRate = 20.13), (s.pricing.rounding = 100))));
    expect(r.selected.price).toBe(2100);
    expect(r.selected.rounding).toBeCloseTo(87, 6);
  });
});

describe('helpers', () => {
  it('convert', () => {
    expect(convert(10, 'USD', 'USD', null)).toBe(10);
    expect(convert(10, 'USD', 'ARS', null)).toBeNull();
    expect(convert(10, 'USD', 'ARS', 1000)).toBe(10000);
    expect(convert(5000, 'ARS', 'USD', 1000)).toBe(5);
  });
  it('ceilTo', () => {
    expect(ceilTo(1001, 10)).toBe(1010);
    expect(ceilTo(1000, 10)).toBe(1000);
    expect(ceilTo(123.4, 0)).toBe(123.4);
  });
});
