# Integración Quinielas Progol — Documentación para Frontend

Guía completa para implementar la pantalla de Quinielas Progol en el cliente, consumiendo los 13 endpoints del backend.

---

## 1. Qué es y para qué sirve

La **Quiniela Progol** es un boleto de predicción de fútbol con 14 partidos los fines de semana (más 7 de revancha), o 9 partidos entre semana sin revancha. El usuario puede jugar cada partido en tres modalidades: Sencillo (1 signo), Doble (2 signos) o Triple (3 signos, cobertura total), dentro de un presupuesto fijo. El módulo backend:

1. Descarga el boleto de la jornada
2. Analiza cada partido con el motor de predicción existente (llamadas a api-sports)
3. Usa un optimizador probabilístico para sugerir qué partidos jugar de cada forma, maximizando la probabilidad de alcanzar un objetivo de aciertos, dentro de un presupuesto

El frontend debe presentar este flujo de forma clara: importar → corregir desajustes de nombres → esperar análisis → visualizar probabilidades → permitir reoptimización → exportar o sincronizar tras jugarse la jornada.

---

## 2. Contrato de endpoints

### POST /quinielas/importar/web

Importa el boleto Progol desde la fuente web oficial (miloteria.mx, API JSON). Es la **vía principal** de importación. El backend descarga automáticamente el boleto de la jornada vigente y devuelve la quiniela creada con todos los partidos.

**Request:**
```json
{
  "tipo_jornada": "fin_semana",
  "force": false
}
```

**Parámetros:**
- `tipo_jornada` (requerido): `"fin_semana"` (14 quiniela + 7 revancha) o `"media_semana"` (9 quiniela, sin revancha)
- `force` (opcional, default false): Si es `true`, reimporta aunque ya exista una quiniela para el mismo concurso. Si es `false`, devuelve la existente si ya fue importada (idempotencia).

**Response (201):**

Para fin de semana (`tipo_jornada: "fin_semana"`):
```json
{
  "id": "6789abcdef012345",
  "concurso": "2350",
  "tipo_jornada": "fin_semana",
  "fecha_cierre": "2026-09-14",
  "estado": "importada",
  "fuente": {
    "tipo": "scraping",
    "adaptador": "miloteria",
    "url": "https://miloteria.mx/api_igt/progol/partidos/",
    "importado_en": "2026-09-10T14:23:45"
  },
  "perfil": null,
  "partidos": [
    {
      "num": 1,
      "seccion": "quiniela",
      "local": "ATLANTE",
      "visitante": "PACHUCA",
      "local_api": null,
      "visitante_api": null,
      "liga": null,
      "liga_api": null,
      "league_id": null,
      "fecha": "2026-09-14",
      "hora": null,
      "fixture_id": null,
      "match_estado": "unmatched",
      "match_score": 0.0,
      "match_via": null,
      "match_candidatos": [],
      "prob_local": null,
      "prob_empate": null,
      "prob_visitante": null,
      "prediccion_estado": null,
      "prediccion_error": null,
      "jugada": null,
      "signo_favorito": null,
      "signo_2": null,
      "signo_3": null,
      "signos": [],
      "signos_marcados": null,
      "prob_cobertura": null,
      "resultado_real": null,
      "goles_local": null,
      "goles_visitante": null,
      "acierto": null,
      "acierto_baseline": null
    },
    {
      "num": 2,
      "seccion": "quiniela",
      "local": "C. AZUL",
      "visitante": "AGUILAS",
      "liga": null,
      "fecha": "2026-09-14"
    },
    {
      "num": 3,
      "seccion": "quiniela",
      "local": "GUADALAJARA",
      "visitante": "PUMAS",
      "liga": null,
      "fecha": "2026-09-14"
    }
  ],
  "resumen": null,
  "warnings": [],
  "nota_metodologica": "...",
  "creado_en": "2026-09-10T14:23:45",
  "actualizado_en": "2026-09-10T14:23:45"
}
```

Para media semana (`tipo_jornada: "media_semana"`, sin revancha):
```json
{
  "id": "abc1234567890def",
  "concurso": "812",
  "tipo_jornada": "media_semana",
  "fecha_cierre": "2026-09-11",
  "estado": "importada",
  "fuente": {
    "tipo": "scraping",
    "adaptador": "miloteria",
    "url": "https://miloteria.mx/api/pronos/progol-media/partidos",
    "importado_en": "2026-09-09T10:15:30"
  },
  "perfil": null,
  "partidos": [
    {
      "num": 1,
      "seccion": "quiniela",
      "local": "PORTO",
      "visitante": "MAN. CITY",
      "liga": null,
      "fecha": "2026-09-11"
    },
    {
      "num": 2,
      "seccion": "quiniela",
      "local": "LILLE",
      "visitante": "BETIS",
      "liga": null,
      "fecha": "2026-09-11"
    },
    {
      "num": 3,
      "seccion": "quiniela",
      "local": "REAL MADRID",
      "visitante": "INTER MILAN",
      "liga": null,
      "fecha": "2026-09-11"
    }
  ],
  "resumen": null,
  "warnings": [],
  "nota_metodologica": "...",
  "creado_en": "2026-09-09T10:15:30",
  "actualizado_en": "2026-09-09T10:15:30"
}
```

**Nota importante:** Cada modalidad tiene su **propio número de concurso** y su **propia fecha de cierre**. No son el mismo concurso ni la misma jornada. La UI debe permitir al usuario seleccionar claramente cuál modalidad desea importar, y no asumir que una es derivada de la otra.

**Errores:**
- `404`: No se encontró boleto en la fuente (la fuente aún no publicó esa modalidad, o la respuesta no tiene el bloque esperado)
- `502`: La fuente no responde o error de conectividad
- `500`: Error genérico al procesar la respuesta

---

### POST /quinielas/importar/manual

Importa una quiniela con 14+7 partidos (fin de semana) o 9 partidos (media semana) suministrados manualmente en JSON. **Es el respaldo** cuando el scraping automático no es viable (la fuente aún no publicó el boleto, o necesitas cargar un boleto anterior).

**Request:**
```json
{
  "concurso": "2456",
  "tipo_jornada": "fin_semana",
  "fecha_cierre": "2026-09-12",
  "partidos": [
    {
      "num": 1,
      "seccion": "quiniela",
      "local": "AGUILAS",
      "visitante": "C. AZUL",
      "liga": "Liga MX",
      "fecha": "2026-09-12",
      "hora": "21:00"
    },
    {
      "num": 2,
      "seccion": "quiniela",
      "local": "ATL. MADRID",
      "visitante": "SEVILLA",
      "liga": "Liga Española",
      "fecha": "2026-09-12",
      "hora": "19:30"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "6789abcdef012345",
  "concurso": "2456",
  "tipo_jornada": "fin_semana",
  "fecha_cierre": "2026-09-12",
  "estado": "importada",
  "fuente": {
    "tipo": "manual",
    "importado_en": "2026-09-10T14:23:45"
  },
  "perfil": null,
  "partidos": [
    {
      "num": 1,
      "seccion": "quiniela",
      "local": "AGUILAS",
      "visitante": "C. AZUL",
      "local_api": null,
      "visitante_api": null,
      "liga": "Liga MX",
      "liga_api": null,
      "league_id": null,
      "fecha": "2026-09-12",
      "hora": "21:00",
      "fixture_id": null,
      "match_estado": "unmatched",
      "match_score": 0.0,
      "match_via": null,
      "match_candidatos": [],
      "prob_local": null,
      "prob_empate": null,
      "prob_visitante": null,
      "prediccion_estado": null,
      "prediccion_error": null,
      "jugada": null,
      "signo_favorito": null,
      "signo_2": null,
      "signo_3": null,
      "signos": [],
      "signos_marcados": null,
      "prob_cobertura": null,
      "resultado_real": null,
      "goles_local": null,
      "goles_visitante": null,
      "acierto": null,
      "acierto_baseline": null
    }
  ],
  "resumen": null,
  "warnings": [],
  "nota_metodologica": "...",
  "creado_en": "2026-09-10T14:23:45",
  "actualizado_en": "2026-09-10T14:23:45"
}
```

