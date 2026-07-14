'use client'

import { HelpTip } from './HelpTip'

interface AtrSectionProps {
  title: string
  byteLabel: string
  /** Help text shown in a tooltip next to the title */
  help?: string
  byteValue?: number
  badge?: string
  badgeVariant?: 'default' | 'warning' | 'error' | 'muted'
  present?: boolean
  /** If true the present button is not rendered (byte is always mandatory) */
  alwaysPresent?: boolean
  /** Called when the user clicks the Present toggle */
  onTogglePresent?: (on: boolean) => void
  /** If true the toggle is disabled (required by a downstream byte) */
  requiredPresent?: boolean
  children: React.ReactNode
}

const BADGE_STYLES: Record<string, string> = {
  default: 'bg-primary/15 text-primary border-primary/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  error: 'bg-destructive/15 text-destructive border-destructive/25',
  muted: 'bg-secondary text-muted-foreground border-border',
}

export function AtrSection({
  title,
  byteLabel,
  help,
  byteValue,
  badge,
  badgeVariant = 'default',
  present = true,
  alwaysPresent = false,
  onTogglePresent,
  requiredPresent = false,
  children,
}: AtrSectionProps) {
  return (
    <div
      className={`rounded-lg border transition-colors ${
        present ? 'border-border bg-card' : 'border-border/30 bg-card/30'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Byte label */}
        <span
          className={`font-mono text-xs px-1.5 py-0.5 rounded border shrink-0 ${
            present
              ? 'text-byte-iface border-byte-iface/30 bg-byte-iface/10'
              : 'text-muted-foreground/30 border-border/20 bg-transparent'
          }`}
        >
          {byteLabel}
        </span>

        {/* Title + optional help tip */}
        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className={`text-sm font-medium truncate ${
              present ? 'text-foreground' : 'text-muted-foreground/40'
            }`}
          >
            {title}
          </span>
          {help && <HelpTip text={help} />}
        </span>

        {/* Byte hex value */}
        {byteValue !== undefined && present && (
          <span className="font-mono text-xs text-primary shrink-0">
            {byteValue.toString(16).padStart(2, '0').toUpperCase()}
          </span>
        )}

        {/* Badge */}
        {badge && (
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${
              BADGE_STYLES[badgeVariant]
            }`}
          >
            {badge}
          </span>
        )}

        {/* Present toggle switch */}
        {!alwaysPresent && (
          <button
            type="button"
            role="switch"
            aria-checked={present}
            disabled={requiredPresent}
            onClick={() => onTogglePresent?.(!present)}
            title={requiredPresent ? 'Required by a downstream byte' : present ? 'Remove byte' : 'Add byte'}
            className={`shrink-0 relative inline-flex items-center h-5 w-9 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              requiredPresent
                ? 'cursor-not-allowed opacity-40 bg-primary/40 border-primary/30'
                : present
                ? 'bg-primary border-primary cursor-pointer'
                : 'bg-secondary border-border/50 cursor-pointer hover:border-primary/40'
            }`}
          >
            <span
              className={`pointer-events-none block h-3.5 w-3.5 rounded-full shadow transition-transform ${
                present
                  ? 'translate-x-[18px] bg-primary-foreground'
                  : 'translate-x-[2px] bg-muted-foreground/50'
              }`}
            />
          </button>
        )}
      </div>

      {/* Body — always visible, dimmed when absent but still interactive */}
      <div
        className={`px-4 pb-4 pt-1 border-t border-border/40 transition-opacity ${
          present ? 'opacity-100' : 'opacity-40'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
