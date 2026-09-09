# Reporte de Análisis, Optimizaciones y Mejoras de Código
**Proyecto:** Engine de Análisis Deportivo (`C:\Proys\Analisis_Deportivo`)  
**Fecha:** {{date}}  
**Dirigido a:** Equipo de Desarrollo Backend y Data/ML  

---

## 📋 Resumen Ejecutivo

Este documento sintetiza el análisis técnico realizado sobre el código base del backend de **Análisis Deportivo** (Python / FastAPI / MongoDB / XGBoost / Redis). El objetivo es identificar cuellos de botella de rendimiento, vulnerabilidades de mantenibilidad, áreas de optimización de base de datos y mejores prácticas de arquitectura de Machine Learning.

En líneas generales, la arquitectura del sistema presenta un diseño modular con patrones claros (Clean Architecture / Domain-Driven Design adaptado). Sin embargo, existen oportunidades clave de optimización en el manejo de I/O de modelos en memoria, indización en MongoDB, eliminación de código duplicado y prevención de *Feature Drift*.

---

## 📊 Matriz de Diagnóstico y Priorización

| ID | Área | Descripción del Hallazgo | Impacto | Esfuerzo |
|---|---|---|---|---|
| **PERF-01** | ML Inferencia | Relectura continua de disco en modelo Poisson (`joblib.load`) | 🔴 Alto | 🟢 Bajo |
| **PERF-02** | Memoria / DB | Carga masiva e incondicional de fixtures para cálculo de Elo sin invalidación de caché | 🔴 Alto | 🟡 Medio |
| **DATA-01** | MongoDB | Falta de índices en colecciones `engineered_features` y `raw_fixtures` | 🔴 Alto | 🟢 Bajo |
| **CODE-01** | Calidad ML | Duplicación de lógica `_add_differential_features` entre entrenamiento e inferencia | 🟡 Medio | 🟢 Bajo |
| **CODE-02** | Refactor | Código duplicado en funciones de cálculo de Elo acumulado (`ml/elo.py`) | 🟢 Bajo | 🟢 Bajo |
| **SYS-01** | Filesystem | Carpeta anómala con nombre corrupto generada por concatenación de rutas en Windows | 🟢 Bajo | 🟢 Bajo |
| **ARCH-01** | Muestreo ML | Formato de serialización `.pkl` vs nativo `.ubj` en XGBoost | 🟢 Bajo | 🟡 Medio |
| **TEST-01** | QA | Cobertura limitada de pruebas unitarias (solo `test_elo.py`) | 🟡 Medio | 🟡 Medio |

---

## 🔴 1. Hallazgos de Alto Impacto: Rendimiento e I/O de ML

### 1.1 Ineficiencia e I/O innecesario en Modelo Poisson (`ml/trainer_poisson.py`)
* **Ubicación:** `ml/trainer_poisson.py` -> `predict_match_poisson()` (consumido por `/predict_poisson` y `prediction_service._expected_goals()`).
* **Problema:** En cada solicitud HTTP de predicción de un partido, el sistema ejecuta `joblib.load(MODEL_PATH_POISSON)`. Esto fuerza una lectura de disco síncrona y la deserialización completa de dos regresores XGBoost y metadatos por cada petición.
* **Impacto:** Latencia innecesaria en respuestas API (entre 50ms y 200ms adicionales por request) y contención de I/O de disco bajo concurrencia.
* **Solución Propuesta:** Centralizar y cachear el artefacto Poisson en memoria dentro de `ml/model_registry.py`, alineado con la estrategia usada para los clasificadores principales (`_model_cache` y `_model_wc_cache`).

```python
# Solución sugerida en ml/model_registry.py
_poisson_cache = None

def _load_model_poisson():
    global _poisson_cache
    if _poisson_cache is None:
        try:
            _poisson_cache = joblib.load(config.MODEL_PATH_POISSON)
        except FileNotFoundError:
            raise Exception("El modelo Poisson no ha sido entrenado aún.")
    return _poisson_cache

def invalidate_model_poisson_cache():
    global _poisson_cache
    _poisson_cache = None
```

