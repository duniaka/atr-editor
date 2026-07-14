'use client'

import { decodeTA2 } from '@/lib/atr'

interface Ta2EditorProps {
  value: number | undefined
  present: boolean
  onChange: (value: number) => void
}

export function Ta2Editor({ value, present, onChange }: Ta2EditorProps) {
  const effectiveVal = value ?? 0x00
  const { canChange, useImplicitFiDi, protocol } = decodeTA2(effectiveVal)

  const update = (changes: Partial<{ canChange: boolean; useImplicitFiDi: boolean; protocol: number }>) => {
    const merged = { canChange, useImplicitFiDi, protocol, ...changes }
    let byte = merged.protocol & 0x0f
    if (!merged.canChange) byte |= 0x80
    if (merged.useImplicitFiDi) byte |= 0x10
    onChange(byte)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
          {/* Bit 8 — b8=1 means SPECIFIC/FIXED (cannot change), b8=0 means NEGOTIABLE */}
          <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded border border-border hover:border-border/60 bg-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={!canChange}
              onChange={e => update({ canChange: !e.target.checked })}
              className="accent-primary mt-0.5 w-3.5 h-3.5"
            />
            <div>
              <span className="text-sm text-foreground">b8 — Specific mode (card fixes the transmission parameters)</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                This toggle sets bit 8. Checked (b8=1) = specific mode: the card dictates the transmission
                parameters and they cannot be negotiated. Unchecked (b8=0) = negotiable mode: the interface
                device may change parameters via PPS. (The bit itself is always editable here.)
              </p>
            </div>
          </label>

          {/* Bit 5 — useImplicitFiDi */}
          <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded border border-border hover:border-border/60 bg-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={useImplicitFiDi}
              onChange={e => update({ useImplicitFiDi: e.target.checked })}
              className="accent-primary mt-0.5 w-3.5 h-3.5"
            />
            <div>
              <span className="text-sm text-foreground">Bit 5: Use implicit Fi/Di</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                If set, Fi/Di are implicit — not carried anywhere in the ATR; the card and reader rely on
                values agreed out-of-band (the card's own specification). If unset, Fi/Di come from TA1
                (or the defaults 372/1 when TA1 is absent).
              </p>
            </div>
          </label>

          {/* Protocol selector bits 4-1 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Protocol type T — bits 4-1
            </label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 14, 15].map(t => (
                <label
                  key={t}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border cursor-pointer text-xs font-mono transition-all ${
                    protocol === t
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:border-border/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="ta2-proto"
                    checked={protocol === t}
                    onChange={() => update({ protocol: t })}
                    className="sr-only"
                  />
                  T={t}
                  {t === 0 && <span className="text-[10px] text-muted-foreground ml-1">(char)</span>}
                  {t === 1 && <span className="text-[10px] text-muted-foreground ml-1">(block)</span>}
                  {t === 14 && <span className="text-[10px] text-muted-foreground ml-1">(non-std)</span>}
                  {t === 15 && <span className="text-[10px] text-muted-foreground ml-1">(global)</span>}
                </label>
              ))}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                <span className="text-xs text-muted-foreground">Other:</span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={protocol}
                  onChange={e => {
                    const v = parseInt(e.target.value)
                    if (!isNaN(v) && v >= 0 && v <= 15) update({ protocol: v })
                  }}
                  className="w-12 bg-secondary border border-border rounded px-1.5 py-1 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 rounded px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">TA2 byte:</span>
            <span className="text-xs font-mono text-primary">
              {effectiveVal.toString(16).padStart(2, '0').toUpperCase()}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              = {effectiveVal.toString(2).padStart(8, '0')}b
            </span>
          </div>
      </div>
    </div>
  )
}
