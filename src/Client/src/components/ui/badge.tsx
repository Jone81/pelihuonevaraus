/**
 * @file badge.tsx
 * @description Uudelleenkäytettävä tilatunniste- ja merkkikomponentti (Badge).
 * Käyttää `class-variance-authority`-kirjastoa erilaisten visuaalisten tilojen
 * (esim. vapaa, varattu, asennettu, toivelistalla) esittämiseen.
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Badge-komponentin tyylivariantit Xamk-ulkoasujärjestelmässä.
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-none border-2 border-black px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider shrink-0 transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-[#FACC15] text-[#09090B]',
        status: 'bg-[#FACC15] text-[#09090B]',
        occupied: 'bg-[#EF4444] text-white',
        installed: 'bg-[#22C55E] text-[#09090B]',
        wishlist: 'bg-[#FACC15] text-[#09090B]',
        secondary: 'bg-[#1C1F24] border-[#3F444E] text-[#F4F4F5]',
        destructive: 'bg-[#EF4444] text-white',
        outline: 'bg-transparent border-[#3F444E] text-[#F4F4F5]',
        success: 'bg-[#22C55E] text-[#09090B]',
        warning: 'bg-[#FACC15] text-[#09090B]',
        xamk: 'bg-[#FACC15] text-[#09090B]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

/**
 * Badge-komponentin ominaisuudet (props), laajentaen HTML `span`-elementin ominaisuuksia.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Pieni pillerimäinen tunniste tilan, kategorian tai roolin korostamiseen.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
