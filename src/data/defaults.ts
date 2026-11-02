import type { EstimationParams, ProjectState, ProjectTypeId } from '../types';
import { DEFAULT_TECHNOLOGIES, PROJECT_TYPES, phases } from './catalog';
import { DEFAULT_SAAS, DEFAULT_TASK_PRICING } from './templates';

export const DEFAULT_PARAMS: EstimationParams = {
  perScreen: { uxui: 2.5, frontend: 4, testing: 0.5 },
  perFeature: { backend: 5, frontend: 2, database: 1, testing: 1.5 },
  perIntegration: { integrations: 8, testing: 2, docs: 0.5 },
  perAiFlow: { ai: 12, testing: 3, docs: 1 },
  perRevision: { uxui: 3, frontend: 2 },
  complexity: { low: 0.85, medium: 1, high: 1.3, veryHigh: 1.6 },
  customization: { template: 0.7, standard: 1, custom: 1.25, bespoke: 1.5 },
  urgency: { normal: 0, priority: 15, urgent: 30 },
};

const today = () => new Date().toISOString().slice(0, 10);

function quoteNumber() {
  const d = new Date();
  return `P-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function typeDefaults(id: ProjectTypeId) {
  const def = PROJECT_TYPES.find((p) => p.id === id)!;
  return {
    projectType: id,
    baseHours: { ...def.baseHours },
    scope: { ...def.scope },
    selectedTechs: [...def.suggestedTechs],
  };
}

/** Ejemplo editable: todos los valores son ilustrativos y se pueden cambiar. */
export function createExampleState(): ProjectState {
  return {
    version: 1,
    estimationMode: 'automatic',
    tasks: [],
    taskPricing: { ...DEFAULT_TASK_PRICING },
    saas: structuredClone(DEFAULT_SAAS),
    ...typeDefaults('ecommerce'),
    complexity: 'medium',
    customization: 'standard',
    urgency: 'normal',
    technologies: DEFAULT_TECHNOLOGIES.map((t) => ({ ...t, hours: { ...t.hours } })),
    manualAdjust: phases(),
    costItems: [
      { id: 'c1', name: 'Hosting (ejemplo)', amount: 15, currency: 'USD', recurrence: 'monthly' },
      { id: 'c2', name: 'Dominio (ejemplo)', amount: 20, currency: 'USD', recurrence: 'once' },
      { id: 'c3', name: 'Plugin premium (ejemplo)', amount: 60, currency: 'USD', recurrence: 'once' },
    ],
    rate: {
      mode: 'auto',
      desiredMonthlyIncome: 2500,
      monthlyExpenses: 400,
      billableHoursPerMonth: 100,
      manualHourlyRate: 30,
      taxRate: 10,
    },
    pricing: {
      contingencyPct: 15,
      marginPct: 25,
      premiumMarginPct: 50,
      marginOnDirectCosts: false,
      infraMonths: 3,
      rounding: 10,
      selectedScenario: 'recommended',
      maintenanceHoursPerMonth: 6,
    },
    currency: { base: 'USD', display: 'USD', arsPerUsd: null, rateNote: '' },
    params: structuredClone(DEFAULT_PARAMS),
    quote: {
      providerAddress: '', providerTaxId: '', clientAddress: '', clientTaxId: '', clientPhone: '',
      providerName: 'LS Nexo Digital',
      providerContact: 'info@lsnexodigital.com.ar',
      clientName: 'María Gómez',
      clientCompany: 'Cosmética Natural SRL (ejemplo)',
      clientEmail: 'cliente@ejemplo.com',
      projectName: 'Tienda online de cosmética natural',
      description:
        'Desarrollo de una tienda online con catálogo de productos, carrito, checkout con Mercado Pago, cálculo de envíos y panel de administración de pedidos.',
      quoteNumber: quoteNumber(),
      issueDate: today(),
      validityDays: 15,
      depositPct: 50,
      deliveryWeeks: 0,
      includes:
        'Diseño responsive\nCarga inicial de hasta 30 productos\nCapacitación de 1 hora\n30 días de soporte post-entrega',
      excludes: 'Redacción de contenidos y fotografía\nCostos de pasarela de pago y comisiones\nCampañas de marketing',
      notes: 'Los costos de terceros se facturan al valor vigente al momento de la contratación.',
      showHours: true,
      showMaintenance: true,
    },
  };
}

export function createBlankState(): ProjectState {
  const s = createExampleState();
  return {
    ...s,
    ...typeDefaults('corporate'),
    costItems: [],
    quote: {
      ...s.quote,
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      projectName: 'Nuevo proyecto',
      description: '',
      includes: '',
      excludes: '',
      notes: '',
    },
  };
}

export function applyProjectType(s: ProjectState, id: ProjectTypeId): ProjectState {
  return { ...s, ...typeDefaults(id), manualAdjust: phases() };
}
