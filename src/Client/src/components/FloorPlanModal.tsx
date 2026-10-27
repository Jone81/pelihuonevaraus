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
      <DialogContent className="xamk-modal-lg">
        <DialogHeader>
          <div className="xamk-modal-header-row">
            <div className="xamk-modal-icon-badge" aria-hidden="true">
              🗺️
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
                  {isEn ? '6 PCs + 2 Consoles' : '6 PC + 2 Konsolia'}
                </Badge>
              </div>

              <div className="sketch-room">
                {/* 6 PC:tä */}
                <div className="sketch-zone pc-group">
                  <div className="zone-tag">{t('floorplan.pcZone')}</div>
                  <div className="pc-grid-sketch">
                    <div className="sketch-station">🖥️ PC 1</div>
                    <div className="sketch-station">🖥️ PC 2</div>
                    <div className="sketch-station">🖥️ PC 3</div>
                    <div className="sketch-station">🖥️ PC 4</div>
                    <div className="sketch-station">🖥️ PC 5</div>
                    <div className="sketch-station">🖥️ PC 6</div>
                  </div>
                </div>

                {/* Konsolit & Shared TV */}
                <div className="sketch-zone console-group">
                  <div className="zone-tag">{t('floorplan.consoleZone')}</div>
                  <div className="tv-box">
                    <span>{t('floorplan.sharedTvZone')}</span>
                  </div>
                  <div className="console-grid-sketch">
                    <div className="sketch-station console-st">🎮 PS5</div>
                    <div className="sketch-station console-st">🕹️ Switch</div>
                  </div>
                </div>
              </div>

              <div className="sketch-empty-notice">
                <p>
                  📷{' '}
                  <em>
                    {isEn
                      ? 'Interactive floor plan schematic — 6 gaming PCs and shared 4K console zone'
                      : 'Pelitilan pohjakaavio — 6 tehokasta pelitietokonetta sekä konsolikaapin yhteinen 4K TV'}
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
