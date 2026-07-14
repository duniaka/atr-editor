'use client'

interface TdEditorProps {
  index: number
  /** The full TDi byte as parsed from the current ATR (upper nibble = Y bits, lower nibble = T). */
  value: number | undefined
  /** Whether this TDi is present in the ATR. */
  present: boolean
  /** Called with the chosen T protocol value (0–15). Upper Y nibble is computed by buildATR. */
  onChange: (tProtocol: number) => void
}

const PROTOCOL_LABELS: Record<number, string> = {
  0: 'T=0 — Character framing',
  1: 'T=1 — Block framing',
  2: 'T=2 — Full-duplex (RFU)',
  3: 'T=3 — Full-duplex (RFU)',
  4: 'T=4 — Enhanced character (RFU)',
  14: 'T=14 — Non-standardized',
  15: 'T=15 — Global interface parameters (not a protocol)',
}

export function TdEditor({ index, value, present, onChange }: TdEditorProps) {
  // Lower nibble of the parsed TDi byte is the current T value.
  const currentT = value !== undefined ? (value & 0x0f) : 0
  // Upper nibble Y bits as computed by buildATR.
  const yBits = value !== undefined ? ((value >> 4) & 0x0f) : 0

  return (
    <div className="flex flex-col gap-3">
      {present && (
        <div className="flex flex-col gap-3">
          {/* Protocol selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Protocol type T — bits 4-1
            </label>
            <select
              value={currentT}
              onChange={e => onChange(parseInt(e.target.value, 10))}
              className="bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 max-w-xs"
            >
              {[0, 1, 2, 3, 4, 14, 15].map(proto => (
                <option key={proto} value={proto}>
                  {PROTOCOL_LABELS[proto] ?? `T=${proto}`}
                  {index === 1 && proto === 15 ? ' — INVALID in TD1' : ''}
                </option>
              ))}
              {/* Fallback for any custom parsed value not in the list */}
              {![0, 1, 2, 3, 4, 14, 15].includes(currentT) && (
                <option value={currentT}>T={currentT} (custom)</option>
              )}
            </select>
          </div>

          {/* Resulting byte breakdown */}
          {value !== undefined && (
            <div className="bg-secondary/50 rounded px-3 py-2 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">TD{index}:</span>
                <span className="text-xs font-mono text-primary">
                  {value.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Y{index + 1} (auto):</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {yBits.toString(2).padStart(4, '0')}b
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">T:</span>
                <span className="text-xs font-mono text-foreground">{currentT}</span>
              </div>
            </div>
          )}

          {index === 1 && currentT === 15 && (
            <p className="text-xs text-destructive">T=15 is invalid in TD1 per ISO 7816-3.</p>
          )}
        </div>
      )}
    </div>
  )
}