---

### 1.2 Carga Masiva y Falta de Invalidación de Caché Elo (`ml/feature_engineering.py`)
* **Ubicación:** `ml/feature_engineering.py` -> `_get_elo_lookup()` y `_get_current_elo()`.
* **Problema:**
  1. `_get_elo_lookup()` ejecuta `get_raw_fixtures_collection().find({})` descargando **todos** los objetos de la colección `raw_fixtures` a memoria sin proyección de campos ni paginación.
  2. Las variables globales `_elo_lookup` y `_current_elo` residen en memoria sin un mecanismo de invalidadación de caché. Cuando se recolectan nuevos partidos o se resuelven predicciones, el Elo en vivo sigue calculándose con los valores previos en memoria hasta que el proceso de la API es reiniciado.
* **Impacto:** Mayor consumo de RAM a medida que crece la base de datos y riesgo de inconsistencia/desactualización en las métricas Elo en vivo.
* **Solución Propuesta:**
  1. Utilizar proyecciones en MongoDB para traer únicamente los campos requeridos (`fixture.id`, `teams`, `goals`, `fixture.date`).
  2. Implementar una función `invalidate_elo_cache()` e invocarla automáticamente al finalizar jobs de recolección (`training_service.run_collect`) o resolución (`resolution_service.resolve_pending`).

---

### 1.3 Duplicación de Lógica y Riesgo de *Feature Drift* (`_add_differential_features`)
* **Ubicación:** `ml/trainer.py` y `ml/model_registry.py`.
* **Problema:** La función `_add_differential_features(X)` está definida idénticamente en dos archivos distintos.
* **Impacto:** Riesgo alto de *Feature Drift* (desincronización entre las características usadas durante el entrenamiento y las calculadas en inferencia) si un desarrollador modifica o añade métricas en `trainer.py` pero olvida replicarlo en `model_registry.py`.
* **Solución Propuesta:** Mover `_add_differential_features` a un módulo centralizado (`ml/feature_engineering.py` o `ml/constants.py`) y reutilizarla por importación.

---

## 🟡 2. Hallazgos de Medio Impacto: Base de Datos y Mantenibilidad

### 2.1 Falta de Índices Estratégicos en MongoDB (`database.py`)
* **Ubicación:** `database.py` -> `ensure_predictions_indexes()`.
* **Problema:** Actualmente solo existen índices únicos y compuestos sobre la colección `predictions`. Colecciones con alto volumen de lecturas/escrituras como `engineered_features`, `raw_fixtures` y `collect_jobs` carecen de índices explícitos.
* **Impacto:** Las búsquedas por `fixture_id`, `match_date` o `tournament_type` realizan *CollScans* (escaneos completos de colección), degradando exponencialmente las operaciones de entrenamiento, recolección e inserción.
* **Solución Propuesta:** Ampliar la creación de índices en la inicialización de la base de datos:

```python
# Solución sugerida en database.py
def ensure_all_indexes():
    ensure_predictions_indexes()
    
    # engineered_features
    get_features_collection().create_index([("fixture_id", 1)], unique=True)
    get_features_collection().create_index([("match_date", -1), ("tournament_type", 1)])
    
    # raw_fixtures
    get_raw_fixtures_collection().create_index([("fixture.id", 1)], unique=True)
    get_raw_fixtures_collection().create_index([("fixture.date", -1)])
    
    # collect_jobs
    get_collect_jobs_collection().create_index([("job_id", 1)], unique=True)
```

---

### 2.2 Anomalía de Directorio Corrupto por Concatenación de Rutas en Windows
* **Ubicación:** `C:\Proys\Analisis_Deportivo\cProysAnalisis_Deportivoanalysis`
* **Problema:** Se detectó la presencia de una carpeta creada con una sintaxis corrupta de ruta (`cProys...`). Esto suele ser causado por un script auxiliar que concatenó cadenas de texto de rutas de Windows sin usar `os.path.join` o `pathlib.Path`.
* **Solución Propuesta:**
  1. Eliminar de forma segura la carpeta vacía corrupta.
  2. Auditar scripts en `scripts/` o `analysis/` para asegurar el uso estricto de `pathlib.Path` al manipular rutas del sistema de archivos.

