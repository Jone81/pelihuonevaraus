import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

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

