# Soccer Prediction Engine — Frontend

Interfaz web para el motor de predicción de partidos de fútbol. Permite consultar fixtures próximos, predecir resultados de ligas de clubes e internacionales, revisar el historial de predicciones y administrar la recolección de datos y el reentrenamiento de modelos ML, todo desde el navegador.

## Prerrequisitos

- Node.js ≥ 18
- Backend corriendo en `http://localhost:8001` (el proxy de Vite lo expone como `/api`)

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

## Configuración del backend

El frontend usa el proxy de Vite definido en [`vite.config.js`](vite.config.js). Todas las rutas `/api/*` se reenvían al backend. Para cambiar el host del backend, edita el target del proxy:

```js
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8001',  // ← cambiar aquí
    rewrite: path => path.replace(/^\/api/, ''),
  }
}
```

En producción, configura el servidor web (nginx, Caddy, etc.) para hacer el mismo proxy.

## Estructura del proyecto

```
src/
  App.jsx               # Shell: navegación entre tabs y estado prefill
  api.js                # Todas las llamadas al backend
  data.js               # Constantes: ligas, equipos, selecciones
  App.css               # Importador de estilos
  components/
    FixturesTab.jsx     # Búsqueda de partidos próximos
    PredictTab.jsx      # Predicción de ligas de clubes
    PredictWCTab.jsx    # Predicción de torneos internacionales
    HistoryTab.jsx      # Historial y estadísticas de predicciones
    AdminTab.jsx        # Panel de administración y entrenamiento
    ProbabilityResult.jsx  # Resultado con barras de probabilidad
    MatchStatsSection.jsx  # Estadísticas esperadas del partido
  styles/
    tokens.css          # Variables CSS: colores, fuentes, radios
    base.css            # Reset, animaciones, helpers
    layout.css          # Header, tabs, modo de acento
    components.css      # Paneles, botones, inputs, badges
    PredictTab.css      # Barras de probabilidad y resultado
    FixturesTab.css     # Tarjetas de fixture
    HistoryTab.css      # Tarjetas del historial
    MatchStats.css      # Visualización de estadísticas
    AdminTab.css        # Controles del panel admin
```

## Documentación

| Documento | Descripción |
|---|---|
| [Guía de usuario](docs/guia-usuario.md) | Cómo usar cada tab desde el navegador |
| [Arquitectura técnica](docs/arquitectura.md) | Diseño de componentes, estado y navegación |
| [Referencia de la API](docs/api-referencia.md) | Todos los endpoints del backend con ejemplos |

## Cómo extender el proyecto

### Agregar una liga o equipo

Edita [`src/data.js`](src/data.js):

1. **Liga de clubes:** agrégala a `CLUB_LEAGUES` y añade su lista de equipos en `TEAMS_BY_LEAGUE`.
2. **Torneo internacional:** agrégala a `INTL_LEAGUES`. Si el nombre no contiene ninguna de las palabras clave de `INTL_KEYWORDS`, añádela.
3. **Equipos de una liga existente:** edita la lista correspondiente en `TEAMS_BY_LEAGUE`.

### Agregar un endpoint nuevo

1. Añade el método al objeto `api` en [`src/api.js`](src/api.js) usando `fetchJSON`.
2. Consúmelo en el componente correspondiente.

### Agregar una tab nueva

1. Añade la entrada al array `TABS` en [`src/App.jsx`](src/App.jsx).
2. Crea el componente en `src/components/`.
3. Añade el renderizado condicional en el `return` de `App`.
