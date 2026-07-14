/**
 * ATR (Answer-to-Reset) library module
 */

// ---------------------------------------------------------------------------
// Constants & lookup tables
// ---------------------------------------------------------------------------

export const TS_DIRECT = 0x3b
export const TS_INVERSE = 0x3f

/** TA1 upper nibble → { Fi, fMax MHz } */
export const FI_TABLE: Record<number, { fi: number; fMax: number }> = {
  0x0: { fi: 372, fMax: 4 },
  0x1: { fi: 372, fMax: 5 },
  0x2: { fi: 558, fMax: 6 },
  0x3: { fi: 744, fMax: 8 },
  0x4: { fi: 1116, fMax: 12 },
  0x5: { fi: 1488, fMax: 16 },
  0x6: { fi: 1860, fMax: 20 },
  0x9: { fi: 512, fMax: 5 },
  0xa: { fi: 768, fMax: 7.5 },
  0xb: { fi: 1024, fMax: 10 },
  0xc: { fi: 1536, fMax: 15 },
  0xd: { fi: 2048, fMax: 20 },
}

/** TA1 lower nibble → Di */
export const DI_TABLE: Record<number, number> = {
  0x1: 1,
  0x2: 2,
  0x3: 4,
  0x4: 8,
  0x5: 16,
  0x6: 32,
  0x7: 64,
  0x8: 12,
  0x9: 20,
}

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** One interface-byte group: TA/TB/TC/TD at the same index i */
export interface InterfaceGroup {
  /** Group index, 1-based (1 = TA1/TB1/TC1/TD1, etc.) */
  index: number
  ta?: number
  tb?: number
  tc?: number
  td?: number
}