**Errores:**
- `400`: concurso/tipo_jornada/partidos inválidos
- `404`: tipo_jornada desconocido (`fin_semana` | `media_semana`)
- `500`: error genérico

---

### PATCH /quinielas/{id}/partidos/{num}

Corrige un partido cuyo matching automático falló o fue dudoso. El backend aprende el alias para futuras jornadas. Típicamente se usa en respuesta a `match_estado = "needs_review"` o `"unmatched"`.

**Request:**
```json
{
  "local": "CRUZ AZUL",
  "visitante": "AMERICA",
  "local_api": "Cruz Azul",
  "visitante_api": "Club America",
  "liga": "Liga MX",
  "liga_api": "Liga MX",
  "league_id": 262,
  "fecha": "2026-09-12",
  "fixture_id": 1123456
}
```

**Response (200):**
Devuelve la quiniela completa actualizada con el partido corregido.

**Errores:**
- `404`: quiniela o partido no encontrados
- `502`: error al consultar api-sports para validar el fixture_id

---

### POST /quinielas/{id}/analizar

Lanza el análisis en background: predice cada partido, aplica shrinkage, optimiza la asignación de jugadas.

**Request:**
```json
{
  "perfil": "agresivo",
  "presupuesto": null,
  "objetivo_aciertos": null,
  "max_triples": null,
  "max_dobles": null,
  "force": false,
  "dry_run": false
}
```

**Perfiles preset:**
- `conservador`: presupuesto 24, objetivo 10 aciertos
- `medio`: presupuesto 72, objetivo 11 aciertos
- `agresivo`: presupuesto 216, objetivo 11 aciertos
- `personalizado`: especificar `presupuesto` y `objetivo_aciertos` directamente

**Response (202 / 200):**
```json
{
  "job_id": "2456:fin_semana",
  "estado": "iniciado",
  "perfil": {
    "nombre": "agresivo",
    "presupuesto": 216,
    "objetivo_aciertos": 11,
    "max_triples": null,
    "max_dobles": null
  }
}
```

Si el job ya estaba en curso o ya terminado:
```json
{
  "job_id": "2456:fin_semana",
  "estado": "ya_en_curso"
}
```

**Errores:**
- `404`: quiniela no encontrada
- `422`: perfil desconocido

---

### GET /quinielas/{id}/analizar/estado

Polling del estado del análisis. El job corre en background; se debe llamar cada 2-5 segundos hasta `estado: "done"` o `"partial"`.

**Response (200):**
```json
{
  "job_id": "2456:fin_semana",
  "estado": "running",
  "total": 21,
  "procesados": 12,
  "matched": 10,
  "needs_review": 1,
  "unmatched": 1,
  "api_calls": 12,
  "started_at": "2026-09-10T14:24:10.123456",
  "updated_at": "2026-09-10T14:24:35.654321",
  "motivo_error": null
}
```

Estados posibles:
- `running`: job en curso
- `done`: completado, 0 partidos sin match
- `partial`: completado, 1+ partidos sin match (requiere corrección)
- `error`: falló, ver `motivo_error`

**Errores:**
- `404`: no existe job de análisis para ese `concurso:tipo_jornada`

---

### POST /quinielas/{id}/optimizar

Re-optimiza con otro presupuesto/perfil **sin** volver a predecir (las probabilidades están congeladas). Respuesta síncrona en milisegundos.

**Request:**
```json
{
  "perfil": "conservador"
}
```

o

```json
{
  "presupuesto": 500,
  "objetivo_aciertos": 12
}
```

**Response (200):**
Devuelve la quiniela completa con nuevas asignaciones de `jugada`, `signos`, etc. Solo cambian los campos de `perfil` y `resumen`.

**Errores:**
- `404`: quiniela no encontrada
- `400`: quiniela no analizada aún (estado != "analizada" | "parcial" | "cerrada" | "resuelta")

---

### POST /quinielas/{id}/override

Fija manualmente los signos de un partido y recalcula el resumen sin re-optimizar ese partido. Útil cuando el usuario quiere forzar una jugada específica.

**Request:**
```json
{
  "num": 3,
  "signos": ["L", "E"]
}
```

**Response (200):**
Devuelve la quiniela completa. El partido #3 quedará con `prediccion_estado: "override_manual"` y `signos: ["L", "E"]`, `jugada: "Doble"`.

**Errores:**
- `404`: quiniela o partido no encontrados

---

### GET /quinielas/{id}

Obtiene la quiniela completa (equivalente a la hoja de Excel).

**Response (200):**
```json
{
  "id": "6789abcdef012345",
  "concurso": "2456",
  "tipo_jornada": "fin_semana",
  "fecha_cierre": "2026-09-12",
  "estado": "analizada",
  "fuente": {
    "tipo": "manual",
    "importado_en": "2026-09-10T14:23:45"
  },
  "perfil": {
    "nombre": "agresivo",
    "presupuesto": 216,
    "objetivo_aciertos": 11,
    "max_triples": null,
    "max_dobles": null
  },
  "partidos": [
    {
      "num": 1,
      "seccion": "quiniela",
      "local": "AGUILAS",
      "visitante": "C. AZUL",
      "local_api": "Club America",
      "visitante_api": "Cruz Azul",
      "liga": "Liga MX",
      "liga_api": "Liga MX",
      "league_id": 262,
      "fecha": "2026-09-12",
      "hora": "21:00",
      "fixture_id": 1123456,
      "match_estado": "ok",
      "match_score": 0.98,
      "match_via": "alias",
      "match_candidatos": [],
      "prob_local": 52.4,
      "prob_empate": 28.1,
      "prob_visitante": 19.5,
      "prediccion_estado": "ok",
      "prediccion_error": null,
      "jugada": "Sencillo",
      "signo_favorito": "L",
      "signo_2": null,
      "signo_3": null,
      "signos": ["L"],
      "signos_marcados": "L",
      "prob_cobertura": 52.4,
      "resultado_real": "L",
      "goles_local": 2,
      "goles_visitante": 1,
      "acierto": true,
      "acierto_baseline": true
    }
  ],
  "resumen": {
    "quiniela": {
      "sencillos": 8,
      "dobles": 3,
      "triples": 3,
      "costo": 216
    },
    "revancha": {
      "sencillos": 2,
      "dobles": 3,
      "triples": 2,
      "costo": 72
    },
    "objetivo_aciertos": 11,
    "prob_objetivo_pct": 30.5,
    "prob_distribucion": [0.000234, 0.001823, ...],
    "aciertos_esperados": 9.8,
    "baseline_prob_objetivo_pct": 1.8,
    "baseline_aciertos_esperados": 7.4,
    "partidos_con_resultado": 1,
    "aciertos": null,
    "acierto_pct": null,
    "baseline_aciertos": null,
    "baseline_acierto_pct": null,
    "actualizado_en": "2026-09-10T14:35:22"
  },
  "warnings": [],
  "nota_metodologica": "...",
  "creado_en": "2026-09-10T14:23:45",
  "actualizado_en": "2026-09-10T14:35:22"
}
```

**Errores:**
- `404`: quiniela no encontrada

---

### GET /quinielas

Listado paginado de quinielas con filtros.

