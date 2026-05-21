# Arquitectura técnica — Frontend

Documentación de diseño para desarrolladores que trabajan en este repositorio.

## Índice

- [Stack y dependencias](#stack-y-dependencias)
- [Estructura de archivos](#estructura-de-archivos)
- [Navegación y estado global](#navegación-y-estado-global)
- [Componentes](#componentes)
- [Capa de API](#capa-de-api)
- [Datos estáticos](#datos-estáticos)
- [Sistema de estilos](#sistema-de-estilos)
- [Flujos principales](#flujos-principales)

---

## Stack y dependencias

| Tecnología | Versión | Rol |
|---|---|---|
| React | 18 | UI framework |
| Vite | 6 | Bundler / dev server / proxy |
| JavaScript / JSX | — | Lenguaje (sin TypeScript) |

Sin librerías de routing, estado global, CSS framework ni test runner.

---

## Estructura de archivos

```
src/
  App.jsx               # Raíz: tab state, prefill state, modos de acento
  api.js                # Todas las llamadas HTTP al backend
  data.js               # Constantes de dominio (ligas, equipos, selecciones)
  App.css               # Importador de hojas de estilo
  main.jsx              # Entry point React
  components/
    FixturesTab.jsx
    PredictTab.jsx
    PredictWCTab.jsx
    HistoryTab.jsx
    AdminTab.jsx
    ProbabilityResult.jsx
    MatchStatsSection.jsx
  styles/
    tokens.css          # Variables CSS (paleta, fuentes, radios)
    base.css            # Reset HTML, keyframes, utilidades
    layout.css          # Shell, header, tabs, overrides de modo
    components.css      # Panels, inputs, buttons, badges, spinners
    PredictTab.css      # Barras de probabilidad y resultado
    FixturesTab.css     # Grid de tarjetas de fixture
    HistoryTab.css      # Tarjetas del historial
    MatchStats.css      # Barras de estadísticas duales
    AdminTab.css        # Secciones de admin
```

---

## Navegación y estado global

No hay router library. `App.jsx` gestiona todo mediante `useState`:

```jsx
const [tab, setTab]       = useState('fixtures')  // tab activa
const [prefill, setPrefill] = useState(null)       // datos de pre-relleno
```

### Tabs disponibles

```js
const TABS = [
  { id: 'fixtures', label: 'Fixtures',  icon: '📅', mode: 'mode-fix'   },
  { id: 'predict',  label: 'Predecir',  icon: '⚽', mode: 'mode-club'  },
  { id: 'wc',       label: 'Mundial',   icon: '🏆', mode: 'mode-intl'  },
  { id: 'history',  label: 'Historial', icon: '📋', mode: 'mode-hist'  },
  { id: 'admin',    label: 'Admin',     icon: '⚙', mode: 'mode-admin' },
]
```

Cada tab tiene un `mode` que se aplica como clase CSS al wrapper del contenido, activando los colores de acento correspondientes vía CSS custom properties.

### Renderizado condicional

`FixturesTab` se monta una vez y se oculta con `display: none` (para preservar el estado del formulario entre navegaciones). El resto de tabs se montan/desmontan con renderizado condicional:

```jsx
<div style={{ display: tab === 'fixtures' ? '' : 'none' }}>
  <FixturesTab onPredict={handlePredict} />
</div>
{tab === 'predict'  && <PredictTab   prefill={prefill} />}
{tab === 'wc'       && <PredictWCTab prefill={prefill} />}
{tab === 'history'  && <HistoryTab />}
{tab === 'admin'    && <AdminTab />}
```

### Flujo de prefill (Fixtures → Predict)

```
FixturesTab
  └─ onPredict(data)
       ↓
App.handlePredict(data)
  ├─ setPrefill(data)
  └─ setTab(data.isWC ? 'wc' : 'predict')
       ↓
PredictTab / PredictWCTab
  └─ useEffect([prefill]) → rellena campos del formulario
```

El objeto `prefill` tiene esta forma:

```js
{
  home:     string,   // equipo local
  away:     string,   // equipo visitante
  league:   string,   // nombre de liga
  date:     string,   // YYYY-MM-DD
  season:   string,   // opcional
  leagueId: string,   // opcional, ID de liga en la fuente de datos
  country:  string,   // opcional
  isWC:     boolean,  // true = torneo internacional
}
```

---

## Componentes

### FixturesTab

**Responsabilidad:** Buscar y listar partidos próximos; invocar `onPredict`.

**Props:**
- `onPredict(data)` — callback que recibe el objeto prefill cuando el usuario hace clic en "Predecir" sobre una tarjeta.

**Estado local:** `loading`, `error`, `fixtures[]`

**Comportamiento especial:** `FixturesTab` no se desmonta al cambiar de tab (se oculta con CSS). Esto preserva los resultados de búsqueda entre navegaciones.

---

### PredictTab

**Responsabilidad:** Formulario de predicción para ligas de clubes.

**Props:**
- `prefill` — objeto de prefill proveniente de App (nullable). Si cambia, un `useEffect` rellena los campos del formulario automáticamente.

**Estado local:** `loading`, `error`, `result`, y un campo por cada input del formulario (`league`, `home`, `away`, `date`, `season`, `leagueId`, `country`).

**Autocompletado de equipos:** El campo de equipos lee `data.getTeamSuggestions(league)` reactivamente al cambiar la liga seleccionada.

---

### PredictWCTab

Idéntico a PredictTab pero consume `api.predictWC` y usa `INTL_LEAGUES` y `NATIONAL_TEAMS` de `data.js`.

---

### HistoryTab

**Responsabilidad:** Filtrar, paginar, visualizar y exportar el historial de predicciones.

**Estado local:** campos de filtros, `loading`, `error`, `predictions[]`, `stats`, `skip` (paginación), `toast`.

**Paginación:** `skip` se incrementa en 20 al hacer clic en "Cargar más". Al cambiar cualquier filtro, `skip` se resetea a 0.

**Eliminación:** Llama a `api.deletePrediction(id)` y filtra el item del estado local sin refetch.

**Exportación:** Llama a `api.exportHistoryUrl(filters)` para construir la URL y la abre en una nueva pestaña.

---

### AdminTab

**Responsabilidad:** Panel de administración con 5 secciones independientes, cada una como sub-componente interno:

| Sub-componente | Función |
|---|---|
| `CollectSection` | Inicia jobs de recolección de datos históricos; muestra estado en polling |
| `TrainSection` | Dispara reentrenamiento de modelos (clubes / WC) |
| `ResolveSection` | Resuelve predicciones pendientes contra resultados reales |
| `TrainedLeaguesSection` | Lista ligas con datos de entrenamiento |
| `LeagueSearchSection` | Busca ligas en la fuente de datos externa |

**Polling de status:** `CollectSection` hace polling cada 3 s a `api.collectStatus()` mientras haya jobs activos. Se limpia el intervalo con `clearInterval` en el `useEffect` cleanup.

---

### ProbabilityResult

**Responsabilidad:** Componente presentacional puro. Recibe `result` y renderiza las barras de probabilidad y las estadísticas del partido.

**Props:**
```js
result: {
  home_team:     string,
  away_team:     string,
  league:        string,
  date:          string,         // YYYY-MM-DD
  probabilities: {
    home_win_prob: number,       // 0–100
    draw_prob:     number,
    away_win_prob: number,
  },
  match_stats:   object | null,  // ver MatchStatsSection
}
```

**Animación de barras:** Las barras se animan con `requestAnimationFrame` para expandirse desde 0 % hasta el valor final. Se usa `useRef` + `useEffect` para el ciclo de animación.

---

### MatchStatsSection

**Responsabilidad:** Muestra estadísticas de partido esperadas en barras duales o compactas.

**Props:**
- `stats` — objeto con propiedades `home_xg`, `away_xg`, `expected_total_goals`, `home_fouls_avg_l5`, `away_fouls_avg_l5`, `home_yellow_cards_l5`, `away_yellow_cards_l5`, `home_corners_avg_l5`, `away_corners_avg_l5`
- `homeTeam` — nombre del equipo local
- `awayTeam` — nombre del equipo visitante
- `compact` — boolean (default `false`). En modo compacto usa un layout de dos columnas más denso

**Componente interno `StatDualBar`:** Barra bidireccional (local izquierda, visitante derecha) con animación `requestAnimationFrame`.

---

## Capa de API

Toda la comunicación con el backend está en [`src/api.js`](../src/api.js). La función `fetchJSON` centraliza:

- La construcción de la URL base (`/api`)
- El manejo de errores de red (sin conexión)
- El parseo de JSON y el lanzamiento de `Error` con `data.detail` si `res.ok === false`

```js
async function fetchJSON(path, opts = {}) {
  let res
  try {
    res = await fetch(BASE + path, opts)
  } catch {
    throw new Error('No se pudo conectar con el servidor...')
  }
  const data = await res.json().catch(() => ({ detail: res.statusText }))
  if (!res.ok) throw new Error(data.detail || res.statusText)
  return data
}
```

Los componentes consumen `api.*` directamente en sus handlers y efectos. No hay capa de caché ni librería de fetching (sin React Query, SWR, etc.).

---

## Datos estáticos

`src/data.js` centraliza todas las constantes del dominio:

| Export | Tipo | Descripción |
|---|---|---|
| `CLUB_LEAGUES` | `string[]` | Lista de ligas de clubes disponibles |
| `INTL_LEAGUES` | `string[]` | Lista de torneos internacionales disponibles |
| `NATIONAL_TEAMS` | `string[]` | Selecciones nacionales para el modo WC |
| `TEAMS_BY_LEAGUE` | `Record<string, string[]>` | Equipos por liga de clubes |
| `isInternational(league)` | `function` | Detecta si una liga es internacional por palabras clave |
| `getTeamSuggestions(league)` | `function` | Retorna la lista de equipos de una liga o `[]` si no existe |
| `todayStr()` | `function` | Fecha actual en formato `YYYY-MM-DD` |

---

## Sistema de estilos

El sistema de estilos usa **CSS custom properties** sin ningún framework. Los archivos se importan en cascada desde `App.css`:

```
tokens.css   →  variables (colores, fuentes, radios)
base.css     →  reset, keyframes, utilidades globales
layout.css   →  shell, header, tabs, overrides de modo
components.css → paneles, inputs, botones, badges
[Tab].css    →  estilos específicos de cada tab
```

### Tokens de diseño

```css
/* Fondos */
--bg-0 .. --bg-3     /* negro → gris oscuro */
--surface            /* fondo de panel translúcido */

/* Texto */
--ink-0 .. --ink-4   /* blanco → gris muy oscuro */

/* Bordes */
--line-faint .. --line-hot

/* Acento de modo */
--c-accent           /* se sobreescribe con .mode-fix / .mode-club / etc. */
--c-accent-deep
--c-accent-glow

/* Colores de acento por modo */
--c-club  --c-intl  --c-admin  --c-fix  --c-hist

/* Estados */
--c-ok    /* verde */
--c-warn  /* amarillo */
--c-bad   /* rojo */
```

### Cambio de modo de acento

`App.jsx` aplica la clase `.mode-{id}` al wrapper del contenido activo. `layout.css` sobreescribe `--c-accent` en ese scope:

```css
.mode-fix   { --c-accent: var(--c-fix);   ... }
.mode-club  { --c-accent: var(--c-club);  ... }
.mode-intl  { --c-accent: var(--c-intl);  ... }
.mode-hist  { --c-accent: var(--c-hist);  ... }
.mode-admin { --c-accent: var(--c-admin); ... }
```

Todos los componentes que usan `var(--c-accent)` responden automáticamente al modo activo.

---

## Flujos principales

### Predicción desde Fixtures

```
Usuario selecciona fecha → FixturesTab fetcha /fixtures
                                               ↓
                         Muestra tarjetas con botón Predecir
                                               ↓
                         Usuario hace clic en Predecir
                                               ↓
                         onPredict(data) → App.handlePredict
                                               ↓
                         App: setTab('predict' | 'wc'), setPrefill(data)
                                               ↓
                         PredictTab/WCTab monta → useEffect(prefill)
                                               ↓
                         Rellena formulario → Usuario confirma
                                               ↓
                         api.predict() → muestra ProbabilityResult
```

### Recolección de datos en Admin

```
Usuario configura liga + temporadas → clic "Iniciar recolección"
                                               ↓
                         api.collect() → POST /admin/collect
                                               ↓
                         Estado: muestra jobs iniciados
                                               ↓
                         setInterval 3s → api.collectStatus()
                                               ↓
                         Actualiza estado de cada job en pantalla
                                               ↓
                         Cuando todos están DONE/ERROR → clearInterval
```
