import type {
  ComplexityId,
  CustomizationId,
  PhaseHours,
  PhaseId,
  ProjectTypeId,
  Scope,
  TechCategory,
  Technology,
  UrgencyId,
} from '../types';

export const PHASES: { id: PhaseId; label: string; hint: string }[] = [
  { id: 'analysis', label: 'Análisis', hint: 'Relevamiento, requerimientos, planificación' },
  { id: 'uxui', label: 'Diseño UX/UI', hint: 'Wireframes, prototipos, diseño visual' },
  { id: 'frontend', label: 'Frontend', hint: 'Maquetación e interacción' },
  { id: 'backend', label: 'Backend', hint: 'Lógica de negocio, autenticación, APIs' },
  { id: 'database', label: 'Base de datos', hint: 'Modelado, migraciones, consultas' },
  { id: 'integrations', label: 'Integraciones', hint: 'Pagos, CRMs, APIs de terceros' },
  { id: 'ai', label: 'Inteligencia artificial', hint: 'Prompts, agentes, RAG, evaluación' },
  { id: 'testing', label: 'Pruebas', hint: 'QA manual, tests automatizados' },
  { id: 'deployment', label: 'Despliegue', hint: 'Servidores, CI/CD, dominios, empaquetado' },
  { id: 'docs', label: 'Documentación', hint: 'Manuales, documentación técnica, capacitación' },
  { id: 'maintenance', label: 'Soporte post-entrega', hint: 'Garantía y ajustes incluidos tras la entrega' },
];

/** Etapas afectadas por el nivel de personalización. */
export const CUSTOMIZABLE_PHASES: PhaseId[] = ['uxui', 'frontend'];

export function phases(partial: Partial<PhaseHours> = {}): PhaseHours {
  return {
    analysis: 0,
    uxui: 0,
    frontend: 0,
    backend: 0,
    database: 0,
    integrations: 0,
    ai: 0,
    testing: 0,
    deployment: 0,
    docs: 0,
    maintenance: 0,
    ...partial,
  };
}

export interface ProjectTypeDef {
  id: ProjectTypeId;
  name: string;
  description: string;
  baseHours: PhaseHours;
  scope: Scope;
  suggestedTechs: string[];
}

/**
 * Horas base: el trabajo fijo del tipo de proyecto (setup, relevamiento,
 * despliegue) independiente del alcance. El alcance suma horas por unidad.
 */
export const PROJECT_TYPES: ProjectTypeDef[] = [
  {
    id: 'ai',
    name: 'Agentes de IA y automatizaciones',
    description: 'Chatbots, agentes, flujos automatizados, RAG',
    baseHours: phases({ analysis: 8, uxui: 2, frontend: 4, backend: 10, database: 4, integrations: 6, ai: 16, testing: 6, deployment: 4, docs: 4, maintenance: 4 }),
    scope: { screens: 2, features: 4, integrations: 3, aiFlows: 2, revisions: 2 },
    suggestedTechs: ['python', 'fastapi', 'openai', 'langchain', 'n8n'],
  },
  {
    id: 'ecommerce',
    name: 'Tiendas online y e-commerce',
    description: 'Catálogo, carrito, pagos, envíos',
    baseHours: phases({ analysis: 8, uxui: 10, frontend: 12, backend: 8, database: 4, integrations: 6, testing: 8, deployment: 4, docs: 3, maintenance: 6 }),
    scope: { screens: 10, features: 8, integrations: 3, aiFlows: 0, revisions: 2 },
    suggestedTechs: ['woocommerce', 'wordpress', 'mercadopago'],
  },
  {
    id: 'corporate',
    name: 'Sitios corporativos y landing pages',
    description: 'Institucionales, portfolios, campañas',
    baseHours: phases({ analysis: 4, uxui: 6, frontend: 6, backend: 2, integrations: 2, testing: 3, deployment: 2, docs: 1, maintenance: 2 }),
    scope: { screens: 5, features: 3, integrations: 1, aiFlows: 0, revisions: 2 },
    suggestedTechs: ['nextjs', 'react', 'tailwind', 'vercel'],
  },
  {
    id: 'saas',
    name: 'Aplicaciones web y plataformas SaaS',
    description: 'Paneles, multiusuario, suscripciones',
    baseHours: phases({ analysis: 16, uxui: 12, frontend: 16, backend: 20, database: 10, integrations: 6, testing: 12, deployment: 8, docs: 6, maintenance: 8 }),
    scope: { screens: 15, features: 15, integrations: 3, aiFlows: 0, revisions: 3 },
    suggestedTechs: ['nextjs', 'react', 'nodejs', 'postgresql', 'stripe', 'docker'],
  },
  {
    id: 'desktop',
    name: 'Aplicaciones de escritorio',
    description: 'Windows, macOS, Linux',
    baseHours: phases({ analysis: 10, uxui: 8, frontend: 12, backend: 12, database: 6, integrations: 2, testing: 10, deployment: 8, docs: 4, maintenance: 6 }),
    scope: { screens: 8, features: 10, integrations: 1, aiFlows: 0, revisions: 2 },
    suggestedTechs: ['electron', 'react', 'sqlite'],
  },
  {
    id: 'api',
    name: 'APIs, integraciones y sistemas a medida',
    description: 'Backends, middlewares, sincronizaciones',
    baseHours: phases({ analysis: 10, backend: 16, database: 8, integrations: 12, testing: 10, deployment: 6, docs: 8, maintenance: 6 }),
    scope: { screens: 0, features: 10, integrations: 5, aiFlows: 0, revisions: 1 },
    suggestedTechs: ['nodejs', 'postgresql', 'docker'],
  },
];

