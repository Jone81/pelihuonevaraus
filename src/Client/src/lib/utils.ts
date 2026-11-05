/**
 * @file utils.ts
 * @description Yleiskäyttöiset apufunktiot käyttöliittymäkomponenteille.
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Yhdistää ehdolliset CSS-luokkanimet (`clsx`) ja ratkaisee mahdolliset
 * Tailwind CSS -luokkien ristiriidat (`twMerge`).
 *
 * @param inputs - Lista luokkanimiä, objekteja tai taulukoita
 * @returns Yhdistetty ja siistitty merkkijono CSS-luokkia
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
