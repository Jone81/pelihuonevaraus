/**
 * @file native-select.tsx
 * @description Natiivi HTML `<select>`-pudotusvalikkokomponentti Xamk-ulkoasulla
 * ja mukautetulla nuoli-ikonilla (`ChevronDown`).
 */
import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * NativeSelect-komponentin ominaisuudet (props).
 */
export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Valinnainen lisäluokka ulommalle kehyselementille */
  wrapperClassName?: string
}

/**
 * Tyylitelty natiivi valintalista lomakkeille.
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn('relative flex items-center w-full', wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            'w-full min-h-[42px] appearance-none rounded-none bg-white px-3 py-2 pr-9 font-mono text-sm font-bold text-[#09090B] border-2 border-black cursor-pointer transition-shadow duration-100 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#FACC15] disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {/* Koristeellinen nuoli-ikoni valintalistan oikeassa reunassa */}
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#09090B]"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </div>
    )
  }
)
NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
