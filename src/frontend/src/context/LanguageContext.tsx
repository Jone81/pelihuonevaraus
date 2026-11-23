/**
 * @file LanguageContext.tsx
 * @description Sovelluksen kaksikielisyydestä (suomi `fi` ja englanti `en`) vastaava konteksti.
 * Sisältää käännössanakirjan, kielivalinnan tallennuksen `localStorage`-muistiin sekä
 * `t`-käännösfunktion tekstien hakemiseen avaimen perusteella.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

/** Tuetut käyttöliittymäkielet: suomi ('fi') ja englanti ('en') */
export type Language = 'fi' | 'en';

/**
 * Kielikontekstin tarjoama rajapinta komponenteille.
 */
interface LanguageContextType {
  /** Aktiivinen kielikoodi ('fi' tai 'en') */
  lang: Language;
  /** Funktio käyttöliittymäkielen vaihtamiseen */
  setLang: (lang: Language) => void;
  /** Käännösfunktio, joka palauttaa avainta vastaavan tekstin valitulla kielellä */
  t: (key: string) => string;
}

/**
 * Käännössanakirja suomen- ja englanninkielisille käyttöliittymäteksteille.
 */
const translations: Record<Language, Record<string, string>> = {
  fi: {
    // Common / Generic
    'common.cancel': 'Peruuta',
    'common.back': 'Takaisin',
    'common.loading': 'Ladataan...',
    'common.submitting': 'Lähetetään...',
    'common.verifying': 'Tarkistetaan...',
    'common.close': 'Sulje',
    'common.all': 'Kaikki',
    'common.actions': 'Toiminnot',
    'common.save': 'Tallenna',

    // Nav
    'nav.title': 'Pelihuonevaraus',
    'nav.subtitle': 'XAMK GAME ROOM',
    'nav.book': 'Varaa laite',
    'nav.status': 'Tilan tilanne',
    'nav.games': 'Pelit ja toivelista',
    'nav.rules': 'Säännöt ja ohjeet',
    'nav.floorplan': 'Tilan pohjakuva',
    'nav.myBookings': 'Omat varaukset',
    'nav.admin': 'Admin-hallinta',
    'nav.superadmin': 'Tapahtumavaraukset',
    'nav.login': 'Kirjaudu sisään',
    'nav.logout': 'Kirjaudu ulos',
    'nav.discord': 'Discord',
    'nav.menu': 'Valikko',
    'nav.openMenu': 'Avaa valikko',
    'nav.closeMenu': 'Sulje valikko',

    // Hero / Footer / Common
    'app.welcome': 'Xamk Game Room',
    'app.footer': 'Kaakkois-Suomen ammattikorkeakoulu',
    'footer.school': 'Kaakkois-Suomen ammattikorkeakoulu',
    'footer.discord': 'Discord-yhteisö',
    'footer.report': 'Ilmoita viasta',

    // Booking Calendar
    'booking.title': 'Tee uusi varaus',
    'booking.desc': 'Aukioloajat ma-pe klo 08:00-18:00. Varauksia voi tehdä korkeintaan 2 kuukautta etukäteen.',
    'booking.openFloorPlan': 'Tilan pohjakuva',
    'booking.typeLabel': 'Varaustyyppi',
    'booking.type.individual': 'Yksittäinen laite, enintään 4 h',
    'booking.type.room': 'Koko tila, enintään 4 h',
    'booking.type.roomAdmin': 'Koko tila, enintään 1 pv',
    'booking.type.event': 'Tapahtuma, Admin',
    'booking.date': 'Päivämäärä',
    'booking.startTime': 'Alkamisaika klo 08:00-18:00',
    'booking.endTime': 'Päättymisaika',
    'booking.selectStation': 'Valitse vapaa pelipiste valitulle ajalle',
    'booking.checkingAvailable': 'Tarkistetaan laitteiden saatavuutta...',
    'booking.noAvailable': 'Ei vapaita pelipisteitä valitulle aikavälille. Tila on täynnä tai tilavarauksen peittämä.',
    'booking.roomNotice': 'Opiskelija voi varata koko tilan enintään 4 tunniksi kerrallaan ja päivässä. Varaajan nimi ja koulusähköposti näkyvät tilannetaulussa, jotta muut pelaajat voivat tiedustella mahdollisuutta osallistua.',
    'booking.roomConflict': 'Koko tila on jo varattu valitulle ajalle',
    'booking.booker': 'Varaaja:',
    'booking.contactBooker': 'Voit ottaa yhteyttä varaajaan sähköpostitse ja kysyä, mahtuuko mukaan pelaamaan.',
    'booking.sharedTvNotice': 'Tämä konsoli käyttää samaa televisiota toisen konsolin kanssa. Varaus lukitsee automaattisesti myös toisen konsolin samalle ajalle.',
    'booking.sharedTvBadge': 'Yhteinen TV',
    'booking.submit': 'Vahvista varaus',
    'booking.loginToBook': 'Kirjaudu sisään ja varaa',
    'booking.processing': 'Käsitellään...',

    // Day Schedule & Reservations
    'schedule.title': 'Päivän varaukset ja aikataulu',
    'schedule.desc': 'Tarkastele pelipisteiden varaustilannetta valittuna päivänä. Näet mitkä koneet on varattu ja mille ajalle.',
    'schedule.dateLabel': 'Tarkasteltava päivä',
    'schedule.today': 'Tänään',
    'schedule.tomorrow': 'Huomenna',
    'schedule.prevDay': 'Edellinen päivä',
    'schedule.nextDay': 'Seuraava päivä',
    'schedule.timelineView': 'Aikataulumatriisi',
    'schedule.listView': 'Pisteiden tilanne',
    'schedule.summaryView': 'Kaikki päivän varaukset',
    'schedule.freeAllDay': 'Vapaa koko päivän klo 08:00-18:00',
    'schedule.free': 'Vapaa',
    'schedule.busy': 'Varattu',
    'schedule.tvLocked': 'TV varattu',
    'schedule.roomLocked': 'Koko tila varattu',
    'schedule.clickSlotHint': 'Klikkaa vapaata aikaväliä valitaksesi sen suoraan lomakkeeseen.',
    'schedule.noBookingsForDay': 'Ei varauksia tälle päivälle. Kaikki laitteet ovat vapaana klo 08:00-18:00.',
    'schedule.roomAlert': 'Koko pelitila on varattu ryhmäkäyttöön tai tapahtumaan',
    'schedule.bookerInfo': 'Varaaja',
    'schedule.contactBooker': 'Ota yhteyttä varaajaan',
    'schedule.time': 'Aika',
    'schedule.station': 'Pelipiste tai tila',
    'schedule.type': 'Tyyppi',
    'schedule.todayBookingsCount': 'varausta tänään',
    'schedule.quickSelectSlot': 'Valitse aika',
    'schedule.currentLiveStatus': 'Tilan tilanne nyt klo',

    // Status
    'status.title': 'Pelihuoneen reaaliaikainen tilanne',
    'status.desc': 'Seuraavan tunnin varaustilanne lasketaan suoraan aktiivisista varauksista.',
    'status.free': 'VAPAANA',
    'status.busy': 'VARATTU',
    'status.refresh': 'Päivitä',
    'status.sharedTvInUse': 'Konsolikaapin TV on tällä hetkellä käytössä. Toinen konsoli on lukittu.',
    'status.roomBookedNow': 'Koko tila on varattu tällä hetkellä',
    'status.booker': 'Varaaja:',

    // News
    'news.badge': 'Tiedote',
    'news.pinned': 'Kiinnitetty tiedote',

    // My Bookings
    'myBookings.title': 'Omat varaukset',
    'myBookings.desc': 'Tarkastele ja hallinnoi voimassa olevia ja aiempia varauksiasi.',
    'myBookings.active': 'Aktiiviset varaukset',
    'myBookings.past': 'Menneet ja perutut varaukset',
    'myBookings.noneActive': 'Sinulla ei ole aktiivisia varauksia tällä hetkellä.',
    'myBookings.nonePast': 'Ei aiempia varauksia.',
    'myBookings.cancel': 'Peruuta varaus',
    'myBookings.cancelling': 'Peruutetaan...',
    'myBookings.cancelConfirm': 'Haluatko varmasti perua tämän varauksen?',
    'myBookings.requireLogin': 'Kirjaudu sisään tarkastellaksesi omia varauksiasi.',

    // Floor Plan Modal
    'floorplan.title': 'Tilan pohjakuva',
    'floorplan.desc': 'Xamk Game Room, pelitilan pohjakartta ja laitteiden sijoittelu.',
    'floorplan.sketchHeader': 'PELIHUONEEN POHJAPIIRROS',
    'floorplan.pcZone': 'PC-PELIPISTEET, 6 KPL',
    'floorplan.consoleZone': 'KONSOLIKAAPPI',
    'floorplan.sharedTvZone': 'YHTEINEN 4K-TV',
    'floorplan.doorZone': 'SISÄÄNKÄYNTI',
    'floorplan.close': 'Sulje',

    // Rules & Guide
    'rules.title': 'Pelitilan säännöt ja ohjeet',
    'rules.subtitle': 'Pelitila on tarkoitettu Kaakkois-Suomen ammattikorkeakoulun opiskelijoille ja henkilökunnalle. Yhteiset säännöt pitävät tilan siistinä ja laitteet käyttökunnossa.',
    'rules.openFloorPlan': 'Avaa tilan pohjakuva',
    'rules.joinDiscord': 'Liity Xamk Discordiin',
    'rules.generalTitle': 'Pelitilan yleiset säännöt',
    'rules.generalBadge': 'Kaikille käyttäjille',
    'rules.steamTitle': 'PC-koneiden käyttö ja Steam',
    'rules.steamBadge': '6 kpl PC-pelipisteitä',
    'rules.consoleTitle': 'Konsolikaappi ja yhteinen TV',
    'rules.consoleBadge': 'PS5 ja Nintendo Switch',
    'rules.discordTitle': 'Xamk Gaming Discord -yhteisö',
    'rules.discordBadge': 'Yhteisö ja peliseura',
    'rules.visualOverviewTitle': 'Katsaus pelitilaan',
    'rules.visualOverviewSub': 'Tilan varustelu ja laitteiden sijoittelu.',

    // Login
    'login.title': 'Kirjaudu sisään',
    'login.desc': 'Kirjaudu oppilaitoksen sähköpostilla, @edu.xamk.fi tai @xamk.fi.',
    'login.sessionNotice': 'Istunto säilyy selaimessa, kunnes kirjaudut ulos.',
    'login.tryQuick': 'Kokeile pikatunnuksilla:',
    'login.step1': 'Vaihe 1. Syötä sähköposti',
    'login.step2': 'Vaihe 2. Syötä 6-numeroinen vahvistuskoodi',
    'login.emailLabel': 'Koulun sähköposti',
    'login.emailPlaceholder': 'etunimi.sukunimi@edu.xamk.fi',
    'login.nameLabel': 'Nimi tai nimimerkki, valinnainen',
    'login.namePlaceholder': 'Matti Meikäläinen',
    'login.allowedHint': 'Sallitut päätteet: @edu.xamk.fi ja @xamk.fi',
    'login.sendCode': 'Lähetä vahvistuskoodi',
    'login.verifyCode': 'Vahvista ja jatka',
    'login.quickStudent': 'Opiskelija',
    'login.quickAdmin': 'SuperAdmin',
    'login.codeSentAlert': 'Vahvistuskoodi lähetetty osoitteeseen',
    'login.devCodeHint': 'Kehityskoodi:',
    'login.enterCodeLabel': 'Syötä 6-numeroinen koodi',
    'login.invalidEmailDomain': 'Vain oppilaitoksen sähköpostiosoitteet @edu.xamk.fi ja @xamk.fi ovat sallittuja.',
    'login.emptyCodeError': 'Syötä 6-numeroinen vahvistuskoodi.',
    'login.changeEmail': 'Vaihda sähköposti',

    // Issues & Bug reporting
    'issue.reportBtn': 'Ilmoita viasta',
    'issue.title': 'Ilmoita viasta tai ongelmasta',
    'issue.desc': 'Huomasitko rikkinäisen laitteen, ohjelmistovian tai muun puutteen? Lähetä ilmoitus suoraan ylläpidolle.',
    'issue.target': 'Kohde tai laite',
    'issue.targetPlaceholder': 'Valitse laite tai tila',
    'issue.targetConsole': 'Konsolikaappi ja yhteinen TV',
    'issue.targetNetwork': 'Verkkoyhteys ja internet',
    'issue.targetFurniture': 'Kalusteet ja tilan siisteys',
    'issue.targetOther': 'Muu huomio',
    'issue.reportTitle': 'Otsikko',
    'issue.reportTitlePlaceholder': 'Esimerkiksi PC 3 näyttö sammuilee',
    'issue.description': 'Kuvaus ja tarkemmat tiedot',
    'issue.descriptionPlaceholder': 'Kuvaile ongelma tarkasti...',
    'issue.reportDesc': 'Kuvaus ja tarkemmat tiedot',
    'issue.reportDescPlaceholder': 'Kuvaile ongelma tarkasti, esimerkiksi milloin vika ilmeni ja mikä ei toimi.',
    'issue.name': 'Nimi, valinnainen',
    'issue.email': 'Sähköposti yhteydenottoa varten',
    'issue.reporterName': 'Ilmoittajan nimi, valinnainen',
    'issue.reporterNamePlaceholder': 'Matti Meikäläinen',
    'issue.reporterEmail': 'Sähköposti yhteydenottoa varten',
    'issue.reporterEmailPlaceholder': 'etunimi.sukunimi@edu.xamk.fi',
    'issue.submit': 'Lähetä ilmoitus ylläpidolle',
    'issue.submitBtn': 'Lähetä ilmoitus',
    'issue.submitting': 'Lähetetään ilmoitusta...',
    'issue.success': 'Vikailmoitus lähetetty. Ylläpito on saanut tiedon.',
    'issue.successDetail': 'Ilmoitus välittyi järjestelmän ylläpitäjille.',
    'issue.validationError': 'Täytä vähintään otsikko ja kuvaus.',
    'issue.tab': 'Vikailmoitukset',
    'booking.upcomingToday': 'Varaukset tänään',
    'wishlist.communityWish': 'Opiskelijatoive',

    // Landing Page
    'landing.welcome': 'Xamk Game Room',
    'landing.subtitle': 'Kaakkois-Suomen ammattikorkeakoulun pelitila opiskelijoille ja henkilökunnalle.',
    'landing.newsHeader': 'Uutiset ja tiedotteet',
    'landing.announcementsCount': 'tiedotetta',
    'landing.noAnnouncements': 'Ei aktiivisia tiedotteita tällä hetkellä.',
    'landing.rulesSummaryTitle': 'Tilan pelisäännöt lyhyesti',
    'landing.rule1': 'Tee varaus aina ennen pelaamisen aloittamista.',
    'landing.rule2': 'Opiskelijan päiväkiintiö on enintään 4 tuntia päivässä.',
    'landing.rule3': 'Kirjaudu aina ulos Steam-, Epic- ja Discord-tileiltäsi pelivuoron päätyttyä.',
    'landing.rule4': 'Konsolikaapissa on yhteinen 4K-TV. Vain toinen konsoli voi olla käytössä kerrallaan.',
    'landing.loginHeader': 'Kirjaudu sisään pelihuoneeseen',
    'landing.loginNotice': 'Varausjärjestelmä ja laitteiden varaus avautuvat kirjautumisen jälkeen.',
    'landing.hoursTitle': 'Aukioloajat',
    'landing.hoursValue': 'Ma-pe klo 08:00-18:00',
    'landing.equipmentTitle': 'Varattavat laitteet',
    'landing.equipmentValue': '6 kpl PC, PS5 ja Switch',
    'landing.discordLink': 'Liity Discordiin',
    'landing.rulesNotice': 'Lue tilan säännöt ja kirjaudu ulos omilta pelitileiltäsi vuoron päätyttyä.',
    'landing.statusPreview': 'Tilan tilanne',
    'landing.openFloorPlan': 'Katso tilan pohjakuva',
    'landing.quickDevLogin': 'Pikakirjautuminen kehitysympäristössä:',

    // Wishlist & Games Catalog
    'games.title': 'Pelit ja toivelista',
    'games.subtitle': 'Selaa Xamk Game Roomin asennettuja pelejä ja äänestä uusia pelejä opiskelijoiden toivelistalla.',
    'games.filterAll': 'Kaikki pelit',
    'games.installed': 'Asennettu',
    'games.loading': 'Ladataan pelivalikoimaa...',
    'games.emptyWishlist': 'Toivelistalla ei ole vielä pelejä. Ehdota ensimmäistä peliä.',
    'games.emptyCategory': 'Tässä kategoriassa ei ole vielä pelejä.',
    'games.noDesc': 'Ei kuvausta.',
    'wishlist.tabCatalog': 'Pelivalikoima',
    'wishlist.tabWishlist': 'Toivelista',
    'wishlist.introTitle': 'Opiskelijoiden toivelista ja äänestys',
    'wishlist.introDesc': 'Tässä ovat opiskelijoiden ehdottamat pelit. Äänestä toivomiasi pelejä. Ylläpito hankkii ja asentaa eniten ääniä saaneet pelit.',
    'wishlist.proposeNew': 'Ehdota uutta peliä',
    'wishlist.vote': 'Äänestä',
    'wishlist.votes': 'ääntä',
    'wishlist.voted': 'Ääni annettu',
    'wishlist.propose': 'Ehdota peliä',
    'wishlist.modalTitle': 'Ehdota peliä toivelistalle',
    'wishlist.modalDesc': 'Puuttuuko pelihuoneesta jokin peli? Lähetä ehdotus muiden opiskelijoiden äänestettäväksi ja ylläpidon hankittavaksi.',
    'wishlist.gameName': 'Pelin nimi',
    'wishlist.gameNamePlaceholder': 'Esimerkiksi Tekken 8 tai Helldivers 2',
    'wishlist.platform': 'Alusta',
    'wishlist.reasonDesc': 'Perustelu tai kuvaus, valinnainen',
    'wishlist.reasonPlaceholder': 'Miksi tämä peli sopisi tilaan?',
    'wishlist.submitWish': 'Lähetä toive',
    'wishlist.success': 'Toive lisätty. Ylläpito käy toiveet läpi.',
  },
  en: {
    // Common / Generic
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.submitting': 'Submitting...',
    'common.verifying': 'Verifying...',
    'common.close': 'Close',
    'common.all': 'All',
    'common.actions': 'Actions',
    'common.save': 'Save',

    // Nav
    'nav.title': 'Game Room Booking',
    'nav.subtitle': 'XAMK GAME ROOM',
    'nav.book': 'Book station',
    'nav.status': 'Live status',
    'nav.games': 'Games and wishlist',
    'nav.rules': 'Rules and guide',
    'nav.floorplan': 'Floor plan',
    'nav.myBookings': 'My bookings',
    'nav.admin': 'Admin panel',
    'nav.superadmin': 'Event bookings',
    'nav.login': 'Log in',
    'nav.logout': 'Log out',
    'nav.discord': 'Discord',
    'nav.menu': 'Menu',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',

    // Hero / Footer / Common
    'app.welcome': 'Xamk Game Room',
    'app.footer': 'South-Eastern Finland University of Applied Sciences',
    'footer.school': 'South-Eastern Finland University of Applied Sciences',
    'footer.discord': 'Discord community',
    'footer.report': 'Report issue',

    // Booking Calendar
    'booking.title': 'Make a new reservation',
    'booking.desc': 'Opening hours Mon-Fri 08:00-18:00. Bookings up to 2 months in advance.',
    'booking.openFloorPlan': 'Room floor plan',
    'booking.typeLabel': 'Reservation type',
    'booking.type.individual': 'Single station, up to 4 hours',
    'booking.type.room': 'Whole room, up to 4 hours',
    'booking.type.roomAdmin': 'Whole room, up to 1 day',
    'booking.type.event': 'Event, Admin',
    'booking.date': 'Date',
    'booking.startTime': 'Start time 08:00-18:00',
    'booking.endTime': 'End time',
    'booking.selectStation': 'Select an available station for the selected time',
    'booking.checkingAvailable': 'Checking station availability...',
    'booking.noAvailable': 'No stations available for the selected time interval. The room may be fully booked or reserved.',
    'booking.roomNotice': 'A student may reserve the entire room for up to 4 hours per reservation and per day. The booker name and university email are shown on the status board so other players can ask to join.',
    'booking.roomConflict': 'The whole room is already booked for the selected time',
    'booking.booker': 'Booker:',
    'booking.contactBooker': 'You can contact the booker by email to ask if you can join.',
    'booking.sharedTvNotice': 'This console shares a 4K TV with the other console. A reservation automatically locks the other console for the same period.',
    'booking.sharedTvBadge': 'Shared TV',
    'booking.submit': 'Confirm booking',
    'booking.loginToBook': 'Log in to book',
    'booking.processing': 'Processing...',

    // Day Schedule & Reservations
    'schedule.title': 'Daily reservations and schedule',
    'schedule.desc': 'Check station reservations for the selected day. See which machines are booked and for what time.',
    'schedule.dateLabel': 'Selected day',
    'schedule.today': 'Today',
    'schedule.tomorrow': 'Tomorrow',
    'schedule.prevDay': 'Previous day',
    'schedule.nextDay': 'Next day',
    'schedule.timelineView': 'Timeline matrix',
    'schedule.listView': 'Station cards',
    'schedule.summaryView': 'All day bookings',
    'schedule.freeAllDay': 'Free all day 08:00-18:00',
    'schedule.free': 'Free',
    'schedule.busy': 'Booked',
    'schedule.tvLocked': 'TV locked',
    'schedule.roomLocked': 'Room reserved',
    'schedule.clickSlotHint': 'Click a free time slot to prefill the booking form.',
    'schedule.noBookingsForDay': 'No bookings for this day. All stations are free from 08:00 to 18:00.',
    'schedule.roomAlert': 'The entire game room is reserved for group use or an event',
    'schedule.bookerInfo': 'Booker',
    'schedule.contactBooker': 'Contact booker',
    'schedule.time': 'Time',
    'schedule.station': 'Station or room',
    'schedule.type': 'Type',
    'schedule.todayBookingsCount': 'reservations today',
    'schedule.quickSelectSlot': 'Select slot',
    'schedule.currentLiveStatus': 'Room status right now at',

    // Status
    'status.title': 'Realtime room availability',
    'status.desc': 'Reservation status for the upcoming hour computed directly from active bookings.',
    'status.free': 'AVAILABLE',
    'status.busy': 'OCCUPIED',
    'status.refresh': 'Refresh',
    'status.sharedTvInUse': 'The console cabinet TV is currently in use. The other console is locked.',
    'status.roomBookedNow': 'The entire room is currently booked',
    'status.booker': 'Booker:',

    // News
    'news.badge': 'Announcement',
    'news.pinned': 'Pinned notice',

    // My Bookings
    'myBookings.title': 'My reservations',
    'myBookings.desc': 'View and manage your active and past reservations.',
    'myBookings.active': 'Active reservations',
    'myBookings.past': 'Past and cancelled reservations',
    'myBookings.noneActive': 'You have no active reservations at the moment.',
    'myBookings.nonePast': 'No past reservations.',
    'myBookings.cancel': 'Cancel booking',
    'myBookings.cancelling': 'Cancelling...',
    'myBookings.cancelConfirm': 'Are you sure you want to cancel this reservation?',
    'myBookings.requireLogin': 'Log in to view your reservations.',

    // Floor Plan Modal
    'floorplan.title': 'Room floor plan',
    'floorplan.desc': 'Xamk Game Room, floor map and equipment layout.',
    'floorplan.sketchHeader': 'GAME ROOM FLOOR PLAN',
    'floorplan.pcZone': 'PC GAMING STATIONS, 6 UNITS',
    'floorplan.consoleZone': 'CONSOLE CABINET',
    'floorplan.sharedTvZone': 'SHARED 4K TV',
    'floorplan.doorZone': 'ENTRANCE',
    'floorplan.close': 'Close',

    // Rules & Guide
    'rules.title': 'Room rules and guidelines',
    'rules.subtitle': 'The gaming space is for students and staff of South-Eastern Finland University of Applied Sciences. Shared rules keep the room clean and the equipment in working order.',
    'rules.openFloorPlan': 'Open floor plan',
    'rules.joinDiscord': 'Join Xamk Discord',
    'rules.generalTitle': 'General room rules',
    'rules.generalBadge': 'For all users',
    'rules.steamTitle': 'PC gaming and Steam instructions',
    'rules.steamBadge': '6 PC gaming stations',
    'rules.consoleTitle': 'Console cabinet and shared TV',
    'rules.consoleBadge': 'PS5 and Nintendo Switch',
    'rules.discordTitle': 'Xamk Gaming Discord community',
    'rules.discordBadge': 'Community and matchmaking',
    'rules.visualOverviewTitle': 'Overview of the gaming space',
    'rules.visualOverviewSub': 'Equipment and layout of the gaming room.',

    // Login
    'login.title': 'Log in',
    'login.desc': 'Log in with your university email, @edu.xamk.fi or @xamk.fi.',
    'login.sessionNotice': 'Your session remains active in the browser until you log out.',
    'login.tryQuick': 'Try quick test accounts:',
    'login.step1': 'Step 1. Enter your email',
    'login.step2': 'Step 2. Enter 6-digit verification code',
    'login.emailLabel': 'University email',
    'login.emailPlaceholder': 'firstname.lastname@edu.xamk.fi',
    'login.nameLabel': 'Full name or alias, optional',
    'login.namePlaceholder': 'John Doe',
    'login.allowedHint': 'Allowed domains: @edu.xamk.fi and @xamk.fi',
    'login.sendCode': 'Send verification code',
    'login.verifyCode': 'Verify and continue',
    'login.quickStudent': 'Student',
    'login.quickAdmin': 'SuperAdmin',
    'login.codeSentAlert': 'Verification code sent to',
    'login.devCodeHint': 'Development code:',
    'login.enterCodeLabel': 'Enter 6-digit code',
    'login.invalidEmailDomain': 'Only university email addresses @edu.xamk.fi and @xamk.fi are allowed.',
    'login.emptyCodeError': 'Enter the 6-digit verification code.',
    'login.changeEmail': 'Change email',

    // Issues & Bug reporting
    'issue.reportBtn': 'Report issue',
    'issue.title': 'Report a hardware or software issue',
    'issue.desc': 'Found broken hardware, a software issue, or another problem? Send a report directly to the administrators.',
    'issue.target': 'Station or hardware',
    'issue.targetPlaceholder': 'Select station or space',
    'issue.targetConsole': 'Console cabinet and shared TV',
    'issue.targetNetwork': 'Network connection and internet',
    'issue.targetFurniture': 'Furniture and room cleanliness',
    'issue.targetOther': 'Other feedback',
    'issue.reportTitle': 'Title',
    'issue.reportTitlePlaceholder': 'For example PC 3 monitor flickers',
    'issue.description': 'Description and details',
    'issue.descriptionPlaceholder': 'Describe the issue in detail...',
    'issue.reportDesc': 'Description and details',
    'issue.reportDescPlaceholder': 'Describe the issue in detail, for example when it happened and which device is affected.',
    'issue.name': 'Name, optional',
    'issue.email': 'Email for follow-up',
    'issue.reporterName': 'Reporter name, optional',
    'issue.reporterNamePlaceholder': 'John Doe',
    'issue.reporterEmail': 'Email for follow-up',
    'issue.reporterEmailPlaceholder': 'firstname.lastname@edu.xamk.fi',
    'issue.submit': 'Submit report to administrators',
    'issue.submitBtn': 'Submit report',
    'issue.submitting': 'Sending report...',
    'issue.success': 'Issue report sent. Administrators have been notified.',
    'issue.successDetail': 'The report was sent to the system administrators.',
    'issue.validationError': 'Fill in at least the title and description.',
    'issue.tab': 'Issue reports',
    'booking.upcomingToday': 'Bookings today',
    'wishlist.communityWish': 'Student wish',

    // Landing Page
    'landing.welcome': 'Xamk Game Room',
    'landing.subtitle': 'South-Eastern Finland University of Applied Sciences gaming space for students and staff.',
    'landing.newsHeader': 'News and announcements',
    'landing.announcementsCount': 'announcements',
    'landing.noAnnouncements': 'No active announcements at the moment.',
    'landing.rulesSummaryTitle': 'Game room rules in brief',
    'landing.rule1': 'Always make a reservation before starting your gaming session.',
    'landing.rule2': 'The student quota is up to 4 hours per day.',
    'landing.rule3': 'Always sign out from your Steam, Epic, and Discord accounts after your session.',
    'landing.rule4': 'The console cabinet has a shared 4K TV. Only one console can be in use at a time.',
    'landing.loginHeader': 'Log in to Game Room',
    'landing.loginNotice': 'The booking system and station reservations open after logging in.',
    'landing.hoursTitle': 'Opening hours',
    'landing.hoursValue': 'Mon-Fri 08:00-18:00',
    'landing.equipmentTitle': 'Available hardware',
    'landing.equipmentValue': '6 PCs, PS5, and Switch',
    'landing.discordLink': 'Join Discord',
    'landing.rulesNotice': 'Read the room guidelines and sign out from personal gaming accounts after your turn.',
    'landing.statusPreview': 'Live status',
    'landing.openFloorPlan': 'View floor plan',
    'landing.quickDevLogin': 'Quick login for testing:',

    // Wishlist & Games Catalog
    'games.title': 'Games and wishlist',
    'games.subtitle': 'Browse games installed at Xamk Game Room and vote for new titles on the student wishlist.',
    'games.filterAll': 'All games',
    'games.installed': 'Installed',
    'games.loading': 'Loading games catalog...',
    'games.emptyWishlist': 'No games on the wishlist yet. Suggest the first game.',
    'games.emptyCategory': 'No games found in this category.',
    'games.noDesc': 'No description.',
    'wishlist.tabCatalog': 'Game catalog',
    'wishlist.tabWishlist': 'Wishlist',
    'wishlist.introTitle': 'Student wishlist and voting',
    'wishlist.introDesc': 'Here are games suggested by students. Vote for the games you want. Administrators acquire and install the top-voted games.',
    'wishlist.proposeNew': 'Propose new game',
    'wishlist.vote': 'Vote',
    'wishlist.votes': 'votes',
    'wishlist.voted': 'Voted',
    'wishlist.propose': 'Propose a game',
    'wishlist.modalTitle': 'Propose a game to the wishlist',
    'wishlist.modalDesc': 'Is a game missing from the game room? Submit a suggestion for students to vote on and administrators to acquire.',
    'wishlist.gameName': 'Game title',
    'wishlist.gameNamePlaceholder': 'For example Tekken 8 or Helldivers 2',
    'wishlist.platform': 'Platform',
    'wishlist.reasonDesc': 'Rationale or description, optional',
    'wishlist.reasonPlaceholder': 'Why would this game fit the room?',
    'wishlist.submitWish': 'Submit wish',
    'wishlist.success': 'Wish added. Administrators will review the suggestion.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/** LocalStorage-avain valitun kielen tallentamiseen */
const STORAGE_KEY = 'pelihuone_lang';

/**
 * Kielikontekstin tarjoajakomponentti (Provider).
 * Lataa tallennetun kielen oletuksena ('fi') ja päivittää myös HTML-juurielementin `lang`-attribuutin.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    return saved === 'en' || saved === 'fi' ? saved : 'fi';
  });

  // Vaihtaa kielen ja tallentaa valinnan selaimen muistiin
  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  };

  // Palauttaa käännöstekstin valitulla kielellä (tai suomeksi/avaimena, jos käännös puuttuu)
  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['fi']?.[key] || key;
  };

  // Päivitetään dokumentin lang-attribuutti saavutettavuutta ja ruudunlukijoita varten
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook kielikontekstin ja `t`-käännösfunktion käyttämiseen komponenteissa.
 * Heittää virheen, jos sitä kutsutaan `LanguageProvider`-komponentin ulkopuolella.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
