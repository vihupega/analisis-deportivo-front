import { useState } from 'react'
import { api } from '../../api.js'

// Dos vías de importación de un boleto Progol: web (automática, recomendada)
// y manual (respaldo cuando la fuente aún no publica el boleto).
export default function ProgolImportPanel({ onImported }) {
  const [mode, setMode] = useState('web')

  return (
    <div className="panel quin-import-panel">
      <div className="eyebrow">Importar boleto Progol</div>
      <div className="toggle-group" style={{ marginBottom: 16 }}>
        <button type="button" className={`toggle-btn ${mode === 'web' ? 'active' : ''}`} onClick={() => setMode('web')}>
          Importar desde web
        </button>
        <button type="button" className={`toggle-btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
          Pegar JSON manual
        </button>
      </div>
      {mode === 'web' ? <ImportWebForm onImported={onImported} /> : <ImportManualForm onImported={onImported} />}
    </div>
  )
}

function ImportWebForm({ onImported }) {
  const [tipoJornada, setTipoJornada] = useState('fin_semana')
  const [force, setForce]             = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const quiniela = await api.quinielas.importarWeb(tipoJornada, force)
      onImported(quiniela)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field" style={{ marginBottom: 12 }}>
        <label className="field-label">Modalidad</label>
        <div className="toggle-group">
          <button type="button" className={`toggle-btn ${tipoJornada === 'fin_semana' ? 'active' : ''}`}
            onClick={() => setTipoJornada('fin_semana')}>
            Fin de semana (14 + 7 revancha)
          </button>
          <button type="button" className={`toggle-btn ${tipoJornada === 'media_semana' ? 'active' : ''}`}
            onClick={() => setTipoJornada('media_semana')}>
            Media semana (9, sin revancha)
          </button>
        </div>
      </div>

      <label className="checkbox-row" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
        Reimportar aunque ya exista la quiniela de este concurso (force)
      </label>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> Importando…</> : 'Importar boleto'}
      </button>

      {error && <div className="alert alert-error">{error}</div>}
    </form>
  )
}

const MANUAL_PLACEHOLDER = `{
  "concurso": "2456",
  "tipo_jornada": "fin_semana",
  "fecha_cierre": "2026-09-12",
  "partidos": [
    { "num": 1, "seccion": "quiniela", "local": "AGUILAS", "visitante": "C. AZUL", "liga": "Liga MX", "fecha": "2026-09-12", "hora": "21:00" }
  ]
}`

function ImportManualForm({ onImported }) {
  const [raw, setRaw]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      setError('JSON inválido: revisa la sintaxis')
      return
    }
    setLoading(true)
    try {
      const quiniela = await api.quinielas.importarManual(payload)
      onImported(quiniela)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field" style={{ marginBottom: 12 }}>
        <label className="field-label">JSON del boleto</label>
        <textarea
          className="input quin-json-textarea"
          rows={10}
          value={raw}
          placeholder={MANUAL_PLACEHOLDER}
          onChange={e => setRaw(e.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> Importando…</> : 'Importar boleto manual'}
      </button>
      {error && <div className="alert alert-error">{error}</div>}
    </form>
  )
}
