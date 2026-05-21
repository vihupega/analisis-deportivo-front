# Renderizado de predicciones — guía de UI

El endpoint `/predict` (y `/predict/wc`) incluye campos adicionales para que
el frontend muestre predicciones de forma más honesta cuando el modelo no
tiene una preferencia clara.

## Campos nuevos en la respuesta

```json
{
  "probabilities": { ... },
  "match_analysis": {
    "is_close_match": true,
    "top_gap_pp":     4.2,
    "draw_is_viable": false
  },
  "warnings": [
    {
      "type":    "close_match",
      "message": "Partido muy parejo (top-1 = 42.1%, top-2 = 37.9%). ..."
    }
  ],
  "informational_notes": [
    "El empate tiene probabilidad considerable (31.2%) aunque no es la predicción más probable. ..."
  ]
}
```

Todos los campos son opcionales hacia atrás: si el backend no los incluye,
el frontend debe tratarlos como `undefined`/vacíos y comportarse igual que antes.

---

## Cuando `match_analysis.is_close_match === true`

**Criterio del backend:** `max_prob < 0.50` Y diferencia entre top-1 y top-2 < `0.10`.

**Comportamiento en el frontend (implementado en `ProbabilityResult.jsx`):**

- El panel `.prob-result` recibe la clase adicional `.close-match`, que cambia el borde a tono ámbar.
- Se muestra un badge **"⚠ Partido parejo"** en la parte superior del panel.
- Los nombres de los equipos **no se colorean** en verde: ambos aparecen en `--ink-0` (blanco neutro), porque ningún resultado tiene preferencia clara.
- Se muestra el mensaje de `warnings[].message` (tipo `close_match`) en un bloque de aviso ámbar debajo de las barras.

**Lo que NO se hace:** el frontend no oculta ni reordena las barras. Las tres siguen apareciendo con sus probabilidades reales.

---

## Cuando `match_analysis.draw_is_viable === true` y el outcome no es empate

**Criterio del backend:** `p_draw >= 0.30` aunque `argmax != draw`.

**Comportamiento en el frontend:**

- La fila de **Empate** en las barras recibe la clase `.viable`.
- El label de la fila se aclara (`--ink-1` en lugar de `--ink-2`) para aumentar su visibilidad.
- El porcentaje muestra un pequeño superíndice `↑` (`aria-label="empate viable"`) para señalar que merece consideración.
- Se renderizan los textos de `informational_notes[]` como bloques de texto secundario debajo de las barras (estilo `analysis-note`).

---

## Sobre el indicador "Correcto" vs "Incorrecto" en el Historial

`is_correct` usa **criterio top-1 estricto**:

- **Correcto** = el argmax del modelo coincidió con el resultado real del partido.
- **Incorrecto** = el argmax del modelo no coincidió.

La regla anterior de "top-2 cuando `max_prob < 49%`" fue eliminada porque:

1. Era inconsistente con la UI: el frontend mostraba un resultado pero el backend contaba otro como correcto.
2. Inflaba el accuracy reportado sin reflejar la calidad real del modelo.

El accuracy resultante es ~5–8 pp menor que el reportado anteriormente, pero es
comparable con benchmarks académicos (Dixon-Coles 50–53 %, FiveThirtyEight 52–55 %)
y con el análisis OOF del modelo (~51.7 %).

---

## Compatibilidad con respuestas antiguas

El frontend es retrocompatible. Si la respuesta no incluye `match_analysis`,
`warnings` ni `informational_notes`, el comportamiento es idéntico al anterior:

- No aparece badge ni mensaje de aviso.
- El equipo con mayor probabilidad se resalta en verde.
- No hay indicador `↑` en el empate.

```js
// Defaults usados cuando el campo no viene en la respuesta
const analysis     = result.match_analysis      ?? {}
const isCloseMatch = analysis.is_close_match    ?? false
const drawIsViable = analysis.draw_is_viable    ?? false
const warnings     = result.warnings            ?? []
const notes        = result.informational_notes ?? []
```
