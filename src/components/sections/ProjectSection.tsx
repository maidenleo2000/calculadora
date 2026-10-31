import { Bot, Building2, Cable, Gauge, LayoutDashboard, Monitor, Palette, ShoppingCart, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { COMPLEXITY_LABELS, CUSTOMIZATION_LABELS, PROJECT_TYPES, URGENCY_LABELS } from '../../data/catalog';
import { applyProjectType } from '../../data/defaults';
import type { ComplexityId, CustomizationId, ProjectState, ProjectTypeId, Updater, UrgencyId } from '../../types';
import { Card, OptionCards, cx } from '../ui';

const ICONS: Record<ProjectTypeId, ReactNode> = {
  ai: <Bot className="h-5 w-5" />,
  ecommerce: <ShoppingCart className="h-5 w-5" />,
  corporate: <Building2 className="h-5 w-5" />,
  saas: <LayoutDashboard className="h-5 w-5" />,
  desktop: <Monitor className="h-5 w-5" />,
  api: <Cable className="h-5 w-5" />,
};

const keys = <T extends string>(o: Record<T, unknown>) => Object.keys(o) as T[];

export function ProjectSection({ state, set }: { state: ProjectState; set: Updater }) {
  const p = state.params;
  return (
    <div className="space-y-5">
      <Card title="Tipo de proyecto" subtitle="Al elegir un tipo se cargan horas base, alcance y tecnologías sugeridas. Todo es editable después.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PROJECT_TYPES.map((t) => {
            const active = state.projectType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => !active && set((s) => applyProjectType(s, t.id))}
                aria-pressed={active}
                className={cx(
                  'flex items-start gap-3 rounded-xl border p-4 text-left transition',
                  active ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span className={cx('rounded-lg p-2', active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600')}>{ICONS[t.id]}</span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{t.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Complejidad" icon={<Gauge className="h-4 w-4" />} subtitle="Factor de esfuerzo aplicado a todas las etapas. Editá los factores en Alcance → Parámetros.">
        <OptionCards<ComplexityId>
          value={state.complexity}
          onChange={(v) => set((s) => ({ ...s, complexity: v }))}
          options={keys(COMPLEXITY_LABELS).map((k) => ({ value: k, ...COMPLEXITY_LABELS[k], extra: `×${p.complexity[k]}` }))}
        />
      </Card>

      <Card title="Nivel de personalización" icon={<Palette className="h-4 w-4" />} subtitle="Afecta sólo las horas de Diseño UX/UI y Frontend.">
        <OptionCards<CustomizationId>
          value={state.customization}
          onChange={(v) => set((s) => ({ ...s, customization: v }))}
          options={keys(CUSTOMIZATION_LABELS).map((k) => ({ value: k, ...CUSTOMIZATION_LABELS[k], extra: `×${p.customization[k]}` }))}
        />
      </Card>

      <Card title="Urgencia" icon={<Timer className="h-4 w-4" />} subtitle="Es un recargo sobre los servicios (no un costo): no se aplica a costos de terceros.">
        <OptionCards<UrgencyId>
          columns="sm:grid-cols-3"
          value={state.urgency}
          onChange={(v) => set((s) => ({ ...s, urgency: v }))}
          options={keys(URGENCY_LABELS).map((k) => ({ value: k, ...URGENCY_LABELS[k], extra: `+${p.urgency[k]}%` }))}
        />
      </Card>
    </div>
  );
}
