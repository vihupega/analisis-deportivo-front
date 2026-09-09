import { useState, useEffect } from 'react'

// Barra individual de probabilidad (local / empate / visitante). Extraída de
// ProbabilityResult.jsx para reutilizarse también en Quinielas.
export function ProbRow({ label, value, type, isWinner, isViable, compact }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value))
    return () => cancelAnimationFrame(id)
  }, [value])

  const classes = ['prob-row', compact && 'compact', isWinner && 'winner', isViable && 'viable']
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

// Trío de barras local/empate/visitante. value = prob_local/prob_empate/prob_visitante (0-100).
export default function ProbBars({ homeLabel, awayLabel, home, draw, away, winner, drawViable, compact }) {
  return (
    <div className="prob-bars">
      <ProbRow
        label={homeLabel}
        value={home}
        type="home"
        isWinner={winner === 'home'}
        compact={compact}
      />
      <ProbRow
        label="Empate"
        value={draw}
        type="draw"
        isWinner={winner === 'draw'}
        isViable={drawViable && winner !== 'draw'}
        compact={compact}
      />
      <ProbRow
        label={awayLabel}
        value={away}
        type="away"
        isWinner={winner === 'away'}
        compact={compact}
      />
    </div>
  )
}
