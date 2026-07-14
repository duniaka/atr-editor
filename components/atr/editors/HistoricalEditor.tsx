'use client'

import { Plus, Trash2 } from 'lucide-react'

interface HistoricalEditorProps {
  value: number[]
  onChange: (value: number[]) => void
}

export function HistoricalEditor({ value, onChange }: HistoricalEditorProps) {
  const addByte = () => {
    if (value.length < 15) onChange([...value, 0x00])
  }

  const removeByte = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const updateByte = (idx: number, hex: string) => {
    const cleaned = hex.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 2)
    const v = parseInt(cleaned, 16)
    if (isNaN(v) && cleaned !== '') return
    const next = [...value]
    next[idx] = isNaN(v) ? 0 : v
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
          Optional bytes T1-TK describing card operating characteristics (K=0-15, encoded in T0 bits 4-1). Structure defined by ISO/IEC 7816-4.
        </p>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <span className="text-xs font-mono text-muted-foreground">{value.length}/15</span>
          <button
            onClick={addByte}
            disabled={value.length >= 15}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={12} />
            Add byte
          </button>
        </div>
      </div>

      {value.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-2">No historical bytes (K=0)</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {value.map((b, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 group">
              <span className="text-[10px] font-mono text-muted-foreground">H{idx + 1}</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={b.toString(16).padStart(2, '0').toUpperCase()}
                  onChange={e => updateByte(idx, e.target.value)}
                  maxLength={2}
                  className="w-11 bg-secondary border border-border rounded px-1.5 py-1 text-sm font-mono text-byte-hist text-center focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
                <button
                  onClick={() => removeByte(idx)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASCII preview */}
      {value.length > 0 && (
        <div className="bg-secondary/50 rounded px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">ASCII:</span>
          <span className="text-xs font-mono text-muted-foreground tracking-wider">
            {value.map(b => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.')).join('')}
          </span>
        </div>
      )}
    </div>
  )
}
