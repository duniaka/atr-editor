'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  parseATR,
  buildATR,
  formatHex,
  validateATR,
  type ParsedATR,
  type ATRFields,
  TS_DIRECT,
} from '@/lib/atr'
import { AtrHexInput } from './AtrHexInput'
import { AtrHexDisplay } from './AtrHexDisplay'
import { AtrSection } from './AtrSection'
import { AtrValidation } from './AtrValidation'
import { TsEditor } from './editors/TsEditor'
import { Ta1Editor } from './editors/Ta1Editor'
import { TbEditor } from './editors/TbEditor'
import { Tc1Editor } from './editors/Tc1Editor'
import { TdEditor } from './editors/TdEditor'
import { Ta2Editor } from './editors/Ta2Editor'
import { Tc2Editor } from './editors/Tc2Editor'
import { HistoricalEditor } from './editors/HistoricalEditor'
import { Ta3Editor } from './editors/Ta3Editor'
import { Tc3Editor } from './editors/Tc3Editor'
import { HelpTip } from './HelpTip'
import { ATR_EXAMPLE_EVENT } from './ExampleAtrChip'

const SIMPLE_DEFAULT = '3B 00'

interface AtrState {
  ts: number
  ta1?: number
  tb1?: number
  tc1?: number
  td1Protocol?: number
  ta2?: number
  tb2?: number
  tc2?: number
  td2Protocol?: number
  // Group 3 (reachable via TD2)
  ta3?: number
  tb3?: number
  tc3?: number
  historical: number[]
  hasTa1: boolean
  hasTb1: boolean
  hasTc1: boolean
  hasTd1: boolean
  hasTa2: boolean
  hasTb2: boolean
  hasTc2: boolean
  hasTd2: boolean
  hasTa3: boolean
  hasTb3: boolean
  hasTc3: boolean
}

function stateToFields(s: AtrState): ATRFields {
  return {
    ts: s.ts,
    ta1: s.hasTa1 ? s.ta1 : undefined,
    tb1: s.hasTb1 ? s.tb1 : undefined,
    tc1: s.hasTc1 ? s.tc1 : undefined,
    td1: s.hasTd1 ? ((s.td1Protocol ?? 0) & 0x0f) : undefined,
    ta2: s.hasTa2 ? s.ta2 : undefined,
    tb2: s.hasTb2 ? s.tb2 : undefined,
    tc2: s.hasTc2 ? s.tc2 : undefined,
    td2: s.hasTd2 ? ((s.td2Protocol ?? 0) & 0x0f) : undefined,
    extraGroups: (s.hasTa3 || s.hasTb3 || s.hasTc3)
      ? [{
          ta: s.hasTa3 ? s.ta3 : undefined,
          tb: s.hasTb3 ? s.tb3 : undefined,
          tc: s.hasTc3 ? s.tc3 : undefined,
        }]
      : undefined,
    historical: s.historical,
  }
}

function parsedToState(p: ParsedATR): AtrState {
  const g1 = p.groups[0]
  const g2 = p.groups[1]
  const g3 = p.groups[2]
  const td1Present = g1?.td !== undefined
  const td2Present = g2?.td !== undefined
  return {
    ts: p.ts,
    ta1: g1?.ta,
    tb1: g1?.tb,
    tc1: g1?.tc,
    td1Protocol: td1Present ? (g1!.td! & 0x0f) : undefined,
    ta2: g2?.ta,
    tb2: g2?.tb,
    tc2: g2?.tc,
    td2Protocol: td2Present ? (g2!.td! & 0x0f) : undefined,
    ta3: g3?.ta,
    tb3: g3?.tb,
    tc3: g3?.tc,
    historical: p.historical,
    hasTa1: g1?.ta !== undefined,
    hasTb1: g1?.tb !== undefined,
    hasTc1: g1?.tc !== undefined,
    hasTd1: td1Present,
    hasTa2: g2?.ta !== undefined,
    hasTb2: g2?.tb !== undefined,
    hasTc2: g2?.tc !== undefined,
    hasTd2: td2Present,
    hasTa3: g3?.ta !== undefined,
    hasTb3: g3?.tb !== undefined,
    hasTc3: g3?.tc !== undefined,
  }
}

