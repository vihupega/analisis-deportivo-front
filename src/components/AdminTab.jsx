import { useState } from 'react'
import { api } from '../api.js'
import { CLUB_LEAGUES, INTL_LEAGUES } from '../data.js'

export default function AdminTab() {
  return (
    <div className="panel">
      <CollectSection />
      <div className="admin-section">
        <TrainSection />
      </div>
      <div className="admin-section">
        <ResolveSection />
      </div>
      <div className="admin-section">
        <TrainedLeaguesSection />
      </div>
      <div className="admin-section">
        <LeagueSearchSection />
      </div>
    </div>
  )
}

function CollectSection() {
  const [league, setLeague]       = useState(CLUB_LEAGUES[0])
  const [seasonInput, setSeason]  = useState('')
  const [seasons, setSeasons]     = useState([])
  const [type, setType]           = useState('clubs')
  const [minPrior, setMinPrior]   = useState(4)
  const [force, setForce]         = useState(false)
  const [leagueId, setLeagueId]   = useState('')
  const [country, setCountry]     = useState('')
  const [status, setStatus]       = useState(null)
  const [jobs, setJobs]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const leagueList = type === 'clubs' ? CLUB_LEAGUES : INTL_LEAGUES

  function addSeason(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault()
      const val = parseInt(seasonInput.trim())
      if (val >= 2010 && val <= 2030 && !seasons.includes(val)) {
        setSeasons(s => [...s, val].sort())
      }
      setSeason('')
    }
  }

  function removeSeason(s) {
    setSeasons(prev => prev.filter(x => x !== s))
  }

  async function startCollect(e) {
    e.preventDefault()
    if (!seasons.length) { setError('Agrega al menos una temporada'); return }
    setLoading(true); setError(null); setStatus(null)
    try {
      const data = await api.collect(league, seasons, type, minPrior, force,
        leagueId ? parseInt(leagueId) : undefined, country || undefined)
      setStatus(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function checkStatus() {
    try {
      const data = await api.collectStatus()
      setJobs(data)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
      <div className="eyebrow">Recolección de datos</div>

      <form onSubmit={startCollect}>
        <div style={{ marginBottom: 14 }}>
          <span className="field-label" style={{ display: 'block', marginBottom: 6 }}>Tipo de torneo</span>
          <div className="toggle-group">
            <button type="button" className={`toggle-btn ${type === 'clubs' ? 'active' : ''}`}
              onClick={() => { setType('clubs'); setLeague(CLUB_LEAGUES[0]); setMinPrior(5); setLeagueId(''); setCountry('') }}>
              ⚽ Ligas de clubes
            </button>
            <button type="button" className={`toggle-btn ${type === 'international' ? 'active intl' : ''}`}
              onClick={() => { setType('international'); setLeague(INTL_LEAGUES[0]); setMinPrior(1); setLeagueId(''); setCountry('') }}>
              🏆 Internacional
            </button>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label className="field-label">Liga / Torneo</label>
            <input
              className="input" type="text" value={league} required
              list="collect-leagues-list"
              placeholder="ej. La Liga, Bundesliga…"
              onChange={e => setLeague(e.target.value)}
            />
            <datalist id="collect-leagues-list">
              {leagueList.map(l => <option key={l} value={l} />)}
            </datalist>
          </div>
          {type === 'international' && (
            <div className="field">
              <label className="field-label">Mín. partidos previos</label>
              <input className="input" type="number" value={minPrior} min={1} max={10}
                onChange={e => setMinPrior(Number(e.target.value))} />
            </div>
          )}
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label className="field-label">ID de liga <span className="text-dim">(opcional)</span></label>
            <input className="input" type="number" min="1" placeholder="ej. 140"
              value={leagueId} onChange={e => setLeagueId(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">País <span className="text-dim">(opcional)</span></label>
            <input className="input" type="text" placeholder="ej. Spain"
              value={country} onChange={e => setCountry(e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 10 }}>
          <label className="field-label">Temporadas (Enter para agregar)</label>
          <input
            className="input" type="text" value={seasonInput}
            placeholder="ej. 2023 — presiona Enter para agregar"
            onChange={e => setSeason(e.target.value)}
            onKeyDown={addSeason}
          />
        </div>

        {seasons.length > 0 && (
          <div className="collect-seasons" style={{ marginBottom: 14 }}>
            {seasons.map(s => (
              <span key={s} className="season-tag">
                {s}
                <button type="button" onClick={() => removeSeason(s)}>×</button>
              </span>
            ))}
          </div>
        )}

        <label className="checkbox-row" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
          Forzar re-procesado (--force)
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={loading || !seasons.length}>
            {loading ? <><span className="spinner" /> Iniciando…</> : '▶ Iniciar recolección'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={checkStatus}>
            🔄 Ver estado de jobs
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
      {status && <div className="alert alert-info" style={{ marginTop: 12 }}>{status.message}</div>}

      {jobs !== null && (
        <div className="job-status">
          {Object.keys(jobs).length === 0
            ? <span className="text-dim">No hay jobs registrados.</span>
            : Object.entries(jobs).map(([id, info]) => (
              <div key={id} className="job-row">
                <span className="text-mute">{id}</span>
                <span className={`job-status-badge status-${info.status}`}>
                  {info.status === 'running' ? '⏳ Ejecutando'
                    : info.status === 'done' ? `✅ Listo (${info.saved} guardados)`
                    : `❌ Error: ${info.error}`}
                </span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

function TrainSection() {
  const [clubResult, setClubResult] = useState(null)
  const [wcResult, setWcResult]     = useState(null)
  const [loadingClub, setLoadingClub] = useState(false)
  const [loadingWC, setLoadingWC]   = useState(false)
  const [errorClub, setErrorClub]   = useState(null)
  const [errorWC, setErrorWC]       = useState(null)

  async function trainClub() {
    setLoadingClub(true); setErrorClub(null); setClubResult(null)
    try { setClubResult(await api.train()) }
    catch (err) { setErrorClub(err.message) }
    finally { setLoadingClub(false) }
  }

  async function trainWC() {
    setLoadingWC(true); setErrorWC(null); setWcResult(null)
    try { setWcResult(await api.trainWC()) }
    catch (err) { setErrorWC(err.message) }
    finally { setLoadingWC(false) }
  }

  return (
    <>
      <div className="eyebrow">Entrenamiento de modelos</div>
      <div className="train-grid">
        <div className="train-card">
          <h4>⚽ Modelo de Clubes</h4>
          <p>Entrena con todos los registros <code>clubs</code> en MongoDB. Requiere ≥50 fixtures.</p>
          <button className="btn btn-primary btn-sm" onClick={trainClub} disabled={loadingClub}>
            {loadingClub ? <><span className="spinner" /> Entrenando…</> : 'Reentrenar'}
          </button>
          {errorClub && <div className="alert alert-error" style={{ fontSize: '0.8rem' }}>{errorClub}</div>}
          {clubResult && <div className="alert alert-success" style={{ fontSize: '0.8rem' }}>{clubResult.message}</div>}
        </div>

        <div className="train-card">
          <h4>🏆 Modelo Copa Mundial</h4>
          <p>Entrena con registros <code>international</code> en MongoDB. Requiere ≥50 fixtures.</p>
          <button className="btn btn-orange btn-sm" onClick={trainWC} disabled={loadingWC}>
            {loadingWC ? <><span className="spinner" /> Entrenando…</> : 'Reentrenar'}
          </button>
          {errorWC && <div className="alert alert-error" style={{ fontSize: '0.8rem' }}>{errorWC}</div>}
          {wcResult && <div className="alert alert-success" style={{ fontSize: '0.8rem' }}>{wcResult.message}</div>}
        </div>
      </div>
    </>
  )
}

function ResolveSection() {
  const [daysBack,  setDaysBack]  = useState(3)
  const [modelType, setModelType] = useState('')
  const [dryRun,    setDryRun]    = useState(false)
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  async function run() {
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await api.resolve(daysBack, modelType || undefined, dryRun)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="eyebrow">Resolver predicciones pendientes</div>
      <p className="text-dim t-mono" style={{ fontSize: '0.78rem', marginBottom: 14, lineHeight: 1.6 }}>
        Consulta los resultados reales de predicciones pendientes y actualiza su estado.
        Si se supera el umbral de nuevas muestras, reentrena el modelo automáticamente.
      </p>

      <div className="form-row" style={{ marginBottom: 12 }}>
        <div className="field">
          <label className="field-label">Últimos N días</label>
          <input className="input" type="number" value={daysBack} min={1} max={30}
            onChange={e => setDaysBack(Number(e.target.value))} />
        </div>
        <div className="field">
          <label className="field-label">Modelo</label>
          <select className="input" value={modelType} onChange={e => setModelType(e.target.value)}>
            <option value="">Ambos</option>
            <option value="clubs">Clubes</option>
            <option value="wc">Copa Mundial</option>
          </select>
        </div>
      </div>

      <label className="checkbox-row" style={{ marginBottom: 14 }}>
        <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
        Dry run (solo consulta, sin escribir ni reentrenar)
      </label>

      <button className="btn btn-indigo btn-sm" onClick={run} disabled={loading}>
        {loading ? <><span className="spinner" /> Ejecutando…</> : '▶ Ejecutar'}
      </button>

      {error  && <div className="alert alert-error"   style={{ marginTop: 10 }}>{error}</div>}
      {result && <div className="alert alert-success" style={{ marginTop: 10 }}>{result.message ?? JSON.stringify(result)}</div>}
    </>
  )
}

function TrainedLeaguesSection() {
  const [leagues, setLeagues] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      setLeagues(await api.leaguesTrained())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="eyebrow">Ligas con datos de entrenamiento</div>
      <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
        {loading ? <><span className="spinner" /> Cargando…</> : '🔄 Cargar ligas'}
      </button>

      {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}

      {leagues !== null && (
        leagues.length === 0
          ? <p className="text-dim t-mono" style={{ fontSize: '0.78rem', marginTop: 10 }}>No hay datos de entrenamiento aún.</p>
          : (
            <table className="trained-table">
              <thead>
                <tr>
                  <th>Liga</th>
                  <th>Tipo</th>
                  <th>Fixtures</th>
                </tr>
              </thead>
              <tbody>
                {leagues.map((l, i) => (
                  <tr key={i}>
                    <td>{l.league}</td>
                    <td>
                      <span style={{ color: l.tournament_type === 'international' ? 'var(--c-intl)' : 'var(--c-club)', fontWeight: 600 }}>
                        {l.tournament_type === 'international' ? '🏆 Internacional' : '⚽ Clubes'}
                      </span>
                    </td>
                    <td className="text-dim">{l.fixtures}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      )}
    </>
  )
}

function LeagueSearchSection() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function search(e) {
    e.preventDefault()
    if (query.trim().length < 3) { setError('Mínimo 3 caracteres'); return }
    setLoading(true); setError(null); setResults(null)
    try {
      setResults(await api.leagueSearch(query.trim()))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="eyebrow">Buscar liga en api-sports</div>
      <p className="text-dim t-mono" style={{ fontSize: '0.78rem', marginBottom: 12, lineHeight: 1.6 }}>
        Encuentra el nombre exacto de una liga para usar en Recolección de datos.
      </p>
      <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <input className="input" type="text" value={query} placeholder="ej. Bundesliga, MLS…"
            onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="btn btn-ghost btn-sm" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Buscando…</> : '🔍 Buscar'}
        </button>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}

      {results !== null && (
        results.length === 0
          ? <p className="text-dim t-mono" style={{ fontSize: '0.78rem', marginTop: 10 }}>Sin resultados.</p>
          : (
            <div className="league-search-results">
              {results.map(r => (
                <div key={r.id} className="league-result-item">
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--ink-0)' }}>{r.name}</span>
                    <span className="text-dim" style={{ fontSize: '0.75rem', marginLeft: 8 }}>
                      {r.country} · {r.type}
                    </span>
                  </div>
                  <span className="text-dim" style={{ fontSize: '0.72rem' }}>id: {r.id}</span>
                </div>
              ))}
            </div>
          )
      )}
    </>
  )
}
