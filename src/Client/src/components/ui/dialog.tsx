/**
 * @file dialog.tsx
 * @description Saavutettava modaali- ja dialogikomponenttiperhe, joka pohjautuu
 * `@radix-ui/react-dialog`-primitiiveihin. Sisältää automaattisen fokuksen hallinnan,
 * taustahimmennyksen (Overlay) ja sulkemispainikkeen.
 */
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Dialogin tilaa hallitseva juurikomponentti */
const Dialog = DialogPrimitive.Root
/** Elementti, joka avaa dialogin klikattaessa */
const DialogTrigger = DialogPrimitive.Trigger
/** Portaali, joka renderöi dialogin DOM-puun juureen */
const DialogPortal = DialogPrimitive.Portal
/** Painike tai elementti dialogin sulkemiseen */
const DialogClose = DialogPrimitive.Close

/**
 * Dialogin taustan tummennuskerros (Overlay).
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('xamk-dialog-overlay', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * Dialogin varsinainen sisältölaatikko, joka sisältää myös oikean yläkulman sulkemisrastin.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn('xamk-dialog-content', className)}
      {...props}
    >
      {children}
      {/* Oikean yläkulman sulkupainike ruudunlukijatekstillä */}
      <DialogPrimitive.Close className="xamk-dialog-close" aria-label="Sulje">
        <X className="h-4 w-4" />
        <span className="sr-only">Sulje</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/**
 * Dialogin ylätunnisteosio otsikolle ja kuvaustekstille.
 */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('xamk-dialog-header', className)}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

/**
 * Dialogin alatunnisteosio toimintopainikkeille (esim. Peruuta / Vahvista).
 */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('xamk-dialog-footer', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

/**
 * Dialogin saavutettava otsikkokomponentti.
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('xamk-dialog-title', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * Dialogin saavutettava kuvaustekstikomponentti.
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('xamk-dialog-description', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