**Query params:**
- `estado`: "importada" | "analizando" | "analizada" | "parcial" | "cerrada" | "resuelta" | "error"
- `tipo_jornada`: "fin_semana" | "media_semana"
- `date_from`: YYYY-MM-DD (sobre `fecha_cierre`)
- `date_to`: YYYY-MM-DD (sobre `fecha_cierre`)
- `limit`: 1-200, default 50
- `skip`: 0+, default 0

**Response (200):**
Array de quinielas (sin partidos embebidos, solo resúmenes).

---

### DELETE /quinielas/{id}

Elimina una quiniela. Solo permitido si `estado == "importada"` (no se puede deshacer un análisis).

**Response (204):** Sin contenido.

**Errores:**
- `404`: quiniela no encontrada o no está en estado "importada"

---

### POST /quinielas/{id}/sincronizar

Después de que se juega la jornada, trae los resultados reales desde `predictions` y recalcula aciertos.

**Response (200):**
Devuelve la quiniela con:
- `resultado_real`, `goles_local`, `goles_visitante` por partido
- `acierto`, `acierto_baseline` por partido
- `resumen.aciertos`, `resumen.acierto_pct`, etc. recalculados

**Errores:**
- `404`: quiniela no encontrada
- `500`: error al consultar predicciones

---

### GET /quinielas/{id}/export

Descarga un archivo .xlsx con la quiniela formateada para impresión/análisis. Réplica del Excel del usuario.

**Response (200):**
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

El archivo tiene dos hojas:
1. **Resumen**: concurso, tipo_jornada, perfil, presupuesto, objetivo, prob_objetivo, aciertos_esperados, aciertos_reales
2. **Partidos**: num, local, visitante, liga, fecha, hora, % local/empate/visitante, jugada, signos, cobertura, resultado, acierto

---

### GET /quinielas/estadisticas

Agregados históricos: por perfil, por tipo de jornada, por liga, evolución temporal.

**Response (200):**
```json
{
  "por_perfil": {
    "agresivo": {
      "jornadas": 5,
      "aciertos_total": 53,
      "aciertos_promedio": 10.6,
      "accuracy": 0.64
    }
  },
  "por_tipo_jornada": {
    "fin_semana": {
      "jornadas": 8,
      "aciertos_promedio": 10.2
    }
  }
}
```

---

## 3. Flujo completo end-to-end

1. **Importar** (`POST /quinielas/importar/web` - vía recomendada):
   - El usuario elige modalidad: "fin_semana" o "media_semana"
   - El backend descarga automáticamente el boleto de la fuente oficial
   - Respuesta: quiniela en estado `importada`, partidos sin `fixture_id` ni probabilidades
   - **Alternativa si falla:** `POST /quinielas/importar/manual` con JSON del boleto (para cuando la fuente no haya publicado aún, o cargar boletos anteriores)

2. **Corregir partidos sin match** (si es necesario):
   - Llamar `GET /quinielas/{id}` y revisar partidos con `match_estado: "needs_review"` o `"unmatched"`
   - Para cada partido problemático: `PATCH /quinielas/{id}/partidos/{num}` con los nombres canónicos
   - El backend aprende el alias

3. **Analizar** (`POST /quinielas/{id}/analizar`):
   - Lanza un job en background
   - Respuesta inmediata con `job_id` y `estado: "iniciado"`
   - El frontend debe hacer polling a `GET /quinielas/{id}/analizar/estado`

4. **Polling** (cada 2-5 segundos):
   - `GET /quinielas/{id}/analizar/estado`
   - Mostrar progreso: `procesados / total` partidos
   - Cuando `estado: "done"` o `"partial"`, parar polling

5. **Visualizar boleto analizado** (`GET /quinielas/{id}`):
   - Mostrar probabilidades (porcentajes 0-100)
   - Mostrar jugadas asignadas (Sencillo/Doble/Triple)
   - Mostrar presupuesto total y desglose por sección
   - Mostrar `prob_objetivo_pct` y `aciertos_esperados`

6. **Reoptimizar** (`POST /quinielas/{id}/optimizar`):
   - Usuario cambia perfil o presupuesto
   - Llamada síncrona, respuesta en <100ms
   - Vuelve a `GET /quinielas/{id}` para refrescar

7. **Exportar** (`GET /quinielas/{id}/export`):
   - Descarga .xlsx para impresión o análisis posterior

8. **Sincronizar tras la jornada** (`POST /quinielas/{id}/sincronizar`):
   - Tras jugarse los partidos, obtener resultados reales
   - Recalcula aciertos y compara contra baseline

---

## 4. Máquina de estados de una quiniela

```
importada
    |
    v
  analizar (POST /quinielas/{id}/analizar)
    |
    v
analizando <-- polling hasta done/partial
    |
    +---> analizada (si 0 partidos unmatched)
    |
    +---> parcial (si 1+ partidos unmatched)
              |
              | (opcionalmente corregir y re-analizar)
              v
           analizada
    |
    v
  cerrada (automático tras fecha_cierre)
    |
    v
 sincronizar (POST /quinielas/{id}/sincronizar)
    |
    v
 resuelta (con resultados reales y aciertos)

error (si falla análisis o sincronización)
```

**Transiciones permitidas por estado:**

| Estado | Acciones permitidas |
|---|---|
| `importada` | Analizar, Corregir partidos, Eliminar |
| `analizando` | Ver estado (polling) |
| `analizada` | Optimizar, Override, Exportar, Sincronizar |
| `parcial` | Corregir partidos, Analizar (force=true), Optimizar, Override, Exportar, Sincronizar |
| `cerrada` | Optimizar, Override, Sincronizar |
| `resuelta` | Optimizar, Exportar |
| `error` | Ver detalles del error |

---

## 5. Polling del análisis

El análisis es costoso: **45-90 segundos en frío** porque analiza 21 partidos × ~7 llamadas HTTP cada uno. Se ejecuta en un job en background.

**Flujo de polling:**

```
POST /quinielas/{id}/analizar
  (respuesta inmediata: job_id, estado: "iniciado")

loop cada 2-5 segundos:
  GET /quinielas/{id}/analizar/estado
    {
      "estado": "running",
      "procesados": 12,
      "total": 21,
      "matched": 10,
      "needs_review": 1,
      "unmatched": 1,
      "api_calls": 12
    }
    
    # Mostrar progreso: "Analizados 12 de 21 partidos..."
    # Mostrar conteo: "10 correctos, 1 para revisar, 1 sin match"
    
    si estado == "done" o "partial":
      break

GET /quinielas/{id}  # Obtener quiniela completa
```

**Mientras se espera (`estado: "running"`):**

- Mostrar barra de progreso: `procesados / total`
- Mostrar conteos en tiempo real: matched, needs_review, unmatched
- Permitir cancelación (abandona el polling, el job sigue corriendo en background)
- Desactivar botón de "Analizar" de nuevo (reintento solo con `force: true`)

**Cuando termina (`estado: "done"`):**
- Todos los partidos resolvieron a `match_estado: "ok"` o `"needs_review"`
- Mostrar botón "Ver Boleto Analizado"

**Cuando termina con errores (`estado: "partial"`):**
- Algunos partidos quedaron con `match_estado: "unmatched"`
- Mostrar aviso: "Hay [N] partidos que no pudieron identificarse automáticamente. Revísalos abajo."
- Mostrar lista de partidos sin match con campo de edición para corrección

---

## 6. Manejo de match_estado

El punto de mayor fricción en la UI: entender por qué ciertos partidos se resolvieron mal y cómo corregirlos.

### match_estado: "ok"
Partido identificado con confianza >= 0.86. Sin intervención requerida.
- `match_score` >= 0.86
- `match_candidatos` vacío
- Mostrar normalmente