---

## 🟢 3. Hallazgos de Calidad de Código, Refactorización y Formato

### 3.1 Unificación de Métodos Elo (`ml/elo.py`)
* **Ubicación:** `ml/elo.py` -> `get_current_elo()` vs `get_current_elo_with_games()`.
* **Problema:** Ambas funciones contienen ~40 líneas de lógica de iteración idéntica para procesar el histórico de partidos y actualizar los ratings Elo.
* **Solución Propuesta:** Reducir la duplicación haciendo que `get_current_elo()` consuma la tupla de `get_current_elo_with_games()`:

```python
# Refactorización sugerida en ml/elo.py
def get_current_elo(raw_fixtures: Iterable[dict]) -> dict[int, float]:
    ratings, _ = get_current_elo_with_games(raw_fixtures)
    return ratings
```

---

### 3.2 Migración de Formato de Serialización XGBoost (`.pkl` -> `.ubj` / `.json`)
* **Problema:** Al cargar modelos Pickle (`.pkl`) de XGBoost, la librería emite advertencias estándar recomendando el uso de formatos nativos (`.json` o Universal Binary JSON `.ubj`).
* **Impacto:** Los archivos `.pkl` dependen del runtime interno de Python y versión exacta de XGBoost, dificultando migraciones o ejecuciones en entornos diversos.
* **Solución Propuesta:** Migrar progresivamente el guardado y carga de artefactos a `booster.save_model("model.ubj")` / `booster.load_model("model.ubj")`.

---

## 🛡️ 4. Recomendaciones de Testing, Resiliencia y Arquitectura

### 4.1 Ampliación de Cobertura de Pruebas Unitarias
* **Estado Actual:** Únicamente existe la suite `tests/test_elo.py`.
* **Riesgo:** Cambios en la lógica de resolución, cálculo de probabilidades o extracción de features pueden introducir regresiones silenciosas en producción.
* **Plan de Pruebas Recomendado:**
  1. `tests/test_prediction_service.py`: Validar la generación de respuestas, cálculo de confianza y alertas de *cold start*.
  2. `tests/test_resolution_service.py`: Verificar la lógica de evaluación de acierto (`is_correct`) y actualización de estados (`PENDING` -> `RESOLVED`).
  3. `tests/test_feature_engineering.py`: Garantizar la consistencia en el cálculo de promedios móviles (forma, goles, xG) sin filtración temporal de datos (*data leakage*).

---

### 4.2 Resiliencia en Conexión Redis e Integraciones de API Externa
* **Observación:** El cliente Redis (`api_client._redis`) maneja excepciones en el arranque para operar sin caché si no está disponible.
* **Mejora:** En caso de fallos intermitentes de red durante operaciones en vivo (`get_h2h`, `get_standings`), se recomienda agregar *retry decorator* o *circuit breaker* para evitar fallos en cascada hacia la API externa (`v3.football.api-sports.io`).

---

## 🚀 Plan de Acción y Hoja de Ruta de Implementación

Para ejecutar estas optimizaciones con el menor riesgo operacional, se sugiere el siguiente orden de trabajo:

```
[Fase 1: Correcciones Inmediatas (Quick Wins)]
 ├── Cargar modelo Poisson en memoria (ml/model_registry.py)
 ├── Crear índices en MongoDB para engineered_features y raw_fixtures (database.py)
 └── Centralizar _add_differential_features en un único módulo

[Fase 2: Optimización de Recursos y Memoria]
 ├── Implementar invalidación y proyecciones en caché Elo (ml/feature_engineering.py)
 ├── Unificar métodos duplicados en ml/elo.py
 └── Limpiar directorio anómalo corrupto en Windows

[Fase 3: Resiliencia y Calidad de Código]
 ├── Implementar suite de pruebas unitarias para servicios y features
 └── Migrar serialización de modelos a formato nativo .ubj de XGBoost
```

---

*Reporte generado automáticamente como parte del análisis de arquitectura y optimización de código.*
