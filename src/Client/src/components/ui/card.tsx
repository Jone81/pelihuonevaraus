/**
 * @file card.tsx
 * @description Korttikomponenttiperhe (Card, CardHeader, CardTitle, CardDescription,
 * CardContent, CardFooter) sisällön ryhmittelyyn Xamk-paneelityylillä.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Kortin juurielementti, joka luo kehystetyn paneelitaustan.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('xamk-admin-panel-card', className)}
    {...props}
  />
))
Card.displayName = 'Card'

/**
 * Kortin ylätunnisteosio otsikolle ja kuvaukselle.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

/**
 * Kortin pääotsikko (`h3`).
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('xamk-admin-card-title', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

/**
 * Kortin tarkentava kuvausteksti otsikon alla.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('xamk-admin-card-desc', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

/**
 * Kortin varsinainen sisältöalue.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props} />
))
CardContent.displayName = 'CardContent'

/**
 * Kortin alatunnisteosio esimerkiksi toimintopainikkeille.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between gap-2 pt-2', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