### match_estado: "needs_review"
Partido identificado con confianza 0.68-0.86. Aceptado provisionalmente, pero el usuario debe confirmar.
- `match_score` entre 0.68 y 0.86
- `match_candidatos` contiene top-3 alternativas (fixtures con mejor score alternativo)
- **Mostrar en UI:**
  - Marcar la fila con un badge "Para revisar"
  - Mostrar el fixture resuelto en el color normal
  - Mostrar los 3 candidatos alternativos debajo
  - Botón "Confirmar esta opción" o "Cambiar a..."
- **La predicción y jugada se calculan igual** — no bloquea el análisis
- **Si el usuario confirma via UI:** llamar `PATCH /quinielas/{id}/partidos/{num}` con los datos correctos

### match_estado: "unmatched"
Partido no identificado (score < 0.68 o ambiguo). **Sin predicción, forzado a Triple.**
- `match_score` < 0.68 o hay ambigüedad (dos candidatos dentro de 0.05 en score)
- `fixture_id` nulo
- `prob_local`, `prob_empate`, `prob_visitante` = 33.33% (uniform)
- `jugada: "Triple"` (fuerza cobertura máxima, descuenta presupuesto)
- `warnings` contiene entrada `{ "type": "partido_sin_prediccion", "message": "..." }`
- **Mostrar en UI:**
  - Marcar la fila con un badge rojo "Sin identificar"
  - Fondo rojo claro
  - Mostrar "?" en el campo de equipo
  - Campo editable para que el usuario ingrese los nombres canónicos
  - Botón "Guardar corrección"
- **Después de `PATCH`:** la fila se actualiza localmente y refleja el fixture correcto + probabilidades

### Por qué ocurre esto: idioma

Progol publica los nombres del boleto en **español, abreviados y en mayúsculas**:
- `AGUILAS` → la API espera "Club America"
- `C. AZUL` → la API espera "Cruz Azul"
- `ATL. MADRID` → la API espera "Atletico Madrid"
- `ROSARIO CEN` → truncado, la API espera "Rosario Central"
- `SLAVIA PRAG` → truncado, la API espera "Slavia Praha"
- `GUADALAJ. F` → femenil, se busca en liga femenil de México

El backend implementa traducción ES→EN en 3 capas: exónimos (Nápoles→Napoli), apodos (Aguilas→Club America), clubes (Athletic Bilbao→Athletic Club). Pero si el nombre está truncado o es una variante no documentada, falla.

**Nota importante:** El sufijo ` F` (femenil) es un discriminante duro. `AGUILAS F` debe casar solo con Aguilas Femenil, nunca con Aguilas Varonil. Si el backend ve ` F`, marca automáticamente la búsqueda en liga femenil. Si no se trata, produce una predicción de la rama equivocada.

---

## 7. Nota metodológica (obligatoria y destacada)

El campo `prob_objetivo_pct` en la respuesta devuelve **P(≥ X aciertos)** según una distribución Poisson-binomial calculada del optimizador. Es importante entender sus limitaciones:

**El supuesto de independencia es optimista.**

El optimizador trata los 21 partidos como independientes: son fixtures distintos con equipos distintos. Pero la independencia real es **de los resultados, no del error del modelo**. El modelo comparte features, calibración y sesgos entre partidos, así que sus errores están correlacionados positivamente.

**Consecuencia:** La probabilidad calculada es **optimista respecto a la cobertura real**. Es una guía **relativa** para comparar asignaciones ("la asignación A es mejor que la B"), no una promesa de rendimiento económico.

**Ejemplo medido:**
Con 14 partidos y presupuesto 216 (3 triples + 3 dobles):
- Optimizador: P(≥11 aciertos) = 30.5%
- Baseline (solo favoritos): P(≥11 aciertos) = 1.8%
- Diferencia: 28.7 pp en favor de la optimización

La diferencia es real y la feature tiene valor. **Pero el 30.5% no es una promesa de ganar dinero**; es una comparación relativa.

**Cómo presentar en UI:**
- Mostrar `prob_objetivo_pct` como "probabilidad teórica" o "cobertura esperada"
- No usar lenguaje de "chances de ganar" o "ROI esperado"
- Si educas al usuario, menciona que asume independencia de errores
- Usa siempre el baseline como referencia visual (p. ej., barra lateral): "vs. 1.8% solo favoritos"

---

## 8. Glosario

### Conceptos de Progol

- **Sencillo:** 1 signo (el favorito). Acierta si el resultado está en ese signo.
- **Doble:** 2 signos (favorito + segundo). Acierta si el resultado está en cualquiera de los dos.
- **Triple:** 3 signos (L, E, V todos). Cobertura total, acierta siempre. Costo máximo.
- **Presupuesto:** Número de combinaciones (`3^triples × 2^dobles`), **no en pesos**. Ej: presupuesto 216 = 3 triples × 3 dobles × 8 sencillos.
- **Objetivo de aciertos:** Mínimo de partidos que se deben acertar para que la jugada sea ganadora (definición del concurso).
- **Baseline:** Asignación donde todos los partidos se juegan Sencillo (solo favorito). Punto de comparación.
- **Boleto:** El conjunto de los 14 (fin de semana) o 9 (media semana) partidos a jugar.
- **Quiniela:** Los primeros 14 partidos (o 9 en media semana).
- **Revancha:** Los 7 partidos adicionales del fin de semana (no existe en media semana).
- **Concurso:** ID numérico del boleto (ej: 2456).
- **Tipo de jornada:** "fin_semana" (14+7) o "media_semana" (9, sin revancha).
- **Liga:** Campeonato (ej: Liga MX, Liga Española, Premier).

### Estados del análisis (job)

- **running:** El job está en progreso, analizando partidos.
- **done:** Job completó, 0 partidos sin match.
- **partial:** Job completó, 1+ partidos sin match (necesitan corrección manual).
- **error:** Job falló, ver `motivo_error`.

### Matching de equipos

- **match_estado:** Estado de la identificación del fixture. "ok" = confianza alta, "needs_review" = confianza media, "unmatched" = no identificado.
- **match_score:** Similitud 0-1 entre el nombre en el boleto y el fixture en api-sports.
- **match_via:** Ruta de resolución ("alias" = tabla aprendida, "traduccion" = tabla de traducción, "tokens" = coincidencia por palabra, "fuzzy" = diflib).
- **match_candidatos:** Lista de top-3 fixtures alternativos cuando `match_estado == "needs_review"`.

---

## 9. Ejemplos curl del flujo completo

**1. Importar desde la fuente web (vía recomendada)**

```bash
# Opción A: importar fin de semana
curl -X POST http://localhost:8000/quinielas/importar/web \
  -H "Content-Type: application/json" \
  -d '{"tipo_jornada": "fin_semana", "force": false}'

# Opción B: importar media semana
curl -X POST http://localhost:8000/quinielas/importar/web \
  -H "Content-Type: application/json" \
  -d '{"tipo_jornada": "media_semana", "force": false}'

# Capturar el ID de la respuesta
QUINIELA_ID="6789abcdef012345"
```

**Alternativa (si falla):** Importar manualmente

```bash
curl -X POST http://localhost:8000/quinielas/importar/manual \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "concurso": "2456",
  "tipo_jornada": "fin_semana",
  "fecha_cierre": "2026-09-12",
  "partidos": [
    {
      "num": 1, "seccion": "quiniela",
      "local": "AGUILAS", "visitante": "C. AZUL",
      "liga": "Liga MX", "fecha": "2026-09-12", "hora": "21:00"
    }
  ]
}
EOF
```

**2. Verificar estado inicial y partidos sin match**

```bash
curl -s http://localhost:8000/quinielas/$QUINIELA_ID | jq '.partidos[] | select(.match_estado != "ok")'
```

**3. Corregir un partido sin match**