export interface ParsedATR {
  /** Raw bytes as parsed */
  raw: number[]
  /** TS byte (0x3B or 0x3F) */
  ts: number
  /** T0 byte */
  t0: number
  /** Number of historical bytes K (T0 bits 0-3) */
  historicalCount: number
  /** Interface groups, in order */
  groups: InterfaceGroup[]
  /** Historical bytes */
  historical: number[]
  /** TCK byte if present */
  tck?: number
  /** Whether TCK is required for this ATR */
  tckRequired: boolean
  /** Whether the TCK value is valid */
  tckValid: boolean
  /** Set of indicated T protocol values across all TD bytes */
  protocols: Set<number>
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseATR(hexStr: string): ParsedATR | null {
  // Clean up input
  const clean = hexStr.replace(/\s+/g, '').toUpperCase()
  if (clean.length < 4 || clean.length % 2 !== 0) return null

  const bytes: number[] = []
  for (let i = 0; i < clean.length; i += 2) {
    const b = parseInt(clean.slice(i, i + 2), 16)
    if (isNaN(b)) return null
    bytes.push(b)
  }

  if (bytes.length < 2) return null

  const ts = bytes[0]
  if (ts !== TS_DIRECT && ts !== TS_INVERSE) return null

  const t0 = bytes[1]
  const historicalCount = t0 & 0x0f
  let yi = (t0 >> 4) & 0x0f // Y1 from T0

  const groups: InterfaceGroup[] = []
  const protocols = new Set<number>()
  let pos = 2
  let groupIdx = 1

  // Parse interface byte groups
  while (yi !== 0 && pos < bytes.length) {
    const group: InterfaceGroup = { index: groupIdx }

    if (yi & 0x1) { group.ta = bytes[pos++] }
    if (yi & 0x2) { group.tb = bytes[pos++] }
    if (yi & 0x4) { group.tc = bytes[pos++] }
    if (yi & 0x8) {
      group.td = bytes[pos++]
      const t = group.td & 0x0f
      protocols.add(t)
      yi = (group.td >> 4) & 0x0f
    } else {
      yi = 0
    }

    groups.push(group)
    groupIdx++
  }

  // Historical bytes
  const historical = bytes.slice(pos, pos + historicalCount)
  pos += historicalCount

  // Determine if TCK is required:
  // TCK absent only if T=0 is the sole indicated protocol (no other TD bytes or only T=0)
  const protocolList = Array.from(protocols)
  const tckRequired =
    protocolList.length === 0
      ? false // only T=0 by default, no TD bytes
      : !(protocolList.length === 1 && protocolList[0] === 0)

  let tck: number | undefined
  let tckValid = true
  if (pos < bytes.length) {
    tck = bytes[pos]
    // XOR of T0 through TCK inclusive must be 0x00
    const xorVal = bytes.slice(1, pos + 1).reduce((a, b) => a ^ b, 0)
    tckValid = xorVal === 0x00
  } else if (tckRequired) {
    tckValid = false
  }

  return {
    raw: bytes,
    ts,
    t0,
    historicalCount,
    groups,
    historical,
    tck,
    tckRequired,
    tckValid,
    protocols,
  }
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

export interface ATRFields {
  ts: number
  /** TA1 value if present */
  ta1?: number
  /** TB1 value if present */
  tb1?: number
  /** TC1 value if present */
  tc1?: number
  /**
   * TD1 protocol T value (lower nibble of TD1). Upper nibble Y2 is computed
   * automatically from the presence of group-2 bytes. Provide this value
   * (0–15) whenever TD1 should be emitted.
   */
  td1?: number
  /** TA2 value if present */
  ta2?: number
  /** TB2 deprecated — include if set */
  tb2?: number
  /** TC2 value if present */
  tc2?: number
  /**
   * TD2 protocol T value (lower nibble of TD2). Upper nibble Y3 is computed
   * automatically from the presence of group-3 bytes. Provide this value
   * (0–15) whenever TD2 should be emitted.
   */
  td2?: number
  /** Additional groups beyond index 2 */
  extraGroups?: Array<{
    ta?: number
    tb?: number
    tc?: number
    td?: number
  }>
  historical: number[]
}

/**
 * Build ATR bytes from a structured description.
 * Automatically computes T0, each TDi, and TCK.
 */
export function buildATR(fields: ATRFields): number[] {
  const bytes: number[] = []

  // TS
  bytes.push(fields.ts)

  // Gather groups: group 1 = TA1,TB1,TC1,TD1; group 2 = TA2,TB2,TC2,TD2; etc.
  // td1/td2 fields carry the protocol T value (lower nibble) — the upper Y nibble
  // is computed automatically from the presence of the next group's bytes.
  type GroupDef = { ta?: number; tb?: number; tc?: number; tProtocol?: number }
  const allGroups: GroupDef[] = []

  // group 1 — td1 carries the T bits for TD1
  allGroups.push({ ta: fields.ta1, tb: fields.tb1, tc: fields.tc1, tProtocol: fields.td1 })
  // group 2 — td2 carries the T bits for TD2
  allGroups.push({ ta: fields.ta2, tb: fields.tb2, tc: fields.tc2, tProtocol: fields.td2 })
  // extra groups
  if (fields.extraGroups) {
    for (const g of fields.extraGroups) {
      allGroups.push({ ta: g.ta, tb: g.tb, tc: g.tc, tProtocol: g.td })
    }
  }

  // Determine which groups are non-empty.
  // A group exists if it has any ta/tb/tc bytes OR has an explicit tProtocol (TD present).
  const hasAny = (g: GroupDef) =>
    g.ta !== undefined || g.tb !== undefined || g.tc !== undefined || g.tProtocol !== undefined

  // Find last group index that is non-empty
  let lastNonEmpty = -1
  for (let i = allGroups.length - 1; i >= 0; i--) {
    if (hasAny(allGroups[i])) {
      lastNonEmpty = i
      break
    }
  }

  // Now assemble the output groups (0 to lastNonEmpty)
  const outputGroups: GroupDef[] = lastNonEmpty >= 0 ? allGroups.slice(0, lastNonEmpty + 1) : []

  // Compute Y1 for T0
  const g1 = outputGroups[0]
  let y1 = 0
  if (g1) {
    if (g1.ta !== undefined) y1 |= 0x1
    if (g1.tb !== undefined) y1 |= 0x2
    if (g1.tc !== undefined) y1 |= 0x4
    // TD1 is present when there is a group 2+ OR group 1 explicitly has a tProtocol
    if (outputGroups.length > 1 || g1.tProtocol !== undefined) y1 |= 0x8
  }

  // T0
  const k = Math.min(fields.historical.length, 15)
  bytes.push((y1 << 4) | k)

  // Emit each group's TA/TB/TC, then compute and emit TDi
  for (let i = 0; i < outputGroups.length; i++) {
    const g = outputGroups[i]
    if (g.ta !== undefined) bytes.push(g.ta)
    if (g.tb !== undefined) bytes.push(g.tb)
    if (g.tc !== undefined) bytes.push(g.tc)

    // Emit TDi if this group has an explicit tProtocol OR there is a next group
    const hasNext = i + 1 < outputGroups.length
    if (hasNext || g.tProtocol !== undefined) {
      // Compute Yi+1 from next group's presence flags
      const next = outputGroups[i + 1]
      let yi1 = 0
      if (next) {
        if (next.ta !== undefined) yi1 |= 0x1
        if (next.tb !== undefined) yi1 |= 0x2
        if (next.tc !== undefined) yi1 |= 0x4
        // TDi+1 present if there is a group after next, or next itself has a tProtocol
        if (i + 2 < outputGroups.length || next.tProtocol !== undefined) yi1 |= 0x8
      }
      // Protocol T in lower nibble of TDi
      const tBits = (g.tProtocol ?? 0) & 0x0f
      bytes.push((yi1 << 4) | tBits)
    }
  }

  // Historical bytes
  for (let i = 0; i < k; i++) {
    bytes.push(fields.historical[i])
  }

  // Determine if TCK is required
  // Collect indicated protocols from TDi bytes
  const indicatedProtocols = new Set<number>()
  // Re-parse the TDi bytes we just emitted to find protocols
  {
    const parsed = parseATR(bytes.map(b => b.toString(16).padStart(2, '0')).join(''))
    if (parsed) {
      parsed.protocols.forEach(p => indicatedProtocols.add(p))
    }
  }
  const protocolList = Array.from(indicatedProtocols)
  const needTck =
    protocolList.length === 0
      ? false
      : !(protocolList.length === 1 && protocolList[0] === 0)

  if (needTck) {
    // XOR of all bytes from T0 (index 1) through the byte before TCK
    const xorVal = bytes.slice(1).reduce((a, b) => a ^ b, 0)
    bytes.push(xorVal) // This makes T0..TCK XOR = 0x00
  }

  return bytes
}

// ---------------------------------------------------------------------------
// Checksum utilities
// ---------------------------------------------------------------------------

/** Compute the correct TCK value for an ATR (XOR of T0 through last historical byte) */
export function computeTCK(bytes: number[]): number {
  // XOR bytes[1..n-1] such that result = 0
  return bytes.slice(1).reduce((a, b) => a ^ b, 0)
}

/** Recalculate TCK in-place and return updated bytes */
export function recalculateTCK(bytes: number[], tckRequired: boolean): number[] {
  if (!tckRequired) return bytes
  const withoutTck = bytes
  const xorVal = withoutTck.slice(1).reduce((a, b) => a ^ b, 0)
  return [...withoutTck, xorVal]
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format bytes array as space-separated uppercase hex string */
export function formatHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

/** Parse a hex string (with or without spaces) into a byte array, returning null on error */
export function hexToBytes(hex: string): number[] | null {
  const clean = hex.replace(/\s+/g, '')
  if (clean.length % 2 !== 0) return null
  const result: number[] = []
  for (let i = 0; i < clean.length; i += 2) {
    const b = parseInt(clean.slice(i, i + 2), 16)
    if (isNaN(b)) return null
    result.push(b)
  }
  return result
}

// ---------------------------------------------------------------------------
// TA1 decode helpers
// ---------------------------------------------------------------------------

export function decodeTA1(ta1: number): {
  fiBits: number
  diBits: number
  fi: number
  fMax: number
  di: number
} {
  const fiBits = (ta1 >> 4) & 0x0f
  const diBits = ta1 & 0x0f
  const fiEntry = FI_TABLE[fiBits] ?? { fi: 372, fMax: 5 }
  const di = DI_TABLE[diBits] ?? 1
  return { fiBits, diBits, fi: fiEntry.fi, fMax: fiEntry.fMax, di }
}

// ---------------------------------------------------------------------------
// TA2 decode helpers
// ---------------------------------------------------------------------------

export function decodeTA2(ta2: number): {
  canChange: boolean
  useImplicitFiDi: boolean
  protocol: number
} {
  return {
    canChange: (ta2 & 0x80) === 0,
    useImplicitFiDi: (ta2 & 0x10) !== 0,
    protocol: ta2 & 0x0f,
  }
}

// ---------------------------------------------------------------------------
// Historical bytes helpers
// ---------------------------------------------------------------------------

/** Return hex string for historical bytes */
export function formatHistorical(historical: number[]): string {
  if (historical.length === 0) return '(none)'
  return formatHex(historical)
}

// ---------------------------------------------------------------------------
// ATR validation
// ---------------------------------------------------------------------------

export interface ATRValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateATR(parsed: ParsedATR): ATRValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (parsed.ts !== TS_DIRECT && parsed.ts !== TS_INVERSE) {
    errors.push(`TS must be 0x3B (direct) or 0x3F (inverse), got 0x${parsed.ts.toString(16).toUpperCase()}`)
  }

  if (parsed.historicalCount > 15) {
    errors.push(`K (historical count) must be 0-15, got ${parsed.historicalCount}`)
  }

  if (parsed.tckRequired && parsed.tck === undefined) {
    errors.push('TCK is required but absent')
  }

  if (parsed.tck !== undefined && !parsed.tckValid) {
    errors.push('TCK checksum is invalid (XOR of T0..TCK must be 0x00)')
  }

  if (parsed.raw.length > 33) {
    errors.push(`ATR exceeds maximum length of 33 bytes (got ${parsed.raw.length})`)
  }

  // Check TD protocol ordering
  const tdProtos: number[] = []
  for (const g of parsed.groups) {
    if (g.td !== undefined) tdProtos.push(g.td & 0x0f)
  }
  for (let i = 1; i < tdProtos.length; i++) {
    if (tdProtos[i] < tdProtos[i - 1] && tdProtos[i] !== 15) {
      warnings.push(`Protocol types in TDi should be in ascending order`)
      break
    }
  }

  // T=15 in TD1 is invalid
  if (parsed.groups[0]?.td !== undefined && (parsed.groups[0].td & 0x0f) === 15) {
    errors.push('T=15 is invalid in TD1')
  }

  // TB1/TB2 deprecated
  if (parsed.groups[0]?.tb !== undefined) {
    warnings.push('TB1 is deprecated (ISO 7816-3:2006); interface devices should ignore it')
  }
  if (parsed.groups[1]?.tb !== undefined) {
    warnings.push('TB2 is deprecated (ISO 7816-3:2006); interface devices should ignore it')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
