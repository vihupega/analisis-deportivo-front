const MAP = {
  ok:           { cls: 'pill ok',   label: 'OK' },
  needs_review: { cls: 'pill warn', label: 'Para revisar' },
  unmatched:    { cls: 'pill bad',  label: 'Sin identificar' },
}

export default function MatchStatusBadge({ estado }) {
  const { cls, label } = MAP[estado] ?? { cls: 'pill', label: estado ?? '—' }
  return <span className={cls}>{label}</span>
}
