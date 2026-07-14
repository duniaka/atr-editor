'use client'

import { TS_DIRECT, TS_INVERSE } from '@/lib/atr'

interface TsEditorProps {
  value: number
  onChange: (value: number) => void
}

export function TsEditor({ value, onChange }: TsEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <label
          className={`flex flex-col gap-1.5 flex-1 cursor-pointer rounded-md border p-3 transition-all ${
            value === TS_DIRECT
              ? 'border-primary/60 bg-primary/8'
              : 'border-border hover:border-border/60 bg-secondary/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="ts"
              checked={value === TS_DIRECT}
              onChange={() => onChange(TS_DIRECT)}
              className="accent-primary"
            />
            <span className="font-mono text-sm text-foreground">3B</span>
            <span className="text-xs text-muted-foreground">— Direct convention</span>
          </div>
          <p className="text-xs text-muted-foreground pl-5 leading-relaxed">
            State H encodes bit 1, LSB transmitted first.
          </p>
        </label>

        <label
          className={`flex flex-col gap-1.5 flex-1 cursor-pointer rounded-md border p-3 transition-all ${
            value === TS_INVERSE
              ? 'border-primary/60 bg-primary/8'
              : 'border-border hover:border-border/60 bg-secondary/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="ts"
              checked={value === TS_INVERSE}
              onChange={() => onChange(TS_INVERSE)}
              className="accent-primary"
            />
            <span className="font-mono text-sm text-foreground">3F</span>
            <span className="text-xs text-muted-foreground">— Inverse convention</span>
          </div>
          <p className="text-xs text-muted-foreground pl-5 leading-relaxed">
            State L encodes bit 1, MSB transmitted first.
          </p>
        </label>
      </div>
    </div>
  )
}
