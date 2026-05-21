import { useState, useEffect } from 'react'
import MatchStatsSection from './MatchStatsSection.jsx'

export default function ProbabilityResult({ result }) {
  const p = result.probabilities
  const home = p.home_win_prob
  const draw = p.draw_prob
  const away = p.away_win_prob

  const winner =
    home > draw && home > away ? 'home'
    : away > home && away > draw ? 'away'
    : 'draw'

  return (
    <div className="prob-result fade-up">
      <div className="prob-teams">
        <span style={{ color: winner === 'home' ? 'var(--c-ok)' : 'var(--ink-0)' }}>
          {result.home_team}
        </span>
        <span style={{ color: 'var(--ink-3)', margin: '0 10px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>vs</span>
        <span style={{ color: winner === 'away' ? 'var(--c-ok)' : 'var(--ink-0)' }}>
          {result.away_team}
        </span>
        <span className="league-label">{result.league} · {result.date}</span>
      </div>

      <div className="prob-bars">
        <ProbRow label={result.home_team} value={home} type="home" />
        <ProbRow label="Empate" value={draw} type="draw" />
        <ProbRow label={result.away_team} value={away} type="away" />
      </div>

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

function ProbRow({ label, value, type }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value))
    return () => cancelAnimationFrame(id)
  }, [value])

  return (
    <div className="prob-row">
      <span className="prob-label" title={label}>
        {label.length > 12 ? label.slice(0, 11) + '…' : label}
      </span>
      <div className="prob-track">
        <div className={`prob-fill ${type}`} style={{ width: `${width}%` }} />
      </div>
      <span className={`prob-pct ${type}`}>{value.toFixed(1)}%</span>
    </div>
  )
}
