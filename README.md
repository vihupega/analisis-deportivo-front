# Soccer Prediction Engine — Frontend

Interfaz web para el motor de predicción de partidos de fútbol. Permite consultar fixtures, predecir resultados de ligas de clubes e internacionales, y administrar la recolección de datos y el reentrenamiento de modelos ML desde el navegador.

## Prerrequisitos

- Node.js ≥ 18
- El backend corriendo en `http://localhost:8000` (ver repositorio del backend)

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev
# → http://localhost:5173
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia Vite con HMR en `http://localhost:5173` |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve el build de producción localmente |

No hay test runner ni linter configurados.

## Configuración

La URL del backend está hardcodeada en [`src/api.js`](src/api.js):

```js
const BASE = 'http://localhost:8000'
```

Cambia este valor si el backend corre en otro host o puerto. No hay archivo `.env` en uso actualmente.

---

## Arquitectura

### Navegación entre tabs

No hay router library. [`src/App.jsx`](src/App.jsx) mantiene el estado `tab` (tipo `'fixtures' | 'predict' | 'wc' | 'admin'`) y renderiza condicionalmente uno de los cuatro componentes principales.

La comunicación entre tabs se hace a través del estado `prefill` en `App`:

```
FixturesTab
  └─ onPredict(data) → App.handlePredict()
       ├─ data.isWC === true  → setTab('wc')  + setPrefill(data)
       └─ data.isWC === false → setTab('predict') + setPrefill(data)
```

Al navegar a la tab de predicción, el `useEffect` de `PredictTab` / `PredictWCTab` detecta el cambio en `prefill` y rellena el formulario automáticamente.

### Capa de API

Todas las llamadas al backend están centralizadas en [`src/api.js`](src/api.js). El objeto `api` expone los siguientes métodos:

| Método | HTTP | Endpoint | Uso |
|---|---|---|---|
| `api.getFixtures(date, league?)` | GET | `/fixtures` | Buscar partidos por fecha y liga |
| `api.predict(home, away, league, date)` | GET | `/predict` | Predicción para ligas de clubes |
| `api.predictWC(home, away, league, date)` | GET | `/predict/wc` | Predicción para competencias internacionales |
| `api.collect(league, seasons, type, minPrior, force)` | POST | `/admin/collect` | Iniciar recolección de datos históricos |
| `api.collectStatus()` | POST | `/admin/collect/status` | Consultar estado de los jobs de recolección |
| `api.train()` | POST | `/admin/train` | Reentrenar modelo de clubes |
| `api.trainWC()` | POST | `/admin/train/wc` | Reentrenar modelo internacional |

Todos los métodos retornan la respuesta JSON parseada. En caso de error HTTP, lanzan un `Error` con el `detail` del cuerpo de la respuesta.

### Datos estáticos

[`src/data.js`](src/data.js) centraliza las constantes del dominio:

- `CLUB_LEAGUES` — ligas de clubes disponibles
- `INTL_LEAGUES` — competencias internacionales disponibles
- `TEAMS_BY_LEAGUE` — plantillas de equipos por liga (usado para el `<datalist>` de autocompletado)
- `NATIONAL_TEAMS` — selecciones nacionales para el modo Copa Mundial
- `isInternational(league)` — determina si una liga es internacional basándose en palabras clave; usado en `App` para decidir a qué tab redirigir desde Fixtures

### Resultado de predicción

[`src/components/ProbabilityResult.jsx`](src/components/ProbabilityResult.jsx) es un componente presentacional puro. Espera un objeto `result` con esta forma:

```json
{
  "home_team": "Real Madrid",
  "away_team": "FC Barcelona",
  "league": "La Liga",
  "date": "2026-05-15",
  "probabilities": {
    "home_win_prob": 45.2,
    "draw_prob": 27.1,
    "away_win_prob": 27.7
  }
}
```

Los valores de probabilidad son porcentajes (0–100). El equipo con la probabilidad más alta se resalta en verde.

---

## Cómo extender el proyecto

### Agregar una liga o equipo

Edita [`src/data.js`](src/data.js):

1. **Liga de clubes nueva:** agrégala al array `CLUB_LEAGUES` y añade su lista de equipos como nueva clave en `TEAMS_BY_LEAGUE`.
2. **Competencia internacional nueva:** agrégala al array `INTL_LEAGUES`. Si su nombre no contiene ninguna de las palabras clave de `INTL_KEYWORDS` (`world cup`, `copa`, `euro`, `nations`, `qualification`), añade la palabra clave correspondiente al array para que `isInternational()` la detecte correctamente.
3. **Equipos de una liga existente:** edita la lista correspondiente en `TEAMS_BY_LEAGUE`.

### Agregar un endpoint nuevo

1. Añade el método al objeto `api` en [`src/api.js`](src/api.js) usando `fetchJSON`.
2. Impleméntalo en el componente correspondiente.

### Agregar una tab nueva

1. Añade la entrada al array `TABS` en [`src/App.jsx`](src/App.jsx).
2. Crea el componente en `src/components/`.
3. Añade el renderizado condicional junto al resto de tabs en el `return` de `App`.
