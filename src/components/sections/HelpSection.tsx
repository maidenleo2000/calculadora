import { BookOpen, CircleHelp } from 'lucide-react';
import { Button, Card } from '../ui';

type Destination = 'project' | 'scope' | 'tasks' | 'rate' | 'costs' | 'quote' | 'saas';

const steps: { title: string; description: string; destination: Destination; action: string }[] = [
  { title: '1. Definí el trabajo', description: 'En Proyecto, completá el nombre y el tipo de trabajo. Definí qué vas a entregar, qué queda afuera y cuántas revisiones incluís. Esos límites te ayudan a presupuestar el mismo alcance que acordás con tu cliente.', destination: 'project', action: 'Ir a Proyecto' },
  { title: '2. Calculá el valor de tu hora', description: 'En Tarifa y moneda, elegí tu moneda base. Podés calcular la tarifa desde tu ingreso mensual deseado, gastos y horas facturables, o ingresar un valor manual. Para usar un mismo valor en todas las tareas y horas de riesgo, activá Aplicar la misma tarifa a todas las horas del proyecto y completá Tarifa única por hora. Si mezclás pesos y dólares, cargá una cotización. La tarifa base es el costo de tu hora, antes de sumar ganancia e impuestos.', destination: 'rate', action: 'Definir mi tarifa' },
  { title: '3. Estimá las tareas', description: 'En Tareas y estimación, activá Por tareas (TodoCode). Agregá cada tarea, su etapa y sus horas. Usá horas directas si ya conocés el tiempo, o tres tiempos PERT si tenés incertidumbre. Con la tarifa única activada, todas las tareas usan ese valor. Si la desactivás, cada tarea usa su tarifa propia si la tiene, o la tarifa base. Las tarifas individuales quedan guardadas cuando usás la tarifa única.', destination: 'tasks', action: 'Estimar mis tareas' },
  { title: '4. Sumá costos y ganancia', description: 'En Costos y margen, agregá hosting, licencias, APIs u otros gastos del proyecto. Indicá cuántos meses de costos recurrentes incluye la entrega. Después definí los imprevistos y la ganancia: un porcentaje sobre costos o un monto fijo de gestión en el modo por tareas.', destination: 'costs', action: 'Revisar costos y ganancia' },
  { title: '5. Revisá cuánto vas a cobrar', description: 'El resumen muestra los costos, la ganancia y el precio final. Elegí Mínimo, Recomendado o Premium: esa elección determina el presupuesto. Revisá los avisos, especialmente si faltan cotizaciones, hay tareas inválidas o un descuento deja el precio por debajo del costo.', destination: 'costs', action: 'Revisar el precio' },
  { title: '6. Prepará y guardá el presupuesto', description: 'En Presupuesto, completá los datos del cliente, la validez, el anticipo, las condiciones y, si corresponde, descuento e IVA. Abrí Vista previa y luego Exportar PDF. En el diálogo del navegador, elegí Guardar como PDF. Usá Proyectos para guardar una versión con nombre o exportarla como archivo JSON.', destination: 'quote', action: 'Preparar el presupuesto' },
];

