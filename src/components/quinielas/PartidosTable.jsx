import { useState } from 'react'
import { api } from '../../api.js'
import MatchStatusBadge from './MatchStatusBadge.jsx'

const SIGNOS = ['L', 'E', 'V']

// Tabla de partidos compartida entre Progol y Personalizada. La divergencia se
// controla con props de capacidad, no con bifurcaciones por tipo.
export default function PartidosTable({
  quiniela,
  variant,           // 'progol' | 'custom'
  canEditMatching,   // progol: permite PATCH de nombres/fixture cuando needs_review/unmatched
  canOverride,       // progol: permite fijar signos manualmente
  canRemove,         // custom en borrador: permite quitar partidos
  onUpdated,         // (quinielaCompleta) => void, tras PATCH/override
  onRemoved,         // (fixtureId) => void, tras quitar un partido
}) {
  const partidos = quiniela.partidos ?? []
  const [editingNum, setEditingNum] = useState(null)
  const [overrideNum, setOverrideNum] = useState(null)
  const [busyNum, setBusyNum] = useState(null)
  const [error, setError] = useState(null)

  const secciones = [...new Set(partidos.map(p => p.seccion ?? 'quiniela'))]

  return (
    <div className="quin-table-wrap">
      {error && <div className="alert alert-error">{error}</div>}
      {secciones.map(seccion => (
        <div key={seccion} className="quin-seccion">
          {secciones.length > 1 && (
            <div className="eyebrow" style={{ marginTop: 16 }}>
              {seccion === 'revancha' ? 'Revancha' : 'Quiniela'}
            </div>
          )}
          <table className="quin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Partido</th>
                <th>Liga</th>
                <th>Fecha</th>
                {variant === 'progol' && <th>Match</th>}
                <th>L / E / V</th>
                <th>Jugada</th>
                <th>Cobertura</th>
                {(quiniela.resumen?.partidos_con_resultado || partidos.some(p => p.resultado_real)) && <th>Resultado</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {partidos.filter(p => (p.seccion ?? 'quiniela') === seccion).map(p => (
                <PartidoRow
                  key={p.num}
                  p={p}
                  quiniela={quiniela}
                  variant={variant}
                  canEditMatching={canEditMatching}
                  canOverride={canOverride}
                  canRemove={canRemove}
                  editing={editingNum === p.num}
                  overriding={overrideNum === p.num}
                  busy={busyNum === p.num}
                  onToggleEdit={() => setEditingNum(editingNum === p.num ? null : p.num)}
                  onToggleOverride={() => setOverrideNum(overrideNum === p.num ? null : p.num)}
                  onSaved={(quinielaActualizada) => {
                    setEditingNum(null)
                    setOverrideNum(null)
                    setBusyNum(null)
                    setError(null)
                    onUpdated?.(quinielaActualizada)
                  }}
                  onBusy={() => { setBusyNum(p.num); setError(null) }}
                  onError={(msg) => { setBusyNum(null); setError(msg) }}
                  onRemoved={onRemoved}
                />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function PartidoRow({
  p, quiniela, variant, canEditMatching, canOverride, canRemove,
  editing, overriding, busy,
  onToggleEdit, onToggleOverride, onSaved, onBusy, onError, onRemoved,
}) {
  const needsAttention = variant === 'progol' && p.match_estado && p.match_estado !== 'ok'
  const rowClass = p.match_estado === 'unmatched' ? 'quin-row-unmatched' : ''

  return (
    <>
      <tr className={rowClass}>
        <td>{p.num}</td>
        <td>
          <div className="quin-teams">
            <span>{p.match_estado === 'unmatched' ? (p.local || '?') : p.local}</span>
            <span className="vs">vs</span>
            <span>{p.match_estado === 'unmatched' ? (p.visitante || '?') : p.visitante}</span>
          </div>
        </td>
        <td className="text-dim">{p.liga || p.liga_api || '—'}</td>
        <td className="text-dim t-mono">{p.fecha}{p.hora ? ` ${p.hora}` : ''}</td>
        {variant === 'progol' && (
          <td>
            <MatchStatusBadge estado={p.match_estado} />
          </td>
        )}
        <td className="t-mono">
          <ProbTriplet local={p.prob_local} empate={p.prob_empate} visitante={p.prob_visitante} />
        </td>
        <td>{p.jugada ? <JugadaBadge jugada={p.jugada} signos={p.signos_marcados} /> : <span className="text-dim">—</span>}</td>
        <td className="t-mono">{p.prob_cobertura != null ? `${p.prob_cobertura.toFixed(1)}%` : '—'}</td>
        {(quiniela.resumen?.partidos_con_resultado || quiniela.partidos.some(x => x.resultado_real)) && (
          <td>
            {p.resultado_real
              ? <span className={p.acierto ? 'text-ok' : 'text-bad'}>
                  {p.resultado_real}{p.goles_local != null ? ` (${p.goles_local}-${p.goles_visitante})` : ''}
                </span>
              : <span className="text-dim">—</span>}
          </td>
        )}
        <td>
          <div className="row gap-8">
            {variant === 'progol' && canEditMatching && needsAttention && (
              <button className="btn btn-ghost btn-sm" onClick={onToggleEdit}>
                {editing ? 'Cerrar' : 'Corregir'}
              </button>
            )}
            {canOverride && (
              <button className="btn btn-ghost btn-sm" onClick={onToggleOverride}>
                {overriding ? 'Cerrar' : 'Forzar'}
              </button>
            )}
            {canRemove && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--c-bad)' }}
                onClick={() => onRemoved?.(p.fixture_id)}>
                Quitar
              </button>
            )}
          </div>
        </td>
      </tr>

      {editing && (
        <tr className="quin-row-edit">
          <td colSpan={99}>
            <MatchFixForm p={p} quinielaId={quiniela.id} onBusy={onBusy} onError={onError} onSaved={onSaved} />
          </td>
        </tr>
      )}

      {overriding && (
        <tr className="quin-row-edit">
          <td colSpan={99}>
            <OverrideForm p={p} quinielaId={quiniela.id} busy={busy} onBusy={onBusy} onError={onError} onSaved={onSaved} />
          </td>
        </tr>
      )}
    </>
  )
}

function ProbTriplet({ local, empate, visitante }) {
  if (local == null) return <span className="text-dim">—</span>
  return (
    <span className="quin-probs">
      <span className="prob-pct home">{local.toFixed(0)}%</span>
      {' / '}
      <span className="prob-pct draw">{empate.toFixed(0)}%</span>
      {' / '}
      <span className="prob-pct away">{visitante.toFixed(0)}%</span>
    </span>
  )
}

function JugadaBadge({ jugada, signos }) {
  const cls = jugada === 'Triple' ? 'pill warn' : jugada === 'Doble' ? 'pill hot' : 'pill'
  return <span className={cls}>{jugada}{signos ? ` (${signos})` : ''}</span>
}

// Corrección de matching (needs_review / unmatched) -> PATCH /quinielas/{id}/partidos/{num}
function MatchFixForm({ p, quinielaId, onBusy, onError, onSaved }) {
  const [localApi, setLocalApi]         = useState(p.local_api || '')
  const [visitanteApi, setVisitanteApi] = useState(p.visitante_api || '')
  const [ligaApi, setLigaApi]           = useState(p.liga_api || '')
  const [leagueId, setLeagueId]         = useState(p.league_id ?? '')
  const [fixtureId, setFixtureId]       = useState(p.fixture_id ?? '')

  function useCandidato(c) {
    setLocalApi(c.home_team ?? c.local ?? localApi)
    setVisitanteApi(c.away_team ?? c.visitante ?? visitanteApi)
    setLigaApi(c.league ?? c.liga ?? ligaApi)
    setLeagueId(c.league_id ?? leagueId)
    setFixtureId(c.fixture_id ?? fixtureId)
  }

  async function save() {
    onBusy()
    try {
      const payload = {
        local: p.local,
        visitante: p.visitante,
        local_api: localApi || undefined,
        visitante_api: visitanteApi || undefined,
        liga: p.liga,
        liga_api: ligaApi || undefined,
        league_id: leagueId ? Number(leagueId) : undefined,
        fecha: p.fecha,
        fixture_id: fixtureId ? Number(fixtureId) : undefined,
      }
      const quinielaActualizada = await api.quinielas.patchPartido(quinielaId, p.num, payload)
      onSaved(quinielaActualizada)
    } catch (err) {
      onError(err.message)
    }
  }

  return (
    <div className="quin-fix-form">
      {p.match_candidatos?.length > 0 && (
        <div className="quin-candidatos">
          <span className="field-label">Candidatos sugeridos</span>
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {p.match_candidatos.map((c, i) => (
              <button key={i} type="button" className="btn btn-ghost btn-sm" onClick={() => useCandidato(c)}>
                {(c.home_team ?? c.local)} vs {(c.away_team ?? c.visitante)}
                {c.score != null ? ` (${(c.score * 100).toFixed(0)}%)` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="form-row" style={{ marginTop: 10 }}>
        <div className="field">
          <label className="field-label">Local (api-sports)</label>
          <input className="input" value={localApi} onChange={e => setLocalApi(e.target.value)} placeholder="ej. Cruz Azul" />
        </div>
        <div className="field">
          <label className="field-label">Visitante (api-sports)</label>
          <input className="input" value={visitanteApi} onChange={e => setVisitanteApi(e.target.value)} placeholder="ej. Club America" />
        </div>
      </div>
      <div className="form-row" style={{ marginTop: 10 }}>
        <div className="field">
          <label className="field-label">Liga (api-sports)</label>
          <input className="input" value={ligaApi} onChange={e => setLigaApi(e.target.value)} placeholder="ej. Liga MX" />
        </div>
        <div className="field">
          <label className="field-label">League ID</label>
          <input className="input" type="number" value={leagueId} onChange={e => setLeagueId(e.target.value)} />
        </div>
      </div>
      <div className="field" style={{ marginTop: 10, maxWidth: 220 }}>
        <label className="field-label">Fixture ID</label>
        <input className="input" type="number" value={fixtureId} onChange={e => setFixtureId(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={save}>
        Guardar corrección
      </button>
    </div>
  )
}

// Override manual de signos -> POST /quinielas/{id}/override (solo Progol)
function OverrideForm({ p, quinielaId, busy, onBusy, onError, onSaved }) {
  const [signos, setSignos] = useState(p.signos?.length ? p.signos : [])

  function toggle(s) {
    setSignos(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function save() {
    if (!signos.length) { onError('Selecciona al menos un signo'); return }
    onBusy()
    try {
      const quinielaActualizada = await api.quinielas.override(quinielaId, { num: p.num, signos })
      onSaved(quinielaActualizada)
    } catch (err) {
      onError(err.message)
    }
  }

  return (
    <div className="quin-fix-form">
      <span className="field-label">Forzar signos para #{p.num}</span>
      <div className="row gap-8" style={{ marginTop: 10 }}>
        {SIGNOS.map(s => (
          <button
            key={s}
            type="button"
            className={`toggle-btn ${signos.includes(s) ? 'active' : ''}`}
            onClick={() => toggle(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={save} disabled={busy}>
        {busy ? <><span className="spinner" /> Guardando…</> : 'Fijar jugada'}
      </button>
    </div>
  )
}
