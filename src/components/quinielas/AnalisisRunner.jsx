import { useState, useCallback, useEffect } from 'react'
import { api } from '../../api.js'
import { useQuinielaPolling } from '../../hooks/useQuinielaPolling.js'

const PERFILES = [
  { value: 'conservador',   label: 'Conservador (presupuesto 24, objetivo 10)' },
  { value: 'medio',         label: 'Medio (presupuesto 72, objetivo 11)' },
  { value: 'agresivo',      label: 'Agresivo (presupuesto 216, objetivo 11)' },
  { value: 'personalizado', label: 'Personalizado' },
]

// Lanza el análisis en background y hace polling del progreso hasta done/partial/error.
// El análisis tarda 45-90s en frío: 21 partidos x ~7 llamadas HTTP cada uno.
export default function AnalisisRunner({ quinielaId, variant, hasPerfilesPreset, canForce, autoStart, onAnalyzed }) {
  const client = variant === 'progol' ? api.quinielas : api.quinielasCustom

  const [perfil, setPerfil]           = useState('medio')
  const [presupuesto, setPresupuesto] = useState(100)
  const [objetivo, setObjetivo]       = useState(10)
  const [maxTriples, setMaxTriples]   = useState('')
  const [maxDobles, setMaxDobles]     = useState('')
  const [force, setForce]             = useState(false)
  const [launching, setLaunching]     = useState(false)
  const [launchError, setLaunchError] = useState(null)

  const fetchEstado = useCallback(() => client.analizarEstado(quinielaId), [client, quinielaId])

  const handleDone = useCallback(async (jobEstado) => {
    if (jobEstado.estado === 'error') return
    try {
      const quinielaCompleta = await client.get(quinielaId)
      onAnalyzed(quinielaCompleta)
    } catch {
      // el estado del job ya se muestra; si falla el refresh el usuario puede reintentar
    }
  }, [client, quinielaId, onAnalyzed])

  const { estado: jobEstado, polling, error: pollError, start } = useQuinielaPolling(fetchEstado, { onDone: handleDone })

  // Si la quiniela ya está en estado "analizando" (job lanzado antes, o por otra
  // sesión), reconecta el polling sin volver a lanzar el análisis.
  useEffect(() => {
    if (autoStart) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  async function launch(e) {
    e.preventDefault()
    setLaunching(true); setLaunchError(null)
    try {
      let payload
      if (hasPerfilesPreset) {
        payload = perfil === 'personalizado'
          ? { perfil: 'personalizado', presupuesto: Number(presupuesto), objetivo_aciertos: Number(objetivo), force }
          : { perfil, force }
      } else {
        payload = {
          presupuesto: Number(presupuesto),
          objetivo_aciertos: Number(objetivo),
          max_triples: maxTriples ? Number(maxTriples) : null,
          max_dobles: maxDobles ? Number(maxDobles) : null,
          force,
        }
      }
      await client.analizar(quinielaId, payload)
      start()
    } catch (err) {
      setLaunchError(err.message)
    } finally {
      setLaunching(false)
    }
  }

  const busy = launching || polling
  const total = jobEstado?.total ?? 0
  const procesados = jobEstado?.procesados ?? 0
  const progressPct = total > 0 ? Math.round((procesados / total) * 100) : 0

  return (
    <div className="panel quin-analisis-runner">
      <div className="eyebrow">Analizar boleto</div>
      <p className="text-dim t-mono" style={{ fontSize: '0.78rem', marginBottom: 14, lineHeight: 1.6 }}>
        El análisis corre en segundo plano y tarda entre 45 y 90 segundos. No cierres esta pestaña.
      </p>

      <form onSubmit={launch} style={{ display: autoStart ? 'none' : undefined }}>
        {hasPerfilesPreset && (
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="field-label">Perfil</label>
            <select className="input" value={perfil} onChange={e => setPerfil(e.target.value)} disabled={busy}>
              {PERFILES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        )}

        {(!hasPerfilesPreset || perfil === 'personalizado') && (
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="field">
              <label className="field-label">Presupuesto</label>
              <input className="input" type="number" min={1} value={presupuesto} disabled={busy}
                onChange={e => setPresupuesto(e.target.value)} required />
            </div>
            <div className="field">
              <label className="field-label">Objetivo de aciertos</label>
              <input className="input" type="number" min={1} value={objetivo} disabled={busy}
                onChange={e => setObjetivo(e.target.value)} required />
            </div>
          </div>
        )}

        {!hasPerfilesPreset && (
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="field">
              <label className="field-label">Máx. triples <span className="text-dim">(opcional)</span></label>
              <input className="input" type="number" min={0} value={maxTriples} disabled={busy}
                onChange={e => setMaxTriples(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Máx. dobles <span className="text-dim">(opcional)</span></label>
              <input className="input" type="number" min={0} value={maxDobles} disabled={busy}
                onChange={e => setMaxDobles(e.target.value)} />
            </div>
          </div>
        )}

        {canForce && (
          <label className="checkbox-row" style={{ marginBottom: 14 }}>
            <input type="checkbox" checked={force} disabled={busy} onChange={e => setForce(e.target.checked)} />
            Forzar re-análisis (force)
          </label>
        )}

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? <><span className="spinner" /> Analizando…</> : 'Analizar'}
        </button>
      </form>

      {launchError && <div className="alert alert-error">{launchError}</div>}
      {pollError && <div className="alert alert-error">{pollError}</div>}

      {jobEstado && (
        <div className="quin-progress" style={{ marginTop: 16 }}>
          <div className="quin-progress-track">
            <div className="quin-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="quin-progress-meta">
            <span className="t-mono text-dim" style={{ fontSize: '0.75rem' }}>
              {jobEstado.estado === 'running' ? `Analizados ${procesados} de ${total} partidos…` : `Estado: ${jobEstado.estado}`}
            </span>
            <span className="t-mono text-dim" style={{ fontSize: '0.75rem' }}>
              {jobEstado.matched ?? 0} correctos · {jobEstado.needs_review ?? 0} para revisar · {jobEstado.unmatched ?? 0} sin match
            </span>
          </div>
          {jobEstado.estado === 'partial' && (
            <div className="alert alert-info" style={{ marginTop: 10 }}>
              Hay {jobEstado.unmatched} partido(s) que no pudieron identificarse automáticamente. Revísalos abajo.
            </div>
          )}
          {jobEstado.estado === 'error' && (
            <div className="alert alert-error" style={{ marginTop: 10 }}>
              El análisis falló: {jobEstado.motivo_error || 'error desconocido'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
