import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RulesAndGuideProps {
  onOpenFloorPlan: () => void;
}

export const RulesAndGuide: React.FC<RulesAndGuideProps> = ({ onOpenFloorPlan }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  return (
    <div className="rules-container">
      {/* Hero header */}
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
            onClick={onOpenFloorPlan}
          >
            {t('rules.openFloorPlan')}
          </Button>
          <Button asChild variant="pill">
            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{t('rules.joinDiscord')}</span>
              <span className="confirm-arrow" aria-hidden="true">→</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Sääntö- ja ohjekortit */}
      <div className="rules-grid">
        {/* 1. Yleiset säännöt */}
        <div className="rule-card">
          <div className="rule-card-header">
            <span className="rule-icon">📜</span>
            <div>
              <h3>{t('rules.generalTitle')}</h3>
              <span className="rule-badge">{t('rules.generalBadge')}</span>
            </div>
          </div>
          <ul className="rule-list">
            <li>
              <strong>🍕 {isEn ? 'No food at stations:' : 'Ei ruokailua koneilla:'}</strong>{' '}
              {isEn
                ? 'Eating at gaming stations is strictly prohibited. Only resealable drink bottles (with caps) are permitted on desks.'
                : 'Laitteiden äärellä syöminen on ehdottomasti kielletty. Ainoastaan suljettavat juomapullot (korkilla) ovat sallittuja pöydillä.'}
            </li>
            <li>
              <strong>🧹 {isEn ? 'Cleanliness & order:' : 'Siisteys & järjestys:'}</strong>{' '}
              {isEn
                ? 'Dispose of your trash in the bins immediately after your session. Push your chair neatly under the desk and return headphones to their stand.'
                : 'Vie omat roskat roskakoriin heti session jälkeen. Laita pelituoli siististi pöydän alle ja aseta kuulokkeet telineeseen.'}
            </li>
            <li>
              <strong>🎧 {isEn ? 'Audio & etiquette:' : 'Äänenvoimakkuus & käytöstavat:'}</strong>{' '}
              {isEn
                ? 'Always use headphones at PC stations. Respect peers playing and studying in the space — avoid disruptive shouting.'
                : 'Käytä aina kuulokkeita PC-pisteillä. Kunnioita tilassa opiskelevia ja pelaavia kanssatiimiläisiä — ei häiritsevää huutelua.'}
            </li>
            <li>
              <strong>⏰ {isEn ? 'Opening hours (08:00–18:00):' : 'Aukioloajat (klo 08:00–18:00):'}</strong>{' '}
              {isEn
                ? 'The room is open Mon–Fri 08:00–18:00. You must exit promptly by 18:00 when doors automatically lock.'
                : 'Tila on avoinna ma–pe klo 08:00–18:00. Tilasta on poistuttava viipymättä klo 18:00 mennessä, jolloin ovet lukittuvat.'}
            </li>
            <li>
              <strong>⏱️ {isEn ? 'Booking limits:' : 'Varausrajat:'}</strong>{' '}
              {isEn
                ? 'An individual student quota is maximum 4 hours per day. Remember to cancel your booking in the system before it starts if you cannot attend!'
                : 'Yksittäisen opiskelijan varauskiintiö on enintään 4 tuntia päivässä. Muista perua varauksesi järjestelmästä ennen sen alkamista, jos et pääsekään pelaamaan!'}
            </li>
          </ul>
        </div>

        {/* 2. PC & Steam-pelaaminen */}
        <div className="rule-card">
          <div className="rule-card-header">
            <span className="rule-icon">🖥️</span>
            <div>
              <h3>{t('rules.steamTitle')}</h3>
              <span className="rule-badge">{t('rules.steamBadge')}</span>
            </div>
          </div>
          <ul className="rule-list">
            <li>
              <strong>🎮 {isEn ? 'Pre-installed games:' : 'Asennetut pelit:'}</strong>{' '}
              {isEn
                ? 'PCs are preloaded with CS2, Valorant, Dota 2, Rocket League, and more. You can propose new titles in the Games & Wishlist tab.'
                : 'Koneilla on valmiiksi asennettuna mm. CS2, Valorant, Dota 2, Rocket League. Uusia pelejä voi ehdottaa Pelit & toivelista -välilehdellä.'}
            </li>
            <li>
              <strong>🔑 {isEn ? 'Personal accounts:' : 'Omat tilit:'}</strong>{' '}
              {isEn
                ? 'Gaming is conducted using your own student accounts (Steam, Riot Games, Epic Games, Battle.net).'
                : 'Pelaaminen tapahtuu aina opiskelijan omilla pelitunnuksilla (Steam, Riot Games, Epic Games, Battle.net).'}
            </li>
            <li>
              <strong className="text-warning">
                🔒 {isEn ? 'IMPORTANT — Always Sign Out:' : 'TÄRKEÄÄ — Kirjaudu aina ulos:'}
              </strong>{' '}
              {isEn
                ? 'Always remember to sign out of Steam and other game launchers before leaving the room! Never save your passwords in browsers on shared stations.'
                : 'Muista aina kirjautua ulos Steam- ja muilta pelitileiltäsi ennen kuin poistut tilasta! Älä koskaan tallenna salasanojasi koneiden selaimiin.'}
            </li>
            <li>
              <strong>⚙️ {isEn ? 'No tampering with settings:' : 'Ei asetusten peukalointia:'}</strong>{' '}
              {isEn
                ? 'Do not install malicious software, alter Windows system settings, or unplug hardware cables.'
                : 'Älä asenna haittaohjelmia, muuta Windowsin järjestelmäasetuksia tai irrota koneiden kaapeleita.'}
            </li>
            <li>
              <strong>🖱️ {isEn ? 'Personal peripherals:' : 'Omat oheislaitteet:'}</strong>{' '}
              {isEn
                ? 'You are welcome to use your own mouse, keyboard, or headset, provided you reconnect the room equipment back in place afterwards.'
                : 'Omien hiirien, näppäimistöjen tai kuulokkeiden käyttö on sallittua, kunhan kytket laitteiston omat osat takaisin paikoilleen session jälkeen.'}
            </li>
          </ul>
        </div>

        {/* 3. Konsolikaappi & SharedTV */}
        <div className="rule-card">
          <div className="rule-card-header">
            <span className="rule-icon">🎮</span>
            <div>
              <h3>{t('rules.consoleTitle')}</h3>
              <span className="rule-badge">{t('rules.consoleBadge')}</span>
            </div>
          </div>
          <ul className="rule-list">
            <li>
              <strong>📺 {isEn ? 'Shared TV Display:' : 'SharedTV-näyttö:'}</strong>{' '}
              {isEn
                ? 'PlayStation 5 and Nintendo Switch share the same large TV. Only one console can be in use at a time — the booking system automatically locks the other during active reservations.'
                : 'PlayStation 5 ja Nintendo Switch jakavat saman suuren television. Vain toinen konsoli voi olla käytössä kerrallaan — järjestelmä lukitsee toisen automaattisesti varauksen ajaksi.'}
            </li>
            <li>
              <strong>🗄️ {isEn ? 'Cabinet contents:' : 'Konsolikaapin sisältö:'}</strong>{' '}
              {isEn
                ? 'The cabinet houses the consoles, PS5 DualSense controllers, Switch Pro Controllers, and Joy-Cons with charging docks.'
                : 'Kaapista löytyvät konsolit, PS5 DualSense -ohjaimet, Switch Pro Controllerit sekä Joy-Conit lataustelakoineen.'}
            </li>
            <li>
              <strong>🔋 {isEn ? 'Charging controllers:' : 'Ohjainten lataus:'}</strong>{' '}
              {isEn
                ? 'Return controllers to the charging stands immediately after use so the next gamer has full battery!'
                : 'Palauta ohjaimet lataustelineisiin aina heti käytön jälkeen, jotta seuraavalla pelaajalla on akut täynnä!'}
            </li>
            <li>
              <strong>🔌 {isEn ? 'Powering down:' : 'Laitteiden sammutus:'}</strong>{' '}
              {isEn
                ? 'Turn off or put console in Rest Mode from the controller and turn off the TV with the remote. Return remote to its cradle.'
                : 'Sammuta konsoli ohjaimesta ("Sammuta konsoli" tai "Lepotila") ja sulje TV kaukosäätimestä. Palauta kaukosäädin konsolitason telineeseen.'}
            </li>
            <li>
              <strong>🤝 {isEn ? 'Whole room booking (max 4h):' : 'Koko tilan varaus (max 4h):'}</strong>{' '}
              {isEn
                ? 'A single student can reserve the whole room (e.g. for a console tournament). Booker details are displayed publicly so others can ask if they can join.'
                : 'Yksittäinenkin opiskelija voi varata koko tilan (esim. konsoliturnaukseen). Varaajan yhteystiedot näkyvät julkisesti, jotta muut voivat tarvittaessa kysyä mahtuuko mukaan.'}
            </li>
          </ul>
        </div>

        {/* 4. Discord & Yhteisö */}
        <div className="rule-card discord-highlight-card">
          <div className="rule-card-header">
            <span className="rule-icon">💬</span>
            <div>
              <h3>{t('rules.discordTitle')}</h3>
              <span className="rule-badge">{t('rules.discordBadge')}</span>
            </div>
          </div>
          <p className="discord-card-desc">
            {isEn
              ? 'Looking for teammates for CS2, organizing a Smash tournament, or suggesting new titles for the gaming room? Join our official Discord server!'
              : 'Etsitkö tiimikavereita CS2-matsiin, haluatko sopia Smash-turnauksesta tai ehdottaa uutta peliä tilan valikoimaan? Liity viralliselle Discord-palvelimellemme!'}
          </p>
          <ul className="rule-list">
            <li>
              {isEn
                ? '📢 Announcements on upcoming LAN events and student tournaments.'
                : '📢 Tiedotteet tulevista LAN-tapahtumista ja opiskelijaturnauksista.'}
            </li>
            <li>
              {isEn
                ? '👥 LFG player matchmaking across games (PC, PS5, Switch).'
                : '👥 Peliseuranhaku eri peleille (PC, PS5, Switch).'}
            </li>
            <li>
              {isEn
                ? '💡 Direct communication channel with admins and teachers.'
                : '💡 Suora keskustelukanava ylläpidon ja opettajien kanssa.'}
            </li>
          </ul>
          <div className="discord-action-area">
            <Button asChild variant="pill">
              <a
                href="https://discord.gg/xamk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{isEn ? '🚀 Join Discord Now' : '🚀 Liity Discordiin nyt'}</span>
                <span className="confirm-arrow" aria-hidden="true">→</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Visuaalinen katsaus tilasta (Kuvapaikat & visualisointi) */}
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
            onClick={onOpenFloorPlan}
          >
            {t('rules.openFloorPlan')}
          </Button>
        </div>

        <div className="photo-preview-grid">
          {/* Kortti 1: 6 PC-pelipistettä */}
          <div className="photo-card">
            <div className="photo-placeholder pc-zone-photo">
              <span className="photo-badge">{isEn ? 'PC ZONE' : 'PC-ALUE'}</span>
              <div className="photo-illustration">
                <span className="big-icon">🖥️</span>
                <span className="photo-caption-title">PC 1 – PC 6</span>
                <span className="photo-caption-sub">
                  {isEn ? '6x 240Hz gaming PCs, mechanical keyboards' : '6 kpl 240Hz pelikoneita, mekaaniset näppäimistöt'}
                </span>
              </div>
            </div>
            <div className="photo-card-info">
              <h4>{isEn ? '🖥️ PC Stations (PCs 1–6)' : '🖥️ PC-pisteet (Koneet 1–6)'}</h4>
              <p>
                {isEn
                  ? 'A row of high-performance gaming computers with ergonomic chairs. Pre-installed with top competitive titles.'
                  : 'Rivistö tehokkaita pelitietokoneita ergonomisilla pelituoleilla. Asennettuina tärkeimmät kilpapelit.'}
              </p>
            </div>
          </div>

          {/* Kortti 2: Konsolialue & SharedTV */}
          <div className="photo-card">
            <div className="photo-placeholder tv-zone-photo">
              <span className="photo-badge">SHARED TV</span>
              <div className="photo-illustration">
                <span className="big-icon">📺</span>
                <span className="photo-caption-title">65" 4K 120Hz {isEn ? 'Display' : 'Näyttö'}</span>
                <span className="photo-caption-sub">PlayStation 5 & Nintendo Switch</span>
              </div>
            </div>
            <div className="photo-card-info">
              <h4>{isEn ? '📺 Console Lounge & Shared TV' : '📺 Konsolinurkkaus & SharedTV'}</h4>
              <p>
                {isEn
                  ? 'Comfortable sofa lounge and a 65-inch 4K OLED gaming television with low latency and HDR.'
                  : 'Mukava sohva-alue ja 65 tuuman 4K OLED -pelitelevisio matalalla viiveellä ja HDR-tuella.'}
              </p>
            </div>
          </div>

          {/* Kortti 3: Konsolikaappi */}
          <div className="photo-card">
            <div className="photo-placeholder cabinet-zone-photo">
              <span className="photo-badge">{isEn ? 'CONSOLE CABINET' : 'KONSOLIKAAPPI'}</span>
              <div className="photo-illustration">
                <span className="big-icon">🗄️</span>
                <span className="photo-caption-title">
                  {isEn ? 'Docks & Controllers' : 'Lataustelineet & Ohjaimet'}
                </span>
                <span className="photo-caption-sub">
                  {isEn ? 'PS5 DualSense & Switch Pro Controllers' : 'PS5 DualSense & Switch Pro -ohjaimet'}
                </span>
              </div>
            </div>
            <div className="photo-card-info">
              <h4>{isEn ? '🗄️ Console Cabinet & Gear' : '🗄️ Konsolikaappi & Tarvikkeet'}</h4>
              <p>
                {isEn
                  ? 'Lockable cabinet holding controllers, docks, and physical games. Always return controllers to charge!'
                  : 'Lukittava konsolikaappi sisältää ohjaimet, lataustelakat ja pelikotelot. Palauta aina ohjaimet lataukseen!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
