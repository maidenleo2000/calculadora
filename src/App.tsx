import { CircleHelp, Clock, Cpu, FileText, FolderOpen, LayoutGrid, ListChecks, Printer, RotateCcw, Server, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import logo from './assets/logo-nexo.png';
import { Analytics } from './components/Charts';
import { InstallButton } from './components/InstallButton';
import { ThemeToggle } from './components/ThemeToggle';
import { Modal } from './components/Modal';
import { QuoteDocument } from './components/QuoteDocument';
import { SavedProjects } from './components/SavedProjects';
import { Summary } from './components/Summary';
import { CostsSection } from './components/sections/CostsSection';
import { HoursSection } from './components/sections/HoursSection';
import { ProjectSection } from './components/sections/ProjectSection';
import { QuoteSection } from './components/sections/QuoteSection';
import { RateSection } from './components/sections/RateSection';
import { ScopeSection } from './components/sections/ScopeSection';
import { TechSection } from './components/sections/TechSection';
import { TasksSection } from './components/sections/TasksSection';
import { SaaSSection } from './components/sections/SaaSSection';
import { HelpSection } from './components/sections/HelpSection';
import { Button, Segmented, Stat, cx } from './components/ui';
import { createBlankState, createExampleState } from './data/defaults';
import { calculate } from './lib/calc';
import { MoneyContext, formatNumber, makeMoney } from './lib/money';
import { loadCurrent, saveCurrent } from './lib/storage';
import type { Currency, ProjectState, ScenarioId, Updater } from './types';

type TabId = 'project' | 'scope' | 'tech' | 'tasks' | 'hours' | 'rate' | 'costs' | 'quote' | 'saas' | 'help';

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'project', label: 'Proyecto', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'scope', label: 'Alcance', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'tech', label: 'Tecnologías', icon: <Cpu className="h-4 w-4" /> },
  { id: 'tasks', label: 'Tareas y estimación', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'hours', label: 'Horas', icon: <Clock className="h-4 w-4" /> },
  { id: 'rate', label: 'Tarifa y moneda', icon: <Wallet className="h-4 w-4" /> },
  { id: 'costs', label: 'Costos y margen', icon: <Server className="h-4 w-4" /> },
  { id: 'quote', label: 'Presupuesto', icon: <FileText className="h-4 w-4" /> },
  { id: 'saas', label: 'Abonos SaaS', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'help', label: 'Ayuda', icon: <CircleHelp className="h-4 w-4" /> },
];

