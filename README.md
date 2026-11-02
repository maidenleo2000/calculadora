# Calculadora de presupuestos de software

Aplicación React + TypeScript + Tailwind CSS para estimar horas, costos y precio de proyectos de desarrollo de software, y generar presupuestos exportables a PDF.

## Ejecutar

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests de las fórmulas (Vitest)
npm run build      # build de producción en dist/
npm run preview    # sirve el build
```

El build usa rutas relativas (`base: './'`), así que `dist/` se puede subir a cualquier hosting estático o a una subcarpeta del sitio.

## Instalar como app (PWA)

La calculadora se puede instalar en PC y celular con el botón **Instalar app** del encabezado:

- **Chrome / Edge (PC) y Android**: abre el diálogo nativo de instalación.
- **iPhone / iPad**: muestra los pasos (Safari → Compartir → Agregar a inicio).
- Si la app ya está instalada, el botón no aparece.

Una vez instalada funciona sin conexión. Requisitos:

- Tiene que servirse por **HTTPS** (o `localhost`). En `npm run dev` el service worker no se registra; para probar la instalación usá `npm run build` y `npm run preview`.
- Archivos involucrados: `public/manifest.webmanifest`, `public/sw.js` y los íconos `public/icon-192.png` / `public/icon-512.png`.
- Al publicar una versión nueva, la app toma los cambios sola (la página se pide primero a la red). Si cambiás `sw.js`, subí el número de `CACHE` (`cotizador-v2`, …) para limpiar la caché vieja.

## Flujo de uso

El botón **Ayuda** del encabezado y la sección **Ayuda** abren una guía dentro de la aplicación. Incluye un paso a paso para cotizar, un ejemplo de precio y anticipo, instrucciones para estimar por alcance y calcular abonos SaaS, y preguntas frecuentes sobre costos, PERT, riesgos, ganancia, impuestos, monedas y guardado. Sus accesos llevan a cada pantalla sin modificar el proyecto.

En **Tareas y estimación** y **Tarifa y moneda**, **Aplicar la misma tarifa a todas las horas del proyecto** permite configurar una **Tarifa única por hora** para todas las tareas y las horas de riesgo. Al activarla se toma la tarifa base actual como valor manual inicial. Las tarifas individuales se conservan y se vuelven a aplicar al desactivar la opción. La elección se guarda con el proyecto; el soporte y los extras SaaS se configuran aparte. En el modo por alcance todas las horas ya usan la tarifa base.

### Cotizar con las cuatro plantillas TodoCode

El acceso **Estimar tareas** abre el nuevo modo **Por tareas (TodoCode)**. Se conserva el modo por alcance y los proyectos guardados anteriormente. Elegí un modo: sus horas no se suman entre sí.

- **Estimaciones:** tareas con etapa, horas directas o tres tiempos PERT (`(optimista + 4 × probable + pesimista) / 6`), tarifa propia opcional y consideraciones/dependencias. Las dependencias se registran como notas, no programan automáticamente el calendario. Se pueden agregar horas por riesgo con una tarifa específica. El cálculo conserva los decimales de PERT; el total se muestra con dos decimales, sin replicar el redondeo a horas enteras del Excel. Los tiempos desordenados se marcan y se excluyen hasta corregirlos.
- **Costos:** cada tarea cuesta `horas × tarifa propia`, o usa la tarifa base si no tiene tarifa propia. La reserva por riesgos se asigna a Análisis en el resumen. En **Costos y margen**, la gestión puede ser un porcentaje o un monto fijo. En modo fijo, Mínimo no agrega ganancia; Recomendado agrega el fijo; Premium agrega el fijo más el porcentaje premium. El ejemplo de costos reproduce **59 horas, 1.038 de desarrollo, 250 de hosting/licencias y 300 de gestión: total 1.588**, en la moneda base elegida. Los valores son ilustrativos, no tarifas de mercado.
- **Presupuesto:** dirección e identificación fiscal de proveedor/cliente, teléfono, detalle por etapa con horas y precio medio por hora, descuento porcentual e IVA editable, anticipo, saldo y firmas. Los impuestos internos de **Tarifa y moneda** se incorporan al precio; el IVA se agrega sobre el subtotal después del descuento. Ambos tienen controles independientes. El descuento reduce la ganancia y genera una advertencia si deja el precio bajo costo. El PDF se obtiene con el diálogo de impresión del navegador.
- **Abonos SaaS:** cálculo independiente del presupuesto de desarrollo. `base por cliente = (desarrollo / meses de recuperación + infraestructura mensual) / clientes + horas de soporte por cliente × costo por hora`. Cada plan suma ganancia sobre esa base y su costo variable, redondea hacia arriba y luego suma extras. Con los datos de ejemplo da **79, 94, 119 y 219 por mes por cliente**, antes de impuestos. Podés usar el costo total del proyecto como inversión inicial o ingresar otro monto. Cero clientes o cero meses deja el resultado pendiente.

Todos los campos nuevos se guardan y se incluyen al exportar/importar proyectos JSON. Cambiar la moneda base también convierte tarifas por tarea, reserva de riesgos, gestión fija y valores monetarios SaaS; los costos de terceros conservan su moneda propia. Los archivos Excel originales se usan como referencia y permanecen intactos.

### Cotizar por alcance

1. **Proyecto**: tipo de proyecto (carga horas base, alcance y tecnologías sugeridas), complejidad, personalización y urgencia.
2. **Alcance**: pantallas, funcionalidades, integraciones, flujos de IA y rondas de revisión. En *Parámetros* se editan las horas que suma cada unidad por etapa y los factores.
3. **Tecnologías**: selección múltiple; cada una suma horas concretas por etapa y, opcionalmente, licencias (pago único o mensual, en USD o ARS). Se pueden agregar tecnologías propias.
4. **Horas**: tabla por etapa con horas base editables, aportes de alcance, tecnologías, factores y ajuste manual.
5. **Tarifa y moneda**: tarifa calculada desde ingresos o manual; cotización ARS/USD cargada por el usuario.
6. **Costos y margen**: infraestructura, APIs y licencias; imprevistos, márgenes, redondeo y mantenimiento mensual.
7. **Presupuesto**: datos del cliente y condiciones. *Exportar PDF* abre el diálogo de impresión: elegí “Guardar como PDF”.

El botón **Oscuro / Claro** del encabezado cambia el tema; la elección se recuerda y, si nunca se eligió, se sigue la preferencia del sistema. Los colores de ambos temas están en `src/index.css` (variables CSS); el presupuesto PDF siempre se muestra e imprime en claro.

Todo se guarda automáticamente en `localStorage`. Desde **Proyectos** se pueden guardar varios proyectos con nombre, y exportar o importar en JSON.

## Fórmulas

Todos los montos se calculan en la **moneda base** y se convierten sólo para mostrarlos.

### Horas

```
horas_etapa = (base + alcance + tecnologías) × factor_complejidad × [factor_personalización si es UX/UI o Frontend] + ajuste_manual
alcance     = Σ cantidad_unidad × horas_por_unidad_en_la_etapa
tecnologías = Σ horas que suma cada tecnología seleccionada en la etapa   (suma, no multiplica)
```

### Tarifa por hora

```
tarifa_base       = (ingreso_neto_deseado + gastos_operativos) / horas_facturables   (o manual)
tarifa_mínima     = tarifa_base / (1 − impuestos)
tarifa_recomendada= tarifa_base × (1 + margen) / (1 − impuestos)
```

La tarifa base es un **costo**: ya contiene tu ingreso y tus gastos. El margen y los impuestos no se meten en ella; se aplican una sola vez sobre el proyecto.

### Precio del proyecto

| Capa | Concepto | Fórmula |
|---|---|---|
| Costo | Desarrollo | horas × tarifa_base |
| Costo | Imprevistos | desarrollo × % reserva |
| Costo | Terceros (infra, APIs, licencias) | únicos + mensuales × meses incluidos, al costo |
| Ganancia | Margen | (desarrollo + imprevistos [+ terceros si se activa]) × % margen |
| Recargo | Urgencia | (desarrollo + imprevistos) × (1 + margen) × % urgencia |
| Impuestos | Impuestos estimados | precio × % impuestos (gross-up: `precio = subtotal / (1 − impuestos)`) |
| Ganancia | Redondeo | diferencia por redondear el precio hacia arriba |

Sin descuento ni IVA: `precio = desarrollo + imprevistos + terceros + margen + urgencia + impuestos + redondeo`.

Con ajustes comerciales: primero `subtotal = (costos + ganancia + urgencia) / (1 − impuestos internos)`, luego `precio = redondear_arriba(subtotal × (1 − descuento) × (1 + IVA))`. El desglose interno resta el descuento neto de impuestos para conciliar con los impuestos efectivos después del descuento. La ganancia adicional incluye urgencia y redondeo, y descuenta el descuento neto. Las pruebas verifican tanto la conciliación interna como la del documento para el cliente.

Escenarios: **Mínimo** (margen 0: cubre costos, imprevistos e impuestos), **Recomendado** y **Premium** (márgenes configurables).

Mantenimiento mensual (se cotiza aparte): `(horas_mes × tarifa_base × (1 + margen) + costos_recurrentes_mes) / (1 − impuestos)`.

### Monedas

No hay cotizaciones automáticas ni inventadas. Si un costo está en otra moneda y no cargaste la cotización, no se suma y se muestra una advertencia.

## Estructura

```
src/
  types.ts                 tipos del modelo
  data/catalog.ts          etapas, tipos de proyecto, tecnologías
  data/defaults.ts         parámetros por defecto y ejemplo editable
  lib/calc.ts              motor de cálculo (puro, testeado)
  lib/calc.test.ts         tests de fórmulas
  lib/money.tsx            formato y conversión de moneda
  lib/storage.ts           localStorage, proyectos guardados
  components/ui/           componentes reutilizables (campos validados, tarjetas…)
  components/sections/     pestañas del formulario
  components/Summary.tsx   desglose económico
  components/Charts.tsx    gráficos (SVG, sin dependencias)
  components/QuoteDocument.tsx  presupuesto imprimible / PDF
```

Los valores del ejemplo (ingresos, impuestos, costos, horas por unidad) son ilustrativos: ajustalos a tu realidad y consultá con tu contador el porcentaje de impuestos.
