import { useState } from 'react'
import { api } from '../api.js'
import { ALL_LEAGUES, isInternational, todayStr } from '../data.js'

export default function FixturesTab({ onPredict }) {
  const [date, setDate]         = useState(todayStr())
  const [league, setLeague]     = useState('')
  const [fixtures, setFixtures] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function search(e) {
    e.preventDefault()
    setLoading(true); setError(null); setFixtures(null)
    try {
      const data = await api.getFixtures(date, league || undefined)
      setFixtures(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={search} className="panel">
        <div className="eyebrow">Buscar partidos por fecha</div>
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="field-label">Fecha</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Liga (opcional)</label>
            <input
              className="input" type="text" value={league} list="all-leagues-list"
              placeholder="Todas las ligas"
              onChange={e => setLeague(e.target.value)}
            />
            <datalist id="all-leagues-list">
              {ALL_LEAGUES.map(l => <option key={l} value={l} />)}
            </datalist>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Buscando…</> : '🔍 Buscar partidos'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {fixtures !== null && (
        fixtures.length === 0
          ? <div className="empty"><span className="icon">🗓️</span>No hay partidos para esta fecha.</div>
          : (
            <div className="fixtures-grid">
              <div className="eyebrow" style={{ marginTop: 20, marginBottom: 4 }}>
                Partidos encontrados
                <span className="count">{fixtures.length}</span>
              </div>
              {fixtures.map(f => (
                <FixtureCard key={f.fixture_id} fixture={f} onPredict={onPredict} />
              ))}
            </div>
          )
      )}
    </div>
  )
}

function FixtureCard({ fixture, onPredict }) {
  const isWC = isInternational(fixture.league)

  return (
    <div className="fixture-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fixture-teams">
          <span className="team-name">{fixture.home_team}</span>
          <span className="vs">vs</span>
          <span className="team-name">{fixture.away_team}</span>
        </div>
        <div className="fixture-meta">
          <span className="league-name">{fixture.league}</span>
          {' · '}{fixture.country}
          {' · '}{fixture.date.slice(0, 10)}
        </div>
      </div>
      <button
        className={`btn btn-sm ${isWC ? 'btn-orange' : 'btn-primary'}`}
        onClick={() => onPredict({
          home:      fixture.home_team,
          away:      fixture.away_team,
          league:    fixture.league,
          date:      fixture.date.slice(0, 10),
          season:    fixture.season,
          leagueId:  fixture.league_id,
          country:   fixture.country,
          isWC,
        })}
      >
        {isWC ? '🏆 Predecir' : '⚽ Predecir'}
      </button>
    </div>
  )
}
