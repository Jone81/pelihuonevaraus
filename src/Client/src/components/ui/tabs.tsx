/**
 * @file tabs.tsx
 * @description Segmentoidut välilehtikomponentit (`@radix-ui/react-tabs`),
 * joilla vaihdetaan näkymiä esimerkiksi pelivalikoiman, aikataulun ja ylläpitopaneelin sisällä.
 */
import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

/** Välilehtikokonaisuuden tilaa hallitseva juuri */
const Tabs = TabsPrimitive.Root

/**
 * Välilehtipainikkeiden palkki (`xamk-segmented-bar`).
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('xamk-segmented-bar', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * Yksittäinen välilehtipainike, joka korostuu aktiivisena (`data-[state=active]`).
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'xamk-segment-btn btn-touch data-[state=active]:bg-[#5d5e63] data-[state=active]:text-white data-[state=active]:font-bold cursor-pointer select-none',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * Valitun välilehden sisältöpaneeli.
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('focus-visible:outline-none', className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
