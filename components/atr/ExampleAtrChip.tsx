'use client'

// This can't be in page.tsx directly because it needs onClick (client)
// We use a global event to communicate with AtrEditor
import { useCallback } from 'react'

interface ExampleAtrChipProps {
  label: string
  hex: string
}

const EVENT_NAME = 'atr:load-example'

export function ExampleAtrChip({ label, hex }: ExampleAtrChipProps) {
  const handleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: hex }))
  }, [hex])

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-secondary/40 hover:border-primary/40 hover:bg-primary/8 hover:text-primary transition-all text-xs text-muted-foreground"
    >
      <span>{label}</span>
      <span className="font-mono text-[10px] opacity-60">{hex.split(' ').length}B</span>
    </button>
  )
}

export { EVENT_NAME as ATR_EXAMPLE_EVENT }
