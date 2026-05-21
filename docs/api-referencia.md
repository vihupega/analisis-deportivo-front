# Referencia de la API — Backend

Todos los endpoints que consume el frontend. El backend corre en `http://localhost:8001`; el proxy de Vite lo expone como `/api` durante el desarrollo.

## Índice

- [Fixtures](#fixtures)
- [Predicción — Clubes](#predicción--clubes)
- [Predicción — Internacional](#predicción--internacional)
- [Historial de predicciones](#historial-de-predicciones)
- [Estadísticas de predicciones](#estadísticas-de-predicciones)
- [Admin — Recolección](#admin--recolección)
- [Admin — Entrenamiento](#admin--entrenamiento)
- [Admin — Resolver predicciones](#admin--resolver-predicciones)
- [Ligas — Búsqueda](#ligas--búsqueda)
- [Ligas — Entrenadas](#ligas--entrenadas)
- [Manejo de errores](#manejo-de-errores)

---

## Fixtures

### GET `/fixtures`

Retorna los partidos programados para una fecha y liga opcionales.

**Parámetros de query**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `date` | string | Sí | Fecha en formato `YYYY-MM-DD` |
| `league` | string | No | Nombre de la liga para filtrar resultados |

**Ejemplo**

```bash
curl "http://localhost:8001/fixtures?date=2026-05-21&league=La+Liga"
```

**Respuesta exitosa — 200**

```json
[
  {
    "fixture_id": 1234567,
    "home":       "Real Madrid",
    "away":       "FC Barcelona",
    "league":     "La Liga",
    "country":    "Spain",
    "date":       "2026-05-21T20:00:00+02:00",
    "season":     2025,
    "league_id":  140,
    "is_wc":      false
  }
]
```

| Campo | Tipo | Descripción |
|---|---|---|
| `fixture_id` | integer | ID único del partido en la fuente de datos |
| `home` / `away` | string | Nombres de los equipos |
| `league` | string | Nombre de la liga |
| `country` | string | País de la liga |
| `date` | string (ISO 8601) | Fecha y hora del partido con zona horaria |
| `season` | integer | Año de la temporada |
| `league_id` | integer | ID de la liga en la fuente de datos |
| `is_wc` | boolean | `true` si es un torneo internacional |

---

## Predicción — Clubes

### GET `/predict`

Calcula la probabilidad de resultado para un partido de ligas de clubes.

**Parámetros de query**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `home` | string | Sí | Nombre del equipo local |
| `away` | string | Sí | Nombre del equipo visitante |
| `league` | string | Sí | Nombre de la liga |
| `date` | string | Sí | Fecha del partido en `YYYY-MM-DD` |
| `season` | integer | No | Año de la temporada (p. ej. `2025`) |
| `league_id` | integer | No | ID de la liga en la fuente de datos |
| `country` | string | No | País de la liga |

**Ejemplo**

```bash
curl "http://localhost:8001/predict?home=Real+Madrid&away=FC+Barcelona&league=La+Liga&date=2026-05-21"
```

**Respuesta exitosa — 200**

```json
{
  "home_team":     "Real Madrid",
  "away_team":     "FC Barcelona",
  "league":        "La Liga",
  "date":          "2026-05-21",
  "probabilities": {
    "home_win_prob":  45.2,
    "draw_prob":      27.1,
    "away_win_prob":  27.7
  },
  "match_stats": {
    "home_xg":                2.14,
    "away_xg":                1.87,
    "expected_total_goals":   4.01,
    "home_fouls_avg_l5":      11.2,
    "away_fouls_avg_l5":       9.8,
    "home_yellow_cards_l5":    1.6,
    "away_yellow_cards_l5":    2.0,
    "home_corners_avg_l5":     5.4,
    "away_corners_avg_l5":     4.2
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `probabilities.home_win_prob` | float | Probabilidad de victoria local (0–100) |
| `probabilities.draw_prob` | float | Probabilidad de empate (0–100) |
| `probabilities.away_win_prob` | float | Probabilidad de victoria visitante (0–100) |
| `match_stats` | object \| null | Estadísticas esperadas del partido. Puede ser `null` si no hay datos suficientes |
| `match_stats.home_xg` | float | Goles esperados del equipo local |
| `match_stats.away_xg` | float | Goles esperados del equipo visitante |
| `match_stats.*_avg_l5` | float | Promedio de la estadística en los últimos 5 partidos |

---

## Predicción — Internacional

### GET `/predict/wc`

Idéntico a `/predict` pero usa el modelo entrenado con datos de torneos internacionales.

**Parámetros de query:** mismos que `/predict`.

**Respuesta:** misma estructura que `/predict`.

**Ejemplo**

```bash
curl "http://localhost:8001/predict/wc?home=Argentina&away=Brazil&league=Copa+America&date=2026-07-10"
```

---

## Historial de predicciones

### GET `/predictions/history`

Retorna el historial de predicciones con filtros y paginación.

**Parámetros de query**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `status` | string | No | `pending` / `resolved` / `cancelled` |
| `model_type` | string | No | `clubs` / `wc` |
| `league` | string | No | Búsqueda parcial por nombre de liga |
| `date_from` | string | No | Desde esta fecha (`YYYY-MM-DD`) |
| `date_to` | string | No | Hasta esta fecha (`YYYY-MM-DD`) |
| `correctness` | string | No | `correct` / `incorrect` (solo aplica a resueltas) |
| `limit` | integer | No | Máximo de resultados (default: 20) |
| `skip` | integer | No | Cuántos registros saltar para paginación (default: 0) |

**Ejemplo**

```bash
curl "http://localhost:8001/predictions/history?status=resolved&model_type=clubs&limit=20&skip=0"
```

**Respuesta exitosa — 200**

```json
[
  {
    "id":           "abc123",
    "home_team":    "Real Madrid",
    "away_team":    "Atletico Madrid",
    "league":       "La Liga",
    "date":         "2026-04-10",
    "model_type":   "clubs",
    "status":       "resolved",
    "probabilities": {
      "home_win_prob": 52.1,
      "draw_prob":     24.3,
      "away_win_prob": 23.6
    },
    "actual_result":  "home_win",
    "is_correct":     true,
    "match_stats":    { ... },
    "created_at":     "2026-04-09T18:32:00Z"
  }
]
```

### DELETE `/predictions/{id}`

Elimina una predicción por su ID.

**Respuesta exitosa:** `204 No Content` (sin cuerpo).

### GET `/predictions/history/export`

Exporta el historial filtrado como archivo `.xlsx`. Acepta los mismos parámetros de filtro que `/predictions/history` (sin `limit` ni `skip` — exporta todo).

**Respuesta exitosa:** Archivo binario con `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

## Estadísticas de predicciones

### GET `/predictions/stats`

Retorna métricas de fiabilidad del historial.

**Ejemplo**

```bash
curl "http://localhost:8001/predictions/stats"
```

**Respuesta exitosa — 200**

```json
{
  "total_resolved":   342,
  "total_correct":    198,
  "reliability_pct":  57.9,
  "by_model_type": {
    "clubs": {
      "total_resolved": 290,
      "total_correct":  172,
      "reliability_pct": 59.3
    },
    "wc": {
      "total_resolved": 52,
      "total_correct":  26,
      "reliability_pct": 50.0
    }
  }
}
```

---

## Admin — Recolección

### POST `/admin/collect`

Inicia la descarga de resultados históricos para una liga y temporadas dadas.

**Parámetros de query**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `league` | string | Sí | Nombre de la liga |
| `season` | integer (repetible) | Sí | Año(s) a descargar. Se puede repetir: `?season=2023&season=2024` |
| `tournament_type` | string | No | `clubs` (default) o `international` |
| `min_prior` | integer | No | Partidos previos mínimos para incluir un equipo (default: 4) |
| `force` | boolean | No | Si `true`, reprocesa datos ya descargados (default: false) |
| `league_id` | integer | No | ID de la liga en la fuente de datos |
| `country` | string | No | País de la liga |

**Ejemplo**

```bash
curl -X POST "http://localhost:8001/admin/collect?league=La+Liga&season=2023&season=2024&tournament_type=clubs"
```

**Respuesta exitosa — 200**

```json
{
  "jobs": {
    "la-liga-2023": { "status": "started" },
    "la-liga-2024": { "status": "started" }
  }
}
```

### GET `/admin/collect/status`

Consulta el estado actual de todos los jobs de recolección en curso.

**Respuesta exitosa — 200**

```json
{
  "la-liga-2023": {
    "status":  "done",
    "saved":   284,
    "error":   null
  },
  "la-liga-2024": {
    "status":  "running",
    "saved":   152,
    "error":   null
  }
}
```

| Campo | Valores posibles |
|---|---|
| `status` | `started` / `running` / `done` / `error` |
| `saved` | Número de fixtures guardados hasta el momento |
| `error` | Mensaje de error (si `status` es `error`); `null` en caso contrario |

---

## Admin — Entrenamiento

### POST `/admin/train`

Reentrena el modelo de ligas de clubes con los datos recolectados.

```bash
curl -X POST "http://localhost:8001/admin/train"
```

**Respuesta exitosa — 200**

```json
{ "message": "Entrenamiento completado. Modelo guardado." }
```

### POST `/admin/train/wc`

Reentrena el modelo de torneos internacionales.

```bash
curl -X POST "http://localhost:8001/admin/train/wc"
```

**Respuesta exitosa — 200**

```json
{ "message": "Entrenamiento WC completado. Modelo guardado." }
```

---

## Admin — Resolver predicciones

### POST `/admin/resolve`

Consulta resultados reales de partidos recientes y actualiza las predicciones pendientes.

**Parámetros de query**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `days_back` | integer | No | Días hacia atrás a consultar (default: 3, máx: 30) |
| `model_type` | string | No | `clubs` / `wc`. Si se omite, resuelve ambos modelos |
| `dry_run` | boolean | No | Si `true`, muestra qué cambiaría sin guardar (default: false) |

**Ejemplo**

```bash
curl -X POST "http://localhost:8001/admin/resolve?days_back=7&dry_run=false"
```

**Respuesta exitosa — 200**

```json
{
  "message": "7 predicciones resueltas. 2 correctas, 5 incorrectas."
}
```

---

## Ligas — Búsqueda

### GET `/leagues/search`

Busca ligas por nombre en la fuente de datos externa.

**Parámetros de query**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `q` | string | Sí | Texto de búsqueda (mínimo 3 caracteres) |

**Ejemplo**

```bash
curl "http://localhost:8001/leagues/search?q=premier"
```

**Respuesta exitosa — 200**

```json
[
  { "id": 39,  "name": "Premier League",         "country": "England" },
  { "id": 140, "name": "Primera Division",       "country": "Spain"   },
  { "id": 203, "name": "Premier League",         "country": "Turkey"  }
]
```

---

## Ligas — Entrenadas

### GET `/leagues/trained`

Lista todas las ligas con datos de entrenamiento registrados en el sistema.

**Ejemplo**

```bash
curl "http://localhost:8001/leagues/trained"
```

**Respuesta exitosa — 200**

```json
[
  { "league": "La Liga",        "type": "clubs",         "fixture_count": 1520 },
  { "league": "Premier League", "type": "clubs",         "fixture_count": 1900 },
  { "league": "World Cup",      "type": "international", "fixture_count":  320 }
]
```

---

## Manejo de errores

Todos los endpoints devuelven errores en el siguiente formato:

```json
{
  "detail": "Descripción del error"
}
```

| Código HTTP | Cuándo ocurre |
|---|---|
| `400` | Parámetros inválidos o faltantes |
| `404` | Recurso no encontrado (par de equipos sin datos, predicción inexistente, etc.) |
| `422` | Error de validación de parámetros (tipo incorrecto, rango inválido) |
| `500` | Error interno del servidor |

El frontend lee el campo `detail` y lo muestra como mensaje de error al usuario. Si el cuerpo no es JSON válido, usa el `statusText` de la respuesta HTTP.
