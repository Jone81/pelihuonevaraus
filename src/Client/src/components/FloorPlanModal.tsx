import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface FloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="floorplan-title">
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🗺️</span>
            <h2 id="floorplan-title">{t('floorplan.title')}</h2>
          </div>
          <button
            type="button"
            className="btn-close btn-touch"
            onClick={onClose}
            aria-label={t('floorplan.close')}
          >
            ✕
          </button>
        </div>

        <p className="modal-description">
          {t('floorplan.desc')}
        </p>

        {/* Kuva-ikkuna (Toistaiseksi tyhjä kuva-alue) */}
        <div className="floorplan-image-box">
          <div className="floorplan-empty-area">
            <div className="floorplan-sketch">
              <div className="sketch-header">
                <span className="sketch-title">{t('floorplan.sketchHeader')}</span>
                <span className="sketch-badge">{isEn ? '6 PCs + 2 Consoles' : '6 PC + 2 Konsolia'}</span>
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

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary btn-touch"
            onClick={onClose}
          >
            {t('floorplan.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
