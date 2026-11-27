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
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-[200] bg-black/80', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * Dialogin varsinainen sisältölaatikko, joka sisältää myös oikean yläkulman sulkemisrastin.
 */
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-[210] -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[540px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none bg-[#1C1F24] text-[#F4F4F5] border-[3px] border-black shadow-[6px_6px_0px_#FACC15] p-4 sm:p-6 flex flex-col gap-4 focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
      {/* Oikean yläkulman sulkupainike ruudunlukijatekstillä */}
      <DialogPrimitive.Close
        className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-none bg-[#121417] border-2 border-black text-[#F4F4F5] cursor-pointer transition-colors hover:bg-[#FACC15] hover:text-[#09090B] focus:outline-none"
        aria-label="Sulje"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
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
    className={cn('flex flex-col gap-1.5 pr-10', className)}
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
    className={cn(
      'flex items-center justify-end gap-2.5 pt-3.5 mt-1 border-t-2 border-[#3F444E] flex-wrap',
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

/**
 * Dialogin saavutettava otsikkokomponentti.
 */
const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'font-extrabold uppercase tracking-tight text-xl text-[#F4F4F5] leading-tight',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * Dialogin saavutettava kuvaustekstikomponentti.
 */
const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[#9CA3AF] leading-relaxed', className)}
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
