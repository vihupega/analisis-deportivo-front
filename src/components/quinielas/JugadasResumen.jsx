import { useState } from 'react'
import { api } from '../../api.js'

const PERFILES = [
  { value: 'conservador',  label: 'Conservador (24, obj. 10)' },
  { value: 'medio',        label: 'Medio (72, obj. 11)' },
  { value: 'agresivo',     label: 'Agresivo (216, obj. 11)' },
  { value: 'personalizado', label: 'Personalizado' },
]

// Resumen de costo/cobertura + formulario de reoptimización. Compartido entre
// Progol y Personalizada vía props de capacidad (hasPerfilesPreset).
export default function JugadasResumen({ quiniela, variant, hasPerfilesPreset, onOptimized }) {
  const r = quiniela.resumen
  if (!r) return null

  const costo = r.costo ?? ((r.quiniela?.costo ?? 0) + (r.revancha?.costo ?? 0))
  const objetivo = r.objetivo_aciertos ?? quiniela.perfil?.objetivo_aciertos
  const diffPct = (r.prob_objetivo_pct ?? 0) - (r.baseline_prob_objetivo_pct ?? 0)

  return (
    <div className="panel quin-resumen">
      <div className="eyebrow">Resumen de la jugada</div>

      <div className="quin-resumen-grid">
        <div className="quin-kpi">
          <span className="quin-kpi-label">Costo total</span>
          <span className="quin-kpi-val">{costo}</span>
        </div>
        <div className="quin-kpi">
          <span className="quin-kpi-label">Objetivo de aciertos</span>
          <span className="quin-kpi-val">{objetivo ?? '—'}</span>
        </div>
        <div className="quin-kpi">
          <span className="quin-kpi-label">Aciertos esperados</span>
          <span className="quin-kpi-val">{r.aciertos_esperados != null ? r.aciertos_esperados.toFixed(1) : '—'}</span>
        </div>
        {r.aciertos != null && (
          <div className="quin-kpi">
            <span className="quin-kpi-label">Aciertos reales</span>
            <span className="quin-kpi-val text-ok">{r.aciertos} ({r.acierto_pct?.toFixed(0)}%)</span>
          </div>
        )}
      </div>

      {!hasPerfilesPreset ? null : quiniela.perfil?.nombre && (
        <p className="text-dim t-mono" style={{ fontSize: '0.78rem', marginTop: 4 }}>
          Perfil actual: <span className="text-hot">{quiniela.perfil.nombre}</span>
        </p>
      )}

      <div className="quin-prob-compare">
        <span className="field-label">Probabilidad teórica de alcanzar {objetivo ?? 'N'} aciertos</span>
        <CompareBar label="Optimizado" value={r.prob_objetivo_pct} highlight />
        <CompareBar label="Baseline (solo favoritos)" value={r.baseline_prob_objetivo_pct} />
        <p className="text-dim t-mono" style={{ fontSize: '0.72rem', marginTop: 6 }}>
          Diferencia vs. baseline: <span className={diffPct >= 0 ? 'text-ok' : 'text-bad'}>{diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)} pp</span>
        </p>
      </div>

      <p className="quin-nota-metodologica">
        {quiniela.nota_metodologica || 'El optimizador asume independencia entre partidos, lo cual es optimista respecto a la cobertura real: es una comparación relativa entre asignaciones, no una promesa de ganar.'}
      </p>

      <OptimizarForm quiniela={quiniela} variant={variant} hasPerfilesPreset={hasPerfilesPreset} onOptimized={onOptimized} />
    </div>
  )
}

function CompareBar({ label, value, highlight }) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  return (
    <div className="quin-compare-row">
      <span className="quin-compare-label">{label}</span>
      <div className="prob-track">
        <div className={`prob-fill ${highlight ? 'home' : 'draw'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`prob-pct ${highlight ? 'home' : 'draw'}`}>{pct.toFixed(1)}%</span>
    </div>
  )
}

function OptimizarForm({ quiniela, variant, hasPerfilesPreset, onOptimized }) {
  const [perfil, setPerfil]           = useState('personalizado')
  const [presupuesto, setPresupuesto] = useState(quiniela.perfil?.presupuesto ?? quiniela.resumen?.costo ?? 100)
  const [objetivo, setObjetivo]       = useState(quiniela.perfil?.objetivo_aciertos ?? quiniela.resumen?.objetivo_aciertos ?? 10)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      let payload
      if (hasPerfilesPreset && perfil !== 'personalizado') {
        payload = { perfil }
      } else if (hasPerfilesPreset) {
        payload = { presupuesto: Number(presupuesto), objetivo_aciertos: Number(objetivo) }
      } else {
        payload = { presupuesto: Number(presupuesto), objetivo_aciertos: Number(objetivo) }
      }
      const client = variant === 'progol' ? api.quinielas : api.quinielasCustom
      const quinielaActualizada = await client.optimizar(quiniela.id, payload)
      onOptimized(quinielaActualizada)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="quin-optimizar-form">
      <div className="eyebrow" style={{ marginTop: 20 }}>Reoptimizar</div>
      {hasPerfilesPreset && (
        <div className="field" style={{ marginBottom: 12 }}>
          <label className="field-label">Perfil</label>
          <select className="input" value={perfil} onChange={e => setPerfil(e.target.value)}>
            {PERFILES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      )}
      {(!hasPerfilesPreset || perfil === 'personalizado') && (
        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="field">
            <label className="field-label">Presupuesto</label>
            <input className="input" type="number" min={1} value={presupuesto} onChange={e => setPresupuesto(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Objetivo de aciertos</label>
            <input className="input" type="number" min={1} value={objetivo} onChange={e => setObjetivo(e.target.value)} />
          </div>
        </div>
      )}
      <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> Optimizando…</> : 'Reoptimizar'}
      </button>
      {error && <div className="alert alert-error">{error}</div>}
    </form>
  )
}
