/**
 * @file textarea.tsx
 * @description Monirivinen tekstisyötekenttä (Textarea), joka on kehystetty
 * Xamk-lomaketyylillä (`xamk-textarea-box`).
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

/** Textarea-komponentin ominaisuudet (props) */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * Monirivinen tekstikenttä `ref`-tuella.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="xamk-textarea-box">
        <textarea
          className={cn('xamk-textarea-input', className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
