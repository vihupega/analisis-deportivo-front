import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api.js'

const LIMIT = 20

const ESTADOS_PROGOL = ['importada', 'analizando', 'analizada', 'parcial', 'cerrada', 'resuelta', 'error']
const ESTADOS_CUSTOM = ['borrador', 'analizando', 'analizada', 'parcial', 'cerrada', 'resuelta', 'error']

const DELETABLE_ESTADO = { progol: 'importada', custom: 'borrador' }

// Listado paginado, compartido entre Progol y Personalizada.
export default function QuinielaList({ variant, onSelect, refreshToken }) {
  const client = variant === 'progol' ? api.quinielas : api.quinielasCustom
  const estados = variant === 'progol' ? ESTADOS_PROGOL : ESTADOS_CUSTOM

  const [estado, setEstado]     = useState('')
  const [tipoJornada, setTipoJornada] = useState('')
  const [q, setQ]               = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [skip, setSkip]         = useState(0)

  const [items, setItems]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [toast, setToast]     = useState(null)

  const load = useCallback(async (customSkip) => {
    const s = customSkip ?? skip
    setLoading(true); setError(null)
    try {
      const filters = variant === 'progol'
        ? { estado, tipoJornada, dateFrom, dateTo, limit: LIMIT, skip: s }
        : { estado, q, dateFrom, dateTo, limit: LIMIT, skip: s }
      const data = await client.list(filters)
      setItems(Array.isArray(data) ? data : (data.items ?? []))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [client, variant, estado, tipoJornada, q, dateFrom, dateTo, skip])

  useEffect(() => { setSkip(0); load(0) }, [refreshToken]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch() { setSkip(0); load(0) }
  function handleNext() { const s = skip + LIMIT; setSkip(s); load(s) }
  function handlePrev() { const s = Math.max(0, skip - LIMIT); setSkip(s); load(s) }

  async function handleDelete(id) {
    try {
      await client.remove(id)
      setItems(prev => prev.filter(it => it.id !== id))
      setToast({ msg: 'Quiniela eliminada', ok: true })
    } catch (err) {
      setToast({ msg: err.message, ok: false })
    }
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div>
      <div className="panel">
        <div className="eyebrow">{variant === 'progol' ? 'Quinielas Progol' : 'Quinielas personalizadas'}</div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="field">
            <label className="field-label">Estado</label>
            <select className="input" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          {variant === 'progol' ? (
            <div className="field">
              <label className="field-label">Tipo de jornada</label>
              <select className="input" value={tipoJornada} onChange={e => setTipoJornada(e.target.value)}>
                <option value="">Ambos</option>
                <option value="fin_semana">Fin de semana</option>
                <option value="media_semana">Media semana</option>
              </select>
            </div>
          ) : (
            <div className="field">
              <label className="field-label">Buscar por nombre</label>
              <input className="input" type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="ej. Mi quiniela" />
            </div>
          )}
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

        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? <><span className="spinner" /> Buscando…</> : 'Buscar'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {toast && <div className={`alert ${toast.ok ? 'alert-success' : 'alert-error'}`}>{toast.msg}</div>}

      {items !== null && (
        items.length === 0
          ? <div className="empty"><span className="icon">🎟️</span>No hay quinielas con esos filtros.</div>
          : (
            <>
              <div className="quin-list">
                {items.map(it => (
                  <QuinielaListItem
                    key={it.id}
                    item={it}
                    variant={variant}
                    onSelect={() => onSelect(it.id)}
                    onDelete={it.estado === DELETABLE_ESTADO[variant] ? () => handleDelete(it.id) : null}
                  />
                ))}
              </div>
              <div className="pagination-row">
                <span className="text-dim t-mono" style={{ fontSize: '0.78rem' }}>
                  Mostrando {skip + 1}–{skip + items.length}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={handlePrev} disabled={skip === 0 || loading}>← Anterior</button>
                <button className="btn btn-ghost btn-sm" onClick={handleNext} disabled={items.length < LIMIT || loading}>Siguiente →</button>
              </div>
            </>
          )
      )}
    </div>
  )
}

function QuinielaListItem({ item, variant, onSelect, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titulo = variant === 'progol' ? `Concurso ${item.concurso}` : item.nombre
  const subtitulo = variant === 'progol' ? item.tipo_jornada : item.descripcion

  return (
    <div className="quin-list-item">
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onSelect}>
        <div className="quin-list-title">
          {titulo}
          <span className={`status-badge status-${item.estado === 'analizada' || item.estado === 'resuelta' ? 'resolved' : item.estado === 'error' ? 'cancelled' : 'pending'}`}>
            {item.estado}
          </span>
        </div>
        <div className="fixture-meta">
          {subtitulo && <>{subtitulo} · </>}
          {item.fecha_cierre || item.fecha_min || ''}
          {item.resumen?.prob_objetivo_pct != null && <> · {item.resumen.prob_objetivo_pct.toFixed(1)}% objetivo</>}
          {item.resumen?.costo != null && <> · costo {item.resumen.costo}</>}
        </div>
      </div>
      <div className="row gap-8">
        <button className="btn btn-ghost btn-sm" onClick={onSelect}>Ver</button>
        {onDelete && (
          <button
            className="btn btn-ghost btn-sm"
            style={confirmDelete ? { borderColor: 'var(--c-bad)', color: 'var(--c-bad)' } : { color: 'var(--text-dim)' }}
            onClick={() => {
              if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return }
              onDelete()
            }}
          >
            {confirmDelete ? '¿Eliminar?' : 'Eliminar'}
          </button>
        )}
      </div>
    </div>
  )
}
