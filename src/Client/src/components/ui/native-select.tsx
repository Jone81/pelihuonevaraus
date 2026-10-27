import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string
}

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

