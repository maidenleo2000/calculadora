export type Currency = 'ARS' | 'USD';

export type PhaseId =
  | 'analysis'
  | 'uxui'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'integrations'
  | 'ai'
  | 'testing'
  | 'deployment'
  | 'docs'
  | 'maintenance';

export type PhaseHours = Record<PhaseId, number>;

export type ProjectTypeId = 'ai' | 'ecommerce' | 'corporate' | 'saas' | 'desktop' | 'api';
export type ComplexityId = 'low' | 'medium' | 'high' | 'veryHigh';
export type CustomizationId = 'template' | 'standard' | 'custom' | 'bespoke';
export type UrgencyId = 'normal' | 'priority' | 'urgent';
export type ScenarioId = 'minimum' | 'recommended' | 'premium';

export type TechCategory =
  | 'frontend'
  | 'backend'
  | 'cms'
  | 'ai'
  | 'data'
  | 'infra'
  | 'desktop'
  | 'payments'
  | 'other';

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  /** Horas extra de setup / configuración / curva de aprendizaje por etapa. */
  hours: Partial<PhaseHours>;
  /** Licencia o costo de pago único, en `currency`. */
  oneTimeCost: number;
  /** Licencia o suscripción mensual, en `currency`. */
  monthlyCost: number;
  currency: Currency;
  custom?: boolean;
}

export interface Scope {
  screens: number;
  features: number;
  integrations: number;
  aiFlows: number;
  revisions: number;
}

export type Recurrence = 'once' | 'monthly';

export interface CostItem {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  recurrence: Recurrence;
}

export interface EstimationParams {
  perScreen: Partial<PhaseHours>;
  perFeature: Partial<PhaseHours>;
  perIntegration: Partial<PhaseHours>;
  perAiFlow: Partial<PhaseHours>;
  perRevision: Partial<PhaseHours>;
  /** Factor de esfuerzo explícito y editable por complejidad. */
  complexity: Record<ComplexityId, number>;
  /** Factor aplicado sólo a UX/UI y frontend. */
  customization: Record<CustomizationId, number>;
  /** Recargo porcentual por urgencia (no es costo, es recargo). */
  urgency: Record<UrgencyId, number>;
}

export interface RateSettings {
  mode: 'auto' | 'manual';
  /** Ingreso neto mensual deseado (después de impuestos), en moneda base. */
  desiredMonthlyIncome: number;
  /** Gastos operativos mensuales (software, equipos, internet, contador...). */
  monthlyExpenses: number;
  billableHoursPerMonth: number;
  /** Tarifa base manual: costo de tu hora, antes de margen e impuestos. */
  manualHourlyRate: number;
  /** % estimado de impuestos sobre lo facturado. */
  taxRate: number;
}

export interface PricingSettings {
  contingencyPct: number;
  marginPct: number;
  premiumMarginPct: number;
  marginOnDirectCosts: boolean;
  /** Meses de costos recurrentes incluidos en el precio del proyecto. */
  infraMonths: number;
  rounding: number;
  selectedScenario: ScenarioId;
  maintenanceHoursPerMonth: number;
}

export interface CurrencySettings {
  base: Currency;
  display: Currency;
  /** Cotización ARS por 1 USD. null = no configurada. */
  arsPerUsd: number | null;
  rateNote: string;
}

export interface QuoteInfo {
  providerAddress: string;
  providerTaxId: string;
  clientAddress: string;
  clientTaxId: string;
  clientPhone: string;
  providerName: string;
  providerContact: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  projectName: string;
  description: string;
  quoteNumber: string;
  issueDate: string;
  validityDays: number;
  depositPct: number;
  deliveryWeeks: number;
  includes: string;
  excludes: string;
  notes: string;
  showHours: boolean;
  showMaintenance: boolean;
}

export interface ProjectState {
  version: 1;
  estimationMode: 'automatic' | 'tasks';
  tasks: TaskEstimate[];
  taskPricing: TaskPricing;
  saas: SaaSSettings;
  projectType: ProjectTypeId;
  baseHours: PhaseHours;
  scope: Scope;
  complexity: ComplexityId;
  customization: CustomizationId;
  urgency: UrgencyId;
  selectedTechs: string[];
  technologies: Technology[];
  manualAdjust: PhaseHours;
  costItems: CostItem[];
  rate: RateSettings;
  pricing: PricingSettings;
  currency: CurrencySettings;
  params: EstimationParams;
  quote: QuoteInfo;
}

export type Updater = (fn: (s: ProjectState) => ProjectState) => void;

export interface TaskEstimate {
  id: string;
  phase: PhaseId;
  name: string;
  method: 'fixed' | 'pert';
  hours: number;
  optimistic: number;
  probable: number;
  pessimistic: number;
  /** null usa la tarifa base del proyecto. Importes en moneda base. */
  hourlyRate: number | null;
  notes: string;
}

export interface TaskPricing {
  useUniformRate: boolean;
  riskHours: number;
  riskHourlyRate: number | null;
  managementMode: 'percentage' | 'fixed';
  managementFixed: number;
  discountPct: number;
  vatPct: number;
}

export interface SaaSSettings {
  useProjectCost: boolean;
  developmentCost: number;
  recoveryMonths: number;
  clients: number;
  infrastructureMonthly: number;
  supportHours: number;
  supportHourlyRate: number;
  markupPct: number;
  extraHours: number;
  extraHourlyRate: number;
  otherExtras: number;
  rounding: number;
  plans: { id: string; name: string; variableCost: number }[];
}