```bash
curl -X PATCH http://localhost:8000/quinielas/$QUINIELA_ID/partidos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "local": "AGUILAS",
    "visitante": "C. AZUL",
    "local_api": "Club America",
    "visitante_api": "Cruz Azul",
    "liga": "Liga MX",
    "liga_api": "Liga MX",
    "league_id": 262
  }'
```

**4. Lanzar análisis con perfil agresivo**

```bash
ANALISIS=$(curl -X POST http://localhost:8000/quinielas/$QUINIELA_ID/analizar \
  -H "Content-Type: application/json" \
  -d '{"perfil": "agresivo"}')

JOB_ID=$(echo $ANALISIS | jq -r '.job_id')
echo "Job ID: $JOB_ID"
```

**5. Polling del análisis cada 3 segundos**

```bash
while true; do
  ESTADO=$(curl -s http://localhost:8000/quinielas/$QUINIELA_ID/analizar/estado)
  STATUS=$(echo $ESTADO | jq -r '.estado')
  PROCESADOS=$(echo $ESTADO | jq -r '.procesados')
  TOTAL=$(echo $ESTADO | jq -r '.total')
  
  echo "Estado: $STATUS ($PROCESADOS/$TOTAL)"
  
  if [ "$STATUS" = "done" ] || [ "$STATUS" = "partial" ]; then
    echo "Análisis terminado"
    break
  fi
  
  sleep 3
done
```

**6. Obtener la quiniela completa analizada**

```bash
curl -s http://localhost:8000/quinielas/$QUINIELA_ID | jq '
  {
    estado: .estado,
    perfil: .perfil,
    resumen: .resumen,
    partidos: [.partidos[] | {
      num: .num,
      local: .local,
      visitante: .visitante,
      jugada: .jugada,
      signos: .signos_marcados,
      prob_objetivo: .prob_cobertura
    }]
  }
'
```

**7. Re-optimizar con presupuesto mayor**

```bash
curl -X POST http://localhost:8000/quinielas/$QUINIELA_ID/optimizar \
  -H "Content-Type: application/json" \
  -d '{"presupuesto": 500, "objetivo_aciertos": 12}'
```

**8. Exportar a Excel**

```bash
curl -o quiniela_$QUINIELA_ID.xlsx \
  http://localhost:8000/quinielas/$QUINIELA_ID/export
```

**9. (Después de que se juega) Sincronizar resultados**

```bash
curl -X POST http://localhost:8000/quinielas/$QUINIELA_ID/sincronizar
```

**10. Ver estadísticas históricas**

```bash
curl -s http://localhost:8000/quinielas/estadisticas | jq '.por_perfil'
```

---

## 10. Quinielas Personalizadas

La **Quiniela Personalizada** es un boleto de predicción armado por el usuario desde cero. A diferencia de Progol (que descarga el boleto de la fuente oficial miloteria.mx), aquí el usuario:

1. Busca fixtures disponibles usando `GET /fixtures` o `GET /leagues/search`
2. Selecciona manualmente los partidos que desea jugar (entre 2 y 21)
3. Define explícitamente el presupuesto y objetivo de aciertos (sin perfiles preset)
4. Corre el mismo motor de predicción y optimización que Progol sobre su boleto personalizado

El backend las almacena en una colección independiente (`quinielas_personalizadas`) y ejecuta el mismo pipeline de análisis compartido con Progol, sin necesidad de matching de nombres de equipos: como el usuario selecciona el fixture ya resolvto desde la API, no hay ambigüedad.

### Diferencias principales con Progol

| Aspecto | Progol | Personalizada |
|---|---|---|
| **Origen del boleto** | Importado desde miloteria.mx (fijo 14+7 o 9 partidos) | Armado libremente por el usuario (2-21 partidos) |
| **Matching de nombres** | Sí: traduce nombres abreviados del boleto a equipos de api-sports | No: el usuario elige el fixture directamente de la API |
| **Presupuesto** | Perfiles preset (conservador/medio/agresivo) o personalizado | Siempre personalizado (obligatorio, sin presets) |
| **Objetivo de aciertos** | Perfiles preset o personalizado | Siempre personalizado (obligatorio) |
| **Sección revancha** | Sí (7 partidos adicionales para fin de semana) | No (todos los partidos en sección "quiniela") |
| **Override manual de signos** | Sí (POST /quinielas/{id}/override) | No (no implementado en v1) |
| **Export a .xlsx** | Sí (GET /quinielas/{id}/export) | No (no implementado en v1) |

---

### Contrato de endpoints

Todos los endpoints están prefijados en `/quinielas-personalizadas`.

#### POST /quinielas-personalizadas

Crea una nueva quiniela personalizada en estado `borrador` con los partidos proporcionados. El usuario selecciona los fixtures desde `GET /fixtures` y los envía aqui.

**Request:**
```json
{
  "nombre": "Mi quiniela del fin de semana",
  "descripcion": "Liga MX + Champions seleccion propia",
  "partidos": [
    {
      "fixture_id": 1234567,
      "home_team": "Cruz Azul",
      "away_team": "Club America",
      "league": "Liga MX",
      "league_id": 262,
      "date": "2026-09-14",
      "hora": "21:00"
    },
    {
      "fixture_id": 1234568,
      "home_team": "Manchester City",
      "away_team": "Liverpool",
      "league": "Premier League",
      "league_id": 39,
      "date": "2026-09-14",
      "hora": "13:00"
    }
  ]
}
```

**Parametros:**
- `nombre` (requerido): string 1-80 caracteres, identificador legible de la quiniela
- `descripcion` (opcional): contexto o notas del usuario
- `partidos` (requerido): array de 2-21 fixtures. Cada uno es un objeto con:
  - `fixture_id` (entero): id de api-sports
  - `home_team` (string): nombre del equipo local
  - `away_team` (string): nombre del equipo visitante
  - `league` (string): nombre del campeonato
  - `league_id` (entero): id de api-sports de la liga
  - `date` (YYYY-MM-DD): fecha del partido
  - `hora` (HH:MM, opcional): horario

Validaciones:
- `fixture_id` duplicados → 400
- numero de partidos fuera de [2, 21] → 400

**Response (201):**
```json
{
  "id": "64f3e1a2b5c6d7e8f9g0h1i2",
  "nombre": "Mi quiniela del fin de semana",
  "descripcion": "Liga MX + Champions seleccion propia",
  "estado": "borrador",
  "perfil": null,
  "partidos": [
    {
      "num": 1,
      "seccion": "quiniela",
      "local": "Cruz Azul",
      "visitante": "Club America",
      "local_api": "Cruz Azul",
      "visitante_api": "Club America",
      "liga": "Liga MX",
      "liga_api": "Liga MX",
      "league_id": 262,
      "fecha": "2026-09-14",
      "hora": "21:00",
      "fixture_id": 1234567,
      "match_estado": "ok",
      "match_score": 1.0,
      "match_via": "seleccion_usuario",
      "match_candidatos": [],
      "prob_local": null,
      "prob_empate": null,
      "prob_visitante": null,
      "prediccion_estado": "sin_prediccion",
      "prediccion_error": null,
      "jugada": null,
      "signo_favorito": null,
      "signo_2": null,
      "signo_3": null,
      "signos": [],
      "signos_marcados": null,
      "prob_cobertura": null,
      "resultado_real": null,
      "goles_local": null,
      "goles_visitante": null,
      "acierto": null,
      "acierto_baseline": null
    }
  ],
  "resumen": null,
  "warnings": [],
  "nota_metodologica": "...",
  "creado_en": "2026-09-10T14:23:45",
  "actualizado_en": "2026-09-10T14:23:45"
}
```

**Errores:**
- `400`: fixture_id duplicados, numero de partidos fuera de rango, fixture_id invalido
- `500`: error al persistir

---

#### GET /quinielas-personalizadas

Listado paginado de quinielas personalizadas con filtros opcionales.

