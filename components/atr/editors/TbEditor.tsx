'use client'

interface TbEditorProps {
  index: number
  value: number | undefined
  present: boolean
  onChange: (value: number) => void
  /** Protocol T from the preceding TDi-1 — used for index=3 to render BWI/CWI */
  td2Protocol?: number
}

export function TbEditor({ index, value, present, onChange, td2Protocol }: TbEditorProps) {
  const isDeprecated = index <= 2

  // TB3 when TD2=T=1 is the first TB for T=1: upper nibble = BWI, lower nibble = CWI
  if (index === 3 && td2Protocol === 1) {
    const b = value ?? 0x45 // default BWI=4, CWI=5
    const bwi = (b >> 4) & 0x0f
    const cwi = b & 0x0f

    // BWT = 11 etu + 2^BWI × 960 × (Fd/f), show etu count (Fd=372 implicit)
    const bwtEtu = 11 + Math.pow(2, bwi) * 960
    // CWT = 11 + 2^CWI etu
    const cwtEtu = 11 + Math.pow(2, cwi)
    const bwiRfu = bwi > 9

    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4">
          {/* BWI — bits 7-4 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              BWI — bits 7-4 (0-9)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={15}
                value={bwi}
                onChange={e => onChange((parseInt(e.target.value) << 4) | cwi)}
                className="accent-primary flex-1"
              />
              <input
                type="number"
                min={0}
                max={15}
                value={bwi}
                onChange={e => {
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v >= 0 && v <= 15) onChange((v << 4) | cwi)
                }}
                className="w-12 bg-secondary border border-border rounded px-1.5 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
              />
            </div>
          </div>

          {/* CWI — bits 3-0 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              CWI — bits 3-0 (0-15)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={15}
                value={cwi}
                onChange={e => onChange((bwi << 4) | parseInt(e.target.value))}
                className="accent-primary flex-1"
              />
              <input
                type="number"
                min={0}
                max={15}
                value={cwi}
                onChange={e => {
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v >= 0 && v <= 15) onChange((bwi << 4) | v)
                }}
                className="w-12 bg-secondary border border-border rounded px-1.5 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'BWI', val: bwi.toString() },
            { label: 'BWT (etu)', val: `≈ ${bwtEtu.toLocaleString()}` },
            { label: 'CWI', val: cwi.toString() },
            { label: 'CWT (etu)', val: cwtEtu.toLocaleString() },
            { label: 'TB3 byte', val: b.toString(16).padStart(2, '0').toUpperCase() },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5 min-w-[80px]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <span className="font-mono text-sm text-foreground">{item.val}</span>
            </div>
          ))}
        </div>

        {bwiRfu && (
          <p className="text-xs text-warning">BWI values 0xA–0xF are reserved for future use per ISO/IEC 7816-3:2006.</p>
        )}
      </div>
    )
  }

  // Generic raw editor (deprecated TB1/TB2, or unknown TB3 protocol)
  const b = value ?? 0x00
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
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Binary
          </label>
          <span className="text-xs font-mono text-muted-foreground bg-secondary/50 rounded px-2 py-1.5">
            {b.toString(2).padStart(8, '0')}b
          </span>
        </div>
      </div>
    </div>
  )
}
