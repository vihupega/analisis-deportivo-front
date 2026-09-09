import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api.js'
import PartidosTable from './PartidosTable.jsx'
import JugadasResumen from './JugadasResumen.jsx'
import AnalisisRunner from './AnalisisRunner.jsx'
import CustomBuilder from './CustomBuilder.jsx'

const PRE_ANALYSIS = { progol: 'importada', custom: 'borrador' }
const RESULT_STATES = ['analizada', 'parcial', 'cerrada', 'resuelta']

// Orquesta el detalle de una quiniela: header de estado, edición de partidos,
// lanzamiento/monitoreo de análisis y resumen de jugadas.
export default function QuinielaDetail({ quinielaId, variant, onBack, onDeleted }) {
  const client = variant === 'progol' ? api.quinielas : api.quinielasCustom
  const preAnalysisEstado = PRE_ANALYSIS[variant]

  const [quiniela, setQuiniela] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [syncing, setSyncing]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setQuiniela(await client.get(quinielaId))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [client, quinielaId])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    setDeleting(true)
    try {
      await client.remove(quinielaId)
      onDeleted()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  async function handleSincronizar() {
    setSyncing(true); setError(null)
    try {
      setQuiniela(await client.sincronizar(quinielaId))
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  function handleExport() {
    const url = api.quinielas.exportUrl(quinielaId)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiniela_${quinielaId}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleRemovePartido(fixtureId) {
    try {
      setQuiniela(await api.quinielasCustom.deletePartido(quinielaId, fixtureId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="empty"><span className="spinner" /> Cargando quiniela…</div>
  if (error && !quiniela) return <div className="alert alert-error">{error}</div>
  if (!quiniela) return null

  const estado = quiniela.estado
  const canOverride       = variant === 'progol'
  const canExport         = variant === 'progol'
  const hasPerfilesPreset = variant === 'progol'
  const canEditMatching   = variant === 'progol'
  const editablePartidos  = variant === 'custom' && estado === 'borrador'
  const showAnalisisRunner = estado === preAnalysisEstado || estado === 'analizando' || estado === 'parcial'
  const showResultado      = RESULT_STATES.includes(estado)
  const canSincronizar     = RESULT_STATES.includes(estado)
  const existingFixtureIds = (quiniela.partidos ?? []).map(p => p.fixture_id).filter(Boolean)

  return (
    <div className="quin-detail">
      <div className="row gap-8" style={{ marginBottom: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Volver al listado</button>
        <div className="row gap-8">
          {canExport && <button className="btn btn-ghost btn-sm" onClick={handleExport}>⬇ Exportar Excel</button>}
          {canSincronizar && (
            <button className="btn btn-ghost btn-sm" onClick={handleSincronizar} disabled={syncing}>
              {syncing ? <><span className="spinner" /> Sincronizando…</> : '🔄 Sincronizar resultados'}
            </button>
          )}
          {estado === preAnalysisEstado && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--c-bad)' }} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          )}
        </div>
      </div>

      <div className="panel quin-header">
        <div className="row gap-8" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <div className="quin-header-title">
              {variant === 'progol' ? `Concurso ${quiniela.concurso}` : quiniela.nombre}
            </div>
            <div className="text-dim t-mono" style={{ fontSize: '0.78rem' }}>
              {variant === 'progol' ? quiniela.tipo_jornada : quiniela.descripcion}
              {quiniela.fecha_cierre && <> · cierre {quiniela.fecha_cierre}</>}
            </div>
          </div>
          <span className={`status-badge status-${showResultado ? 'resolved' : estado === 'error' ? 'cancelled' : 'pending'}`}>
            {estado}
          </span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {(quiniela.warnings ?? []).length > 0 && (
        <div className="alert alert-info">
          {quiniela.warnings.map((w, i) => <div key={i}>{w.message}</div>)}
        </div>
      )}

      {estado === 'error' && (
        <div className="alert alert-error">La quiniela quedó en estado de error. Revisa los detalles e intenta re-analizar.</div>
      )}

      {editablePartidos && (
        <CustomBuilder
          mode="edit"
          quinielaId={quinielaId}
          existingFixtureIds={existingFixtureIds}
          existingCount={existingFixtureIds.length}
          onUpdated={setQuiniela}
        />
      )}

      {quiniela.partidos?.length > 0 && (
        <div className="panel">
          <div className="eyebrow">Partidos</div>
          <PartidosTable
            quiniela={quiniela}
            variant={variant}
            canEditMatching={canEditMatching}
            canOverride={canOverride && showResultado}
            canRemove={editablePartidos}
            onUpdated={setQuiniela}
            onRemoved={handleRemovePartido}
          />
        </div>
      )}

      {showAnalisisRunner && (
        <AnalisisRunner
          quinielaId={quinielaId}
          variant={variant}
          hasPerfilesPreset={hasPerfilesPreset}
          canForce={estado === 'parcial'}
          autoStart={estado === 'analizando'}
          onAnalyzed={setQuiniela}
        />
      )}

      {quiniela.resumen && (
        <JugadasResumen
          quiniela={quiniela}
          variant={variant}
          hasPerfilesPreset={hasPerfilesPreset}
          onOptimized={setQuiniela}
        />
      )}
    </div>
  )
}
