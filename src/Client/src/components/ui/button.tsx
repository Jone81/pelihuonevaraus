/**
 * @file button.tsx
 * @description Yhtenäinen painikekomponentti (Button), joka tukee useita Xamk-teeman
 * mukaisia tyylejä, kokovariantteja sekä Radix UI `Slot`-edelleenohjausta (`asChild`).
 */
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Painikkeen ulkoasu- ja kokovarianttien määrittelyt.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d49a2a] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none btn-touch',
  {
    variants: {
      variant: {
        default:
          'xamk-confirm-pill-btn',
        xamk:
          'xamk-confirm-pill-btn',
        pill:
          'xamk-confirm-pill-btn',
        segment:
          'xamk-segment-btn',
        station:
          'xamk-station-row-card',
        destructive:
          'xamk-table-action-btn action-danger',
        outline:
          'xamk-modal-cancel-btn',
        secondary:
          'xamk-modal-cancel-btn',
        ghost:
          'rounded-md px-3 py-1.5 text-[#cfd2d8] hover:bg-[#25272d] hover:text-white',
        link:
          'text-[#d49a2a] underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'text-xs px-3 py-1.5 min-h-[34px]',
        lg: 'text-base px-6 py-2.5 min-h-[44px]',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Painikekomponentin ominaisuudet (props).
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Jos `true`, renderöi lapsielementin suoraan Radix Slot -komponentilla `<button>`-tagin sijaan */
  asChild?: boolean
}

/**
 * Uudelleenkäytettävä painikekomponentti `ref`-tuella.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Valitaan renderöitäväksi elementiksi joko Slot tai tavallinen button
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
