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
  'inline-flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap text-center rounded-none font-mono text-sm font-extrabold uppercase tracking-tight border-2 border-black shadow-[4px_4px_0px_#000000] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[3px_3px_0px_#FACC15] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none min-h-[44px] px-3.5 sm:px-5 py-2.5',
  {
    variants: {
      variant: {
        default:
          'bg-[#FACC15] text-[#09090B] hover:bg-[#EAB308]',
        xamk:
          'bg-[#FACC15] text-[#09090B] hover:bg-[#EAB308]',
        pill:
          'bg-[#FACC15] text-[#09090B] hover:bg-[#EAB308]',
        segment:
          'bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none hover:bg-[#252930] active:translate-x-0 active:translate-y-0 min-h-[40px] px-3 py-2 text-xs',
        station:
          'bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] justify-between text-left normal-case font-sans font-bold px-3.5 py-2.5 min-h-[46px] hover:border-[#FACC15]',
        destructive:
          'bg-[#EF4444] text-white hover:bg-[#DC2626]',
        outline:
          'bg-white text-[#09090B] hover:bg-[#F4F4F5]',
        secondary:
          'bg-[#3B82F6] text-white hover:bg-[#2563EB]',
        ghost:
          'bg-transparent text-[#F4F4F5] border-transparent shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none hover:bg-[#1C1F24] hover:border-[#3F444E] active:translate-x-0 active:translate-y-0 min-h-[36px] px-3 py-1.5',
        link:
          'bg-transparent text-[#3B82F6] border-transparent shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none active:translate-x-0 active:translate-y-0 underline-offset-4 hover:underline min-h-0 px-1 py-0',
      },
      size: {
        default: '',
        sm: 'text-xs px-3 py-1.5 min-h-[34px]',
        lg: 'text-base px-6 py-3 min-h-[48px]',
        icon: 'h-10 w-10 min-h-[40px] min-w-[40px] p-0',
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
