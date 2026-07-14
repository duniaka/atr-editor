'use client'

interface Tc1EditorProps {
  value: number | undefined
  present: boolean
  onChange: (value: number) => void
}

export function Tc1Editor({ value, present, onChange }: Tc1EditorProps) {
  const n = value ?? 0

  const guardTimeLabel =
    n === 255 ? 'GT = 12 etu (N=255 special case)' : n === 0 ? 'No extra guard time (default)' : `N = ${n}`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              N (extra guard time) — 0-255
            </label>
            <input
              type="range"
              min={0}
              max={255}
              value={n}
              onChange={e => onChange(parseInt(e.target.value))}
              className="accent-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Hex value
            </label>
            <input
              type="text"
              value={n.toString(16).padStart(2, '0').toUpperCase()}
              onChange={e => {
                const v = parseInt(e.target.value, 16)
                if (!isNaN(v) && v >= 0 && v <= 255) onChange(v)
              }}
              maxLength={2}
              className="w-14 bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Dec
            </label>
            <input
              type="number"
              min={0}
              max={255}
              value={n}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v >= 0 && v <= 255) onChange(v)
              }}
              className="w-16 bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
        </div>

        <div className="bg-secondary/50 rounded px-3 py-2">
          <span className="text-xs font-mono text-muted-foreground">{guardTimeLabel}</span>
        </div>
      </div>
    </div>
  )
}
