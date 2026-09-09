import { useCallback, useEffect, useRef, useState } from 'react'

const TERMINAL_STATES = ['done', 'partial', 'error']

// Polling genérico para el job de análisis de una quiniela (Progol o Personalizada).
// fetchEstado: () => Promise<{ estado, total, procesados, matched, needs_review, unmatched, motivo_error }>
// Usa setTimeout recursivo (no setInterval) con backoff 2s -> 5s, y corta en done/partial/error.
export function useQuinielaPolling(fetchEstado, { minIntervalMs = 2000, maxIntervalMs = 5000, onDone } = {}) {
  const [estado, setEstado] = useState(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState(null)

  const timerRef    = useRef(null)
  const intervalRef = useRef(minIntervalMs)
  const activeRef    = useRef(false)
  const fetchRef     = useRef(fetchEstado)
  const onDoneRef     = useRef(onDone)
  fetchRef.current = fetchEstado
  onDoneRef.current = onDone

  const stop = useCallback(() => {
    activeRef.current = false
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setPolling(false)
  }, [])

  const tick = useCallback(async () => {
    if (!activeRef.current) return
    try {
      const data = await fetchRef.current()
      if (!activeRef.current) return
      setEstado(data)
      if (TERMINAL_STATES.includes(data.estado)) {
        stop()
        onDoneRef.current?.(data)
        return
      }
      intervalRef.current = Math.min(maxIntervalMs, intervalRef.current + 500)
      timerRef.current = setTimeout(tick, intervalRef.current)
    } catch (err) {
      if (!activeRef.current) return
      setError(err.message)
      stop()
    }
  }, [maxIntervalMs, stop])

  const start = useCallback(() => {
    activeRef.current = true
    intervalRef.current = minIntervalMs
    setError(null)
    setPolling(true)
    tick()
  }, [minIntervalMs, tick])

  // cleanup estricto: evita fugas del timer al desmontar o cambiar de quiniela
  useEffect(() => stop, [stop])

  return { estado, polling, error, start, stop }
}
