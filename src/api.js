const BASE = '/api'

async function fetchJSON(path, opts = {}) {
  let res
  try {
    res = await fetch(BASE + path, opts)
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:8001')
  }
  const data = await res.json().catch(() => ({ detail: res.statusText }))
  if (!res.ok) throw new Error(data.detail || res.statusText)
  return data
}

// Igual que fetchJSON pero envía un body JSON (POST/PATCH/PUT).
function sendJSON(path, method, body) {
  return fetchJSON(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

// DELETE que tolera respuesta 204 sin cuerpo, igual que deletePrediction.
function deleteNoContent(path) {
  return fetchJSON(path, { method: 'DELETE' }).catch(err => {
    if (err.message && !err.message.includes('JSON')) throw err
  })
}

function buildQuery(map) {
  const p = new URLSearchParams()
  Object.entries(map).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v) })
  return p.toString()
}

export const api = {
  getFixtures: (date, league) => {
    const p = new URLSearchParams({ date })
    if (league) p.set('league', league)
    return fetchJSON(`/fixtures?${p}`)
  },

  predict: (home, away, league, date, season, leagueId, country) => {
    const p = new URLSearchParams({ home, away, league, date })
    if (season)   p.set('season',    season)
    if (leagueId) p.set('league_id', leagueId)
    if (country)  p.set('country',   country)
    return fetchJSON(`/predict?${p}`)
  },

  predictWC: (home, away, league, date, season, leagueId, country) => {
    const p = new URLSearchParams({ home, away, league, date })
    if (season)   p.set('season',    season)
    if (leagueId) p.set('league_id', leagueId)
    if (country)  p.set('country',   country)
    return fetchJSON(`/predict/wc?${p}`)
  },

  collect: (league, seasons, tournamentType = 'clubs', minPrior = 4, force = false, leagueId, country) => {
    const p = new URLSearchParams({ league, tournament_type: tournamentType, min_prior: minPrior, force })
    seasons.forEach(s => p.append('season', s))
    if (leagueId) p.set('league_id', leagueId)
    if (country)  p.set('country', country)
    return fetchJSON(`/admin/collect?${p}`, { method: 'POST' })
  },

  collectStatus: () => fetchJSON('/admin/collect/status'),

  train: () => fetchJSON('/admin/train', { method: 'POST' }),

  trainWC: () => fetchJSON('/admin/train/wc', { method: 'POST' }),

  resolve: (daysBack = 3, modelType, dryRun = false) => {
    const p = new URLSearchParams({ days_back: daysBack, dry_run: dryRun })
    if (modelType) p.set('model_type', modelType)
    return fetchJSON(`/admin/resolve?${p}`, { method: 'POST' })
  },

  leagueSearch: (q) => fetchJSON(`/leagues/search?${new URLSearchParams({ q })}`),

  leaguesTrained: () => fetchJSON('/leagues/trained'),

  predictionsStats: () => fetchJSON('/predictions/stats'),

  predictionsHistory: (filters = {}) => {
    const p = new URLSearchParams()
    const map = {
      status:      filters.status,
      model_type:  filters.modelType,
      league:      filters.league,
      date_from:   filters.dateFrom,
      date_to:     filters.dateTo,
      correctness: filters.correctness,
      limit:       filters.limit ?? 20,
      skip:        filters.skip   ?? 0,
    }
    Object.entries(map).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, v) })
    return fetchJSON(`/predictions/history?${p}`)
  },

  deletePrediction: (id) =>
    fetchJSON(`/predictions/${id}`, { method: 'DELETE' }).catch(err => {
      if (err.message && !err.message.includes('JSON')) throw err
    }),

  exportHistoryUrl: (filters = {}) => {
    const p = new URLSearchParams()
    const map = {
      status:      filters.status,
      model_type:  filters.modelType,
      league:      filters.league,
      date_from:   filters.dateFrom,
      date_to:     filters.dateTo,
      correctness: filters.correctness,
    }
    Object.entries(map).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, v) })
    const qs = p.toString()
    return `${BASE}/predictions/history/export${qs ? `?${qs}` : ''}`
  },
}

// ── Quinielas Progol ──────────────────────────────────────────
api.quinielas = {
  importarWeb: (tipoJornada, force = false) =>
    sendJSON('/quinielas/importar/web', 'POST', { tipo_jornada: tipoJornada, force }),

  importarManual: (payload) =>
    sendJSON('/quinielas/importar/manual', 'POST', payload),

  list: (filters = {}) => {
    const qs = buildQuery({
      estado:       filters.estado,
      tipo_jornada: filters.tipoJornada,
      date_from:    filters.dateFrom,
      date_to:      filters.dateTo,
      limit:        filters.limit ?? 50,
      skip:         filters.skip ?? 0,
    })
    return fetchJSON(`/quinielas${qs ? `?${qs}` : ''}`)
  },

  get: (id) => fetchJSON(`/quinielas/${id}`),

  remove: (id) => deleteNoContent(`/quinielas/${id}`),

  patchPartido: (id, num, payload) => sendJSON(`/quinielas/${id}/partidos/${num}`, 'PATCH', payload),

  analizar: (id, payload) => sendJSON(`/quinielas/${id}/analizar`, 'POST', payload),

  analizarEstado: (id) => fetchJSON(`/quinielas/${id}/analizar/estado`),

  optimizar: (id, payload) => sendJSON(`/quinielas/${id}/optimizar`, 'POST', payload),

  override: (id, payload) => sendJSON(`/quinielas/${id}/override`, 'POST', payload),

  sincronizar: (id) => sendJSON(`/quinielas/${id}/sincronizar`, 'POST'),

  estadisticas: () => fetchJSON('/quinielas/estadisticas'),

  exportUrl: (id) => `${BASE}/quinielas/${id}/export`,
}

// ── Quinielas Personalizadas ──────────────────────────────────
api.quinielasCustom = {
  crear: (payload) => sendJSON('/quinielas-personalizadas', 'POST', payload),

  list: (filters = {}) => {
    const qs = buildQuery({
      estado:    filters.estado,
      q:         filters.q,
      date_from: filters.dateFrom,
      date_to:   filters.dateTo,
      limit:     filters.limit ?? 50,
      skip:      filters.skip ?? 0,
    })
    return fetchJSON(`/quinielas-personalizadas${qs ? `?${qs}` : ''}`)
  },

  get: (id) => fetchJSON(`/quinielas-personalizadas/${id}`),

  patchMeta: (id, payload) => sendJSON(`/quinielas-personalizadas/${id}`, 'PATCH', payload),

  remove: (id) => deleteNoContent(`/quinielas-personalizadas/${id}`),

  putPartidos: (id, partidos) => sendJSON(`/quinielas-personalizadas/${id}/partidos`, 'PUT', { partidos }),

  addPartidos: (id, partidos) => sendJSON(`/quinielas-personalizadas/${id}/partidos`, 'POST', { partidos }),

  deletePartido: (id, fixtureId) => deleteNoContent(`/quinielas-personalizadas/${id}/partidos/${fixtureId}`),

  analizar: (id, payload) => sendJSON(`/quinielas-personalizadas/${id}/analizar`, 'POST', payload),

  analizarEstado: (id) => fetchJSON(`/quinielas-personalizadas/${id}/analizar/estado`),

  optimizar: (id, payload) => sendJSON(`/quinielas-personalizadas/${id}/optimizar`, 'POST', payload),

  sincronizar: (id) => sendJSON(`/quinielas-personalizadas/${id}/sincronizar`, 'POST'),

  estadisticas: () => fetchJSON('/quinielas-personalizadas/estadisticas'),
}
