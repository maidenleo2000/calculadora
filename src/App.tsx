import { Clock, Cpu, FileText, FolderOpen, LayoutGrid, ListChecks, Printer, RotateCcw, Server, Sparkles, TrendingUp, Wallet } from 'lucide-react';
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
import { Button, Segmented, Stat, cx } from './components/ui';
import { PROJECT_TYPES } from './data/catalog';
import { createBlankState, createExampleState } from './data/defaults';
import { calculate } from './lib/calc';
import { MoneyContext, formatNumber, makeMoney } from './lib/money';
import { loadCurrent, saveCurrent } from './lib/storage';
import type { Currency, ProjectState, ScenarioId, Updater } from './types';

type TabId = 'project' | 'scope' | 'tech' | 'hours' | 'rate' | 'costs' | 'quote';

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'project', label: 'Proyecto', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'scope', label: 'Alcance', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'tech', label: 'Tecnologías', icon: <Cpu className="h-4 w-4" /> },
  { id: 'hours', label: 'Horas', icon: <Clock className="h-4 w-4" /> },
  { id: 'rate', label: 'Tarifa y moneda', icon: <Wallet className="h-4 w-4" /> },
  { id: 'costs', label: 'Costos y margen', icon: <Server className="h-4 w-4" /> },
  { id: 'quote', label: 'Presupuesto', icon: <FileText className="h-4 w-4" /> },
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
  const typeName = PROJECT_TYPES.find((p) => p.id === state.projectType)?.name;

  const props = { state, set, result };

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
                <p className="text-xs text-slate-500">{state.quote.projectName || 'Proyecto sin nombre'} · {typeName}</p>
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
              <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={() => setModal('quote')}>Presupuesto PDF</Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Horas totales" icon={<Clock className="h-3.5 w-3.5" />} value={`${formatNumber(result.totalHours)} h`} sub={`~${result.suggestedWeeks} semanas de trabajo`} />
            <Stat label="Tarifa recomendada" icon={<Wallet className="h-3.5 w-3.5" />} value={`${money.fmt(result.rates.recommendedBilled, 2)}`}
              sub={`por hora · mínima ${money.fmt(result.rates.minimumBilled, 2)}`} />
            <Stat label="Costo total" icon={<Server className="h-3.5 w-3.5" />} value={money.fmt(sc.totalCost)} sub="Desarrollo + imprevistos + terceros" />
            <Stat tone="indigo" label={`Precio ${sc.label.toLowerCase()}`} icon={<TrendingUp className="h-3.5 w-3.5" />} value={money.fmt(sc.price)}
              sub={`Ganancia ${money.fmt(sc.profit)} (${formatNumber(sc.marginOnPrice * 100, 1)}%)`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Secciones">
                <div className="inline-flex min-w-full gap-1 rounded-2xl border border-slate-200 bg-surface p-1 shadow-sm xl:flex xl:flex-wrap">
                  {TABS.map((t, i) => (
                    <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                      className={cx(
                        'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition',
                        tab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
                      )}>
                      <span className={cx('text-xs', tab === t.id ? 'text-indigo-200' : 'text-slate-400')}>{i + 1}</span>
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </nav>

              {tab === 'project' && <ProjectSection state={state} set={set} />}
              {tab === 'scope' && <ScopeSection state={state} set={set} />}
              {tab === 'tech' && <TechSection state={state} set={set} />}
              {tab === 'hours' && <HoursSection {...props} />}
              {tab === 'rate' && <RateSection {...props} />}
              {tab === 'costs' && <CostsSection {...props} />}
              {tab === 'quote' && <QuoteSection {...props} onPreview={() => setModal('quote')} />}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setTab(TABS[Math.max(0, TABS.findIndex((t) => t.id === tab) - 1)].id)}>← Anterior</Button>
                <Button variant="secondary" onClick={() => setTab(TABS[Math.min(TABS.length - 1, TABS.findIndex((t) => t.id === tab) + 1)].id)}>Siguiente →</Button>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <Summary {...props} />
            </div>
          </div>

          <Analytics result={result} selected={state.pricing.selectedScenario} onSelect={selectScenario} />

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
