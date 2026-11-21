/**
 * @file RulesAndGuide.tsx
 * @description Pelitilan säännöt, laiteohjeet ja visuaalinen tilakatsaus.
 * Esittää yleiset käyttösäännöt, PC-koneiden ja Steamin ohjeet, konsolikaapin ja
 * yhteisen 4K-TV:n (SharedTV) toimintaperiaatteet sekä linkit Discord-yhteisöön.
 */
import React from 'react';
import {
  BookOpen,
  Monitor,
  Gamepad2,
  Tv,
  Map,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiscordIcon } from '@/components/ui/discord-icon';

/**
 * RulesAndGuide-komponentin ominaisuudet (props).
 */
interface RulesAndGuideProps {
  /** Funktio pohjakuvamodaalin avaamiseen */
  onOpenFloorPlan: () => void;
}

/**
 * Pelitilan säännöt ja ohjeet -näkymäkomponentti.
 */
export const RulesAndGuide: React.FC<RulesAndGuideProps> = ({ onOpenFloorPlan }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  return (
    <div className="space-y-8 text-[#F4F4F5]">
      {/* Hero header */}
      {/* Yläosan otsikkoalue ja pikatoiminnot */}
      <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <Badge variant="status" className="mb-2">XAMK GAME ROOM</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('rules.title')}</h1>
          <p className="text-sm sm:text-base text-[#A1A1AA]">
            {t('rules.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-1.5"
            onClick={onOpenFloorPlan}
          >
            <Map className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>{t('rules.openFloorPlan')}</span>
          </Button>
          <Button asChild variant="pill">
            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordIcon className="w-4 h-4 shrink-0" />
              <span>{t('rules.joinDiscord')}</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Sääntö- ja ohjekortit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Yleiset säännöt */}
        <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 pb-3 border-b border-[#3F444E]">
            <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black" aria-hidden="true">
              <BookOpen className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('rules.generalTitle')}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono font-bold uppercase bg-[#121417] text-[#FACC15] border border-[#3F444E] rounded-none">{t('rules.generalBadge')}</span>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-[#D4D4D8] list-disc pl-5 marker:text-[#FACC15]">
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'No food at stations.' : 'Ei ruokailua koneilla.'}</strong>{' '}
              {isEn
                ? 'Eating at gaming stations is prohibited. Only resealable drink bottles with caps are permitted on desks.'
                : 'Laitteiden äärellä syöminen on kielletty. Vain suljettavat korkilliset juomapullot ovat sallittuja pöydillä.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Cleanliness and order.' : 'Siisteys ja järjestys.'}</strong>{' '}
              {isEn
                ? 'Put your trash in the bins immediately after your session. Push your chair under the desk and return headphones to their stand.'
                : 'Vie omat roskat roskakoriin heti vuoron jälkeen. Työnnä pelituoli pöydän alle ja aseta kuulokkeet telineeseen.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Audio and etiquette.' : 'Äänenvoimakkuus ja käytöstavat.'}</strong>{' '}
              {isEn
                ? 'Always use headphones at PC stations. Respect other students playing and working in the room, and avoid shouting.'
                : 'Käytä aina kuulokkeita PC-pisteillä. Huomioi muut pelaajat ja vältä häiritsevää huutelua.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Opening hours 08:00-18:00.' : 'Aukioloajat klo 08:00-18:00.'}</strong>{' '}
              {isEn
                ? 'The room is open Mon-Fri 08:00-18:00. Leave the room by 18:00 when the doors lock.'
                : 'Tila on avoinna ma-pe klo 08:00-18:00. Poistu tilasta viimeistään klo 18:00, jolloin ovet lukittuvat.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Booking limits.' : 'Varausrajat.'}</strong>{' '}
              {isEn
                ? 'The student quota is up to 4 hours per day. Cancel your booking in the system before it starts if you cannot attend.'
                : 'Yksittäisen opiskelijan varauskiintiö on enintään 4 tuntia päivässä. Peru varauksesi järjestelmästä ennen sen alkamista, jos et pääse paikalle.'}
            </li>
          </ul>
        </div>

        {/* 2. PC ja Steam-pelaaminen */}
        <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 pb-3 border-b border-[#3F444E]">
            <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black" aria-hidden="true">
              <Monitor className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('rules.steamTitle')}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono font-bold uppercase bg-[#121417] text-[#FACC15] border border-[#3F444E] rounded-none">{t('rules.steamBadge')}</span>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-[#D4D4D8] list-disc pl-5 marker:text-[#FACC15]">
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Pre-installed games.' : 'Asennetut pelit.'}</strong>{' '}
              {isEn
                ? 'PCs have CS2, Valorant, Dota 2, Rocket League, and other titles installed. You can propose new titles on the Games and wishlist tab.'
                : 'Koneilla on valmiiksi asennettuna esimerkiksi CS2, Valorant, Dota 2 ja Rocket League. Uusia pelejä voi ehdottaa Pelit ja toivelista -välilehdellä.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Personal accounts.' : 'Omat tilit.'}</strong>{' '}
              {isEn
                ? 'Sign in with your own accounts on Steam, Riot Games, Epic Games, and Battle.net.'
                : 'Pelaa omilla Steam-, Riot Games-, Epic Games- ja Battle.net-pelitunnuksillasi.'}
            </li>
            <li>
              <strong className="text-[#EF4444] font-bold">
                {isEn ? 'Always sign out.' : 'Kirjaudu aina ulos.'}
              </strong>{' '}
              {isEn
                ? 'Sign out of Steam and other game launchers before leaving the room. Do not save passwords in browsers on shared stations.'
                : 'Kirjaudu ulos Steam- ja muilta pelitileiltäsi ennen kuin poistut tilasta. Älä tallenna salasanojasi yhteiskäyttökoneiden selaimiin.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'System settings and cables.' : 'Järjestelmäasetukset ja kaapelit.'}</strong>{' '}
              {isEn
                ? 'Do not install unauthorized software, change Windows system settings, or unplug hardware cables.'
                : 'Älä asenna luvattomia ohjelmia, muuta Windowsin järjestelmäasetuksia tai irrota koneiden kaapeleita.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Personal peripherals.' : 'Omat oheislaitteet.'}</strong>{' '}
              {isEn
                ? 'You may use your own mouse, keyboard, or headset if you reconnect the room equipment afterwards.'
                : 'Voit käyttää omaa hiirtä, näppäimistöä tai kuulokkeita, kun kytket tilan omat laitteet takaisin paikoilleen vuoron jälkeen.'}
            </li>
          </ul>
        </div>

        {/* 3. Konsolikaappi ja yhteinen TV */}
        <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 pb-3 border-b border-[#3F444E]">
            <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black" aria-hidden="true">
              <Gamepad2 className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('rules.consoleTitle')}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono font-bold uppercase bg-[#121417] text-[#FACC15] border border-[#3F444E] rounded-none">{t('rules.consoleBadge')}</span>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-[#D4D4D8] list-disc pl-5 marker:text-[#FACC15]">
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Shared TV display.' : 'Yhteinen TV-näyttö.'}</strong>{' '}
              {isEn
                ? 'PlayStation 5 and Nintendo Switch share the same 4K TV. Only one console can be in use at a time, and the booking system locks the other console during active reservations.'
                : 'PlayStation 5 ja Nintendo Switch jakavat saman 4K-television. Vain toinen konsoli voi olla käytössä kerrallaan, ja varausjärjestelmä lukitsee toisen konsolin varauksen ajaksi.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Cabinet contents.' : 'Konsolikaapin sisältö.'}</strong>{' '}
              {isEn
                ? 'The cabinet holds the consoles, PS5 DualSense controllers, Switch Pro Controllers, and Joy-Cons with charging docks.'
                : 'Kaapissa ovat konsolit, PS5 DualSense -ohjaimet, Switch Pro -ohjaimet sekä Joy-Con-ohjaimet lataustelakoineen.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Charging controllers.' : 'Ohjainten lataus.'}</strong>{' '}
              {isEn
                ? 'Return controllers to the charging docks immediately after use so the batteries are charged for the next player.'
                : 'Palauta ohjaimet lataustelineisiin heti käytön jälkeen, jotta akut latautuvat seuraavalle pelaajalle.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Powering down.' : 'Laitteiden sammutus.'}</strong>{' '}
              {isEn
                ? 'Turn off the console or set it to rest mode from the controller, and turn off the TV with the remote. Return the remote to its stand.'
                : 'Sammuta konsoli tai aseta se lepotilaan ohjaimesta, ja sulje TV kaukosäätimestä. Palauta kaukosäädin konsolitason telineeseen.'}
            </li>
            <li>
              <strong className="text-[#F4F4F5]">{isEn ? 'Whole room booking, up to 4 hours.' : 'Koko tilan varaus, enintään 4 h.'}</strong>{' '}
              {isEn
                ? 'A student may reserve the whole room, for example for a console tournament. Booker contact details are shown on the status board so other students can ask to join.'
                : 'Opiskelija voi varata koko tilan esimerkiksi konsoliturnaukseen. Varaajan yhteystiedot näkyvät tilannetaulussa, jotta muut voivat kysyä lupaa liittyä mukaan.'}
            </li>
          </ul>
        </div>

        {/* 4. Discord ja yhteisö */}
        <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3B82F6] shadow-[4px_4px_0px_#3B82F6] p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 pb-3 border-b border-[#3F444E]">
            <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-none bg-[#3B82F6] text-white border-2 border-black" aria-hidden="true">
              <DiscordIcon className="w-5 h-5 shrink-0" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('rules.discordTitle')}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono font-bold uppercase bg-[#121417] text-[#3B82F6] border border-[#3B82F6] rounded-none">{t('rules.discordBadge')}</span>
            </div>
          </div>
          <p className="text-sm text-[#D4D4D8]">
            {isEn
              ? 'Find teammates for CS2, arrange a Smash tournament, or discuss new games on the Xamk Gaming Discord server.'
              : 'Etsi peliseuraa CS2-otteluun, sovi Smash-turnauksesta tai keskustele uusista peleistä Xamk Gaming Discord -palvelimella.'}
          </p>
          <ul className="space-y-3 text-sm text-[#D4D4D8] list-disc pl-5 marker:text-[#3B82F6]">
            <li>
              {isEn
                ? 'Announcements on upcoming LAN events and student tournaments.'
                : 'Tiedotteet tulevista LAN-tapahtumista ja opiskelijaturnauksista.'}
            </li>
            <li>
              {isEn
                ? 'Player matchmaking across PC, PS5, and Switch games.'
                : 'Peliseuranhaku PC-, PS5- ja Switch-peleihin.'}
            </li>
            <li>
              {isEn
                ? 'Direct contact channel with student administrators and staff.'
                : 'Suora keskustelukanava ylläpidon ja henkilökunnan kanssa.'}
            </li>
          </ul>
          <div className="pt-2 mt-auto">
            <Button asChild variant="pill">
              <a
                href="https://discord.gg/xamk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Join Discord' : 'Liity Discordiin'}</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Visuaalinen katsaus tilasta */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#3F444E] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('rules.visualOverviewTitle')}</h2>
            <p className="text-sm text-[#A1A1AA] mt-1">
              {t('rules.visualOverviewSub')}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-1.5"
            onClick={onOpenFloorPlan}
          >
            <Map className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>{t('rules.openFloorPlan')}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kortti 1: 6 PC-pelipistettä */}
          <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] flex flex-col overflow-hidden">
            <div className="relative p-6 bg-[#121417] border-b border-[#3F444E] flex flex-col items-center justify-center text-center min-h-[180px]">
              <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-mono font-bold uppercase rounded-none bg-[#FACC15] text-[#09090B] border border-black">{isEn ? 'PC ZONE' : 'PC-ALUE'}</span>
              <div className="flex flex-col items-center gap-2 mt-4">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-[#1C1F24] text-[#FACC15] border-2 border-[#3F444E]" aria-hidden="true">
                  <Monitor className="w-8 h-8 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="font-mono font-bold text-base text-[#F4F4F5]">PC 1-PC 6</span>
                <span className="text-xs font-mono text-[#A1A1AA]">
                  {isEn ? '6x 240Hz gaming PCs, mechanical keyboards' : '6 kpl 240 Hz pelikoneita, mekaaniset näppäimistöt'}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="text-base font-extrabold uppercase tracking-tight text-[#F4F4F5]">{isEn ? 'PC stations, PC 1-PC 6' : 'PC-pisteet, PC 1-PC 6'}</h4>
              <p className="text-sm text-[#D4D4D8]">
                {isEn
                  ? 'Six gaming computers with 240 Hz monitors and adjustable chairs.'
                  : 'Kuusi pelitietokonetta 240 Hz näytöillä ja säädettävillä pelituoleilla.'}
              </p>
            </div>
          </div>

          {/* Kortti 2: Konsolialue ja yhteinen TV */}
          <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] flex flex-col overflow-hidden">
            <div className="relative p-6 bg-[#121417] border-b border-[#3F444E] flex flex-col items-center justify-center text-center min-h-[180px]">
              <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-mono font-bold uppercase rounded-none bg-[#3B82F6] text-white border border-black">SHARED TV</span>
              <div className="flex flex-col items-center gap-2 mt-4">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-[#1C1F24] text-[#3B82F6] border-2 border-[#3F444E]" aria-hidden="true">
                  <Tv className="w-8 h-8 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="font-mono font-bold text-base text-[#F4F4F5]">65" 4K 120 Hz {isEn ? 'Display' : 'Näyttö'}</span>
                <span className="text-xs font-mono text-[#A1A1AA]">PlayStation 5 ja Nintendo Switch</span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="text-base font-extrabold uppercase tracking-tight text-[#F4F4F5]">{isEn ? 'Console lounge and shared TV' : 'Konsolinurkkaus ja yhteinen TV'}</h4>
              <p className="text-sm text-[#D4D4D8]">
                {isEn
                  ? 'Sofa group and a 65-inch 4K OLED television connected to both consoles.'
                  : 'Sohvaryhmä ja 65 tuuman 4K OLED -televisio, johon molemmat konsolit on kytketty.'}
              </p>
            </div>
          </div>

          {/* Kortti 3: Konsolikaappi */}
          <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] shadow-[4px_4px_0px_#000000] flex flex-col overflow-hidden">
            <div className="relative p-6 bg-[#121417] border-b border-[#3F444E] flex flex-col items-center justify-center text-center min-h-[180px]">
              <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-mono font-bold uppercase rounded-none bg-[#22C55E] text-[#09090B] border border-black">{isEn ? 'CONSOLE CABINET' : 'KONSOLIKAAPPI'}</span>
              <div className="flex flex-col items-center gap-2 mt-4">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-[#1C1F24] text-[#22C55E] border-2 border-[#3F444E]" aria-hidden="true">
                  <Gamepad2 className="w-8 h-8 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="font-mono font-bold text-base text-[#F4F4F5]">
                  {isEn ? 'Docks and controllers' : 'Lataustelineet ja ohjaimet'}
                </span>
                <span className="text-xs font-mono text-[#A1A1AA]">
                  {isEn ? 'PS5 DualSense and Switch Pro Controllers' : 'PS5 DualSense- ja Switch Pro -ohjaimet'}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="text-base font-extrabold uppercase tracking-tight text-[#F4F4F5]">{isEn ? 'Console cabinet and gear' : 'Konsolikaappi ja tarvikkeet'}</h4>
              <p className="text-sm text-[#D4D4D8]">
                {isEn
                  ? 'Cabinet holding controllers, charging docks, and game cases. Return controllers to the docks after use.'
                  : 'Konsolikaapissa säilytetään ohjaimet, lataustelakat ja pelikotelot. Palauta ohjaimet lataukseen käytön jälkeen.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