const questions = [
  { title: '¿Puedo aplicar el mismo valor por hora a todo el proyecto?', answer: 'Sí. En Tareas y estimación o en Tarifa y moneda, activá Aplicar la misma tarifa a todas las horas del proyecto y completá Tarifa única por hora. Ese valor se aplica a todas las tareas y a las horas de riesgo, incluso si tenían una tarifa propia. Las tarifas individuales se conservan y vuelven a usarse cuando desactivás la opción. El valor es la tarifa base antes de ganancia e impuestos. El soporte y los extras SaaS siguen usando sus propios valores.' },
  { title: '¿Qué diferencia hay entre costo, ganancia y precio?', answer: 'El costo reúne tu trabajo, la reserva para imprevistos y los gastos de terceros. La ganancia es lo que agregás sobre esos costos. El precio es lo que cobrás al cliente después de aplicar también urgencia, impuestos, descuento, IVA y redondeo, según tu configuración.' },
  { title: '¿Cómo funciona la estimación PERT?', answer: 'Para cada tarea cargás un tiempo optimista, uno probable y uno pesimista. La cuenta es (optimista + 4 × probable + pesimista) ÷ 6. Por ejemplo, 1, 2 y 3 horas dan 2 horas esperadas. Los tiempos deben cumplir optimista ≤ probable ≤ pesimista; una tarea inválida queda fuera del total hasta que la corrijas. Las consideraciones y dependencias son notas: no organizan automáticamente el calendario.' },
  { title: '¿Se suman las horas por alcance y las horas por tareas?', answer: 'Se usa un modo a la vez. Por alcance calcula horas base más pantallas, funcionalidades, tecnologías y factores. Por tareas usa la lista de tareas y las horas de riesgo. Podés cambiar el modo en Tareas y estimación; los datos del otro modo se conservan. Las licencias y suscripciones de las tecnologías seleccionadas siguen contando como costos de terceros en ambos modos.' },
  { title: '¿Cuándo uso horas de riesgo o reserva para imprevistos?', answer: 'Las horas de riesgo agregan tiempo explícito al modo por tareas y aparecen dentro de Análisis en el resumen. La reserva para imprevistos agrega un porcentaje al costo del desarrollo. Si completás ambas, se cobran ambas: revisá si cubren el mismo riesgo para evitar reservar dos veces por lo mismo.' },
  { title: '¿El margen del 20% significa que gano el 20% del precio?', answer: 'El porcentaje de margen se aplica sobre el costo elegido. Si el costo es 200 y agregás 20%, la ganancia es 40 y el precio antes de impuestos es 240. Esos 40 representan el 16,67% del precio. El resumen muestra la ganancia prevista y su porcentaje sobre el precio final.' },
  { title: '¿Qué cambia entre Mínimo, Recomendado y Premium?', answer: 'Mínimo no agrega margen de ganancia, aunque mantiene imprevistos, urgencia, impuestos y otros ajustes que hayas configurado. Recomendado agrega el margen elegido o la gestión fija. Premium usa el porcentaje premium; si elegiste gestión fija, suma ese fijo más el porcentaje premium. Un descuento puede hacer que incluso el escenario mínimo quede por debajo del costo.' },
  { title: '¿Qué diferencia hay entre impuestos internos e IVA?', answer: 'Los impuestos de Tarifa y moneda se incorporan al precio para cubrir el porcentaje configurado sobre la facturación sin IVA. El IVA de Presupuesto se agrega por separado sobre el importe después del descuento. No cargues el mismo concepto en los dos campos. Podés dejar cualquiera de ellos en cero si no corresponde a tu presupuesto.' },
  { title: '¿Cómo funcionan la moneda base y la moneda de visualización?', answer: 'La moneda base es la que usás para ingresar tarifas, gestión e importes SaaS. La moneda de visualización convierte los resultados con la cotización que cargaste. Cada costo de terceros conserva su moneda propia. Sin una cotización, los costos en otra moneda quedan excluidos del total y se muestra un aviso.' },
  { title: '¿Qué incluye el mantenimiento mensual?', answer: 'El mantenimiento opcional se calcula aparte del precio del proyecto: horas mensuales a tarifa base con margen, más los costos mensuales de terceros y los impuestos internos. No se suma al total de desarrollo. Si el presupuesto lleva IVA, el mantenimiento se muestra antes de IVA. Los abonos SaaS tienen su propio cálculo independiente.' },
  { title: '¿Dónde se guardan mis proyectos?', answer: 'El trabajo actual se guarda automáticamente en este navegador. En Proyectos podés guardar versiones con nombre, abrirlas y exportar o importar archivos JSON. Los datos no se sincronizan entre dispositivos: exportá un JSON para llevarlos a otra computadora o tener una copia. Borrar los datos del navegador puede eliminar los proyectos locales.' },
  { title: '¿Puedo practicar con los ejemplos sin perder mi trabajo?', answer: 'Guardá primero tu trabajo con nombre en Proyectos o exportalo como JSON. Los botones Ejemplo, Nuevo y los ejemplos TodoCode reemplazan datos del proyecto actual y piden confirmación antes de hacerlo. Los valores de ejemplo son ilustrativos: adaptá las horas y los importes a tu trabajo.' },
];

