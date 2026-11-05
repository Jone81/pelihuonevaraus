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
  'xamk-station-status-pill transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: '',
        status: '',
        occupied: 'status-pill-occupied',
        installed: 'status-pill-installed',
        wishlist: 'status-pill-wishlist',
        secondary: 'bg-[#25272d] border-[#3d4049] text-[#dcdfe6]',
        destructive: 'status-pill-occupied',
        outline: 'bg-transparent border-[#454852] text-[#e2e5ec]',
        success: 'status-pill-installed',
        warning: 'status-pill-wishlist',
        xamk: '',
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