export const TECH_CATEGORIES: Record<TechCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  cms: 'CMS y e-commerce',
  ai: 'Inteligencia artificial',
  data: 'Datos',
  infra: 'Infraestructura',
  desktop: 'Escritorio',
  payments: 'Pagos',
  other: 'Otras',
};

function tech(id: string, name: string, category: TechCategory, hours: Partial<PhaseHours>): Technology {
  return { id, name, category, hours, oneTimeCost: 0, monthlyCost: 0, currency: 'USD' };
}

/**
 * Cada tecnología suma horas concretas (setup, configuración, integración)
 * en las etapas donde impacta. No se usan multiplicadores. Los costos de
 * licencia arrancan en 0: cargalos con el precio real que pagues.
 */
export const DEFAULT_TECHNOLOGIES: Technology[] = [
  tech('react', 'React', 'frontend', { frontend: 3 }),
  tech('nextjs', 'Next.js', 'frontend', { frontend: 4, deployment: 2 }),
  tech('vue', 'Vue', 'frontend', { frontend: 3 }),
  tech('angular', 'Angular', 'frontend', { frontend: 6 }),
  tech('tailwind', 'Tailwind CSS', 'frontend', { frontend: 1 }),
  tech('nodejs', 'Node.js', 'backend', { backend: 4 }),
  tech('python', 'Python', 'backend', { backend: 3 }),
  tech('django', 'Django', 'backend', { backend: 5, database: 2 }),
  tech('fastapi', 'FastAPI', 'backend', { backend: 3, docs: 1 }),
  tech('dotnet', '.NET', 'backend', { backend: 6, deployment: 2 }),
  tech('java', 'Java / Spring', 'backend', { backend: 8, deployment: 2 }),
  tech('electron', 'Electron', 'desktop', { frontend: 4, deployment: 8 }),
  tech('wordpress', 'WordPress', 'cms', { frontend: 3, deployment: 2 }),
  tech('shopify', 'Shopify', 'cms', { frontend: 5, integrations: 2 }),
  tech('woocommerce', 'WooCommerce', 'cms', { backend: 4, integrations: 3 }),
  tech('openai', 'OpenAI API', 'ai', { ai: 4, integrations: 2 }),
  tech('langchain', 'LangChain', 'ai', { ai: 8 }),
  tech('n8n', 'n8n', 'ai', { integrations: 6 }),
  tech('postgresql', 'PostgreSQL', 'data', { database: 3 }),
  tech('mongodb', 'MongoDB', 'data', { database: 3 }),
  tech('sqlite', 'SQLite', 'data', { database: 1 }),
  tech('supabase', 'Supabase / Firebase', 'data', { backend: 2, database: 2 }),
  tech('docker', 'Docker', 'infra', { deployment: 4 }),
  tech('aws', 'AWS', 'infra', { deployment: 6 }),
  tech('vercel', 'Vercel / Netlify', 'infra', { deployment: 1 }),
  tech('stripe', 'Stripe', 'payments', { integrations: 6, testing: 2 }),
  tech('mercadopago', 'Mercado Pago', 'payments', { integrations: 6, testing: 2 }),
];

export const COMPLEXITY_LABELS: Record<ComplexityId, { label: string; hint: string }> = {
  low: { label: 'Baja', hint: 'Requerimientos claros, patrones conocidos' },
  medium: { label: 'Media', hint: 'Algunas reglas de negocio propias' },
  high: { label: 'Alta', hint: 'Lógica compleja, muchos roles o estados' },
  veryHigh: { label: 'Muy alta', hint: 'Alta incertidumbre, tecnología nueva' },
};

export const CUSTOMIZATION_LABELS: Record<CustomizationId, { label: string; hint: string }> = {
  template: { label: 'Plantilla', hint: 'Sobre un tema o kit existente' },
  standard: { label: 'Estándar', hint: 'Diseño propio simple' },
  custom: { label: 'A medida', hint: 'Diseño único, componentes propios' },
  bespoke: { label: 'Premium', hint: 'Animaciones, branding, microinteracciones' },
};

export const URGENCY_LABELS: Record<UrgencyId, { label: string; hint: string }> = {
  normal: { label: 'Normal', hint: 'Plazo estándar' },
  priority: { label: 'Prioritaria', hint: 'Reorganizar agenda' },
  urgent: { label: 'Urgente', hint: 'Horas extra, fines de semana' },
};