export function HelpSection({ mode, onNavigate }: { mode: 'automatic' | 'tasks'; onNavigate: (destination: Destination) => void }) {
  return <div className="space-y-5">
    <Card title="Ayuda: cómo usar la calculadora" icon={<BookOpen className="h-4 w-4" />}
      subtitle="Seguí esta guía para pasar de las tareas de un trabajo a un presupuesto para tu cliente.">
      <p className="text-sm text-slate-600">Tu proyecto está en modo <strong className="text-slate-900">{mode === 'tasks' ? 'Por tareas (TodoCode)' : 'Por alcance'}</strong>. Para empezar con las plantillas, seguí los pasos de abajo. Los botones te llevan a cada sección y conservan los datos que ya cargaste.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => onNavigate('tasks')}>Empezar por mis tareas</Button>
        <Button onClick={() => onNavigate('saas')}>Quiero calcular un abono SaaS</Button>
      </div>
    </Card>

    <Card title="Paso a paso para cotizar un trabajo">
      <ol className="space-y-5">{steps.map((step) => <li key={step.title} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
        <h3 className="font-semibold text-slate-900">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
        <Button className="mt-3" onClick={() => onNavigate(step.destination)}>{step.action}</Button>
      </li>)}</ol>
    </Card>

    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Ejemplo sencillo de un trabajo" subtitle="Importes ilustrativos, en una misma moneda.">
        <dl className="space-y-3 text-sm text-slate-600">
          <div className="flex justify-between gap-4"><dt>10 horas × 20 por hora</dt><dd className="font-medium text-slate-900">200</dd></div>
          <div className="flex justify-between gap-4"><dt>Ganancia del 20% sobre el desarrollo</dt><dd className="font-medium text-slate-900">+40</dd></div>
          <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 font-semibold text-slate-900"><dt>Precio para el cliente</dt><dd>240</dd></div>
          <div className="flex justify-between gap-4"><dt>Anticipo del 50%</dt><dd>120</dd></div>
          <div className="flex justify-between gap-4"><dt>Saldo contra entrega</dt><dd>120</dd></div>
        </dl>
        <p className="mt-4 text-sm text-slate-500">Para reproducirlo, activá Por tareas (TodoCode), agregá una tarea de 10 horas directas y fijá la tarifa única en 20. En Costos y margen, elegí ganancia por porcentaje y margen recomendado del 20%. Dejá en cero terceros, riesgos, imprevistos, impuestos, IVA, descuento y redondeo; elegí urgencia normal y el escenario Recomendado.</p>
      </Card>
      <Card title="Si preferís estimar por alcance">
        <p className="text-sm leading-relaxed text-slate-600">En Proyecto elegí el tipo de desarrollo, la complejidad y la personalización. En Alcance indicá pantallas, funcionalidades, integraciones, flujos de IA y revisiones. En Tecnologías seleccioná las herramientas. Después revisá el desglose en Horas y continuá con tarifa, costos y presupuesto.</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">Activá Por alcance en Tareas y estimación para usar esos valores en el precio. La urgencia y los costos de terceros también afectan al presupuesto.</p>
        <Button className="mt-4" onClick={() => onNavigate('scope')}>Revisar el alcance</Button>
      </Card>
    </div>

    <Card title="Cómo calcular un abono SaaS" subtitle="Usalo cuando varios clientes pagan una suscripción por el mismo producto.">
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
        <li>Ingresá cuánto costó desarrollar el producto y en cuántos meses querés recuperar esa inversión. También podés tomar el costo total del proyecto actual.</li>
        <li>Cargá la cantidad de clientes y la infraestructura mensual compartida. Estos costos se distribuyen entre esos clientes.</li>
        <li>Definí las horas de soporte y su costo <strong>por cliente</strong>. Se suman a la parte compartida para obtener el costo base.</li>
        <li>Elegí la ganancia sobre ese costo base y el costo variable de cada plan. Indicá cómo redondear el abono.</li>
        <li>Agregá horas extras u otros extras por cliente. Se suman después del redondeo. El resultado es el abono mensual por cliente, antes de impuestos.</li>
      </ol>
      <p className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">Con los valores del ejemplo, los planes dan 79, 94, 119 y 219 por mes por cliente. Si cambiás la cantidad de clientes, se recalcula cuánto le corresponde pagar a cada uno. Este apartado no aplica el descuento ni el IVA del presupuesto de desarrollo.</p>
      <Button className="mt-4" onClick={() => onNavigate('saas')}>Ir a Abonos SaaS</Button>
    </Card>

    <Card title="Preguntas frecuentes" icon={<CircleHelp className="h-4 w-4" />} subtitle="Abrí una pregunta para ver la explicación.">
      <div className="divide-y divide-slate-100">{questions.map((question) => <details key={question.title} className="group py-3 first:pt-0 last:pb-0">
        <summary className="cursor-pointer rounded-md text-sm font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{question.title}</summary>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{question.answer}</p>
      </details>)}</div>
    </Card>
  </div>;
}
