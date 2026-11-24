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
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'grid grid-flow-col auto-cols-[minmax(auto,1fr)] rounded-none bg-[#1C1F24] border-2 border-black p-0 overflow-x-auto',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * Yksittäinen välilehtipainike, joka korostuu aktiivisena (`data-[state=active]`).
 */
const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center min-h-[42px] px-3 py-2 rounded-none font-mono text-xs font-bold uppercase tracking-wider text-[#F4F4F5] bg-[#1C1F24] border-r-2 border-black last:border-r-0 transition-colors cursor-pointer select-none hover:bg-[#252930] data-[state=active]:bg-[#FACC15] data-[state=active]:text-[#09090B] data-[state=active]:font-extrabold focus-visible:outline-none focus-visible:ring-0',
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
  React.ComponentRef<typeof TabsPrimitive.Content>,
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
