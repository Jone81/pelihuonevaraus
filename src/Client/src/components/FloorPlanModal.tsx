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
      <DialogContent className="xamk-modal-lg">
        <DialogHeader>
          <div className="xamk-modal-header-row">
            <div className="xamk-modal-icon-badge" aria-hidden="true">
              <Map className="w-5 h-5 shrink-0" aria-hidden="true" />
            </div>
            <div className="xamk-modal-title-group">
              <DialogTitle>{t('floorplan.title')}</DialogTitle>
              <div className="xamk-modal-underline" />
              <DialogDescription>{t('floorplan.desc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Kuva-ikkuna / Luonnosalue */}
        <div className="floorplan-image-box">
          <div className="floorplan-empty-area">
            <div className="floorplan-sketch">
              <div className="sketch-header">
                <span className="sketch-title">{t('floorplan.sketchHeader')}</span>
                <Badge variant="status">
                  {isEn ? '6 PCs and 2 consoles' : '6 PC ja 2 konsolia'}
                </Badge>
              </div>

              <div className="sketch-room">
                {/* 6 PC:tä */}
                <div className="sketch-zone pc-group">
                  <div className="zone-tag">{t('floorplan.pcZone')}</div>
                  <div className="pc-grid-sketch">
                    {['PC 1', 'PC 2', 'PC 3', 'PC 4', 'PC 5', 'PC 6'].map((pcName) => (
                      <div key={pcName} className="sketch-station inline-flex items-center justify-center gap-1.5">
                        <Monitor className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{pcName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Konsolit ja yhteinen TV */}
                <div className="sketch-zone console-group">
                  <div className="zone-tag">{t('floorplan.consoleZone')}</div>
                  <div className="tv-box inline-flex items-center justify-center gap-1.5">
                    <Tv className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{t('floorplan.sharedTvZone')}</span>
                  </div>
                  <div className="console-grid-sketch">
                    <div className="sketch-station console-st inline-flex items-center justify-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>PlayStation 5</span>
                    </div>
                    <div className="sketch-station console-st inline-flex items-center justify-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Nintendo Switch</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sketch-empty-notice">
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
