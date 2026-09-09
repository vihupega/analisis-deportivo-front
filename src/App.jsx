import { useState } from 'react'
import FixturesTab from './components/FixturesTab.jsx'
import PredictTab from './components/PredictTab.jsx'
import PredictWCTab from './components/PredictWCTab.jsx'
import AdminTab from './components/AdminTab.jsx'
import HistoryTab from './components/HistoryTab.jsx'
import QuinielasTab from './components/quinielas/QuinielasTab.jsx'

const TABS = [
  { id: 'fixtures',  label: 'Fixtures',   icon: '📅', mode: 'mode-fix'   },
  { id: 'predict',   label: 'Predecir',   icon: '⚽', mode: 'mode-club'  },
  { id: 'wc',        label: 'Mundial',    icon: '🏆', mode: 'mode-intl'  },
  { id: 'quinielas', label: 'Quinielas',  icon: '🎟', mode: 'mode-quin'  },
  { id: 'history',   label: 'Historial',  icon: '📋', mode: 'mode-hist'  },
  { id: 'admin',     label: 'Admin',      icon: '⚙', mode: 'mode-admin' },
]

export default function App() {
  const [tab, setTab] = useState('fixtures')
  const [prefill, setPrefill] = useState(null)

  function handlePredict(data) {
    setPrefill(data)
    setTab(data.isWC ? 'wc' : 'predict')
  }

  const activeMode = TABS.find(t => t.id === tab)?.mode ?? 'mode-club'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">⚽</div>
          <div className="brand-text">
            <div className="brand-name">Soccer Prediction</div>
            <div className="brand-sub">Engine · v2.0</div>
          </div>
        </div>
        <div className="row gap-8" style={{ alignItems: 'center' }}>
          <span className="dot live" />
          <span className="t-mono text-dim" style={{ fontSize: 11, letterSpacing: '0.1em' }}>SISTEMA ACTIVO</span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            className={`tab ${t.mode} ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className={activeMode}>
        <div style={{ display: tab === 'fixtures' ? '' : 'none' }}>
          <FixturesTab onPredict={handlePredict} />
        </div>
        {tab === 'predict'  && <PredictTab   prefill={prefill} onTabChange={setTab} />}
        {tab === 'wc'        && <PredictWCTab prefill={prefill} onTabChange={setTab} />}
        {tab === 'quinielas' && <QuinielasTab />}
        {tab === 'history'   && <HistoryTab />}
        {tab === 'admin'     && <AdminTab />}
      </div>
    </div>
  )
}
