import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Map,
  X,
  Monitor,
  Tv,
  Gamepad2,
  Gamepad,
  Sparkles,
  Info,
} from 'lucide-react';

interface FloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#2d323f]">
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Map className="w-4 h-4 text-[#fbba18]" />
              <span>{t('floorplan.title')}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">{t('floorplan.desc')}</p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pohjapiirroksen luonnosalue */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#111318] border border-[#262a36] flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#222632]">
            <span className="font-bold text-white tracking-wider uppercase text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fbba18]" />
              <span>{t('floorplan.sketchHeader')}</span>
            </span>
            <span className="text-[10px] font-bold text-[#fbba18] bg-[#fbba18]/15 border border-[#fbba18]/30 px-2 py-0.5 rounded-full">
              {isEn ? '6 PCs + 2 Consoles' : '6 PC-pistettä + 2 Konsolia'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. PC-alue */}
            <div className="p-3.5 rounded-xl bg-[#151821] border border-[#2b303e] flex flex-col gap-2.5">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('floorplan.pcZone')}</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['PC 1', 'PC 2', 'PC 3', 'PC 4', 'PC 5', 'PC 6'].map((pc) => (
                  <div
                    key={pc}
                    className="p-2.5 rounded-lg bg-[#1a1e29] border border-[#2e3444] text-center text-xs font-bold text-white flex flex-col items-center gap-1 shadow-xs"
                  >
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{pc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Konsolialue & Shared TV */}
            <div className="p-3.5 rounded-xl bg-[#151821] border border-[#2b303e] flex flex-col gap-2.5">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('floorplan.consoleZone')}</span>
              </span>

              {/* Yhteinen 4K TV */}
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2">
                <Tv className="w-4 h-4 text-amber-400" />
                <span>{t('floorplan.sharedTvZone')}</span>
              </div>

              {/* Konsolit */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#1a1e29] border border-[#2e3444] text-center text-xs font-bold text-white flex flex-col items-center gap-1 shadow-xs">
                  <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>PlayStation 5</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1a1e29] border border-[#2e3444] text-center text-xs font-bold text-white flex flex-col items-center gap-1 shadow-xs">
                  <Gamepad className="w-3.5 h-3.5 text-rose-400" />
                  <span>Switch</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>
              {isEn
                ? 'High-speed LAN, gaming chairs and headsets are available at every station.'
                : 'Kaikilla pelipisteillä on nopea kiinteä verkkoyhteys, Secretlab-pelituolit ja pelikuulokkeet.'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#2d323f]">
          <button
            type="button"
            className="px-5 py-2 rounded-xl bg-[#111318] hover:bg-[#1a1d26] border border-[#2d323f] text-gray-200 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            onClick={onClose}
          >
            {t('floorplan.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
