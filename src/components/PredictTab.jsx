import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { CLUB_LEAGUES, TEAMS_BY_LEAGUE, getTeamSuggestions, todayStr } from '../data.js'
import ProbabilityResult from './ProbabilityResult.jsx'

export default function PredictTab({ prefill }) {
  const [league, setLeague]     = useState(CLUB_LEAGUES[0])
  const [home, setHome]         = useState('')
  const [away, setAway]         = useState('')
  const [date, setDate]         = useState(todayStr())
  const [season, setSeason]     = useState('')
  const [leagueId, setLeagueId] = useState(null)
  const [country, setCountry]   = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (prefill && !prefill.isWC) {
      setLeague(prefill.league || CLUB_LEAGUES[0])
      setHome(prefill.home || '')
      setAway(prefill.away || '')
      setDate(prefill.date || todayStr())
      setSeason(prefill.season || '')
      setLeagueId(prefill.leagueId || null)
      setCountry(prefill.country || '')
      setResult(null)
      setError(null)
    }
  }, [prefill])

  const suggestions = getTeamSuggestions(league)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await api.predict(home, away, league, date, season || undefined, leagueId || undefined, country || undefined)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setHome(''); setAway(''); setLeagueId(null); setCountry(''); setResult(null); setError(null)
  }

  return (
    <div>
      <form onSubmit={submit} className="panel">
        <div className="eyebrow">Predecir partido — Ligas de clubes</div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label className="field-label">Liga</label>
          <input
            className="input" type="text" value={league} required list="club-leagues-list"
            placeholder="ej. La Liga"
            onChange={e => { setLeague(e.target.value); setLeagueId(null); setCountry(''); clear() }}
          />
          <datalist id="club-leagues-list">
            {CLUB_LEAGUES.map(l => <option key={l} value={l} />)}
          </datalist>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label className="field-label">Equipo local</label>
            <input
              className="input" type="text" value={home} required list="home-teams"
              placeholder="ej. Real Madrid"
              onChange={e => setHome(e.target.value)}
            />
            <datalist id="home-teams">
              {suggestions.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="field">
            <label className="field-label">Equipo visitante</label>
            <input
              className="input" type="text" value={away} required list="away-teams"
              placeholder="ej. FC Barcelona"
              onChange={e => setAway(e.target.value)}
            />
            <datalist id="away-teams">
              {suggestions.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="field-label">Fecha del partido</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Temporada (opcional)</label>
            <input className="input" type="number" value={season} min={2010} max={2030}
              placeholder="ej. 2026"
              onChange={e => setSeason(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Calculando…</> : '⚽ Predecir resultado'}
          </button>
          {(result || error) && (
            <button type="button" className="btn btn-ghost" onClick={clear}>Limpiar</button>
          )}
        </div>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {result && <ProbabilityResult result={result} />}
    </div>
  )
}
