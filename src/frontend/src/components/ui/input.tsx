/**
 * @file input.tsx
 * @description Tekstisyötekenttäkomponentti (Input), joka käärii HTML `<input>`-elementin
 * Xamk-lomaketyyliseen kehykseen (`xamk-input-box`).
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

/** Syötekentän ominaisuudet (props), laajentaen standardia HTMLInputElement-rajapintaa */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Lomakkeiden tekstisyötekenttä `ref`-tuella.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full min-h-[42px] rounded-none bg-white px-3 py-2 font-mono text-sm font-bold text-[#09090B] placeholder:text-[#6B7280] border-2 border-black transition-shadow duration-100 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