**Query params:**
- `estado`: "borrador" | "analizando" | "analizada" | "parcial" | "error" | "resuelta"
- `q`: substring del nombre (case-insensitive)
- `date_from`: YYYY-MM-DD (sobre `fecha_min`, fecha minima del boleto)
- `date_to`: YYYY-MM-DD (sobre `fecha_min`, fecha minima del boleto)
- `limit`: 1-200, default 50
- `skip`: 0+, default 0

**Response (200):**
Array de quinielas (sin partidos embebidos, solo metadatos y resumen).

---

#### GET /quinielas-personalizadas/{quiniela_id}

Obtiene la quiniela completa con todos los partidos y análisis.

**Response (200):**
```json
{
  "id": "64f3e1a2b5c6d7e8f9g0h1i2",
  "nombre": "Mi quiniela del fin de semana",
  "descripcion": "Liga MX + Champions seleccion propia",
  "estado": "analizada",
  "perfil": {
    "presupuesto": 150,
    "objetivo_aciertos": 8,
    "max_triples": null,
    "max_dobles": null
  },
  "partidos": [
    {
      "num": 1,
      "seccion": "quiniela",
      "local": "Cruz Azul",
      "visitante": "Club America",
      "local_api": "Cruz Azul",
      "visitante_api": "Club America",
      "liga": "Liga MX",
      "liga_api": "Liga MX",
      "league_id": 262,
      "fecha": "2026-09-14",
      "hora": "21:00",
      "fixture_id": 1234567,
      "match_estado": "ok",
      "match_score": 1.0,
      "match_via": "seleccion_usuario",
      "match_candidatos": [],
      "prob_local": 45.2,
      "prob_empate": 32.1,
      "prob_visitante": 22.7,
      "prediccion_estado": "ok",
      "prediccion_error": null,
      "jugada": "Doble",
      "signo_favorito": "L",
      "signo_2": "E",
      "signo_3": null,
      "signos": ["L", "E"],
      "signos_marcados": "LE",
      "prob_cobertura": 77.3,
      "resultado_real": null,
      "goles_local": null,
      "goles_visitante": null,
      "acierto": null,
      "acierto_baseline": null
    }
  ],
  "resumen": {
    "sencillos": 5,
    "dobles": 3,
    "triples": 0,
    "costo": 150,
    "objetivo_aciertos": 8,
    "prob_objetivo_pct": 42.3,
    "aciertos_esperados": 7.2,
    "baseline_prob_objetivo_pct": 5.1,
    "baseline_aciertos_esperados": 4.8,
    "partidos_con_resultado": 0,
    "aciertos": null,
    "acierto_pct": null,
    "baseline_aciertos": null,
    "baseline_acierto_pct": null,
    "actualizado_en": "2026-09-10T14:35:22"
  },
  "warnings": [],
  "nota_metodologica": "...",
  "creado_en": "2026-09-10T14:23:45",
  "actualizado_en": "2026-09-10T14:35:22"
}
```

**Errores:**
- `404`: quiniela no encontrada

---

#### PATCH /quinielas-personalizadas/{quiniela_id}

Actualiza nombre y/o descripcion de la quiniela. Permitido en cualquier estado.

**Request:**
```json
{
  "nombre": "Mi quiniela actualizada",
  "descripcion": "Ahora con mas equipos"
}
```

Ambos campos son opcionales. Si se omiten, no se actualizan.

**Response (200):**
Quiniela completa.

**Errores:**
- `404`: quiniela no encontrada
- `500`: error generico

---

#### DELETE /quinielas-personalizadas/{quiniela_id}

Elimina una quiniela. Solo permitido si estado == "borrador" (no se puede deshacer un analisis).

**Response (204):** Sin contenido.

**Errores:**
- `404`: quiniela no encontrada
- `409`: quiniela no esta en estado "borrador" (ej. esta analizando)

---

#### PUT /quinielas-personalizadas/{quiniela_id}/partidos

Reemplaza todos los partidos de la quiniela. Solo permitido en estado "borrador".

**Request:**
```json
{
  "partidos": [
    {
      "fixture_id": 1234567,
      "home_team": "Equipo A",
      "away_team": "Equipo B",
      "league": "Liga Ejemplo",
      "league_id": 999,
      "date": "2026-09-15",
      "hora": "18:00"
    }
  ]
}
```

**Response (200):**
Quiniela completa con nuevos partidos en estado "borrador".

**Errores:**
- `404`: quiniela no encontrada
- `409`: quiniela no esta en estado "borrador"
- `400`: fixture_id duplicados o numero de partidos fuera de [2, 21]

---

#### POST /quinielas-personalizadas/{quiniela_id}/partidos

Agrega nuevos partidos al boleto existente (hasta maximo 21 totales). Solo permitido en estado "borrador".

**Request:**
```json
{
  "partidos": [
    {
      "fixture_id": 1234570,
      "home_team": "Nuevo Equipo",
      "away_team": "Rival",
      "league": "Liga Z",
      "league_id": 111,
      "date": "2026-09-16",
      "hora": "20:00"
    }
  ]
}
```

**Response (200):**
Quiniela con partidos agregados.

**Errores:**
- `404`: quiniela no encontrada
- `400`: fixture_id duplicados (ya presentes o entre nuevos), total de partidos superaria 21, fixture_id invalido
- `409`: quiniela no esta en estado "borrador"

---

#### DELETE /quinielas-personalizadas/{quiniela_id}/partidos/{fixture_id}

Remueve un partido individual del boleto. Solo permitido en estado "borrador".

**Response (200):**
Quiniela con el partido removido.

**Errores:**
- `404`: quiniela no encontrada o fixture_id no esta en el boleto
- `400`: remover dejaria menos de 2 partidos (minimo requerido)
- `409`: quiniela no esta en estado "borrador"

---

#### POST /quinielas-personalizadas/{quiniela_id}/analizar

Lanza el análisis en background: predice cada partido, aplica shrinkage, optimiza la asignacion de jugadas. Solo permitido en estado "borrador".

**Request:**
```json
{
  "presupuesto": 150,
  "objetivo_aciertos": 8,
  "max_triples": null,
  "max_dobles": null,
  "force": false,
  "dry_run": false
}
```

**Parametros:**
- `presupuesto` (requerido): 1-100000, numero de combinaciones para optimizar
- `objetivo_aciertos` (requerido): 1-N (donde N es numero de partidos del boleto)
- `max_triples` (opcional): limite maximo de partidos en modalidad Triple
- `max_dobles` (opcional): limite maximo de partidos en modalidad Doble
- `force` (default false): si true, reinicia el analisis aunque ya este en curso
- `dry_run` (default false): si true, ejecuta análisis pero no persiste (debug)

Validaciones:
- presupuesto fuera de [1, 100000] → 400
- objetivo_aciertos <= 0 o > N partidos → 400
- quiniela no en estado "borrador" → 409

**Response (202 / 200):**
```json
{
  "job_id": "custom:64f3e1a2b5c6d7e8f9g0h1i2",
  "estado": "iniciado",
  "perfil": {
    "presupuesto": 150,
    "objetivo_aciertos": 8,
    "max_triples": null,
    "max_dobles": null
  }
}
```

Si el job ya estaba en curso o ya terminado (sin `force`):
```json
{
  "job_id": "custom:64f3e1a2b5c6d7e8f9g0h1i2",
  "estado": "ya_en_curso"
}
```

o

```json
{
  "job_id": "custom:64f3e1a2b5c6d7e8f9g0h1i2",
  "estado": "ya_analizada"
}
```

**Errores:**
- `404`: quiniela no encontrada
- `400`: presupuesto/objetivo_aciertos fuera de rango
- `409`: quiniela no esta en estado "borrador"

---

