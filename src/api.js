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
