'use client'

import { useState } from 'react'
import { FI_TABLE, DI_TABLE, decodeTA1 } from '@/lib/atr'

interface Ta1EditorProps {
  value: number | undefined
  present: boolean
  onChange: (value: number) => void
}

const FI_OPTIONS = Object.entries(FI_TABLE).map(([k, v]) => ({
  bits: parseInt(k),
  fi: v.fi,
  fMax: v.fMax,
}))

const DI_OPTIONS = Object.entries(DI_TABLE).map(([k, v]) => ({
  bits: parseInt(k),
  di: v,
}))

export function Ta1Editor({ value, present, onChange }: Ta1EditorProps) {
  const effectiveVal = value ?? 0x11 // default Fi=372, Di=1
  const { fiBits, diBits, fi, fMax, di } = decodeTA1(effectiveVal)
  const [clockMHz, setClockMHz] = useState(5)

  const handleFiChange = (newFiBits: number) => {
    onChange((newFiBits << 4) | diBits)
  }

  const handleDiChange = (newDiBits: number) => {
    onChange((fiBits << 4) | newDiBits)
  }

  // Timing calculations
  // 1 etu = Fi / (Di × f)  seconds
  // f in Hz = clockMHz × 1_000_000
  const fHz = clockMHz * 1_000_000
  // 1 etu spans Fi/Di clock cycles (independent of the actual clock frequency).
  const clocksPerEtu = fi / di
  const etuSec = fi / (di * fHz)
  const etuUs = etuSec * 1_000_000
  // 1 character = 10 etu (start + 8 data + parity); + 2 etu default guard time = 12 etu per slot.
  const charEtu = 10
  const charSlotEtu = 12 // including default guard time
  const charUs = charEtu * etuUs
  const charSlotUs = charSlotEtu * etuUs
  // T=1 block: prologue(3) + info(0..254) + epilogue(2 or 3) bytes, each 11 etu
  // Minimum block = 5 bytes (S-block no data) = 55 etu
  const t1ByteEtu = 11
  const t1ByteUs = t1ByteEtu * etuUs
  const t1MinBlockUs = 5 * t1ByteEtu * etuUs

  const fmt = (us: number) =>
    us >= 1000 ? `${(us / 1000).toFixed(3)} ms` : `${us.toFixed(2)} µs`

  return (
    <div className="flex flex-col gap-3">
      {present && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Fi selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fi / f(max) — bits 8-5
              </label>
              <select
                value={fiBits}
                onChange={e => handleFiChange(parseInt(e.target.value))}
                className="bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
              >
                {FI_OPTIONS.map(opt => (
                  <option key={opt.bits} value={opt.bits}>
                    {opt.bits.toString(16).toUpperCase()} — Fi={opt.fi}, f≤{opt.fMax}MHz
                  </option>
                ))}
              </select>
            </div>

            {/* Di selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Di — bits 4-1
              </label>
              <select
                value={diBits}
                onChange={e => handleDiChange(parseInt(e.target.value))}
                className="bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
              >
                {DI_OPTIONS.map(opt => (
                  <option key={opt.bits} value={opt.bits}>
                    {opt.bits.toString(16).toUpperCase()} — Di={opt.di}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clock frequency input */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              Clock frequency
            </label>
            <input
              type="number"
              min={0.1}
              max={20}
              step={0.1}
              value={clockMHz}
              onChange={e => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v) && v > 0 && v <= 20) setClockMHz(v)
              }}
              className="w-20 bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
            <span className="text-xs text-muted-foreground">MHz</span>
            {clockMHz > fMax && (
              <span className="text-xs text-destructive">exceeds f(max) = {fMax} MHz</span>
            )}
          </div>

          {/* Derived values + timing */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Fi', val: fi.toString() },
              { label: 'Di', val: di.toString() },
              { label: 'clocks/etu', val: Number.isInteger(clocksPerEtu) ? clocksPerEtu.toString() : clocksPerEtu.toFixed(3) },
              { label: 'f(max)', val: `${fMax} MHz` },
              { label: 'TA1', val: effectiveVal.toString(16).padStart(2, '0').toUpperCase() },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-0.5 bg-secondary/50 rounded px-2.5 py-1.5 min-w-[72px]">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <span className="font-mono text-sm text-foreground">{item.val}</span>
              </div>
            ))}
          </div>

          <div className="border border-border/40 rounded-lg overflow-hidden">
            <div className="bg-secondary/40 px-3 py-1.5 border-b border-border/40">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Timing @ {clockMHz} MHz
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border/40">
              <div className="flex flex-col gap-2 px-3 py-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">T=0 (character)</span>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">1 etu</span>
                    <span className="font-mono text-xs text-foreground">{fmt(etuUs)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">1 byte (10 etu)</span>
                    <span className="font-mono text-xs text-foreground">{fmt(charUs)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">1 char slot (12 etu)</span>
                    <span className="font-mono text-xs text-foreground">{fmt(charSlotUs)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-3 py-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">T=1 (block)</span>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">1 etu</span>
                    <span className="font-mono text-xs text-foreground">{fmt(etuUs)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">1 byte (11 etu)</span>
                    <span className="font-mono text-xs text-foreground">{fmt(t1ByteUs)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">min block (5 bytes)</span>
                    <span className="font-mono text-xs text-foreground">{fmt(t1MinBlockUs)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
