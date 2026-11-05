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
      <div className="xamk-input-box">
        <input
          type={type}
          className={cn('xamk-text-input', className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