function stateToATRBytes(s: AtrState): number[] {
  return buildATR(stateToFields(s))
}

export function AtrEditor() {
  const [hexInput, setHexInput] = useState(SIMPLE_DEFAULT)
  const [parsed, setParsed] = useState<ParsedATR | null>(() => parseATR(SIMPLE_DEFAULT))
  const [atrState, setAtrState] = useState<AtrState>(() => {
    const p = parseATR(SIMPLE_DEFAULT)
    return p
      ? parsedToState(p)
      : { ts: TS_DIRECT, historical: [], hasTa1: false, hasTb1: false, hasTc1: false, hasTd1: false, hasTa2: false, hasTb2: false, hasTc2: false, hasTd2: false, hasTa3: false, hasTb3: false, hasTc3: false }
  })
  const [hoveredByte, setHoveredByte] = useState<string | null>(null)

  const handleHexChange = useCallback((raw: string) => {
    setHexInput(raw)
    const p = parseATR(raw)
    if (p) {
      setParsed(p)
      setAtrState(parsedToState(p))
    } else {
      setParsed(null)
    }
  }, [])

  const updateState = useCallback((updater: (prev: AtrState) => AtrState) => {
    setAtrState(prev => {
      const next = updater(prev)
      const bytes = stateToATRBytes(next)
      const hex = formatHex(bytes)
      setHexInput(hex)
      setParsed(parseATR(hex))
      return next
    })
  }, [])

  // Setters
  const setTs = (v: number) => updateState(s => ({ ...s, ts: v }))

  // Each setter auto-enables the byte if it was absent when the user edits a field
  const setTa1 = (v: number) => updateState(s => ({ ...s, hasTa1: true, ta1: v }))
  const toggleTa1 = (on: boolean) => updateState(s => ({ ...s, hasTa1: on, ta1: on ? (s.ta1 ?? 0x11) : undefined }))

  const setTb1 = (v: number) => updateState(s => ({ ...s, hasTb1: true, tb1: v }))
  const toggleTb1 = (on: boolean) => updateState(s => ({ ...s, hasTb1: on, tb1: on ? (s.tb1 ?? 0x00) : undefined }))

  const setTc1 = (v: number) => updateState(s => ({ ...s, hasTc1: true, tc1: v }))
  const toggleTc1 = (on: boolean) => updateState(s => ({ ...s, hasTc1: on, tc1: on ? (s.tc1 ?? 0x00) : undefined }))

  const setTd1Protocol = (v: number) => updateState(s => ({ ...s, hasTd1: true, td1Protocol: v }))
  const toggleTd1 = (on: boolean) =>
    updateState(s => ({
      ...s,
      hasTd1: on,
      td1Protocol: on ? (s.td1Protocol ?? 0) : undefined,
      hasTa2: on ? s.hasTa2 : false,
      hasTb2: on ? s.hasTb2 : false,
      hasTc2: on ? s.hasTc2 : false,
      hasTd2: on ? s.hasTd2 : false,
    }))

  const setTa2 = (v: number) => updateState(s => ({ ...s, hasTa2: true, ta2: v }))
  const toggleTa2 = (on: boolean) => updateState(s => ({ ...s, hasTa2: on, ta2: on ? (s.ta2 ?? 0x00) : undefined }))

  const setTb2 = (v: number) => updateState(s => ({ ...s, hasTb2: true, tb2: v }))
  const toggleTb2 = (on: boolean) => updateState(s => ({ ...s, hasTb2: on, tb2: on ? (s.tb2 ?? 0x00) : undefined }))

  const setTc2 = (v: number) => updateState(s => ({ ...s, hasTc2: true, tc2: v }))
  const toggleTc2 = (on: boolean) => updateState(s => ({ ...s, hasTc2: on, tc2: on ? (s.tc2 ?? 0x0a) : undefined }))

  const setTd2Protocol = (v: number) => updateState(s => ({ ...s, hasTd2: true, td2Protocol: v }))
  const toggleTd2 = (on: boolean) =>
    updateState(s => ({
      ...s,
      hasTd2: on,
      td2Protocol: on ? (s.td2Protocol ?? 0) : undefined,
      hasTa3: on ? s.hasTa3 : false,
      hasTb3: on ? s.hasTb3 : false,
      hasTc3: on ? s.hasTc3 : false,
    }))

  // Default TA3 = 0xFE (IFSC=254) when enabled under T=1.
  const setTa3 = (v: number) => updateState(s => ({ ...s, hasTa3: true, ta3: v }))
  const toggleTa3 = (on: boolean) => updateState(s => ({ ...s, hasTa3: on, ta3: on ? (s.ta3 ?? 0xfe) : undefined }))

  // Default TB3 = 0x45 (BWI=4, CWI=5) — a valid T=1 waiting-integer byte.
  const setTb3 = (v: number) => updateState(s => ({ ...s, hasTb3: true, tb3: v }))
  const toggleTb3 = (on: boolean) => updateState(s => ({ ...s, hasTb3: on, tb3: on ? (s.tb3 ?? 0x45) : undefined }))

  // Default TC3 = 0x00 (LRC, the default error-detection code) when enabled.
  const setTc3 = (v: number) => updateState(s => ({ ...s, hasTc3: true, tc3: v }))
  const toggleTc3 = (on: boolean) => updateState(s => ({ ...s, hasTc3: on, tc3: on ? (s.tc3 ?? 0x00) : undefined }))

  const setHistorical = (v: number[]) => updateState(s => ({ ...s, historical: v }))

  const handleReset = () => handleHexChange(SIMPLE_DEFAULT)

  useEffect(() => {
    const handler = (e: Event) => {
      const hex = (e as CustomEvent<string>).detail
      if (hex) handleHexChange(hex)
    }
    window.addEventListener(ATR_EXAMPLE_EVENT, handler)
    return () => window.removeEventListener(ATR_EXAMPLE_EVENT, handler)
  }, [handleHexChange])

  const validation = parsed ? validateATR(parsed) : null
  const td1Byte = parsed?.groups?.[0]?.td
  const td2Byte = parsed?.groups?.[1]?.td
  const group2Reachable = atrState.hasTd1
  const td1Required = atrState.hasTa2 || atrState.hasTb2 || atrState.hasTc2 || atrState.hasTd2

  return (
    <div className="flex flex-col gap-6">
      {/* Hex Input */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <AtrHexInput
          value={hexInput}
          onChange={handleHexChange}
          isValid={parsed !== null || hexInput.trim() === ''}
          onReset={handleReset}
        />
        {parsed && (
          <div className="border-t border-border/60 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5 font-semibold">
              Annotated bytes
            </p>
            <AtrHexDisplay
              parsed={parsed}
              hoveredByte={hoveredByte}
              onByteHover={setHoveredByte}
            />
          </div>
        )}
        {validation && (
          <AtrValidation validation={validation} byteCount={parsed?.raw.length ?? 0} />
        )}
      </div>

      {/* Field Editors */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
          Interface Bytes
        </h2>

        {/* TS — always present */}
        <AtrSection
          title="Initial Character — Convention"
          byteLabel="TS"
          help="Defines the bit-level coding convention for all subsequent ATR bytes. 3B = direct convention (H=1, LSB first). 3F = inverse convention (L=1, MSB first)."
          byteValue={atrState.ts}
          present
          alwaysPresent
        >
          <TsEditor value={atrState.ts} onChange={setTs} />
        </AtrSection>

        {/* TA1 */}
        <AtrSection
          title="Clock Rate / Baud Rate Parameters"
          byteLabel="TA1"
          help="Global interface byte. Upper nibble (Fi) selects the clock rate conversion factor and maximum frequency. Lower nibble (Di) selects the baud rate adjustment factor. Default when absent: Fi=1 (372), Di=1, f≤5 MHz."
          byteValue={atrState.hasTa1 ? atrState.ta1 : undefined}
          present={atrState.hasTa1}
          badge={atrState.hasTa1 ? 'global' : undefined}
          badgeVariant="muted"
          onTogglePresent={toggleTa1}
        >
          <Ta1Editor value={atrState.ta1} present={atrState.hasTa1} onChange={setTa1} />
        </AtrSection>

        {/* TB1 */}
        <AtrSection
          title="Deprecated Global Byte"
          byteLabel="TB1"
          help="Deprecated in ISO/IEC 7816-3:2006. Was used to encode programming voltage (VPP) parameters for contact C6. Cards should not transmit it; terminals must ignore it."
          byteValue={atrState.hasTb1 ? atrState.tb1 : undefined}
          present={atrState.hasTb1}
          badge="deprecated"
          badgeVariant="warning"
          onTogglePresent={toggleTb1}
        >
          <TbEditor index={1} value={atrState.tb1} present={atrState.hasTb1} onChange={setTb1} />
        </AtrSection>

        {/* TC1 */}
        <AtrSection
          title="Extra Guard Time"
          byteLabel="TC1"
          help="Global byte N. Adds N extra elementary time units (etu) of guard time between characters. N=0 means no extra guard time. N=255 means 2 etu for T=0 or 11 etu for T=1 (protocol-specific)."
          byteValue={atrState.hasTc1 ? atrState.tc1 : undefined}
          present={atrState.hasTc1}
          badge={atrState.hasTc1 ? 'global' : undefined}
          badgeVariant="muted"
          onTogglePresent={toggleTc1}
        >
          <Tc1Editor value={atrState.tc1} present={atrState.hasTc1} onChange={setTc1} />
        </AtrSection>

        {/* TD1 */}
        <AtrSection
          title="Structural Byte — Protocol Chain"
          byteLabel="TD1"
          help="Upper nibble (Y2) is auto-computed: each bit signals presence of TA2/TB2/TC2/TD2 respectively. Lower nibble encodes the first offered protocol type T. T=0: character framing. T=1: block framing. T=15: global interface parameters."
          byteValue={td1Byte}
          present={atrState.hasTd1}
          badge={atrState.hasTd1 ? `T=${atrState.td1Protocol ?? 0}` : undefined}
          badgeVariant="default"
          onTogglePresent={toggleTd1}
          requiredPresent={td1Required}
        >
          <TdEditor index={1} value={td1Byte} present={atrState.hasTd1} onChange={setTd1Protocol} />
        </AtrSection>

        {/* Group 2 — only reachable via TD1 */}
        {group2Reachable && (
          <div className="pl-4 border-l-2 border-border/40 flex flex-col gap-2 ml-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-1">
              Group 2 — via TD1
            </p>

            {/* TA2 */}
            <AtrSection
              title="Specific Mode Byte"
              byteLabel="TA2"
              help="Controls whether the card operates in negotiable or specific mode (bit 8), whether to use implicit Fi/Di values (bit 5), and which protocol T is active in specific mode (bits 4–1)."
              byteValue={atrState.hasTa2 ? atrState.ta2 : undefined}
              present={atrState.hasTa2}
              badge={atrState.hasTa2 ? 'global' : undefined}
              badgeVariant="muted"
              onTogglePresent={toggleTa2}
            >
              <Ta2Editor value={atrState.ta2} present={atrState.hasTa2} onChange={setTa2} />
            </AtrSection>

            {/* TB2 */}
            <AtrSection
              title="Deprecated Global Byte"
              byteLabel="TB2"
              help="Deprecated in ISO/IEC 7816-3:2006. Formerly encoded VPP programming voltage for contact C6. Terminals must ignore this byte."
              byteValue={atrState.hasTb2 ? atrState.tb2 : undefined}
              present={atrState.hasTb2}
              badge="deprecated"
              badgeVariant="warning"
              onTogglePresent={toggleTb2}
            >
              <TbEditor index={2} value={atrState.tb2} present={atrState.hasTb2} onChange={setTb2} />
            </AtrSection>

            {/* TC2 */}
            <AtrSection
              title="T=0 Waiting Time Parameter"
              byteLabel="TC2"
              help="T=0 specific. Waiting time integer WI (default 10, range 1–255). WT = 960 × WI × (Fi/f). If the card does not respond within WT, the interface device may reset. Value 0 is reserved."
              byteValue={atrState.hasTc2 ? atrState.tc2 : undefined}
              present={atrState.hasTc2}
              badge={atrState.hasTc2 ? 'T=0' : undefined}
              badgeVariant="default"
              onTogglePresent={toggleTc2}
            >
              <Tc2Editor value={atrState.tc2} present={atrState.hasTc2} onChange={setTc2} />
            </AtrSection>

            {/* TD2 */}
            <AtrSection
              title="Structural Byte — Protocol Chain"
              byteLabel="TD2"
              help="Same structure as TD1. Upper nibble (Y3) auto-computed from presence of TA3/TB3/TC3/TD3. Lower nibble T encodes a second offered protocol or T=15 to indicate global interface bytes follow in group 3."
              byteValue={td2Byte}
              present={atrState.hasTd2}
              badge={atrState.hasTd2 ? `T=${atrState.td2Protocol ?? 0}` : undefined}
              badgeVariant="default"
              onTogglePresent={toggleTd2}
            >
              <TdEditor index={2} value={td2Byte} present={atrState.hasTd2} onChange={setTd2Protocol} />
            </AtrSection>

            {/* Group 3 — only reachable via TD2 */}
            {atrState.hasTd2 && (
              <div className="pl-4 border-l-2 border-border/30 flex flex-col gap-2 ml-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-1">
                  Group 3 — via TD2 (T={atrState.td2Protocol ?? 0})
                </p>

                {/* TA3 — first interface byte qualified by TD2's protocol T.
                    T=1: first TA for T=1 = IFSC. T=15: global clock-stop/class. */}
                <AtrSection
                  title={
                    atrState.td2Protocol === 1 ? 'T=1 IFSC (Card Information Field Size)' :
                    atrState.td2Protocol === 15 ? 'Global — Clock Stop / Class' :
                    'TA3'
                  }
                  byteLabel="TA3"
                  help={
                    atrState.td2Protocol === 1
                      ? 'First TA for T=1 (ISO/IEC 7816-3:2006 clause 11.4.2). Encodes IFSC, the maximum information field size the card can receive. Valid values 0x01..0xFE = 1..254; 0x00 and 0xFF are reserved. Default if absent: IFSC = 32.'
                      : atrState.td2Protocol === 15
                      ? 'T=15 global. Carries the clock-stop indicator (bits 8–7) and the class indicator for supply voltage (bits 6–1).'
                      : `First TA for T=${atrState.td2Protocol ?? 0}. ISO/IEC 7816-3:2006 defines no specific meaning for this byte under T=${atrState.td2Protocol ?? 0} (T=0 uses only the waiting-time integer WI in TC2).`
                  }
                  byteValue={atrState.hasTa3 ? atrState.ta3 : undefined}
                  present={atrState.hasTa3}
                  onTogglePresent={toggleTa3}
                >
                  <Ta3Editor
                    value={atrState.ta3}
                    td2Protocol={atrState.td2Protocol ?? 0}
                    onChange={setTa3}
                  />
                </AtrSection>

                {/* TB3 — first interface byte qualified by TD2's protocol T.
                    T=1: first TB for T=1 = BWI/CWI waiting-time integers. */}
                <AtrSection
                  title={atrState.td2Protocol === 1 ? 'T=1 Waiting Time Integers (BWI/CWI)' : 'TB3'}
                  byteLabel="TB3"
                  help={
                    atrState.td2Protocol === 1
                      ? 'First TB for T=1 (ISO/IEC 7816-3:2006 clause 11.4.3). Bits 8–5 encode BWI (controls BWT), bits 4–1 encode CWI (controls CWT). Standard BWI range 0..9 (A..F reserved); CWI range 0..15. Default if absent: BWI = 4, CWI = 13.'
                      : `First TB for T=${atrState.td2Protocol ?? 0}. ISO/IEC 7816-3:2006 defines no specific meaning for this byte under T=${atrState.td2Protocol ?? 0}.`
                  }
                  byteValue={atrState.hasTb3 ? atrState.tb3 : undefined}
                  present={atrState.hasTb3}
                  badge={atrState.hasTb3 && atrState.td2Protocol === 1 ? 'T=1' : undefined}
                  badgeVariant="default"
                  onTogglePresent={toggleTb3}
                >
                  <TbEditor
                    index={3}
                    value={atrState.tb3}
                    present={atrState.hasTb3}
                    onChange={setTb3}
                    td2Protocol={atrState.td2Protocol}
                  />
                </AtrSection>

                {/* TC3 — first interface byte qualified by TD2's protocol T.
                    T=1: first TC for T=1 = LRC/CRC error-detection code selection. */}
                <AtrSection
                  title={atrState.td2Protocol === 1 ? 'T=1 Redundancy Code Selection' : 'TC3'}
                  byteLabel="TC3"
                  help={
                    atrState.td2Protocol === 1
                      ? 'First TC for T=1 (ISO/IEC 7816-3:2006 clause 11.4.4). Bit 1 selects the block error-detection code: 0 = LRC (default), 1 = CRC. Bits 8–2 are reserved and shall be 0.'
                      : `First TC for T=${atrState.td2Protocol ?? 0}. ISO/IEC 7816-3:2006 defines a specific meaning (LRC/CRC selection) only for T=1; under T=${atrState.td2Protocol ?? 0} this byte has no defined interpretation.`
                  }
                  byteValue={atrState.hasTc3 ? atrState.tc3 : undefined}
                  present={atrState.hasTc3}
                  onTogglePresent={toggleTc3}
                >
                  <Tc3Editor value={atrState.tc3} onChange={setTc3} td2Protocol={atrState.td2Protocol} />
                </AtrSection>
              </div>
            )}
          </div>
        )}

        {/* Historical bytes */}
        <div className="mt-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">
            Historical Bytes
          </h2>
          <AtrSection
            title={`Historical Bytes (K=${atrState.historical.length})`}
            byteLabel={`T1–T${Math.max(atrState.historical.length, 1)}`}
            help="0–15 optional bytes carrying card-specific information (e.g. card capabilities, life-cycle status, ATR information). Count K is encoded in the lower nibble of T0. Content is application-defined."
            present={atrState.historical.length > 0}
            badge={atrState.historical.length > 0 ? `${atrState.historical.length}` : '0'}
            badgeVariant={atrState.historical.length > 0 ? 'default' : 'muted'}
            onTogglePresent={on => { if (!on) setHistorical([]) }}
          >
            <HistoricalEditor value={atrState.historical} onChange={setHistorical} />
          </AtrSection>
        </div>

        {/* TCK */}
        {parsed && (
          <div className="mt-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">
              Check Byte
            </h2>
            <div
              className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                parsed.tckRequired
                  ? parsed.tckValid
                    ? 'border-border bg-card'
                    : 'border-destructive/40 bg-destructive/5'
                  : 'border-border/40 bg-card/40'
              }`}
            >
              <span
                className={`font-mono text-xs px-1.5 py-0.5 rounded border shrink-0 ${
                  parsed.tckRequired
                    ? 'text-byte-tck border-byte-tck/30 bg-byte-tck/10'
                    : 'text-muted-foreground/40 border-border/30'
                }`}
              >
                TCK
              </span>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-muted-foreground">
                  {parsed.tckRequired ? 'Check byte required' : 'Not required (T=0 only)'}
                </span>
                <HelpTip
                  text={
                    parsed.tckRequired
                      ? 'Required when any protocol other than T=0 is offered. TCK is chosen so that XOR(T0, …, TCK) = 0x00. Recalculated automatically.'
                      : 'TCK is absent when the ATR only offers T=0 (or no protocol). Including it would be a spec violation.'
                  }
                />
              </div>
              {parsed.tck !== undefined && parsed.tckRequired && (
                <span className={`font-mono text-sm shrink-0 ${parsed.tckValid ? 'text-byte-tck' : 'text-destructive'}`}>
                  {parsed.tck.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              )}
              {parsed.tckRequired && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${
                    parsed.tckValid
                      ? 'bg-success/10 text-success border-success/25'
                      : 'bg-destructive/10 text-destructive border-destructive/25'
                  }`}
                >
                  {parsed.tckValid ? 'valid' : 'invalid'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
