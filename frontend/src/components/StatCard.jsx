import React from 'react'

const toneMap = {
  slate: 'border-slate-200',
  teal: 'border-teal-200',
  amber: 'border-amber-200',
  sky: 'border-sky-200',
  rose: 'border-rose-200'
}

export default function StatCard({ label, value, hint, tone = 'slate' }) {
  return (
    <div className={`card p-4 border-l-4 ${toneMap[tone] || toneMap.slate}`}>
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  )
}
