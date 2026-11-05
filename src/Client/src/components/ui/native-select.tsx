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
      <div className={cn('xamk-input-box xamk-select-box', wrapperClassName)}>
        <select
          ref={ref}
          className={cn('xamk-native-select', className)}
          {...props}
        >
          {children}
        </select>
        {/* Koristeellinen nuoli-ikoni valintalistan oikeassa reunassa */}
        <ChevronDown
          className="xamk-select-chevron h-4 w-4"
          aria-hidden="true"
        />
      </div>
    )
  }
)
NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
