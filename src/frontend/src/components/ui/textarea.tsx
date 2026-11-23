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
      <textarea
        className={cn(
          'flex w-full min-h-[84px] rounded-none bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-[#09090B] placeholder:text-[#6B7280] border-2 border-black transition-shadow duration-100 resize-y focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
