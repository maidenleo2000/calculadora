import { Eye, FileText, Printer } from 'lucide-react';
import type { CalcResult } from '../../lib/calc';
import type { ProjectState, QuoteInfo, Updater } from '../../types';
import { Button, Card, NumberField, TextArea, TextField, Toggle } from '../ui';

export function QuoteSection({ state, set, result, onPreview }: { state: ProjectState; set: Updater; result: CalcResult; onPreview: () => void }) {
  const q = state.quote;
  const setQ = (patch: Partial<QuoteInfo>) => set((s) => ({ ...s, quote: { ...s.quote, ...patch } }));

  return (
    <Card
      title="Presupuesto para el cliente"
      icon={<FileText className="h-4 w-4" />}
      subtitle="Datos que aparecen en el documento exportable. El PDF muestra el precio del escenario seleccionado."
      actions={
        <div className="flex gap-2">
          <Button icon={<Eye className="h-4 w-4" />} onClick={onPreview}>Vista previa</Button>
          <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Exportar PDF</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Tu nombre / estudio" value={q.providerName} onChange={(v) => setQ({ providerName: v })} />
        <TextField label="Tu contacto" value={q.providerContact} onChange={(v) => setQ({ providerContact: v })} />
        <TextField label="Tu dirección" value={q.providerAddress} onChange={(v) => setQ({ providerAddress: v })} />
        <TextField label="Tu CUIT / identificación fiscal" value={q.providerTaxId} onChange={(v) => setQ({ providerTaxId: v })} />
        <TextField label="Cliente" value={q.clientName} onChange={(v) => setQ({ clientName: v })} />
        <TextField label="Empresa" value={q.clientCompany} onChange={(v) => setQ({ clientCompany: v })} />
        <TextField label="Dirección del cliente" value={q.clientAddress} onChange={(v) => setQ({ clientAddress: v })} />
        <TextField label="CUIT / identificación fiscal del cliente" value={q.clientTaxId} onChange={(v) => setQ({ clientTaxId: v })} />
        <TextField label="Teléfono del cliente" value={q.clientPhone} onChange={(v) => setQ({ clientPhone: v })} />
        <TextField label="Email del cliente" type="email" value={q.clientEmail} onChange={(v) => setQ({ clientEmail: v })} />
        <TextField label="Nombre del proyecto" value={q.projectName} onChange={(v) => setQ({ projectName: v })} />
        <TextArea className="sm:col-span-2" label="Descripción" value={q.description} onChange={(v) => setQ({ description: v })} />
        <TextField label="N.º de presupuesto" value={q.quoteNumber} onChange={(v) => setQ({ quoteNumber: v })} />
        <TextField label="Fecha de emisión" type="date" value={q.issueDate} onChange={(v) => setQ({ issueDate: v })} />
        <NumberField label="Validez" suffix="días" value={q.validityDays} min={1} max={365} onChange={(v) => setQ({ validityDays: v })} />
        <NumberField label="Anticipo" suffix="%" value={q.depositPct} max={100} onChange={(v) => setQ({ depositPct: v })} />
        <NumberField label="Descuento comercial" suffix="%" value={state.taskPricing.discountPct} max={100}
          hint="Se resta del subtotal antes del IVA. Reduce la ganancia prevista."
          onChange={(discountPct) => set((s) => ({ ...s, taskPricing: { ...s.taskPricing, discountPct } }))} />
        <NumberField label="IVA a agregar al presupuesto" suffix="%" value={state.taskPricing.vatPct} max={100}
          hint="Se aplica al subtotal con descuento. Es independiente de los impuestos internos de Tarifa y moneda. Dejá en 0 si no corresponde."
          onChange={(vatPct) => set((s) => ({ ...s, taskPricing: { ...s.taskPricing, vatPct } }))} />
        <NumberField label="Plazo de entrega" suffix="sem." value={q.deliveryWeeks} max={520}
          hint={`0 = usar el plazo estimado (${result.suggestedWeeks} semanas)`} onChange={(v) => setQ({ deliveryWeeks: v })} />
        <div className="flex flex-col justify-end gap-3 pb-1">
          <Toggle checked={q.showHours} onChange={(v) => setQ({ showHours: v })} label="Mostrar horas por etapa" />
          <Toggle checked={q.showMaintenance} onChange={(v) => setQ({ showMaintenance: v })} label="Ofrecer plan de mantenimiento" />
        </div>
        <TextArea label="Incluye (una línea por ítem)" rows={4} value={q.includes} onChange={(v) => setQ({ includes: v })} />
        <TextArea label="No incluye (una línea por ítem)" rows={4} value={q.excludes} onChange={(v) => setQ({ excludes: v })} />
        <TextArea className="sm:col-span-2" label="Notas y condiciones" value={q.notes} onChange={(v) => setQ({ notes: v })} />
      </div>
    </Card>
  );
}
