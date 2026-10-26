import React from 'react';
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

interface FloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                {t('floorplan.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#9da3ae] mt-1">
                {t('floorplan.desc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Kuva-ikkuna / Luonnosalue */}
        <div className="floorplan-image-box my-4">
          <div className="floorplan-empty-area">
            <div className="floorplan-sketch">
              <div className="sketch-header flex items-center justify-between">
                <span className="sketch-title">{t('floorplan.sketchHeader')}</span>
                <Badge variant="xamk">
                  {isEn ? '6 PCs + 2 Consoles' : '6 PC + 2 Konsolia'}
                </Badge>
              </div>

              <div className="sketch-room">
                {/* 6 PC:tä */}
                <div className="sketch-zone pc-group">
                  <div className="zone-tag">{t('floorplan.pcZone')}</div>
                  <div className="pc-grid-sketch">
                    <div className="sketch-station">PC 1</div>
                    <div className="sketch-station">PC 2</div>
                    <div className="sketch-station">PC 3</div>
                    <div className="sketch-station">PC 4</div>
                    <div className="sketch-station">PC 5</div>
                    <div className="sketch-station">PC 6</div>
                  </div>
                </div>

                {/* Konsolit & Shared TV */}
                <div className="sketch-zone console-group">
                  <div className="zone-tag">{t('floorplan.consoleZone')}</div>
                  <div className="tv-box">
                    <span>{t('floorplan.sharedTvZone')}</span>
                  </div>
                  <div className="console-grid-sketch">
                    <div className="sketch-station console-st">PS5</div>
                    <div className="sketch-station console-st">Switch</div>
                  </div>
                </div>
              </div>

              <div className="sketch-empty-notice">
                <p>
                  📷 <em>
                    {isEn
                      ? 'Official photo placeholder (to be added later)'
                      : 'Virallinen kuva-alue (toistaiseksi tyhjä, lisätään myöhemmin)'}
                  </em>
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="btn-touch px-6"
            onClick={onClose}
          >
            {t('floorplan.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
