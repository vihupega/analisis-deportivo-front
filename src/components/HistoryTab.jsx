import { useState, useEffect } from 'react'
import { api } from '../api.js'
import MatchStatsSection from './MatchStatsSection.jsx'

const LIMIT = 20

const STATUS_OPTS = [
  { value: '',          label: 'Todos los estados' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'resolved',  label: 'Resueltos' },
  { value: 'cancelled', label: 'Cancelados' },
]

const MODEL_OPTS = [
  { value: '',      label: 'Todos los modelos' },
  { value: 'clubs', label: 'Clubes' },
  { value: 'wc',    label: 'Copa Mundial' },
]


export default function HistoryTab() {
  const [status,      setStatus]      = useState('')
  const [modelType,   setModelType]   = useState('')
  const [league,      setLeague]      = useState('')
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')
  const [correctness, setCorrectness] = useState('')
  const [skip,        setSkip]        = useState(0)

  const [predictions, setPredictions] = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [stats,       setStats]       = useState(null)
  const [toast,       setToast]       = useState(null)

  useEffect(() => {
    api.predictionsStats().then(setStats).catch(() => {})
  }, [])

  async function fetchHistory(customSkip) {
    const s = customSkip ?? skip
    setLoading(true); setError(null)
    try {
      const data = await api.predictionsHistory({ status, modelType, league, dateFrom, dateTo, correctness, limit: LIMIT, skip: s })
      setPredictions(Array.isArray(data) ? data : (data.items ?? data.predictions ?? []))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() { setSkip(0); fetchHistory(0) }

  async function handleDelete(id) {
    try {
      await api.deletePrediction(id)
      setPredictions(prev => prev.filter(p => p.fixture_id !== id))
      setToast({ msg: 'Predicción eliminada', ok: true })
    } catch (err) {
      setToast({ msg: err.message || 'Error al eliminar', ok: false })
    }
    setTimeout(() => setToast(null), 3500)
  }

  function handleExport() {
    const url = api.exportHistoryUrl({ status, modelType, league, dateFrom, dateTo, correctness })
    const a = document.createElement('a')
    a.href = url
    a.download = 'historial_predicciones.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handleNext() {
    const s = skip + LIMIT; setSkip(s); fetchHistory(s)
  }

  function handlePrev() {
    const s = Math.max(0, skip - LIMIT); setSkip(s); fetchHistory(s)
  }

  return (
    <div>
      <div className="panel">
        <div className="eyebrow">Historial de predicciones</div>
        <AccuracyStrip stats={stats} />

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="field">
            <label className="field-label">Estado</label>
            <select className="input" value={status} onChange={e => {
              setStatus(e.target.value)
              if (e.target.value !== 'resolved') setCorrectness('')
            }}>
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {status === 'resolved' && (
            <div className="field">
              <label className="field-label">Resultado</label>
              <div className="toggle-group">
                <button type="button"
                  className={`toggle-btn ${correctness === '' ? 'active' : ''}`}
                  onClick={() => setCorrectness('')}>Todos</button>
                <button type="button"
                  className={`toggle-btn ${correctness === 'correct' ? 'active correct' : ''}`}
                  onClick={() => setCorrectness('correct')}>✓ Correctos</button>
                <button type="button"
                  className={`toggle-btn ${correctness === 'incorrect' ? 'active wrong' : ''}`}
                  onClick={() => setCorrectness('incorrect')}>✗ Incorrectos</button>
              </div>
            </div>
          )}
          <div className="field">
            <label className="field-label">Modelo</label>
            <select className="input" value={modelType} onChange={e => setModelType(e.target.value)}>
              {MODEL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="field">
            <label className="field-label">Liga (búsqueda parcial)</label>
            <input className="input" type="text" value={league} placeholder="ej. La Liga"
              onChange={e => setLeague(e.target.value)} />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="field-label">Desde</label>
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Hasta</label>
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? <><span className="spinner" /> Buscando…</> : '🔍 Buscar'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleExport}
            style={{ borderColor: '#217346', color: '#217346' }}
            title="Descargar historial como Excel con los filtros activos"
          >
            ⬇ Excel
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {toast && (
        <div className={`alert ${toast.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 8 }}>
          {toast.msg}
        </div>
      )}

      {predictions !== null && (
        predictions.length === 0
          ? <div className="empty"><span className="icon">📋</span>No hay predicciones con esos filtros.</div>
          : (
            <>
              <div className="history-list">
                {predictions.map((p, i) => <PredictionCard key={p._id ?? p.fixture_id ?? i} prediction={p} onDelete={handleDelete} />)}
              </div>
              <div className="pagination-row">
                <span className="text-dim t-mono" style={{ fontSize: '0.78rem' }}>
                  Mostrando {skip + 1}–{skip + predictions.length}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={handlePrev} disabled={skip === 0 || loading}>
                  ← Anterior
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleNext}
                  disabled={predictions.length < LIMIT || loading}>
                  Siguiente →
                </button>
              </div>
            </>
          )
      )}
    </div>
  )
}

function PredictionCard({ prediction: p, onDelete }) {
  const probs    = p.probabilities ?? {}
  let homeProb   = probs.home_win_prob ?? 0
  let drawProb   = probs.draw_prob     ?? 0
  let awayProb   = probs.away_win_prob ?? 0
  if (homeProb + drawProb + awayProb <= 1.5) {
    homeProb *= 100; drawProb *= 100; awayProb *= 100
  }

  const predicted  = (homeProb || drawProb || awayProb)
    ? derivePredicted(homeProb, drawProb, awayProb)
    : (p.predicted_outcome ?? p.predicted_winner ?? null)
  const actual     = p.actual_outcome    ?? p.actual_winner    ?? null
  const status     = p.status ?? 'pending'
  const isCorrect  = p.is_correct  ?? p.correct        ?? null
  const probCorr   = p.prob_correct_outcome             ?? null
  const actualRes  = p.actual_result                    ?? null
  const modelType  = p.model_type ?? ''

  const [showStats,    setShowStats]    = useState(false)
  const [deleteStage,  setDeleteStage]  = useState(0)
  const hasStats = !!p.match_stats

  return (
    <div className="history-card">
      <div className="history-card-main">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fixture-teams" style={{ marginBottom: 4 }}>
            <span className="team-name">{p.home_team}</span>
            <span className="vs">vs</span>
            <span className="team-name">{p.away_team}</span>
          </div>
          <div className="fixture-meta">
            <span className="league-name">{p.league}</span>
            {p.date && <> · {p.date.slice(0, 10)}</>}
            {modelType && <> · <span style={{ color: modelType === 'wc' ? 'var(--c-intl)' : 'var(--c-club)' }}>
              {modelType === 'wc' ? '🏆 WC' : '⚽ Clubes'}
            </span></>}
          </div>

          {(homeProb || drawProb || awayProb) > 0 && (
            <div className="history-probs">
              <MiniBar label={p.home_team} value={homeProb} type="home-hist" />
              <MiniBar label="Empate"      value={drawProb} type="draw-hist" />
              <MiniBar label={p.away_team} value={awayProb} type="away-hist" />
            </div>
          )}

          {hasStats && (
            <button
              className={`stats-toggle ${showStats ? 'open' : ''}`}
              onClick={() => setShowStats(s => !s)}
            >
              {showStats ? '▴' : '▾'} Estadísticas
            </button>
          )}
        </div>

        <div className="history-outcome">
          <StatusBadge status={status} />
          {status === 'pending' && (
            <button
              className="btn btn-ghost btn-sm"
              style={deleteStage === 1
                ? { borderColor: 'var(--c-bad)', color: 'var(--c-bad)' }
                : { color: 'var(--text-dim)' }
              }
              title={deleteStage === 1 ? 'Haz clic de nuevo para confirmar' : 'Eliminar predicción pendiente'}
              onClick={() => {
                if (deleteStage === 0) {
                  setDeleteStage(1)
                  setTimeout(() => setDeleteStage(0), 3000)
                } else {
                  onDelete(p.fixture_id)
                }
              }}
            >
              {deleteStage === 0 ? '🗑' : '¿Eliminar?'}
            </button>
          )}
          {status === 'resolved' && probCorr !== null && isCorrect !== null && (
            <ProbDonut value={probCorr} isCorrect={isCorrect} />
          )}
          {status === 'resolved' && isCorrect !== null && (
            <span className={isCorrect ? 'outcome-correct' : 'outcome-wrong'}>
              {isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
            </span>
          )}
          {status === 'resolved' && actual && (
            <span className="text-dim t-mono" style={{ fontSize: '0.72rem' }}>
              Real: {outcomeLabel(actual)}
            </span>
          )}
          {status === 'resolved' && actualRes && (
            <span className="text-dim t-mono" style={{ fontSize: '0.72rem' }}>
              Marcador: {actualRes}
            </span>
          )}
          {status === 'pending' && predicted && (
            <span className="text-dim t-mono" style={{ fontSize: '0.72rem' }}>
              Pred: {outcomeLabel(predicted)}
            </span>
          )}
        </div>
      </div>

      <div className={`history-stats-panel ${showStats ? 'open' : ''}`}>
        {p.match_stats && (
          <MatchStatsSection
            stats={p.match_stats}
            homeTeam={p.home_team}
            awayTeam={p.away_team}
            compact
          />
        )}
      </div>
    </div>
  )
}

function ProbDonut({ value, isCorrect }) {
  const color = isCorrect ? 'var(--c-ok)' : 'var(--c-bad)'
  const pct   = Math.min(100, Math.max(0, value ?? 0))
  return (
    <div className="prob-donut-wrap">
      <div
        className="prob-donut"
        style={{ background: `conic-gradient(${color} ${pct}%, var(--bg-3) ${pct}%)` }}
      >
        <div className="prob-donut-inner">
          <span className="prob-donut-pct">{Math.round(pct)}%</span>
        </div>
      </div>
      <span className="prob-donut-label">Confianza</span>
    </div>
  )
}

function MiniBar({ label, value, type }) {
  return (
    <div className="mini-bar-row">
      <span className="mini-bar-label">{label.length > 10 ? label.slice(0, 9) + '…' : label}</span>
      <div className="prob-track" style={{ height: 5 }}>
        <div className={`prob-fill ${type}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`prob-pct ${type}`} style={{ fontSize: '0.7rem' }}>{value.toFixed(1)}%</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending:   { cls: 'status-pending',   label: '⏳ Pendiente' },
    resolved:  { cls: 'status-resolved',  label: '✅ Resuelto'  },
    cancelled: { cls: 'status-cancelled', label: '⊘ Cancelado' },
  }
  const { cls, label } = map[status] ?? { cls: 'status-pending', label: status }
  return <span className={`status-badge ${cls}`}>{label}</span>
}

function derivePredicted(home, draw, away) {
  if (home >= draw && home >= away) return 'home'
  if (away >= home && away >= draw) return 'away'
  return 'draw'
}

function outcomeLabel(outcome) {
  return outcome === 'home' ? 'Local' : outcome === 'away' ? 'Visitante' : 'Empate'
}

function AccuracyStrip({ stats }) {
  if (!stats) return null
  const pctColor = (pct) =>
    pct >= 65 ? 'var(--c-ok)' : pct >= 40 ? 'var(--c-warn)' : 'var(--c-bad)'

  return (
    <div className="accuracy-strip">
      <div className="accuracy-row">
        <span className="accuracy-kpi">
          <span className="accuracy-val">{stats.total_resolved}</span>
          <span className="accuracy-label">resueltas</span>
        </span>
        <span className="accuracy-sep">·</span>
        <span className="accuracy-kpi">
          <span className="accuracy-val">{stats.total_correct}</span>
          <span className="accuracy-label">correctas</span>
        </span>
        <span className="accuracy-sep">·</span>
        <span className="accuracy-kpi">
          <span className="accuracy-val" style={{ color: pctColor(stats.reliability_pct) }}>
            {stats.reliability_pct}%
          </span>
          <span className="accuracy-label">fiabilidad</span>
        </span>
      </div>
      {stats.by_model_type && (
        <div className="accuracy-row accuracy-row-sub">
          {stats.by_model_type.clubs && (
            <span className="accuracy-model">
              <span style={{ color: 'var(--c-club)' }}>⚽ Clubes</span>
              {' '}
              <span style={{ color: pctColor(stats.by_model_type.clubs.reliability_pct) }}>
                {stats.by_model_type.clubs.reliability_pct}%
              </span>
            </span>
          )}
          {stats.by_model_type.clubs && stats.by_model_type.wc && (
            <span className="accuracy-sep">·</span>
          )}
          {stats.by_model_type.wc && (
            <span className="accuracy-model">
              <span style={{ color: 'var(--c-intl)' }}>🏆 WC</span>
              {' '}
              <span style={{ color: pctColor(stats.by_model_type.wc.reliability_pct) }}>
                {stats.by_model_type.wc.reliability_pct}%
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
