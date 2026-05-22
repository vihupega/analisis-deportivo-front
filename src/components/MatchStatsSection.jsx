import { useState, useEffect } from 'react'

export function StatDualBar({ label, homeVal, awayVal, fillType = 'home' }) {
  const hv = homeVal ?? 0
  const av = awayVal ?? 0
  const total = hv + av
  const homePct = total === 0 ? 50 : (hv / total) * 100
  const awayPct = total === 0 ? 50 : (av / total) * 100
  const [homeW, setHomeW] = useState(0)
  const [awayW, setAwayW] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => { setHomeW(homePct); setAwayW(awayPct) })
    return () => cancelAnimationFrame(id)
  }, [homePct, awayPct])

  return (
    <div className="stat-dual-row">
      <span className="stat-val stat-val--home">{hv.toFixed(1)}</span>
      <div className="stat-dual-bars">
        <div className="stat-track stat-track--home">
          <div className={`stat-fill stat-fill--${fillType === 'warn' ? 'warn' : 'home'}`} style={{ width: `${homeW}%` }} />
        </div>
        <span className="stat-label-center">{label}</span>
        <div className="stat-track stat-track--away">
          <div className={`stat-fill stat-fill--${fillType === 'warn' ? 'warn' : 'away'}`} style={{ width: `${awayW}%` }} />
        </div>
      </div>
      <span className="stat-val stat-val--away">{av.toFixed(1)}</span>
    </div>
  )
}

export default function MatchStatsSection({ stats, homeTeam, awayTeam, compact = false }) {
  if (!stats) return null
  const trim = (s, n = 10) => s.length > n ? s.slice(0, n - 1) + '…' : s
  const fmt2 = (v) => (v ?? 0).toFixed(2)

  return (
    <div>
      {!compact && <div className="stats-divider" />}
      {!compact && <div className="eyebrow" style={{ marginBottom: 14 }}>Estadísticas esperadas</div>}

      {compact
        ? (
          <div className="xg-compact">
            <span className="xg-compact-val text-ok">{fmt2(stats.home_xg)}</span>
            <div className="xg-compact-center">
              <span className="xg-label">xG</span>
              <span className="xg-compact-total">
                <span className="text-dim">total </span>{fmt2(stats.expected_total_goals)}
              </span>
            </div>
            <span className="xg-compact-val text-bad">{fmt2(stats.away_xg)}</span>
          </div>
        )
        : (
          <div className="xg-hero">
            <div className="xg-side xg-side--home">
              <span className="xg-num text-ok">{fmt2(stats.home_xg)}</span>
              <span className="xg-team-label">{homeTeam}</span>
            </div>
            <div className="xg-center">
              <span className="xg-label">xG</span>
              <span className="xg-total">
                <span className="text-dim">total </span>
                {fmt2(stats.expected_total_goals)}
              </span>
            </div>
            <div className="xg-side xg-side--away">
              <span className="xg-num text-bad">{fmt2(stats.away_xg)}</span>
              <span className="xg-team-label">{awayTeam}</span>
            </div>
          </div>
        )
      }

      <div className="stats-compare">
        {!compact && (
          <div className="stats-compare-header">
            <span className="stat-header-home">{trim(homeTeam)}</span>
            <span />
            <span className="stat-header-away">{trim(awayTeam)}</span>
          </div>
        )}
        <StatDualBar label="Faltas"    homeVal={stats.home_fouls_avg_l5}    awayVal={stats.away_fouls_avg_l5}    />
        <StatDualBar label="Amarillas" homeVal={stats.home_yellow_cards_l5} awayVal={stats.away_yellow_cards_l5} fillType="warn" />
        <StatDualBar label="Corners"   homeVal={stats.home_corners_avg_l5}  awayVal={stats.away_corners_avg_l5}  />
      </div>
    </div>
  )
}
