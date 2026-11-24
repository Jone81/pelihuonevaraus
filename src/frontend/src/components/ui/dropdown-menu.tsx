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
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[220] min-w-[230px] rounded-none bg-[#1C1F24] text-[#F4F4F5] border-[3px] border-black shadow-[6px_6px_0px_#FACC15] p-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

/**
 * Yksittäinen valittava rivi tai toiminto pudotusvalikossa.
 */
const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    /** Lisää vasemman sisennyksen ikoneita varten */
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex items-center gap-2.5 px-3 py-2 rounded-none font-mono text-xs font-bold uppercase tracking-wide text-[#F4F4F5] cursor-pointer select-none outline-none transition-colors hover:bg-[#FACC15] hover:text-[#09090B] focus:bg-[#FACC15] focus:text-[#09090B]',
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
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    /** Lisää vasemman sisennyksen */
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-3 pt-2 pb-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]',
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
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('h-[2px] bg-[#3F444E] my-1.5 mx-1', className)}
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
