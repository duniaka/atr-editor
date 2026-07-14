'use client'

import { useRef, useCallback } from 'react'
import { Copy, RotateCcw } from 'lucide-react'

interface AtrHexInputProps {
  value: string
  onChange: (value: string) => void
  isValid: boolean
  onReset?: () => void
}

/** Format raw hex input: uppercase + space-separate every byte */
function formatHexInput(raw: string): string {
  // Strip everything except hex digits
  const digits = raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
  // Insert spaces every 2 hex digits
  const parts: string[] = []
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2))
  }
  return parts.join(' ')
}

export function AtrHexInput({ value, onChange, isValid, onReset }: AtrHexInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const cursorPos = e.target.selectionStart ?? raw.length

      // Format value
      const formatted = formatHexInput(raw)
      onChange(formatted)

      // Restore cursor position — account for added spaces
      requestAnimationFrame(() => {
        if (!inputRef.current) return
        // Count hex digits before cursor in the raw string
        const digitsBeforeCursor = raw.slice(0, cursorPos).replace(/[^0-9a-fA-F]/g, '').length
        // In the formatted string, byte N ends at position N*3 - 1
        const byteIndex = Math.floor((digitsBeforeCursor - 1) / 2)
        const digitInByte = (digitsBeforeCursor - 1) % 2
        let newPos = byteIndex * 3 + digitInByte + 1
        if (digitsBeforeCursor === 0) newPos = 0
        inputRef.current.setSelectionRange(newPos, newPos)
      })
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace to skip over spaces
      if (e.key === 'Backspace') {
        const el = e.currentTarget
        const pos = el.selectionStart ?? 0
        if (pos > 0 && value[pos - 1] === ' ') {
          e.preventDefault()
          const newVal = value.slice(0, pos - 1) + value.slice(pos)
          onChange(formatHexInput(newVal))
          requestAnimationFrame(() => {
            if (!inputRef.current) return
            const p = Math.max(0, pos - 2)
            inputRef.current.setSelectionRange(p, p)
          })
        }
      }
    },
    [value, onChange]
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value)
  }, [value])

  const byteCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          ATR Hex
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {byteCount} {byteCount === 1 ? 'byte' : 'bytes'}
          </span>
          {onReset && (
            <button
              onClick={onReset}
              title="Reset to default ATR"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Copy size={13} />
          </button>
        </div>
      </div>

      <div
        className={`relative flex items-center rounded-md border transition-colors ${
          !isValid && value.trim() !== ''
            ? 'border-destructive/60 bg-destructive/5'
            : 'border-border bg-input hover:border-border/80 focus-within:border-primary/60'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="3B 6B 00 00 00 31 ..."
          className={`w-full bg-transparent font-mono text-sm px-3 py-2.5 outline-none tracking-wider placeholder:text-muted-foreground/40 ${
            !isValid && value.trim() !== '' ? 'text-destructive' : 'text-hex-text'
          }`}
        />
        {!isValid && value.trim() !== '' && (
          <span className="absolute right-3 text-xs text-destructive font-mono shrink-0">
            invalid
          </span>
        )}
      </div>
    </div>
  )
}