export default function App() {
  const [state, setState] = useState<ProjectState>(() => loadCurrent() ?? createExampleState());
  const [tab, setTab] = useState<TabId>('project');
  const [modal, setModal] = useState<'quote' | 'projects' | null>(null);

  useEffect(() => {
    const id = setTimeout(() => saveCurrent(state), 300);
    return () => clearTimeout(id);
  }, [state]);

  const set: Updater = useCallback((fn) => setState(fn), []);
  const result = useMemo(() => calculate(state), [state]);
  const money = useMemo(() => makeMoney(state.currency), [state.currency]);
  const hasRate = !!state.currency.arsPerUsd;
  const selectScenario = (id: ScenarioId) => set((s) => ({ ...s, pricing: { ...s.pricing, selectedScenario: id } }));
  const sc = result.selected;

  const props = { state, set, result };
  const showProjectSummary = tab !== 'saas' && tab !== 'help';

  return (
    <MoneyContext.Provider value={money}>
      <div className="min-h-screen print:hidden">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="LS Nexo Digital" className="h-11 w-11 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600">LS Nexo Digital</div>
                <h1 className="text-base font-bold leading-tight text-slate-900">Calculadora de presupuestos</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<Currency>
                size="sm"
                value={money.currency}
                onChange={(display) => set((s) => ({ ...s, currency: { ...s.currency, display } }))}
                options={(['USD', 'ARS'] as Currency[]).map((c) => ({
                  value: c,
                  label: c,
                  disabled: !hasRate && c !== state.currency.base,
                  hint: !hasRate && c !== state.currency.base ? 'Cargá la cotización en Tarifa y moneda' : undefined,
                }))}
              />
              <Button variant="ghost" icon={<Sparkles className="h-4 w-4" />}
                onClick={() => confirm('¿Cargar el ejemplo? Se reemplaza el proyecto actual (guardalo antes si lo necesitás).') && setState(createExampleState())}>
                Ejemplo
              </Button>
              <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => confirm('¿Empezar un proyecto nuevo? Se reemplaza el actual.') && setState(createBlankState())}>
                Nuevo
              </Button>
              <Button icon={<FolderOpen className="h-4 w-4" />} onClick={() => setModal('projects')}>Proyectos</Button>
              <InstallButton />
              <ThemeToggle />
              <Button icon={<CircleHelp className="h-4 w-4" />} onClick={() => setTab('help')}>Ayuda</Button>
              <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={() => setModal('quote')}>Presupuesto PDF</Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Cotizá con las plantillas TodoCode</div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">De las tareas al precio de tu trabajo</h2>
            <p className="mt-1 text-sm text-slate-600">Estimá el tiempo, definí el costo de cada tarea y sumá tu ganancia. Para un producto por suscripción, calculá el abono por cliente.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => setTab('tasks')}>1. Estimar tareas</Button>
              <Button onClick={() => setTab('costs')}>2. Costos y ganancia</Button>
              <Button onClick={() => setTab('quote')}>3. Preparar presupuesto</Button>
              <Button onClick={() => setTab('saas')}>Calcular abonos SaaS</Button>
            </div>
            <p className="mt-3 text-xs text-indigo-700">Modo de proyecto activo: {state.estimationMode === 'tasks' ? 'por tareas · tarifas por tarea y horas de riesgo' : 'por alcance · horas base, tecnologías y factores'}.</p>
          </section>
          {showProjectSummary && <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Horas totales" icon={<Clock className="h-3.5 w-3.5" />} value={`${formatNumber(result.totalHours)} h`} sub={`~${result.suggestedWeeks} semanas de trabajo`} />
            <Stat label={state.taskPricing.useUniformRate ? 'Tarifa única por hora' : 'Tarifa recomendada'} icon={<Wallet className="h-3.5 w-3.5" />} value={money.fmt(state.taskPricing.useUniformRate ? result.rates.costRate : result.rates.recommendedBilled, 2)}
              sub={state.taskPricing.useUniformRate ? 'Para todas las horas · antes de ganancia e impuestos' : `por hora · mínima ${money.fmt(result.rates.minimumBilled, 2)}`} />
            <Stat label="Costo total" icon={<Server className="h-3.5 w-3.5" />} value={money.fmt(sc.totalCost)} sub="Desarrollo + imprevistos + terceros" />
            <Stat tone="indigo" label={`Precio ${sc.label.toLowerCase()}`} icon={<TrendingUp className="h-3.5 w-3.5" />} value={money.fmt(sc.price, 2)}
              sub={`Ganancia ${money.fmt(sc.profit)} (${formatNumber(sc.marginOnPrice * 100, 1)}%)`} />
          </div>}

          <div className={cx('grid gap-6', showProjectSummary && 'lg:grid-cols-[minmax(0,1fr)_360px]')}>
            <div className="min-w-0 space-y-5">
              <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Secciones">
                <div className="inline-flex min-w-full gap-1 rounded-2xl border border-slate-200 bg-surface p-1 shadow-sm xl:flex xl:flex-wrap">
                  {TABS.map((t, i) => (
                    <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                      className={cx(
                        'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition',
                        tab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
                      )}>
                      {t.id !== 'help' && <span className={cx('text-xs', tab === t.id ? 'text-indigo-200' : 'text-slate-400')}>{i + 1}</span>}
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </nav>

              {tab === 'project' && <ProjectSection state={state} set={set} />}
              {tab === 'scope' && <ScopeSection state={state} set={set} />}
              {tab === 'tech' && <TechSection state={state} set={set} />}
              {tab === 'tasks' && <TasksSection {...props} />}
              {tab === 'hours' && <HoursSection {...props} />}
              {tab === 'rate' && <RateSection {...props} />}
              {tab === 'costs' && <CostsSection {...props} />}
              {tab === 'quote' && <QuoteSection {...props} onPreview={() => setModal('quote')} />}
              {tab === 'saas' && <SaaSSection {...props} />}
              {tab === 'help' && <HelpSection mode={state.estimationMode} onNavigate={setTab} />}

              {tab !== 'help' && <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setTab(TABS[Math.max(0, TABS.findIndex((t) => t.id === tab) - 1)].id)}>← Anterior</Button>
                <Button variant="secondary" onClick={() => setTab(TABS[Math.min(TABS.length - 1, TABS.findIndex((t) => t.id === tab) + 1)].id)}>Siguiente →</Button>
              </div>}
            </div>

            {showProjectSummary && <div className="lg:sticky lg:top-24 lg:self-start">
              <Summary {...props} />
            </div>}
          </div>

          {showProjectSummary && <Analytics result={result} selected={state.pricing.selectedScenario} onSelect={selectScenario} />}

          <footer className="pb-4 text-center text-xs text-slate-400">
            Los datos se guardan automáticamente en este navegador. Los valores de ejemplo son ilustrativos: ajustalos a tu realidad.
          </footer>
        </main>

        {modal === 'quote' && (
          <Modal wide title="Vista previa del presupuesto" onClose={() => setModal(null)}
            actions={<Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Exportar PDF</Button>}>
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <QuoteDocument state={state} result={result} />
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">En el diálogo de impresión elegí “Guardar como PDF”.</p>
          </Modal>
        )}
        {modal === 'projects' && (
          <Modal title="Proyectos" onClose={() => setModal(null)}>
            <SavedProjects state={state} onLoad={(s) => { setState(s); setModal(null); }} />
          </Modal>
        )}
      </div>

      <div className="hidden print:block">
        <QuoteDocument state={state} result={result} />
      </div>
    </MoneyContext.Provider>
  );
}
