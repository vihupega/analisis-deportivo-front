# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173 (Vite HMR)
npm run build    # Production build
npm run preview  # Preview production build
```

No test runner or linter is configured.

## Architecture

React 18 SPA (JavaScript/JSX, Vite 6) for a soccer match prediction interface. The backend REST API is expected at `http://localhost:8000` (hardcoded in [src/api.js](src/api.js)).

### Navigation

There is no router library. [src/App.jsx](src/App.jsx) tracks a single `tab` state (`'fixtures' | 'predict' | 'wc' | 'admin'`) and conditionally renders one of four components. Cross-tab communication uses a `prefill` state object passed as props — clicking a match in Fixtures prefills the Predict form.

### Key files

| File | Role |
|------|------|
| [src/api.js](src/api.js) | All fetch calls — single `fetchJSON(path, opts)` wrapper, all endpoints listed here |
| [src/data.js](src/data.js) | Hardcoded constants: league lists, team rosters per league, national teams; `isInternational(league)` determines club vs. World Cup path |
| [src/components/PredictTab.jsx](src/components/PredictTab.jsx) | Club league predictions |
| [src/components/PredictWCTab.jsx](src/components/PredictWCTab.jsx) | International/World Cup predictions |
| [src/components/AdminTab.jsx](src/components/AdminTab.jsx) | Data collection jobs and model retraining (polls `/admin/collect/status`) |
| [src/components/ProbabilityResult.jsx](src/components/ProbabilityResult.jsx) | Shared result display (probability bars) |

### State management

React hooks only — no Context, Redux, or Zustand. Each component owns its local state (form inputs, loading, error, result). The only cross-component state lives in `App.jsx` (`tab`, `prefill`).

### Styling

Single stylesheet [src/App.css](src/App.css) using CSS custom properties (variables). No CSS framework or CSS-in-JS library.

### Adding teams or leagues

Edit [src/data.js](src/data.js): add the league to the appropriate array and add its team list as a new key in `teamsByLeague`. The `isInternational` helper must also be updated if adding a new international competition.