#### GET /quinielas-personalizadas/{quiniela_id}/analizar/estado

Polling del estado del análisis en background. El job corre en paralelo; llamar cada 2-5 segundos hasta `estado: "done"` o `"partial"`.

**Response (200):**
```json
{
  "job_id": "custom:64f3e1a2b5c6d7e8f9g0h1i2",
  "estado": "running",
  "total": 8,
  "procesados": 5,
  "matched": 5,
  "needs_review": 0,
  "unmatched": 0,
  "api_calls": 5,
  "started_at": "2026-09-10T14:24:10.123456",
  "updated_at": "2026-09-10T14:24:35.654321",
  "motivo_error": null
}
```

Estados posibles:
- `running`: job en curso
- `done`: completado, 0 partidos sin prediccion
- `partial`: completado, 1+ partidos sin prediccion (no sucede normalmente en personalizadas; ocurre si la API de prediccion falla)
- `error`: falló, ver `motivo_error`

**Errores:**
- `404`: quiniela no encontrada

---

#### POST /quinielas-personalizadas/{quiniela_id}/optimizar

Re-optimiza con otro presupuesto/objetivo sin volver a predecir (las probabilidades estan congeladas). Respuesta sincrona en milisegundos. Permitido en estados "analizada", "parcial", "cerrada", "resuelta".

**Request:**
```json
{
  "presupuesto": 200,
  "objetivo_aciertos": 10,
  "max_triples": null,
  "max_dobles": null
}
```

**Response (200):**
Quiniela completa con nuevas asignaciones de `jugada`, `signos`, etc. Solo cambian los campos de `perfil` y `resumen`.

**Errores:**
- `404`: quiniela no encontrada
- `400`: presupuesto/objetivo_aciertos fuera de rango o quiniela nunca fue analizada

---

#### POST /quinielas-personalizadas/{quiniela_id}/sincronizar

Despues de que se juega la jornada, trae los resultados reales desde `predictions` y recalcula aciertos. Permitido en estados "analizada", "parcial", "cerrada", "resuelta".

**Response (200):**
Quiniela con:
- `resultado_real`, `goles_local`, `goles_visitante` por partido
- `acierto`, `acierto_baseline` por partido (true/false)
- `resumen.aciertos`, `resumen.acierto_pct`, etc. recalculados
- `estado` pasa a "resuelta"

**Errores:**
- `404`: quiniela no encontrada
- `500`: error al consultar predicciones

---

#### GET /quinielas-personalizadas/estadisticas

Agregados históricos: por estado, fechas, distribuciones de presupuesto, etc.

**Response (200):**
```json
{
  "total": 42,
  "por_estado": {
    "borrador": 5,
    "analizada": 28,
    "resuelta": 9
  },
  "presupuesto_promedio": 175,
  "aciertos_promedio_resuelta": 7.3,
  "jornadas_completadas": 9
}
```

---

### Flujo end-to-end para quinielas personalizadas

1. **Buscar fixtures**:
   - `GET /fixtures?date=2026-09-14` (o similar, con filtros)
   - `GET /leagues/search?q="Liga MX"`
   - El usuario ve lista de partidos disponibles

2. **Seleccionar partidos**:
   - El usuario elige 2-21 fixtures de la lista
   - Captura `fixture_id`, `home_team`, `away_team`, `league`, `league_id`, `date`

3. **Crear quiniela**:
   - `POST /quinielas-personalizadas` con nombre, descripcion, y array de fixtures
   - Respuesta: quiniela en estado "borrador", sin probabilidades ni jugadas

4. **Editar partidos (opcional, solo en borrador)**:
   - `PUT /quinielas-personalizadas/{id}/partidos` para reemplazar todos
   - `POST /quinielas-personalizadas/{id}/partidos` para agregar mas
   - `DELETE /quinielas-personalizadas/{id}/partidos/{fixture_id}` para quitar uno

5. **Analizar**:
   - `POST /quinielas-personalizadas/{id}/analizar` con presupuesto y objetivo explicitos
   - Respuesta inmediata: job_id, estado "iniciado"
   - Quiniela cambia a estado "analizando"

6. **Polling del análisis**:
   - Loop cada 2-5 segundos: `GET /quinielas-personalizadas/{id}/analizar/estado`
   - Mostrar progreso: "Analizados X de Y partidos..."
   - Cuando `estado: "done"` o `"partial"`, parar polling

7. **Visualizar boleto analizado**:
   - `GET /quinielas-personalizadas/{id}`
   - Mostrar probabilidades, jugadas asignadas, presupuesto, cobertura esperada

8. **Reoptimizar (opcional)**:
   - Usuario cambia presupuesto u objetivo
   - `POST /quinielas-personalizadas/{id}/optimizar`
   - Volver a paso 7 para refrescar visualizacion

9. **Sincronizar tras la jornada**:
   - Despues que se juega: `POST /quinielas-personalizadas/{id}/sincronizar`
   - Trae resultados reales, calcula aciertos, pasa a estado "resuelta"

10. **Consultar estadisticas**:
    - `GET /quinielas-personalizadas/estadisticas`
    - Ver agregados historicos de todas las quinielas personalizadas

---

### Maquina de estados

```
borrador
    |
    | (editar partidos: PUT/POST/DELETE)
    |
    v
  analizar (POST /quinielas-personalizadas/{id}/analizar)
    |
    v
analizando <-- polling hasta done/partial
    |
    +---> analizada (si todos los partidos predichos exitosamente)
    |
    +---> parcial (si 1+ partidos fuerondejados con prediccion fallida)
              |
              | (opcionalmente re-analizar con force=true)
              v
           analizada
    |
    v
  cerrada (automático tras fecha_max del boleto)
    |
    v
 sincronizar (POST /quinielas-personalizadas/{id}/sincronizar)
    |
    v
 resuelta (con resultados reales y aciertos calculados)

error (si falla análisis o sincronización)
```

**Transiciones y acciones permitidas por estado:**

| Estado | Acciones permitidas | Acciones bloqueadas |
|---|---|---|
| `borrador` | Editar partidos (PUT/POST/DELETE), Analizar, Actualizar meta (PATCH), Eliminar (DELETE) | — |
| `analizando` | Ver estado (polling) | Editar partidos, Analizar (sin force), Eliminar |
| `analizada` | Optimizar, Sincronizar, Actualizar meta, Exportar (si se implementa) | Editar partidos, Eliminar |
| `parcial` | Analizar (force=true), Optimizar, Sincronizar, Actualizar meta | Editar partidos sin re-analizar, Eliminar |
| `cerrada` | Optimizar, Sincronizar, Actualizar meta | Editar partidos, Eliminar |
| `resuelta` | Optimizar (con nuevos parametros), Actualizar meta | Editar partidos, Sincronizar de nuevo |
| `error` | Ver detalles del error, Actualizar meta | Cualquier otra operacion hasta re-crear |

---

### Limitaciones de la primera entrega

**Estas funcionalidades NO existen en v1 de quinielas personalizadas** (a diferencia de Progol). Planeadas para versiones futuras:

- **Override manual de signos:** No se puede forzar manualmente los signos de un partido en una quiniela personalizada. El usuario debe aceptar la asignacion optimizada o re-optimizar con otros parametros.
- **Export a .xlsx:** No hay endpoint de exportacion a Excel para quinielas personalizadas. El usuario debe capturar los datos desde la API o usar herramientas de terceros.
- **Perfiles preset:** No existen perfiles "conservador", "medio", "agresivo" como en Progol. El usuario siempre define presupuesto y objetivo explicitamente.

**Para futuros sprints:** Si necesitas override o export, es recomendable aguantar a que se implemente, o usar los datos crudos de la API REST (GET /quinielas-personalizadas/{id}) y procesarlos en el cliente.

---

