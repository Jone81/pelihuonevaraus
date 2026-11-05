/**
 * @file dropdown-menu.tsx
 * @description Pudotusvalikkokomponentit (`@radix-ui/react-dropdown-menu`),
 * joita käytetään esimerkiksi mobiilinavigaation ja toimintovalikkojen toteutukseen.
 */
import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

/** Pudotusvalikon juuri */
const DropdownMenu = DropdownMenuPrimitive.Root
/** Pudotusvalikon avaava painike */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
/** Valikkokohteiden ryhmittelyelementti */
const DropdownMenuGroup = DropdownMenuPrimitive.Group
/** Portaali valikon renderöimiseen dokumentin juureen */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
/** Alivalikon juuri */
const DropdownMenuSub = DropdownMenuPrimitive.Sub
/** Valintanappiryhmä pudotusvalikon sisällä */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

/**
 * Pudotusvalikon avautuva sisältölaatikko.
 */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn('xamk-dropdown-content', className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

/**
 * Yksittäinen valittava rivi tai toiminto pudotusvalikossa.
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    /** Lisää vasemman sisennyksen ikoneita varten */
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'xamk-dropdown-item',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

/**
 * Pudotusvalikon väliotsikko tai ryhmän nimi (ei klikattava).
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    /** Lisää vasemman sisennyksen */
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'xamk-dropdown-label',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

/**
 * Vaakasuora erotinviiva pudotusvalikon osioiden välillä.
 */
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('xamk-dropdown-separator', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
}
