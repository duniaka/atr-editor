'use client'

interface Tc2EditorProps {
  value: number | undefined
  present: boolean
  onChange: (value: number) => void
}

export function Tc2Editor({ value, present, onChange }: Tc2EditorProps) {
  // Default WI=10 when absent
  const wi = value ?? 10

  // WT = 960 × WI × Fi/f (with default Fi=372)
  // At 5MHz: WT_ms = 960 × WI × 372 / 5_000_000 × 1000
  const wtEtu = 960 * wi
  const wtMs = (960 * wi * 372) / 5_000_000 * 1000

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              WI (waiting time integer) — 1-255
            </label>
            <input
              type="range"
              min={1}
              max={255}
              value={wi}
              onChange={e => onChange(parseInt(e.target.value))}
              className="accent-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Hex
            </label>
            <input
              type="text"
              value={wi.toString(16).padStart(2, '0').toUpperCase()}
              onChange={e => {
                const v = parseInt(e.target.value, 16)
                if (!isNaN(v) && v >= 1 && v <= 255) onChange(v)
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
              min={1}
              max={255}
              value={wi}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v >= 1 && v <= 255) onChange(v)
              }}
              className="w-16 bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'WI', val: wi.toString() },
            { label: 'WT (etu)', val: wtEtu.toLocaleString() },
            { label: 'WT @ 5MHz', val: `${wtMs.toFixed(2)} ms` },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5 min-w-[90px]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <span className="font-mono text-sm text-foreground">{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
