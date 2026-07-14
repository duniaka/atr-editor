'use client'

import { useState, useRef, useEffect } from 'react'

interface HelpTipProps {
  text: string
  /** Optional extra class on the trigger button */
  className?: string
}

export function HelpTip({ text, className = '' }: HelpTipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label="Show help"
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-border/50 text-[10px] font-semibold text-muted-foreground/50 hover:text-muted-foreground hover:border-border transition-colors leading-none select-none"
      >
        ?
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-md border border-border bg-popover px-3 py-2 shadow-lg pointer-events-none"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
          {/* Caret */}
          <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  )
}
