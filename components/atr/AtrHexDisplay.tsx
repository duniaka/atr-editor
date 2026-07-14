'use client'

import { type ParsedATR } from '@/lib/atr'

interface ByteToken {
  value: number
  label: string
  colorClass: string
  tooltip: string
}

function getByteTokens(parsed: ParsedATR): ByteToken[] {
  const tokens: ByteToken[] = []
  const { raw, ts, groups, historicalCount, tck, tckValid, tckRequired } = parsed

  // TS
  tokens.push({
    value: ts,
    label: 'TS',
    colorClass: 'text-byte-ts',
    tooltip: ts === 0x3b ? 'TS — Direct convention' : 'TS — Inverse convention',
  })

  // T0
  const t0 = raw[1]
  tokens.push({
    value: t0,
    label: 'T0',
    colorClass: 'text-byte-t0',
    tooltip: `T0 — Format byte: Y1=${((t0 >> 4) & 0x0f).toString(2).padStart(4, '0')}, K=${t0 & 0x0f} historical bytes`,
  })

  // Interface bytes.
  // For groups i>2, the meaning of TAi/TBi/TCi is qualified by the protocol T
  // encoded in the preceding TDi-1.
  let groupIdx = 0
  let prevTdProtocol: number | undefined
  for (const group of groups) {
    const i = group.index
    // For i>2, this group's specific bytes are qualified by the previous TD's T.
    const qualifyingT = i > 2 ? prevTdProtocol : undefined
    if (group.ta !== undefined)
      tokens.push({
        value: group.ta,
        label: `TA${i}`,
        colorClass: 'text-byte-iface',
        tooltip:
          qualifyingT === 1
            ? `TA${i} — First TA for T=1: IFSC = ${group.ta} (max information field size the card can receive)`
            : `TA${i} — Interface byte`,
      })
    if (group.tb !== undefined)
      tokens.push({
        value: group.tb,
        label: `TB${i}`,
        colorClass: 'text-byte-iface',
        tooltip:
          qualifyingT === 1
            ? `TB${i} — First TB for T=1: BWI=${(group.tb >> 4) & 0x0f}, CWI=${group.tb & 0x0f} (block/character waiting-time integers)`
            : `TB${i} — Interface byte${i <= 2 ? ' (deprecated)' : ''}`,
      })
    if (group.tc !== undefined)
      tokens.push({
        value: group.tc,
        label: `TC${i}`,
        colorClass: 'text-byte-iface',
        tooltip:
          qualifyingT === 1
            ? `TC${i} — First TC for T=1: error-detection code ${(group.tc & 0x01) ? 'CRC' : 'LRC'} (bit 1)`
            : `TC${i} — Interface byte`,
      })
    if (group.td !== undefined) {
      prevTdProtocol = group.td & 0x0f
      tokens.push({
        value: group.td,
        label: `TD${i}`,
        colorClass: 'text-byte-iface',
        tooltip: `TD${i} — Structural byte: Y${i + 1}=${((group.td >> 4) & 0x0f).toString(2).padStart(4, '0')}, T=${group.td & 0x0f}`,
      })
    }
    groupIdx++
  }

  // Historical bytes
  for (let i = 0; i < historicalCount; i++) {
    tokens.push({
      value: parsed.historical[i],
      label: `H${i + 1}`,
      colorClass: 'text-byte-hist',
      tooltip: `Historical byte ${i + 1}`,
    })
  }

  // TCK
  if (tck !== undefined) {
    tokens.push({
      value: tck,
      label: 'TCK',
      colorClass: tckValid ? 'text-byte-tck' : 'text-byte-tck-error',
      tooltip: tckValid
        ? 'TCK — Check byte (valid)'
        : 'TCK — Check byte (INVALID — XOR of T0..TCK must be 0x00)',
    })
  }

  return tokens
}

interface AtrHexDisplayProps {
  parsed: ParsedATR | null
  hoveredByte?: string | null
  onByteHover?: (label: string | null) => void
}

export function AtrHexDisplay({ parsed, hoveredByte, onByteHover }: AtrHexDisplayProps) {
  if (!parsed) return null

  const tokens = getByteTokens(parsed)

  return (
    <div className="flex flex-wrap gap-1.5 items-end">
      {tokens.map((token, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center gap-0.5 group cursor-default"
          title={token.tooltip}
          onMouseEnter={() => onByteHover?.(token.label)}
          onMouseLeave={() => onByteHover?.(null)}
        >
          <span
            className={`text-[10px] font-mono leading-none transition-colors ${
              hoveredByte === token.label
                ? 'text-primary'
                : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            {token.label}
          </span>
          <span
            className={`font-mono text-sm px-1.5 py-0.5 rounded transition-all ${token.colorClass} ${
              hoveredByte === token.label
                ? 'bg-primary/15 ring-1 ring-primary/40'
                : 'bg-secondary/60 group-hover:bg-secondary'
            }`}
          >
            {token.value.toString(16).padStart(2, '0').toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  )
}
