'use client'

/**
 * TA3 editor — context-aware based on the protocol T indicated by the preceding TDi-1.
 *
 * When TD2 encodes T=1:
 *   TA3 is the **first TA for T=1** = IFSC (Information Field Size for the Card).
 *   Valid range: 0x01–0xFE (1–254). 0x00 and 0xFF are reserved.
 *   Default if absent: IFSC = 32.
 *
 * When TD2 encodes T=15:
 *   TA3 carries global clock-stop and SPU class indicator bits.
 *
 * Other protocols: raw hex.
 */

interface Ta3EditorProps {
  value: number | undefined
  /** Protocol T indicated by TD2 */
  td2Protocol: number
  onChange: (value: number) => void
}

export function Ta3Editor({ value, td2Protocol, onChange }: Ta3EditorProps) {

  if (td2Protocol === 1) {
    // T=1: TA3 = IFSC (first TA for T=1). Default 32 if absent.
    const ifsc = value ?? 32
    const reserved = ifsc === 0x00 || ifsc === 0xFF

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              IFSC — 0x01..0xFE (1..254 bytes)
            </label>
            <input
              type="range"
              min={1}
              max={254}
              value={Math.max(1, Math.min(254, ifsc))}
              onChange={e => onChange(parseInt(e.target.value))}
              className="accent-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hex</label>
            <input
              type="text"
              value={ifsc.toString(16).padStart(2, '0').toUpperCase()}
              onChange={e => {
                const v = parseInt(e.target.value, 16)
                if (!isNaN(v) && v >= 0 && v <= 255) onChange(v)
              }}
              maxLength={2}
              className="w-14 bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dec</label>
            <input
              type="number"
              min={1}
              max={254}
              value={ifsc}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v >= 1 && v <= 254) onChange(v)
              }}
              className="w-16 bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">IFSC</span>
            <span className="font-mono text-sm text-foreground">{ifsc} bytes</span>
          </div>
          <div className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Max INF field</span>
            <span className="font-mono text-sm text-foreground">0x{ifsc.toString(16).padStart(2,'0').toUpperCase()}</span>
          </div>
        </div>

        {reserved && (
          <p className="text-xs text-destructive">
            0x{ifsc.toString(16).padStart(2,'0').toUpperCase()} is reserved (0x00 and 0xFF are RFU per ISO/IEC 7816-3:2006).
          </p>
        )}
      </div>
    )
  }

  if (td2Protocol === 15) {
    // T=15: first TA encodes clock-stop indicator (b8 b7) and class indicator (b6..b1).
    // ISO/IEC 7816-3:2006 §8.3:
    //   b8 b7: 00 not supported, 01 state L, 10 state H, 11 no preference
    //   b1 class A (5V), b2 class B (3V), b3 class C (1.8V), b4..b6 RFU
    const b = value ?? 0x00
    const clockStop = (b >> 6) & 0x03
    const classBits = b & 0x3f

    const setClockStop = (cs: number) => onChange((classBits) | ((cs & 0x03) << 6))
    const toggleClass = (bit: number) => onChange(((clockStop & 0x03) << 6) | (classBits ^ (1 << bit)))

    const clockOptions = [
      { v: 0, label: 'Not supported' },
      { v: 1, label: 'State L' },
      { v: 2, label: 'State H' },
      { v: 3, label: 'No preference' },
    ]
    const classOptions = [
      { bit: 0, label: 'A', volt: '5V' },
      { bit: 1, label: 'B', volt: '3V' },
      { bit: 2, label: 'C', volt: '1.8V' },
    ]

    return (
      <div className="flex flex-col gap-3">
        {/* Clock stop indicator — bits 8-7 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Clock stop — bits 8-7
          </label>
          <div className="flex flex-wrap gap-2">
            {clockOptions.map(o => (
              <label
                key={o.v}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border cursor-pointer text-xs font-mono transition-all ${
                  clockStop === o.v
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:border-border/60'
                }`}
              >
                <input
                  type="radio"
                  name="ta3-clockstop"
                  checked={clockStop === o.v}
                  onChange={() => setClockStop(o.v)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {/* Class indicator — bits 6-1 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Class accepted by the card — bits 3-1
          </label>
          <div className="flex flex-wrap gap-2">
            {classOptions.map(o => (
              <label
                key={o.bit}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border cursor-pointer text-xs font-mono transition-all ${
                  (classBits >> o.bit) & 1
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:border-border/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={((classBits >> o.bit) & 1) === 1}
                  onChange={() => toggleClass(o.bit)}
                  className="sr-only"
                />
                {o.label} <span className="text-[10px] text-muted-foreground ml-0.5">{o.volt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-secondary/50 rounded px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">TA byte:</span>
          <span className="text-xs font-mono text-primary">{b.toString(16).padStart(2, '0').toUpperCase()}</span>
          <span className="text-xs font-mono text-muted-foreground">= {b.toString(2).padStart(8, '0')}b</span>
        </div>
      </div>
    )
  }

  // Generic raw editor for other protocols
  const b = value ?? 0x00
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Raw value (hex)</label>
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
    </div>
  )
}
