import { useState, useEffect } from 'react'
import MatchStatsSection from './MatchStatsSection.jsx'

export default function ProbabilityResult({ result }) {
  const p = result.probabilities
  const home = p.home_win_prob
  const draw = p.draw_prob
  const away = p.away_win_prob

  const analysis        = result.match_analysis ?? {}
  const isCloseMatch    = analysis.is_close_match  ?? false
  const drawIsViable    = analysis.draw_is_viable  ?? false
  const warnings        = result.warnings           ?? []
  const notes           = result.informational_notes ?? []
  const closeWarning    = warnings.find(w => w.type === 'close_match')

  const winner =
    home > draw && home > away ? 'home'
    : away > home && away > draw ? 'away'
    : 'draw'

  return (
    <div className={`prob-result fade-up${isCloseMatch ? ' close-match' : ''}`}>

      {isCloseMatch && (
        <div className="close-match-badge">
          <span aria-hidden="true">⚠</span> Partido parejo
        </div>
      )}

      <div className="prob-teams">
        <span style={{ color: !isCloseMatch && winner === 'home' ? 'var(--c-ok)' : 'var(--ink-0)' }}>
          {result.home_team}
        </span>
        <span style={{ color: 'var(--ink-3)', margin: '0 10px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>vs</span>
        <span style={{ color: !isCloseMatch && winner === 'away' ? 'var(--c-ok)' : 'var(--ink-0)' }}>
          {result.away_team}
        </span>
        <span className="league-label">{result.league} · {result.date}</span>
      </div>

      <div className="prob-bars">
        <ProbRow
          label={result.home_team}
          value={home}
          type="home"
          isWinner={!isCloseMatch && winner === 'home'}
        />
        <ProbRow
          label="Empate"
          value={draw}
          type="draw"
          isWinner={!isCloseMatch && winner === 'draw'}
          isViable={drawIsViable && winner !== 'draw'}
        />
        <ProbRow
          label={result.away_team}
          value={away}
          type="away"
          isWinner={!isCloseMatch && winner === 'away'}
        />
      </div>

      {closeWarning && (
        <p className="analysis-warning" role="alert">
          {closeWarning.message}
        </p>
      )}

      {notes.length > 0 && (
        <div className="analysis-notes">
          {notes.map((note, i) => (
            <p key={i} className="analysis-note">{note}</p>
          ))}
        </div>
      )}

      {result.match_stats && (
        <MatchStatsSection
          stats={result.match_stats}
          homeTeam={result.home_team}
          awayTeam={result.away_team}
        />
      )}
    </div>
  )
}

function ProbRow({ label, value, type, isWinner, isViable }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value))
    return () => cancelAnimationFrame(id)
  }, [value])

  const classes = ['prob-row', isWinner && 'winner', isViable && 'viable']
    .filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span className="prob-label" title={label}>
        {label.length > 12 ? label.slice(0, 11) + '…' : label}
      </span>
      <div className="prob-track">
        <div className={`prob-fill ${type}`} style={{ width: `${width}%` }} />
      </div>
      <span className={`prob-pct ${type}`}>
        {value.toFixed(1)}%
        {isViable && <span className="viable-mark" aria-label="empate viable">↑</span>}
      </span>
    </div>
  )
}
