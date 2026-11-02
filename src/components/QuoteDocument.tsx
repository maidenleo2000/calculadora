import logo from '../assets/logo-nexo.png';
import type { CalcResult } from '../lib/calc';
import { splitPayment } from '../lib/calc';
import { formatNumber, useMoney } from '../lib/money';
import { PROJECT_TYPES } from '../data/catalog';
import type { ProjectState } from '../types';

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

function fmtDate(iso: string, addDays = 0) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + addDays);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Documento para el cliente. Se usa en la vista previa y al imprimir/exportar a PDF. */
export function QuoteDocument({ state, result }: { state: ProjectState; result: CalcResult }) {
  const money = useMoney();
  const q = state.quote;
  const sc = result.selected;
  const payment = splitPayment(money.toDisplay(sc.price), q.depositPct);
  const weeks = q.deliveryWeeks > 0 ? q.deliveryWeeks : result.suggestedWeeks;
  const techs = state.technologies.filter((t) => state.selectedTechs.includes(t.id));
  const type = PROJECT_TYPES.find((p) => p.id === state.projectType);
  const visiblePhases = result.phases.filter((p) => p.total > 0);
  const taskMode = state.estimationMode === 'tasks';
  const taxFactor = 1 / (1 - Math.min(90, Math.max(0, state.rate.taxRate)) / 100);
  const fixedManagement = taskMode && state.taskPricing.managementMode === 'fixed';
  const thirdPartyMarkup = !fixedManagement && state.pricing.marginOnDirectCosts ? sc.direct * sc.marginPct / 100 : 0;
  const management = (sc.margin - thirdPartyMarkup) * taxFactor;
  const serviceRounding = sc.client.services - (sc.labor + sc.contingency) * taxFactor - management;

  return (
    <article className="theme-light mx-auto max-w-[800px] bg-white p-10 text-[13px] leading-relaxed text-slate-800 print:p-0">
      <header className="flex items-start justify-between border-b-2 border-indigo-600 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Presupuesto</div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{q.projectName || 'Proyecto'}</h1>
          <div className="mt-1 text-slate-500">{type?.name}</div>
        </div>
        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-semibold text-slate-900">{q.providerName}</div>
              <div className="text-slate-500">{q.providerContact}</div>
              {q.providerAddress && <div className="text-xs text-slate-500">{q.providerAddress}</div>}
              {q.providerTaxId && <div className="text-xs text-slate-500">CUIT / ID: {q.providerTaxId}</div>}
            </div>
            <img src={logo} alt="" className="h-14 w-14" />
          </div>
          <div className="mt-2 text-xs text-slate-500">N.º {q.quoteNumber}</div>
          <div className="text-xs text-slate-500">Emitido: {fmtDate(q.issueDate)}</div>
          <div className="text-xs text-slate-500">Válido hasta: {fmtDate(q.issueDate, q.validityDays)}</div>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</h2>
          <div className="mt-1 font-medium text-slate-900">{q.clientName}</div>
          <div>{q.clientCompany}</div>
          <div className="text-slate-500">{q.clientEmail}</div>
          {q.clientAddress && <div>{q.clientAddress}</div>}
          {q.clientTaxId && <div>CUIT / ID: {q.clientTaxId}</div>}
          {q.clientPhone && <div>Tel.: {q.clientPhone}</div>}
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plazo estimado</h2>
          <div className="mt-1 font-medium text-slate-900">{weeks} semanas</div>
          {techs.length > 0 && (
            <>
              <h2 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tecnologías</h2>
              <div className="mt-1">{techs.map((t) => t.name).join(' · ')}</div>
            </>
          )}
        </div>
      </section>

      {q.description && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Descripción</h2>
          <p className="mt-1 whitespace-pre-line">{q.description}</p>
        </section>
      )}

      {q.showHours && !taskMode && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Etapas de trabajo</h2>
          <table className="w-full">
            <tbody>
              {visiblePhases.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-1.5">{p.label}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-600">{formatNumber(p.total)} h</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-1.5">Total estimado</td>
                <td className="py-1.5 text-right tabular-nums">{formatNumber(result.totalHours)} h</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-5 break-inside-avoid rounded-lg bg-slate-50 p-5 print:border print:border-slate-200">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Inversión</h2>
        <table className="w-full">
          {taskMode && <thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 font-medium">Descripción</th>
            {q.showHours && <><th className="px-2 py-2 text-right font-medium">Horas</th><th className="px-2 py-2 text-right font-medium">Precio/h</th></>}
            <th className="py-2 text-right font-medium">Total</th>
          </tr></thead>}
          <tbody>
            {taskMode ? <>
              {visiblePhases.map((p) => <tr key={p.id}>
                <td className="py-1">{p.label}{p.id === 'analysis' && state.taskPricing.riskHours > 0 ? ' (incluye reserva por riesgos)' : ''}</td>
                {q.showHours && <><td className="px-2 text-right tabular-nums">{formatNumber(p.total, 2)}</td><td className="px-2 text-right tabular-nums">{money.fmt(p.total > 0 ? p.labor * taxFactor / p.total : 0, 2)}</td></>}
                <td className="text-right tabular-nums">{money.fmt(p.labor * taxFactor, 2)}</td>
              </tr>)}
              {sc.contingency > 0 && <tr><td className="py-1" colSpan={q.showHours ? 3 : 1}>Reserva para imprevistos</td><td className="text-right tabular-nums">{money.fmt(sc.contingency * taxFactor, 2)}</td></tr>}
              {management > 0 && <tr><td className="py-1" colSpan={q.showHours ? 3 : 1}>Costos de gestión</td><td className="text-right tabular-nums">{money.fmt(management, 2)}</td></tr>}
              {serviceRounding > 0.005 && <tr><td className="py-1" colSpan={q.showHours ? 3 : 1}>Ajuste comercial por redondeo</td><td className="text-right tabular-nums">{money.fmt(serviceRounding, 2)}</td></tr>}
            </> :
            <tr>
              <td className="py-1">Desarrollo y servicios profesionales</td>
              <td className="py-1 text-right tabular-nums">{money.fmt(sc.client.services, 2)}</td>
            </tr>}
            {sc.client.thirdParty > 0.005 && (
              <tr>
                <td className="py-1" colSpan={taskMode && q.showHours ? 3 : 1}>
                  Infraestructura, licencias y servicios de terceros
                  {state.pricing.infraMonths > 0 && result.direct.recurringMonthly > 0 && (
                    <span className="text-slate-500"> (incluye {state.pricing.infraMonths} meses)</span>
                  )}
                </td>
                <td className="py-1 text-right tabular-nums">{money.fmt(sc.client.thirdParty, 2)}</td>
              </tr>
            )}
            {sc.client.urgency > 0.005 && (
              <tr>
                <td className="py-1" colSpan={taskMode && q.showHours ? 3 : 1}>Recargo por entrega prioritaria</td>
                <td className="py-1 text-right tabular-nums">{money.fmt(sc.client.urgency, 2)}</td>
              </tr>
            )}
            <tr className="border-t border-slate-200">
              <td className="pt-2" colSpan={taskMode && q.showHours ? 3 : 1}>Subtotal</td>
              <td className="pt-2 text-right tabular-nums">{money.fmt(sc.client.services + sc.client.thirdParty + sc.client.urgency, 2)}</td>
            </tr>
            {sc.discount > 0 && <tr><td className="py-1" colSpan={taskMode && q.showHours ? 3 : 1}>Descuento ({state.taskPricing.discountPct}%)</td><td className="text-right tabular-nums">−{money.fmt(sc.discount, 2)}</td></tr>}
            {sc.vat > 0 && <tr><td className="py-1" colSpan={taskMode && q.showHours ? 3 : 1}>IVA ({state.taskPricing.vatPct}%)</td><td className="text-right tabular-nums">{money.fmt(sc.vat, 2)}</td></tr>}
            <tr className="border-t-2 border-slate-300 text-base font-bold text-slate-900">
              <td className="pt-2" colSpan={taskMode && q.showHours ? 3 : 1}>Total</td>
              <td className="pt-2 text-right tabular-nums">{money.fmt(sc.price, 2)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 grid grid-cols-2 gap-3 text-slate-600">
          <div>Anticipo ({q.depositPct}%): <span className="font-medium text-slate-900">{money.raw(payment.deposit, money.currency, 2)}</span></div>
          <div>Saldo contra entrega: <span className="font-medium text-slate-900">{money.raw(payment.balance, money.currency, 2)}</span></div>
        </div>
        {q.showMaintenance && result.maintenanceMonthly > 0 && (
          <div className="mt-3 border-t border-slate-200 pt-3 text-slate-600">
            Plan de mantenimiento opcional: <span className="font-medium text-slate-900">{money.fmt(result.maintenanceMonthly, 2)} / mes{state.taskPricing.vatPct > 0 ? ' antes de IVA' : ''}</span>
            {' '}({formatNumber(state.pricing.maintenanceHoursPerMonth)} h mensuales{result.direct.recurringMonthly > 0 ? ' + infraestructura' : ''}).
          </div>
        )}
        <div className="mt-2 text-xs text-slate-500">Importes expresados en {money.currency}.</div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-6 break-inside-avoid">
        {lines(q.includes).length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Incluye</h2>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">{lines(q.includes).map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        )}
        {lines(q.excludes).length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">No incluye</h2>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">{lines(q.excludes).map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        )}
      </section>

      {q.notes && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condiciones</h2>
          <p className="mt-1 whitespace-pre-line text-slate-600">{q.notes}</p>
        </section>
      )}

      <section className="mt-10 grid grid-cols-2 gap-10 break-inside-avoid text-center text-xs text-slate-500">
        <div className="border-t border-slate-300 pt-2">Firma del proveedor</div>
        <div className="border-t border-slate-300 pt-2">Firma del cliente / conformidad</div>
      </section>

      <footer className="mt-10 flex justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
        <span>{q.providerName}</span>
        <span>Presupuesto {q.quoteNumber}</span>
      </footer>
    </article>
  );
}
