'use client'

import { type ATRValidation } from '@/lib/atr'
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'

interface AtrValidationProps {
  validation: ATRValidation | null
  byteCount: number
}

export function AtrValidation({ validation, byteCount }: AtrValidationProps) {
  if (!validation) return null

  return (
    <div
      className={`rounded-lg border px-4 py-3 flex flex-col gap-2 ${
        !validation.valid
          ? 'border-destructive/40 bg-destructive/5'
          : validation.warnings.length > 0
          ? 'border-warning/30 bg-warning/5'
          : 'border-success/30 bg-success/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {!validation.valid ? (
          <AlertCircle size={14} className="text-destructive shrink-0" />
        ) : validation.warnings.length > 0 ? (
          <AlertTriangle size={14} className="text-warning shrink-0" />
        ) : (
          <CheckCircle size={14} className="text-success shrink-0" />
        )}
        <span
          className={`text-xs font-medium ${
            !validation.valid ? 'text-destructive' : validation.warnings.length > 0 ? 'text-warning' : 'text-success'
          }`}
        >
          {!validation.valid
            ? `Invalid ATR — ${validation.errors.length} error${validation.errors.length > 1 ? 's' : ''}`
            : validation.warnings.length > 0
            ? `Valid ATR with ${validation.warnings.length} warning${validation.warnings.length > 1 ? 's' : ''}`
            : 'Valid ATR'}
        </span>
        <span className="text-xs text-muted-foreground ml-auto font-mono">{byteCount} bytes</span>
      </div>

      {validation.errors.map((e, i) => (
        <p key={i} className="text-xs text-destructive pl-5 leading-relaxed">
          {e}
        </p>
      ))}

      {validation.warnings.map((w, i) => (
        <p key={i} className="text-xs text-warning pl-5 leading-relaxed">
          {w}
        </p>
      ))}
    </div>
  )
}
