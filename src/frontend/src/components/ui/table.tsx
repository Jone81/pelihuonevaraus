/**
 * @file table.tsx
 * @description Responsiiviset taulukkokomponentit (Table, TableHeader, TableBody,
 * TableRow, TableHead, TableCell) ylläpitopaneelin ja varausnäkymien listauksiin.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Taulukon juurikomponentti, joka käärii `<table>`-elementin vieritettävään kehykseen.
 */
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { wrapperClassName?: string }
>(({ className, wrapperClassName, ...props }, ref) => (
  <div
    className={cn(
      'w-full max-w-full min-w-0 box-border overflow-x-auto rounded-none border-2 border-black bg-[#1C1F24] shadow-[4px_4px_0px_#000000]',
      wrapperClassName
    )}
  >
    <table
      ref={ref}
      className={cn('w-full min-w-[580px] border-collapse text-sm text-[#F4F4F5]', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

/**
 * Taulukon otsakerivien osio (`<thead>`).
 */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-[#121417] border-b-2 border-black', className)}
    {...props}
  />
))
TableHeader.displayName = 'TableHeader'

/**
 * Taulukon sisältörivien osio (`<tbody>`).
 */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-b-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

/**
 * Yksittäinen taulukkorivi (`<tr>`).
 */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('border-b border-[#3F444E] transition-colors hover:bg-[#252930]', className)}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

/**
 * Taulukon sarakeotsikkosolu (`<th>`).
 */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'px-3.5 py-3 text-left font-mono text-xs font-bold uppercase tracking-wider text-[#FACC15]',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

/**
 * Taulukon tavallinen datasolu (`<td>`).
 */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-3.5 py-3 align-middle text-[#F4F4F5]', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}
