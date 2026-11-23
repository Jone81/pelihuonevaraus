/**
 * @file FloorPlanModal.tsx
 * @description Pelitilan pohjakuvan ja laitesijoittelun esittävä modaali-ikkuna.
 * Havainnollistaa 6 PC-pelipisteen sekä konsolikaapin (PS5, Switch ja yhteinen 4K-TV) sijainnin.
 */
import React from 'react';
import { Map, Monitor, Gamepad2, Tv } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * FloorPlanModal-komponentin ominaisuudet (props).
 */
interface FloorPlanModalProps {
  /** Onko pohjakuvamodaali avoinna */
  isOpen: boolean;
  /** Funktio modaalin sulkemiseen */
  onClose: () => void;
}

/**
 * Modaali-ikkuna pelitilan pohjapiirroksen tarkasteluun.
 */
export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-none w-10 h-10 bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center shrink-0" aria-hidden="true">
              <Map className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>{t('floorplan.title')}</DialogTitle>
              <div className="h-1 w-14 bg-[#FACC15] border border-black my-2" />
              <DialogDescription>{t('floorplan.desc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Kuva-ikkuna / Luonnosalue */}
        <div className="rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-black p-4">
          <div className="w-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3F444E]">
                <span className="font-mono font-bold text-sm uppercase tracking-wider text-[#FACC15]">{t('floorplan.sketchHeader')}</span>
                <Badge variant="status">
                  {isEn ? '6 PCs and 2 consoles' : '6 PC ja 2 konsolia'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 6 PC:tä */}
                <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 flex flex-col gap-3">
                  <div className="font-mono font-bold text-xs uppercase tracking-wider text-[#FACC15] border-b border-[#3F444E] pb-1.5">{t('floorplan.pcZone')}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['PC 1', 'PC 2', 'PC 3', 'PC 4', 'PC 5', 'PC 6'].map((pcName) => (
                      <div key={pcName} className="rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-black shadow-[2px_2px_0px_#000000] px-2.5 py-2 font-mono font-bold text-xs inline-flex items-center justify-center gap-1.5">
                        <Monitor className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
                        <span>{pcName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Konsolit ja yhteinen TV */}
                <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-4 flex flex-col gap-3">
                  <div className="font-mono font-bold text-xs uppercase tracking-wider text-[#3B82F6] border-b border-[#3F444E] pb-1.5">{t('floorplan.consoleZone')}</div>
                  <div className="rounded-none bg-[#3B82F6] text-white border-2 border-black shadow-[3px_3px_0px_#000000] px-3 py-2 font-mono font-bold text-xs uppercase tracking-wide inline-flex items-center justify-center gap-1.5">
                    <Tv className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{t('floorplan.sharedTvZone')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-black shadow-[2px_2px_0px_#000000] px-2.5 py-2 font-mono font-bold text-xs inline-flex items-center justify-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 shrink-0 text-[#22C55E]" strokeWidth={2.5} aria-hidden="true" />
                      <span>PlayStation 5</span>
                    </div>
                    <div className="rounded-none bg-[#121417] text-[#F4F4F5] border-2 border-black shadow-[2px_2px_0px_#000000] px-2.5 py-2 font-mono font-bold text-xs inline-flex items-center justify-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 shrink-0 text-[#22C55E]" strokeWidth={2.5} aria-hidden="true" />
                      <span>Nintendo Switch</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#3F444E] pt-3 text-center text-xs font-mono text-[#A1A1AA]">
                <p>
                  <em>
                    {isEn
                      ? 'Floor plan schematic, 6 gaming PCs and shared 4K console zone'
                      : 'Pelitilan pohjakaavio, 6 pelitietokonetta sekä konsolikaapin yhteinen 4K-TV'}
                  </em>
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="pill" onClick={onClose}>
            <span>{t('floorplan.close')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
