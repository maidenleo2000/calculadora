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

`precio = desarrollo + imprevistos + terceros + margen + urgencia + impuestos + redondeo` (lo verifican los tests).

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