### Ejemplos curl del flujo completo

**1. Crear una quiniela personalizada**

```bash
curl -X POST http://localhost:8000/quinielas-personalizadas \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "nombre": "Mi fin de semana personalizado",
  "descripcion": "MX + Champions, seleccion propia",
  "partidos": [
    {
      "fixture_id": 1234567,
      "home_team": "Cruz Azul",
      "away_team": "Club America",
      "league": "Liga MX",
      "league_id": 262,
      "date": "2026-09-14",
      "hora": "21:00"
    },
    {
      "fixture_id": 1234568,
      "home_team": "Manchester City",
      "away_team": "Liverpool",
      "league": "Premier League",
      "league_id": 39,
      "date": "2026-09-14",
      "hora": "13:00"
    }
  ]
}
EOF

# Capturar el ID
QUINIELA_ID="64f3e1a2b5c6d7e8f9g0h1i2"
```

**2. Listar quinielas personalizadas en estado "borrador"**

```bash
curl -s "http://localhost:8000/quinielas-personalizadas?estado=borrador&limit=10" | jq '.[] | {id, nombre, estado}'
```

**3. Agregar mas partidos al boleto (mientras esta en borrador)**

```bash
curl -X POST http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID/partidos \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "partidos": [
    {
      "fixture_id": 1234569,
      "home_team": "Real Madrid",
      "away_team": "Barcelona",
      "league": "La Liga",
      "league_id": 140,
      "date": "2026-09-15",
      "hora": "20:00"
    }
  ]
}
EOF
```

**4. Lanzar análisis con presupuesto y objetivo personalizados**

```bash
curl -X POST http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID/analizar \
  -H "Content-Type: application/json" \
  -d '{
    "presupuesto": 150,
    "objetivo_aciertos": 8,
    "max_triples": null,
    "max_dobles": null,
    "force": false,
    "dry_run": false
  }'

# Captura el job_id de la respuesta
JOB_ID="custom:64f3e1a2b5c6d7e8f9g0h1i2"
```

**5. Polling del estado del análisis (cada 3 segundos)**

```bash
while true; do
  ESTADO=$(curl -s http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID/analizar/estado)
  STATUS=$(echo $ESTADO | jq -r '.estado')
  PROCESADOS=$(echo $ESTADO | jq -r '.procesados')
  TOTAL=$(echo $ESTADO | jq -r '.total')
  
  echo "Estado: $STATUS ($PROCESADOS/$TOTAL)"
  
  if [ "$STATUS" = "done" ] || [ "$STATUS" = "partial" ]; then
    echo "Análisis terminado"
    break
  fi
  
  sleep 3
done
```

**6. Obtener la quiniela completa analizada**

```bash
curl -s http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID | jq '{
  estado: .estado,
  perfil: .perfil,
  resumen: {
    sencillos: .resumen.sencillos,
    dobles: .resumen.dobles,
    triples: .resumen.triples,
    costo: .resumen.costo,
    prob_objetivo_pct: .resumen.prob_objetivo_pct,
    aciertos_esperados: .resumen.aciertos_esperados
  },
  partidos: [.partidos[] | {
    num: .num,
    local: .local,
    visitante: .visitante,
    jugada: .jugada,
    signos: .signos_marcados,
    prob_cobertura: .prob_cobertura
  }]
}'
```

**7. Re-optimizar con presupuesto mayor**

```bash
curl -X POST http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID/optimizar \
  -H "Content-Type: application/json" \
  -d '{
    "presupuesto": 250,
    "objetivo_aciertos": 10,
    "max_triples": null,
    "max_dobles": null
  }'
```

**8. Sincronizar resultados tras la jornada**

```bash
curl -X POST http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID/sincronizar
```

**9. Consultar estadisticas históricas de personalizadas**

```bash
curl -s http://localhost:8000/quinielas-personalizadas/estadisticas | jq '.'
```

**10. Eliminar una quiniela en estado "borrador"**

```bash
curl -X DELETE http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID
# Respuesta: 204 (sin contenido)

# Intentar eliminar una que no esta en borrador (409):
curl -X DELETE http://localhost:8000/quinielas-personalizadas/$QUINIELA_ID
# {"detail": "Quiniela personalizada no esta en estado borrador"}
```

---

## Notas de implementación para el frontend

### Notas comunes (Progol + Personalizadas)

1. **Todos los porcentajes en la respuesta están en rango 0-100**, no 0-1.
2. **Todas las fechas se devuelven en formato ISO 8601** (`YYYY-MM-DDThh:mm:ss`), excepto los campos `fecha` de partidos que son `YYYY-MM-DD` (solo fecha, sin hora).
3. **El campo `nota_metodologica` se incluye en cada respuesta** de GET. Usa su contenido en un tooltip o footer para educar al usuario.
4. **El campo `fixture_id` es crítico.** Es el identificador de api-sports usado para posteriores predicciones y resultados. Si es nulo tras análisis, esa fila quedó `unmatched` (Progol) o sin predicción (Personalizadas) y necesita corrección.
5. **Warnings.** El campo `warnings` es un array de `{ type, message }`. Muestra todos en un banner o toast. Los tipos esperados son `partido_sin_prediccion`, `partido_sin_match` (durante análisis).

### Notas específicas para Progol

6. **La importación automática funciona** (`POST /quinielas/importar/web`). Es la vía principal y recomendada. `POST /quinielas/importar/manual` es el respaldo para cuando la fuente aún no publica el boleto, o necesites cargar uno a mano. Cada modalidad (fin_semana, media_semana) tiene su propio concurso y fecha de cierre — la UI debe permitir elegir claramente cuál modalidad deseas.
7. **Los perfiles no pueden cambiar tras analizar.** Si el usuario quiere otra asignación con el mismo presupuesto, usa `POST /quinielas/{id}/optimizar` (rápido, no re-predice).
8. **Aislamiento de secciones.** Quiniela y Revancha se optimizan por separado con presupuestos distintos. El costo total es suma de ambas secciones. Mostrar ambas en el resumen.
9. **Sobrescritura de nombres.** Los campos `local`, `visitante` guardan el nombre tal como aparece en el boleto Progol (para auditoría). Los campos `local_api`, `visitante_api` contienen el nombre canónico de api-sports (para búsqueda y predicción). Mostrar ambos en debug si es necesario, pero en UI normal muestra solo los de Progol.

### Notas específicas para Quinielas Personalizadas

10. **Prefijo diferente:** Los endpoints están bajo `/quinielas-personalizadas`, no `/quinielas`, para evitar colisiones de routing con Progol.
11. **No hay matching de nombres:** Dado que el usuario elige el fixture directamente desde `GET /fixtures`, no hay necesidad de traducir nombres ni de estados `needs_review`. Todos los partidos inician con `match_via: "seleccion_usuario"` y `match_estado: "ok"`.
12. **Presupuesto y objetivo siempre personalizados:** A diferencia de Progol (que tiene perfiles preset), las personalizadas requieren que el usuario especifique presupuesto y objetivo_aciertos explícitamente en `POST /analizar`. No hay perfiles; usa directamente los valores ingresados.
13. **Una sola sección:** No existe sección "revancha". Todos los partidos van en sección "quiniela". El resumen tiene un unico desglose de sencillos/dobles/triples con un costo total único.
14. **Rango de fechas derivado:** Los campos `fecha_min` y `fecha_max` se calculan automaticamente del menor/mayor `fecha` entre los partidos. Usalos para filtros en listado, pero el usuario no puede editarlos (son derivados).
15. **Sin override ni export en v1:** No hay `POST /override` ni `GET /export` para personalizadas en esta entrega. Si el usuario necesita cambiar signos, debe reoptimizar. Si necesita descargar, captura desde la API REST o usa herramientas externas.
