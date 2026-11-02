import type { ProjectState, SaaSSettings, TaskEstimate, TaskPricing, PhaseId } from '../types';

export const DEFAULT_TASK_PRICING: TaskPricing = {
  useUniformRate: false,
  riskHours: 0, riskHourlyRate: null, managementMode: 'percentage', managementFixed: 0, discountPct: 0, vatPct: 0,
};

export const DEFAULT_SAAS: SaaSSettings = {
  useProjectCost: false, developmentCost: 4000, recoveryMonths: 24, clients: 10,
  infrastructureMonthly: 80, supportHours: 3, supportHourlyRate: 8, markupPct: 40,
  extraHours: 0, extraHourlyRate: 12, otherExtras: 0, rounding: 1,
  plans: [
    { id: 'basic', name: 'Básico', variableCost: 10 },
    { id: 'intermediate', name: 'Intermedio', variableCost: 25 },
    { id: 'pro', name: 'Pro', variableCost: 50 },
    { id: 'enterprise', name: 'Enterprise', variableCost: 150 },
  ],
};

const groups: [PhaseId, number, [string, number][]][] = [
  ['analysis', 15, [
    ['Relevamiento de requisitos con el cliente', 6], ['Definición de casos de uso / user stories', 2],
    ['Diseño de arquitectura básica', 4], ['Bocetos de interfaz gráfica', 2], ['Validación del alcance con el cliente', 1],
  ]],
  ['backend', 20, [
    ['Configuración del entorno y repositorio', 2], ['Modelo de datos y base de datos', 3],
    ['Implementación de endpoints', 3], ['Lógica de negocio', 8], ['Pruebas unitarias básicas', 2],
  ]],
  ['frontend', 18, [
    ['Configuración del proyecto y dependencias', 1], ['Maquetado inicial de vistas', 4],
    ['Integración con backend', 4], ['Estados, formularios y validaciones', 2], ['Ajustes de diseño y usabilidad', 1],
  ]],
  ['testing', 15, [['Creación de casos de prueba', 0.5], ['Pruebas funcionales', 2], ['Corrección de bugs', 2.5]]],
  ['deployment', 18, [
    ['Configuración de servidores / nube', 1], ['Despliegue del backend', 3],
    ['Despliegue del frontend', 3], ['Backup y configuraciones varias', 2],
  ]],
];

export function costTemplateTasks(): TaskEstimate[] {
  return groups.flatMap(([phase, hourlyRate, rows]) => rows.map(([name, hours], i) => ({
    id: `template-${phase}-${i}`, phase, name, hourlyRate, method: 'fixed', hours,
    optimistic: hours, probable: hours, pessimistic: hours, notes: '',
  })));
}

export function pertTemplateTasks(): TaskEstimate[] {
  const rows: [string, number, number, number][] = [
    ['Crear endpoint de creación de productos', 0.3, 0.5, 1],
    ['Crear lógica de creación de productos', 0.5, 0.8, 1.5],
    ['Operaciones de base de datos para crear un producto', 1, 1.3, 2],
    ['Leer productos', 1, 1.5, 2], ['Eliminar productos', 1.5, 2, 3], ['Actualizar productos', 1.5, 2, 3],
    ['Crear pedido', 1.5, 2, 2.5], ['Consultar pedidos', 0.5, 1, 2],
    ['Eliminar pedidos', 2, 2.5, 3], ['Actualizar pedidos', 2, 2.5, 3],
  ];
  return rows.map(([name, optimistic, probable, pessimistic], i) => ({
    id: `pert-${i}`, name, optimistic, probable, pessimistic, phase: 'backend',
    method: 'pert', hours: probable, hourlyRate: null, notes: i >= 6 ? 'Depende de terminar las tareas de productos.' : '',
  }));
}

/** Ejemplo de las plantillas; las cifras son ilustrativas, no tarifas de mercado. */
export function applyCostTemplate(s: ProjectState): ProjectState {
  return {
    ...s, estimationMode: 'tasks', tasks: costTemplateTasks(), selectedTechs: [], urgency: 'normal',
    rate: { ...s.rate, taxRate: 0 },
    costItems: [{ id: 'template-vps', name: 'Hosting y licencias (VPS)', amount: 250, currency: s.currency.base, recurrence: 'once' }],
    pricing: { ...s.pricing, contingencyPct: 0, rounding: 0, selectedScenario: 'recommended' },
    taskPricing: { ...DEFAULT_TASK_PRICING, managementMode: 'fixed', managementFixed: 300 },
  };
}
