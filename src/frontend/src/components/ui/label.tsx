/**
 * @file label.tsx
 * @description Lomakekenttien nimikekomponentti (Label), joka pohjautuu
 * `@radix-ui/react-label`-primitiiviin saavutettavuuden varmistamiseksi.
 */
import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/** Nimikkeen oletustyylit ja passiivisen tilan korostus */
const labelVariants = cva(
  'font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5] peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none'
)

/**
 * Saavutettava lomakekentän otsakekomponentti.
 */
const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
