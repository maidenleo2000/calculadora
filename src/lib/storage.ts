import type { ProjectState } from '../types';
import { createExampleState } from '../data/defaults';

const CURRENT_KEY = 'calc-presupuestos:current';
const SAVED_KEY = 'calc-presupuestos:saved';

export interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  state: ProjectState;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible (modo privado, cuota llena) */
  }
}

/** Completa campos faltantes con los valores por defecto (estados guardados de versiones previas). */
export function normalize(input: unknown): ProjectState | null {
  if (!input || typeof input !== 'object' || (input as ProjectState).version !== 1) return null;
  const d = createExampleState();
  const s = input as ProjectState;
  return {
    ...d,
    ...s,
    estimationMode: s.estimationMode === 'tasks' ? 'tasks' : 'automatic',
    tasks: Array.isArray(s.tasks) ? s.tasks : [],
    taskPricing: { ...d.taskPricing, ...s.taskPricing },
    saas: { ...d.saas, ...s.saas, plans: Array.isArray(s.saas?.plans) ? s.saas.plans : d.saas.plans },
    scope: { ...d.scope, ...s.scope },
    baseHours: { ...d.baseHours, ...s.baseHours },
    manualAdjust: { ...d.manualAdjust, ...s.manualAdjust },
    rate: { ...d.rate, ...s.rate },
    pricing: { ...d.pricing, ...s.pricing },
    currency: { ...d.currency, ...s.currency },
    params: { ...d.params, ...s.params },
    quote: {
      ...d.quote,
      ...s.quote,
      // Reemplaza los datos genéricos de versiones anteriores por los de la marca.
      ...(s.quote?.providerName === 'Tu nombre o estudio' && { providerName: d.quote.providerName }),
      ...(s.quote?.providerContact === 'hola@tuestudio.com' && { providerContact: d.quote.providerContact }),
    },
    technologies: Array.isArray(s.technologies) ? s.technologies : d.technologies,
    costItems: Array.isArray(s.costItems) ? s.costItems : d.costItems,
    selectedTechs: Array.isArray(s.selectedTechs) ? s.selectedTechs : d.selectedTechs,
  };
}

export const loadCurrent = () => normalize(read(CURRENT_KEY));
export const saveCurrent = (s: ProjectState) => write(CURRENT_KEY, s);

export const listSaved = (): SavedProject[] => read<SavedProject[]>(SAVED_KEY) ?? [];

export function saveProject(name: string, state: ProjectState): SavedProject[] {
  const list = listSaved();
  const existing = list.find((p) => p.name === name);
  const entry: SavedProject = { id: existing?.id ?? crypto.randomUUID(), name, savedAt: new Date().toISOString(), state };
  const next = existing ? list.map((p) => (p.id === existing.id ? entry : p)) : [entry, ...list];
  write(SAVED_KEY, next);
  return next;
}

export function deleteProject(id: string): SavedProject[] {
  const next = listSaved().filter((p) => p.id !== id);
  write(SAVED_KEY, next);
  return next;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
