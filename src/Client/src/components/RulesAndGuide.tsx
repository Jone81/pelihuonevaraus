import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  BookOpen,
  Map,
  MessageSquare,
  ShieldCheck,
  Monitor,
  Tv,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface RulesAndGuideProps {
  onOpenFloorPlan: () => void;
}

export const RulesAndGuide: React.FC<RulesAndGuideProps> = ({ onOpenFloorPlan }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  return (
    <div className="w-full max-w-full flex flex-col gap-6">
      {/* Yläkortti: Esittely & Pikalinkit */}
      <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col items-start max-w-2xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#fbba18]" />
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white font-sans">
              {t('rules.title')}
            </h2>
          </div>
          <div className="w-10 h-0.5 bg-[#d89619] rounded-full mt-1.5" />
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{t('rules.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-[#111318] hover:bg-[#1a1d26] border border-[#2d323f] text-gray-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={onOpenFloorPlan}
          >
            <Map className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('rules.openFloorPlan')}</span>
          </button>
          <a
            href="https://discord.gg/xamk"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d89619] via-[#fbba18] to-[#d89619] text-[#0a0b0d] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('rules.joinDiscord')}</span>
          </a>
        </div>
      </div>

      {/* Sääntö- ja ohjekortit 4 sarakkeen / 2x2 ruudukkona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Yleiset säännöt */}
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#252936]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">{t('rules.generalTitle')}</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
              {t('rules.generalBadge')}
            </span>
          </div>

          <ul className="space-y-3 text-xs text-gray-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbba18] mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'No food at stations: ' : 'Ei ruokailua koneilla: '}</strong>
                <span>{isEn ? 'Eating at gaming stations is strictly prohibited. Only resealable drink bottles (with caps) are permitted on desks.' : 'Laitteiden äärellä syöminen on ehdottomasti kielletty. Ainoastaan suljettavat juomapullot (korkilla) ovat sallittuja pöydillä.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbba18] mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Cleanliness & order: ' : 'Siisteys & järjestys: '}</strong>
                <span>{isEn ? 'Dispose of your trash in the bins immediately after your session. Push your chair neatly under the desk and return headphones to their stand.' : 'Vie omat roskat roskakoriin heti session jälkeen. Laita pelituoli siististi pöydän alle ja aseta kuulokkeet telineeseen.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbba18] mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Audio & etiquette: ' : 'Äänenvoimakkuus & käytöstavat: '}</strong>
                <span>{isEn ? 'Always use headphones at PC stations. Respect peers playing and studying in the space — avoid disruptive shouting.' : 'Käytä aina kuulokkeita PC-pisteillä. Kunnioita tilassa opiskelevia ja pelaavia kanssatiimiläisiä — ei häiritsevää huutelua.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbba18] mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Opening hours (08:00–18:00): ' : 'Aukioloajat (klo 08:00–18:00): '}</strong>
                <span>{isEn ? 'The room is open Mon–Fri 08:00–18:00. You must exit promptly by 18:00 when doors automatically lock.' : 'Tila on avoinna ma–pe klo 08:00–18:00. Tilasta on poistuttava viipymättä klo 18:00 mennessä, jolloin ovet lukittuvat.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbba18] mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Booking limits: ' : 'Varausrajat: '}</strong>
                <span>{isEn ? 'An individual student quota is maximum 4 hours per day. Remember to cancel your booking in the system before it starts if you cannot attend!' : 'Yksittäisen opiskelijan varauskiintiö on enintään 4 tuntia päivässä. Muista perua varauksesi järjestelmästä ennen sen alkamista, jos et pääsekään pelaamaan!'}</span>
              </div>
            </li>
          </ul>
        </div>

        {/* 2. PC & Steam-pelaaminen */}
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#252936]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <Monitor className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">{t('rules.steamTitle')}</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              {t('rules.steamBadge')}
            </span>
          </div>

          <ul className="space-y-3 text-xs text-gray-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Pre-installed games: ' : 'Asennetut pelit: '}</strong>
                <span>{isEn ? 'PCs are preloaded with CS2, Valorant, Dota 2, Rocket League, and more. You can propose new titles in the Games & Wishlist tab.' : 'Koneille on esiasennettu suosituimmat kilpapelit (CS2, Valorant, Dota 2, Rocket League ym.). Voit ehdottaa uusia pelejä Pelit & Toivelista -välilehdellä.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Personal accounts: ' : 'Omat tilit: '}</strong>
                <span>{isEn ? 'Use your own Steam, Epic, Riot, or Battle.net account to play.' : 'Käytä omaa Steam-, Epic Games-, Riot- tai Battle.net-tiliäsi pelaamiseen.'}</span>
              </div>
            </li>
            <li className="p-3 rounded-xl bg-[#d89619]/10 border border-[#d89619]/30 text-[#fbba18] flex items-start gap-2 text-xs">
              <Lock className="w-4 h-4 text-[#fbba18] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-bold">{isEn ? 'Sign out after session: ' : 'Kirjaudu aina ulos: '}</strong>
                <span>{isEn ? 'Always sign out of personal game clients, browser sessions, and Discord when ending your turn.' : 'Muista aina kirjautua ulos henkilökohtaisilta pelitileiltäsi (Steam, Discord, selaimet) pelivuoron päätyttyä tietoturvasi takaamiseksi.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Hardware & peripherals: ' : 'Oheislaitteet: '}</strong>
                <span>{isEn ? 'You may bring your own mouse, keyboard, or headset. Always return room peripherals back to original ports after playing.' : 'Voit tuoda oman hiiren, näppäimistön tai kuulokkeet. Kytke tilan omat laitteet takaisin paikalleen pelivuoron jälkeen.'}</span>
              </div>
            </li>
          </ul>
        </div>

        {/* 3. Konsolikaappi & Yhteinen TV */}
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#252936]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Tv className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">{t('rules.consoleTitle')}</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
              {t('rules.consoleBadge')}
            </span>
          </div>

          <ul className="space-y-3 text-xs text-gray-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Shared TV Display: ' : 'SharedTV-näyttö: '}</strong>
                <span>{isEn ? 'PS5 and Nintendo Switch share the same 4K TV. Only one console can be in use at a time. The system automatically locks the other console.' : 'PS5 ja Nintendo Switch käyttävät samaa 4K-televisiota. Vain yksi konsoli voi olla kerrallaan käytössä; varausjärjestelmä lukitsee toisen automaattisesti.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Charging controllers: ' : 'Ohjainten lataus: '}</strong>
                <span>{isEn ? 'Always place PS5 DualSense and Switch Joy-Cons in their designated charging docks after your game session.' : 'Aseta PS5 DualSense -ohjaimet ja Switch Joy-Conit aina lataustelakoihinsa pelivuorosi päätyttyä, jotta virtaa riittää seuraaville pelaajille.'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <div>
                <strong className="text-white">{isEn ? 'Powering down: ' : 'Laitteiden sammutus: '}</strong>
                <span>{isEn ? 'Put consoles to Rest Mode or turn off. Turn off the TV using the remote control in the cabinet.' : 'Aseta konsolit lepotilaan (Rest Mode) tai sammuta ne. Sammuta TV kaukosäätimellä.'}</span>
              </div>
            </li>
          </ul>
        </div>

        {/* 4. Discord & Yhteisö */}
        <div className="bg-[#181a20] border border-[#2d323f] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#252936]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#5865F2]/15 text-[#5865F2]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">{t('rules.discordTitle')}</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#858ffa]">
              {t('rules.discordBadge')}
            </span>
          </div>

          <ul className="space-y-3 text-xs text-gray-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2] mt-1.5 flex-shrink-0" />
              <span>{isEn ? 'Official announcements on student esports tournaments and LAN events.' : 'Tiedotteet tulevista opiskelijaturnauksista, LAN-tapahtumista ja peli-illoista.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2] mt-1.5 flex-shrink-0" />
              <span>{isEn ? 'Find teammates and players for CS2, Valorant, Fighting games & party games.' : 'Löydä peliseuraa ja tiimikavereita eri peleille (PC, PS5, Switch).'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2] mt-1.5 flex-shrink-0" />
              <span>{isEn ? 'Direct support and feedback channel with the gaming room administrators.' : 'Suora keskustelukanava ylläpidon ja opiskelijavastaavien kanssa.'}</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-[#252936]">
            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isEn ? 'Join Xamk Discord' : 'Liity Xamk Discordiin'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
