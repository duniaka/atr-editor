'use client'

interface Tc3EditorProps {
  value: number | undefined
  onChange: (value: number) => void
  /** Protocol T from the preceding TDi-1. LRC/CRC selection is only defined for T=1. */
  td2Protocol?: number
}

export function Tc3Editor({ value, onChange, td2Protocol }: Tc3EditorProps) {
  const b = value ?? 0x00

  // The redundancy-code (LRC/CRC) meaning only applies to the first TC for T=1.
  // For any other qualifying protocol, fall back to a raw hex/binary view.
  if (td2Protocol !== 1) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Raw value (hex)
            </label>
            <input
              type="text"
              value={b.toString(16).padStart(2, '0').toUpperCase()}
              onChange={e => {
                const v = parseInt(e.target.value, 16)
                if (!isNaN(v) && v >= 0 && v <= 255) onChange(v)
              }}
              maxLength={2}
              className="w-14 bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Binary</label>
            <span className="text-xs font-mono text-muted-foreground bg-secondary/50 rounded px-2 py-1.5">
              {b.toString(2).padStart(8, '0')}b
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          The LRC/CRC redundancy-code selection is only defined for the first TC of T=1. Under T={td2Protocol ?? 0},
          ISO/IEC 7816-3:2006 assigns no specific meaning to this byte.
        </p>
      </div>
    )
  }

  const useCrc = (b & 0x01) !== 0
  const reservedBitsSet = (b & 0xFE) !== 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {/* LRC option */}
        <button
          type="button"
          onClick={() => onChange(useCrc ? (b & 0xFE) : b)}
          className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-lg border transition-all ${
            !useCrc
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground hover:border-border/80'
          }`}
        >
          <span className="text-sm font-semibold font-mono">LRC</span>
          <span className="text-[11px]">Longitudinal Redundancy Check</span>
          <span className="text-[10px] opacity-60">bit 0 = 0 (default)</span>
        </button>

        {/* CRC option */}
        <button
          type="button"
          onClick={() => onChange(b | 0x01)}
          className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-lg border transition-all ${
            useCrc
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground hover:border-border/80'
          }`}
        >
          <span className="text-sm font-semibold font-mono">CRC</span>
          <span className="text-[11px]">Cyclic Redundancy Check</span>
          <span className="text-[10px] opacity-60">bit 0 = 1</span>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">TC3 byte</span>
          <span className="font-mono text-sm text-foreground">{b.toString(16).padStart(2, '0').toUpperCase()}</span>
        </div>
        <div className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Binary</span>
          <span className="font-mono text-sm text-foreground">{b.toString(2).padStart(8, '0')}b</span>
        </div>
        <div className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">EDC</span>
          <span className="font-mono text-sm text-foreground">{useCrc ? 'CRC' : 'LRC'}</span>
        </div>
      </div>

      {reservedBitsSet && (
        <p className="text-xs text-warning">
          Bits 7..1 are reserved and should be 0x00 per ISO/IEC 7816-3:2006.
        </p>
      )}
    </div>
  )
}
