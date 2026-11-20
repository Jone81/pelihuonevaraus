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
  MessageSquare,
  Tv,
  Map,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <div className="rules-container">
      {/* Hero header */}
      {/* Yläosan otsikkoalue ja pikatoiminnot */}
      <div className="rules-hero">
        <div className="rules-hero-content">
          <Badge variant="status" className="mb-2">XAMK GAME ROOM</Badge>
          <h1>{t('rules.title')}</h1>
          <p className="rules-subtitle">
            {t('rules.subtitle')}
          </p>
        </div>
        <div className="rules-hero-actions">
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-1.5"
            onClick={onOpenFloorPlan}
          >
            <Map className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t('rules.openFloorPlan')}</span>
          </Button>
          <Button asChild variant="pill">
            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{t('rules.joinDiscord')}</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Sääntö- ja ohjekortit */}
      <div className="rules-grid">
        {/* 1. Yleiset säännöt */}
        <div className="rule-card">
          <div className="rule-card-header">
            <span className="rule-icon" aria-hidden="true">
              <BookOpen className="w-5 h-5 shrink-0" aria-hidden="true" />
            </span>
            <div>
              <h3>{t('rules.generalTitle')}</h3>
              <span className="rule-badge">{t('rules.generalBadge')}</span>
            </div>
          </div>
          <ul className="rule-list">
            <li>
              <strong>{isEn ? 'No food at stations.' : 'Ei ruokailua koneilla.'}</strong>{' '}
              {isEn
                ? 'Eating at gaming stations is prohibited. Only resealable drink bottles with caps are permitted on desks.'
                : 'Laitteiden äärellä syöminen on kielletty. Vain suljettavat korkilliset juomapullot ovat sallittuja pöydillä.'}
            </li>
            <li>
              <strong>{isEn ? 'Cleanliness and order.' : 'Siisteys ja järjestys.'}</strong>{' '}
              {isEn
                ? 'Put your trash in the bins immediately after your session. Push your chair under the desk and return headphones to their stand.'
                : 'Vie omat roskat roskakoriin heti vuoron jälkeen. Työnnä pelituoli pöydän alle ja aseta kuulokkeet telineeseen.'}
            </li>
            <li>
              <strong>{isEn ? 'Audio and etiquette.' : 'Äänenvoimakkuus ja käytöstavat.'}</strong>{' '}
              {isEn
                ? 'Always use headphones at PC stations. Respect other students playing and working in the room, and avoid shouting.'
                : 'Käytä aina kuulokkeita PC-pisteillä. Huomioi muut pelaajat ja vältä häiritsevää huutelua.'}
            </li>
            <li>
              <strong>{isEn ? 'Opening hours 08:00-18:00.' : 'Aukioloajat klo 08:00-18:00.'}</strong>{' '}
              {isEn
                ? 'The room is open Mon-Fri 08:00-18:00. Leave the room by 18:00 when the doors lock.'
                : 'Tila on avoinna ma-pe klo 08:00-18:00. Poistu tilasta viimeistään klo 18:00, jolloin ovet lukittuvat.'}
            </li>
            <li>
              <strong>{isEn ? 'Booking limits.' : 'Varausrajat.'}</strong>{' '}
              {isEn
                ? 'The student quota is up to 4 hours per day. Cancel your booking in the system before it starts if you cannot attend.'
                : 'Yksittäisen opiskelijan varauskiintiö on enintään 4 tuntia päivässä. Peru varauksesi järjestelmästä ennen sen alkamista, jos et pääse paikalle.'}
            </li>
          </ul>
        </div>

        {/* 2. PC ja Steam-pelaaminen */}
        <div className="rule-card">
          <div className="rule-card-header">
            <span className="rule-icon" aria-hidden="true">
              <Monitor className="w-5 h-5 shrink-0" aria-hidden="true" />
            </span>
            <div>
              <h3>{t('rules.steamTitle')}</h3>
              <span className="rule-badge">{t('rules.steamBadge')}</span>
            </div>
          </div>
          <ul className="rule-list">
            <li>
              <strong>{isEn ? 'Pre-installed games.' : 'Asennetut pelit.'}</strong>{' '}
              {isEn
                ? 'PCs have CS2, Valorant, Dota 2, Rocket League, and other titles installed. You can propose new titles on the Games and wishlist tab.'
                : 'Koneilla on valmiiksi asennettuna esimerkiksi CS2, Valorant, Dota 2 ja Rocket League. Uusia pelejä voi ehdottaa Pelit ja toivelista -välilehdellä.'}
            </li>
            <li>
              <strong>{isEn ? 'Personal accounts.' : 'Omat tilit.'}</strong>{' '}
              {isEn
                ? 'Sign in with your own accounts on Steam, Riot Games, Epic Games, and Battle.net.'
                : 'Pelaa omilla Steam-, Riot Games-, Epic Games- ja Battle.net-pelitunnuksillasi.'}
            </li>
            <li>
              <strong className="text-warning">
                {isEn ? 'Always sign out.' : 'Kirjaudu aina ulos.'}
              </strong>{' '}
              {isEn
                ? 'Sign out of Steam and other game launchers before leaving the room. Do not save passwords in browsers on shared stations.'
                : 'Kirjaudu ulos Steam- ja muilta pelitileiltäsi ennen kuin poistut tilasta. Älä tallenna salasanojasi yhteiskäyttökoneiden selaimiin.'}
            </li>
            <li>
              <strong>{isEn ? 'System settings and cables.' : 'Järjestelmäasetukset ja kaapelit.'}</strong>{' '}
              {isEn
                ? 'Do not install unauthorized software, change Windows system settings, or unplug hardware cables.'
                : 'Älä asenna luvattomia ohjelmia, muuta Windowsin järjestelmäasetuksia tai irrota koneiden kaapeleita.'}
            </li>
            <li>
              <strong>{isEn ? 'Personal peripherals.' : 'Omat oheislaitteet.'}</strong>{' '}
              {isEn
                ? 'You may use your own mouse, keyboard, or headset if you reconnect the room equipment afterwards.'
                : 'Voit käyttää omaa hiirtä, näppäimistöä tai kuulokkeita, kun kytket tilan omat laitteet takaisin paikoilleen vuoron jälkeen.'}
            </li>
          </ul>
        </div>

        {/* 3. Konsolikaappi ja yhteinen TV */}
        <div className="rule-card">
          <div className="rule-card-header">
            <span className="rule-icon" aria-hidden="true">
              <Gamepad2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            </span>
            <div>
              <h3>{t('rules.consoleTitle')}</h3>
              <span className="rule-badge">{t('rules.consoleBadge')}</span>
            </div>
          </div>
          <ul className="rule-list">
            <li>
              <strong>{isEn ? 'Shared TV display.' : 'Yhteinen TV-näyttö.'}</strong>{' '}
              {isEn
                ? 'PlayStation 5 and Nintendo Switch share the same 4K TV. Only one console can be in use at a time, and the booking system locks the other console during active reservations.'
                : 'PlayStation 5 ja Nintendo Switch jakavat saman 4K-television. Vain toinen konsoli voi olla käytössä kerrallaan, ja varausjärjestelmä lukitsee toisen konsolin varauksen ajaksi.'}
            </li>
            <li>
              <strong>{isEn ? 'Cabinet contents.' : 'Konsolikaapin sisältö.'}</strong>{' '}
              {isEn
                ? 'The cabinet holds the consoles, PS5 DualSense controllers, Switch Pro Controllers, and Joy-Cons with charging docks.'
                : 'Kaapissa ovat konsolit, PS5 DualSense -ohjaimet, Switch Pro -ohjaimet sekä Joy-Con-ohjaimet lataustelakoineen.'}
            </li>
            <li>
              <strong>{isEn ? 'Charging controllers.' : 'Ohjainten lataus.'}</strong>{' '}
              {isEn
                ? 'Return controllers to the charging docks immediately after use so the batteries are charged for the next player.'
                : 'Palauta ohjaimet lataustelineisiin heti käytön jälkeen, jotta akut latautuvat seuraavalle pelaajalle.'}
            </li>
            <li>
              <strong>{isEn ? 'Powering down.' : 'Laitteiden sammutus.'}</strong>{' '}
              {isEn
                ? 'Turn off the console or set it to rest mode from the controller, and turn off the TV with the remote. Return the remote to its stand.'
                : 'Sammuta konsoli tai aseta se lepotilaan ohjaimesta, ja sulje TV kaukosäätimestä. Palauta kaukosäädin konsolitason telineeseen.'}
            </li>
            <li>
              <strong>{isEn ? 'Whole room booking, up to 4 hours.' : 'Koko tilan varaus, enintään 4 h.'}</strong>{' '}
              {isEn
                ? 'A student may reserve the whole room, for example for a console tournament. Booker contact details are shown on the status board so other students can ask to join.'
                : 'Opiskelija voi varata koko tilan esimerkiksi konsoliturnaukseen. Varaajan yhteystiedot näkyvät tilannetaulussa, jotta muut voivat kysyä lupaa liittyä mukaan.'}
            </li>
          </ul>
        </div>

        {/* 4. Discord ja yhteisö */}
        <div className="rule-card discord-highlight-card">
          <div className="rule-card-header">
            <span className="rule-icon" aria-hidden="true">
              <MessageSquare className="w-5 h-5 shrink-0" aria-hidden="true" />
            </span>
            <div>
              <h3>{t('rules.discordTitle')}</h3>
              <span className="rule-badge">{t('rules.discordBadge')}</span>
            </div>
          </div>
          <p className="discord-card-desc">
            {isEn
              ? 'Find teammates for CS2, arrange a Smash tournament, or discuss new games on the Xamk Gaming Discord server.'
              : 'Etsi peliseuraa CS2-otteluun, sovi Smash-turnauksesta tai keskustele uusista peleistä Xamk Gaming Discord -palvelimella.'}
          </p>
          <ul className="rule-list">
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
          <div className="discord-action-area">
            <Button asChild variant="pill">
              <a
                href="https://discord.gg/xamk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{isEn ? 'Join Discord' : 'Liity Discordiin'}</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Visuaalinen katsaus tilasta */}
      <div className="visual-overview-section">
        <div className="section-header">
          <div>
            <h2>{t('rules.visualOverviewTitle')}</h2>
            <p className="section-description">
              {t('rules.visualOverviewSub')}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-1.5"
            onClick={onOpenFloorPlan}
          >
            <Map className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t('rules.openFloorPlan')}</span>
          </Button>
        </div>

        <div className="photo-preview-grid">
          {/* Kortti 1: 6 PC-pelipistettä */}
          <div className="photo-card">
            <div className="photo-placeholder pc-zone-photo">
              <span className="photo-badge">{isEn ? 'PC ZONE' : 'PC-ALUE'}</span>
              <div className="photo-illustration">
                <span className="big-icon" aria-hidden="true">
                  <Monitor className="w-8 h-8 shrink-0" aria-hidden="true" />
                </span>
                <span className="photo-caption-title">PC 1-PC 6</span>
                <span className="photo-caption-sub">
                  {isEn ? '6x 240Hz gaming PCs, mechanical keyboards' : '6 kpl 240 Hz pelikoneita, mekaaniset näppäimistöt'}
                </span>
              </div>
            </div>
            <div className="photo-card-info">
              <h4>{isEn ? 'PC stations, PC 1-PC 6' : 'PC-pisteet, PC 1-PC 6'}</h4>
              <p>
                {isEn
                  ? 'Six gaming computers with 240 Hz monitors and adjustable chairs.'
                  : 'Kuusi pelitietokonetta 240 Hz näytöillä ja säädettävillä pelituoleilla.'}
              </p>
            </div>
          </div>

          {/* Kortti 2: Konsolialue ja yhteinen TV */}
          <div className="photo-card">
            <div className="photo-placeholder tv-zone-photo">
              <span className="photo-badge">SHARED TV</span>
              <div className="photo-illustration">
                <span className="big-icon" aria-hidden="true">
                  <Tv className="w-8 h-8 shrink-0" aria-hidden="true" />
                </span>
                <span className="photo-caption-title">65" 4K 120 Hz {isEn ? 'Display' : 'Näyttö'}</span>
                <span className="photo-caption-sub">PlayStation 5 ja Nintendo Switch</span>
              </div>
            </div>
            <div className="photo-card-info">
              <h4>{isEn ? 'Console lounge and shared TV' : 'Konsolinurkkaus ja yhteinen TV'}</h4>
              <p>
                {isEn
                  ? 'Sofa group and a 65-inch 4K OLED television connected to both consoles.'
                  : 'Sohvaryhmä ja 65 tuuman 4K OLED -televisio, johon molemmat konsolit on kytketty.'}
              </p>
            </div>
          </div>

          {/* Kortti 3: Konsolikaappi */}
          <div className="photo-card">
            <div className="photo-placeholder cabinet-zone-photo">
              <span className="photo-badge">{isEn ? 'CONSOLE CABINET' : 'KONSOLIKAAPPI'}</span>
              <div className="photo-illustration">
                <span className="big-icon" aria-hidden="true">
                  <Gamepad2 className="w-8 h-8 shrink-0" aria-hidden="true" />
                </span>
                <span className="photo-caption-title">
                  {isEn ? 'Docks and controllers' : 'Lataustelineet ja ohjaimet'}
                </span>
                <span className="photo-caption-sub">
                  {isEn ? 'PS5 DualSense and Switch Pro Controllers' : 'PS5 DualSense- ja Switch Pro -ohjaimet'}
                </span>
              </div>
            </div>
            <div className="photo-card-info">
              <h4>{isEn ? 'Console cabinet and gear' : 'Konsolikaappi ja tarvikkeet'}</h4>
              <p>
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
