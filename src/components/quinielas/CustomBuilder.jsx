import { useState } from 'react'
import { api } from '../../api.js'
import { ALL_LEAGUES, todayStr } from '../../data.js'

const MIN_PARTIDOS = 2
const MAX_PARTIDOS = 21

// Armado de boleto para Quinielas Personalizadas: busca fixtures (reutiliza
// api.getFixtures, igual que FixturesTab) y arma una selección de 2-21 partidos.
// mode 'create': crea una quiniela nueva. mode 'edit': agrega partidos a una en borrador.
export default function CustomBuilder({ mode, quinielaId, existingFixtureIds = [], existingCount = 0, onCreated, onUpdated }) {
  const [date, setDate]     = useState(todayStr())
  const [league, setLeague] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  const [selected, setSelected] = useState([]) // array de partidos armados
  const [nombre, setNombre]         = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const selectedIds = new Set(selected.map(s => s.fixture_id))
  const totalCount = existingCount + selected.length

  async function search(e) {
    e.preventDefault()
    setSearching(true); setSearchError(null); setResults(null)
    try {
      setResults(await api.getFixtures(date, league || undefined))
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearching(false)
    }
  }

  function toggleFixture(f) {
    if (selectedIds.has(f.fixture_id)) {
      setSelected(prev => prev.filter(s => s.fixture_id !== f.fixture_id))
      return
    }
    if (totalCount >= MAX_PARTIDOS) return
    const fecha = f.date?.slice(0, 10)
    const hora = f.date?.length > 10 ? f.date.slice(11, 16) : undefined
    setSelected(prev => [...prev, {
      fixture_id: f.fixture_id,
      home_team: f.home_team,
      away_team: f.away_team,
      league: f.league,
      league_id: f.league_id,
      date: fecha,
      hora,
    }])
  }

  function removeSelected(fixtureId) {
    setSelected(prev => prev.filter(s => s.fixture_id !== fixtureId))
  }

  async function submit() {
    setSubmitError(null)
    if (mode === 'create') {
      if (!nombre.trim()) { setSubmitError('El nombre es requerido'); return }
      if (selected.length < MIN_PARTIDOS) { setSubmitError(`Selecciona al menos ${MIN_PARTIDOS} partidos`); return }
    } else if (!selected.length) {
      setSubmitError('Selecciona al menos un partido para agregar')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'create') {
        const quiniela = await api.quinielasCustom.crear({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, partidos: selected })
        onCreated(quiniela)
      } else {
        const quiniela = await api.quinielasCustom.addPartidos(quinielaId, selected)
        setSelected([])
        onUpdated(quiniela)
      }
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel quin-custom-builder">
      <div className="eyebrow">{mode === 'create' ? 'Nueva quiniela personalizada' : 'Agregar partidos al boleto'}</div>

      {mode === 'create' && (
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="input" type="text" value={nombre} maxLength={80}
              placeholder="ej. Mi quiniela del fin de semana" onChange={e => setNombre(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Descripción <span className="text-dim">(opcional)</span></label>
            <input className="input" type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
        </div>
      )}

      <form onSubmit={search} className="quin-fixture-search">
        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="field">
            <label className="field-label">Fecha</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Liga (opcional)</label>
            <input className="input" type="text" value={league} list="quin-leagues-list"
              placeholder="Todas las ligas" onChange={e => setLeague(e.target.value)} />
            <datalist id="quin-leagues-list">
              {ALL_LEAGUES.map(l => <option key={l} value={l} />)}
            </datalist>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" type="submit" disabled={searching}>
          {searching ? <><span className="spinner" /> Buscando…</> : 'Buscar partidos'}
        </button>
      </form>

      {searchError && <div className="alert alert-error">{searchError}</div>}

      {results !== null && (
        results.length === 0
          ? <div className="empty"><span className="icon">🗓️</span>No hay partidos para esta fecha.</div>
          : (
            <div className="quin-fixture-list">
              {results.map(f => {
                const already = existingFixtureIds.includes(f.fixture_id)
                const checked = selectedIds.has(f.fixture_id)
                return (
                  <label key={f.fixture_id} className={`quin-fixture-item ${checked ? 'checked' : ''} ${already ? 'disabled' : ''}`}>
                    <input type="checkbox" checked={checked || already} disabled={already || (!checked && totalCount >= MAX_PARTIDOS)}
                      onChange={() => toggleFixture(f)} />
                    <span className="quin-fixture-teams">{f.home_team} vs {f.away_team}</span>
                    <span className="text-dim" style={{ fontSize: '0.75rem' }}>{f.league} · {f.date?.slice(0, 10)}</span>
                    {already && <span className="pill">Ya en el boleto</span>}
                  </label>
                )
              })}
            </div>
          )
      )}

      {selected.length > 0 && (
        <div className="quin-selected" style={{ marginTop: 16 }}>
          <span className="field-label">Seleccionados ({totalCount}/{MAX_PARTIDOS})</span>
          <div className="quin-selected-list">
            {selected.map(s => (
              <span key={s.fixture_id} className="season-tag">
                {s.home_team} vs {s.away_team}
                <button type="button" onClick={() => removeSelected(s.fixture_id)}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit} disabled={submitting}>
        {submitting
          ? <><span className="spinner" /> Guardando…</>
          : mode === 'create' ? 'Crear quiniela' : 'Agregar al boleto'}
      </button>
      {submitError && <div className="alert alert-error">{submitError}</div>}
    </div>
  )
}
