import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fi' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fi: {
    // Common / Generic
    'common.cancel': 'Peruuta',
    'common.back': '← Takaisin',
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
    'nav.book': '📅 Varaa laite',
    'nav.status': '🟢 Tilan tilanne',
    'nav.games': '🎮 Pelit & Toivelista',
    'nav.rules': '📖 Säännöt & Ohjeet',
    'nav.floorplan': '🗺️ Tilan pohjakuva',
    'nav.myBookings': '📋 Omat varaukset',
    'nav.admin': '⚙️ Admin-hallinta',
    'nav.superadmin': '⚡ SuperAdmin-jyräys',
    'nav.login': 'Kirjaudu sisään',
    'nav.logout': 'Kirjaudu ulos',
    'nav.discord': '💬 Discord',
    'nav.menu': 'Valikko',
    'nav.openMenu': 'Avaa valikko',
    'nav.closeMenu': 'Sulje valikko',

    // Hero / Footer / Common
    'app.welcome': 'Tervetuloa Xamk Game Roomiin!',
    'app.footer': 'Kaakkois-Suomen ammattikorkeakoulu',
    'footer.school': 'Kaakkois-Suomen ammattikorkeakoulu',
    'footer.discord': '💬 Discord-yhteisö',
    'footer.report': '⚠️ Ilmoita viasta',

    // Booking Calendar
    'booking.title': 'Tee uusi varaus',
    'booking.desc': 'Aukioloajat ma–pe klo 08:00–18:00. Varauksia voi tehdä korkeintaan 2 kuukautta etukäteen.',
    'booking.openFloorPlan': '🗺️ Tilan pohjakuva',
    'booking.typeLabel': 'Varaustyyppi',
    'booking.type.individual': '🎮 Yksittäinen laite (max 4h)',
    'booking.type.room': '🏢 Koko tila (max 4h)',
    'booking.type.roomAdmin': '🏢 Koko tila (max 1 pv)',
    'booking.type.event': '🏆 Tapahtuma (Admin)',
    'booking.date': 'Päivämäärä',
    'booking.startTime': 'Alkamisaika (klo 08–18)',
    'booking.endTime': 'Päättymisaika',
    'booking.selectStation': 'Valitse vapaa pelipiste valitulle ajalle',
    'booking.checkingAvailable': 'Tarkistetaan laitteiden saatavuutta...',
    'booking.noAvailable': 'Ei vapaita pelipisteitä valitulle aikavälille. Tila saattaa olla täynnä tai tilavarauksen peittämä.',
    'booking.roomNotice': 'Huomio tilavarauksesta: Yksittäinenkin opiskelija voi varata koko tilan (enintään 4 tuntia kerrallaan ja päivässä). Varaajan nimi ja koulusähköposti näkyvät tilannetaulussa julkisesti, jotta muut pelaajat voivat tiedustella mahdollisuutta osallistua mukaan pelaamiseen.',
    'booking.roomConflict': 'Huomio: Koko tila on jo varattu valitulle ajalle',
    'booking.booker': 'Varaaja:',
    'booking.contactBooker': 'Voit ottaa yhteyttä varaajaan sähköpostitse ja sopia mahtuuko mukaan pelaamaan!',
    'booking.sharedTvNotice': 'Huomio yhteisestä televisiosta: Tämä konsoli käyttää samaa televisiota toisen konsolin kanssa. Kun teet tämän varauksen, järjestelmä lukitsee automaattisesti myös toisen konsolin samalle ajalle.',
    'booking.sharedTvBadge': '📺 Yhteinen TV',
    'booking.submit': 'Vahvista varaus',
    'booking.loginToBook': 'Kirjaudu sisään ja varaa',
    'booking.processing': 'Käsitellään...',

    // Day Schedule & Reservations
    'schedule.title': 'Päivän varaukset ja aikataulu',
    'schedule.desc': 'Tarkastele pelipisteiden varaustilannetta valittuna päivänä. Näet mitkä koneet on varattu ja millekin ajalle, vaikka laite olisi juuri nyt vapaana.',
    'schedule.dateLabel': 'Tarkasteltava päivä',
    'schedule.today': 'Tänään',
    'schedule.tomorrow': 'Huomenna',
    'schedule.prevDay': '← Edellinen päivä',
    'schedule.nextDay': 'Seuraava päivä →',
    'schedule.timelineView': '📊 Aikataulumatriisi',
    'schedule.listView': '📋 Pisteiden tilanne',
    'schedule.summaryView': '📑 Kaikki päivän varaukset',
    'schedule.freeAllDay': 'Vapaa koko päivän (08:00–18:00)',
    'schedule.free': 'Vapaa',
    'schedule.busy': 'Varattu',
    'schedule.tvLocked': 'TV varattu',
    'schedule.roomLocked': 'Koko tila varattu',
    'schedule.clickSlotHint': 'Klikkaa vapaata aikaväliä valitaksesi sen suoraan lomakkeeseen!',
    'schedule.noBookingsForDay': 'Ei varauksia tälle päivälle. Kaikki laitteet ovat vapaana klo 08:00–18:00!',
    'schedule.roomAlert': 'Koko pelitila on varattu ryhmäkäyttöön tai tapahtumaan',
    'schedule.bookerInfo': 'Varaaja',
    'schedule.contactBooker': 'Ota yhteyttä varaajaan',
    'schedule.time': 'Aika',
    'schedule.station': 'Pelipiste / Tila',
    'schedule.type': 'Tyyppi',
    'schedule.todayBookingsCount': 'varaus(ta) tänään',
    'schedule.quickSelectSlot': 'Valitse aika',
    'schedule.currentLiveStatus': 'Tilan tilanne nyt klo',

    // Status
    'status.title': 'Pelihuoneen reaaliaikainen tilanne',
    'status.desc': 'Seuraavan tunnin dynaaminen varaustilanne. Tieto lasketaan suoraan aktiivisista varauksista.',
    'status.free': 'VAPAANA',
    'status.busy': 'VARATTU',
    'status.refresh': '🔄 Päivitä',
    'status.sharedTvInUse': '📺 Konsolikaapin TV on tällä hetkellä käytössä. Toinen konsoli on lukittu.',
    'status.roomBookedNow': '🏢 Koko tila on varattu tällä hetkellä',
    'status.booker': 'Varaaja:',

    // News
    'news.badge': '📢 Tiedote',
    'news.pinned': '📌 Tärkeä tiedote',

    // My Bookings
    'myBookings.title': '📋 Omat varaukset',
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
    'floorplan.desc': 'Xamk Game Room — Pelitilan pohjakartta ja laitteiden sijoittelu.',
    'floorplan.sketchHeader': '📐 PELIHUONEEN POHJAPIIRROS',
    'floorplan.pcZone': '🖥️ PC-PELIPISTEET (6 KPL)',
    'floorplan.consoleZone': '🎮 KONSOLIKAAPPI',
    'floorplan.sharedTvZone': '📺 YHTEINEN 4K TV',
    'floorplan.doorZone': '🚪 SISÄÄNKÄYNTI',
    'floorplan.close': 'Sulje',

    // Rules & Guide
    'rules.title': '📖 Pelitilan säännöt ja ohjeet',
    'rules.subtitle': 'Pelitila on tarkoitettu Kaakkois-Suomen ammattikorkeakoulun opiskelijoille ja henkilökunnalle. Noudattamalla yhteisiä sääntöjä varmistamme viihtyisän ja toimivan peliympäristön kaikille!',
    'rules.openFloorPlan': '🗺️ Avaa tilan pohjakuva',
    'rules.joinDiscord': '💬 Liity Xamk Discordiin',
    'rules.generalTitle': 'Pelitilan yleiset säännöt',
    'rules.generalBadge': 'Kaikille käyttäjille',
    'rules.steamTitle': 'PC-koneiden käyttö & Steam',
    'rules.steamBadge': '6 kpl PC-pelipisteitä',
    'rules.consoleTitle': 'Konsolikaappi & Yhteinen TV',
    'rules.consoleBadge': 'PS5 + Nintendo Switch',
    'rules.discordTitle': 'Xamk Gaming Discord -yhteisö',
    'rules.discordBadge': 'Yhteisö & Peliseura',
    'rules.visualOverviewTitle': '🖼️ Visuaalinen katsaus pelitilaan',
    'rules.visualOverviewSub': 'Tutustu tilan varusteluun ja laitteiden sijoitteluun.',

    // Login
    'login.title': 'Kirjaudu sisään',
    'login.desc': 'Kirjaudu oppilaitoksen sähköpostilla (@edu.xamk.fi tai @xamk.fi).',
    'login.sessionNotice': 'Järjestelmä käyttää kertakirjautumista (istunto säilyy, ellet kirjaudu erikseen ulos).',
    'login.tryQuick': 'Kokeile pikatunnuksilla:',
    'login.step1': 'Vaihe 1: Syötä sähköposti',
    'login.step2': 'Vaihe 2: Syötä 6-numeroinen vahvistuskoodi',
    'login.emailLabel': 'Koulun sähköposti',
    'login.emailPlaceholder': 'etunimi.sukunimi@edu.xamk.fi',
    'login.nameLabel': 'Nimi tai nimimerkki (valinnainen)',
    'login.namePlaceholder': 'Matti Meikäläinen',
    'login.allowedHint': 'Sallitut päätteet: @edu.xamk.fi tai @xamk.fi',
    'login.sendCode': 'Lähetä vahvistuskoodi',
    'login.verifyCode': 'Vahvista ja jatka',
    'login.quickStudent': '🎓 Opiskelija',
    'login.quickAdmin': '⚡ SuperAdmin',
    'login.codeSentAlert': '📧 Vahvistuskoodi lähetetty osoitteeseen',
    'login.devCodeHint': 'Kehityskoodi:',
    'login.enterCodeLabel': 'Syötä 6-numeroinen koodi',
    'login.invalidEmailDomain': 'Vain oppilaitoksen sähköpostiosoitteet (@edu.xamk.fi tai @xamk.fi) ovat sallittuja.',
    'login.emptyCodeError': 'Syötä 6-numeroinen vahvistuskoodi.',
    'login.changeEmail': 'Vaihda sähköposti',

    // Issues & Bug reporting
    'issue.reportBtn': '⚠️ Ilmoita viasta',
    'issue.title': 'Ilmoita viasta tai ongelmasta',
    'issue.desc': 'Huomasitko rikkinäisen laitteen, ohjelmistovian tai muun ongelman? Lähetä ilmoitus suoraan ylläpidolle.',
    'issue.target': 'Kohde / Laite',
    'issue.targetPlaceholder': 'Valitse laite tai tila',
    'issue.targetConsole': 'Konsolikaappi / Yhteinen TV',
    'issue.targetNetwork': 'Verkkoyhteys / Internet',
    'issue.targetFurniture': 'Huonekalut / Tilan siisteys',
    'issue.targetOther': 'Muu / Yleinen huomio',
    'issue.reportTitle': 'Otsikko / Lyhyt tiivistelmä',
    'issue.reportTitlePlaceholder': 'Esim. PC 3 näyttö sammuilee',
    'issue.description': 'Kuvaus / Yksityiskohdat',
    'issue.descriptionPlaceholder': 'Kuvaile ongelma mahdollisimman tarkasti...',
    'issue.name': 'Nimi (valinnainen)',
    'issue.email': 'Sähköposti yhteydenottoa varten',
    'issue.submit': 'Lähetä ilmoitus ylläpidolle',
    'issue.submitting': 'Lähetetään ilmoitusta...',
    'issue.success': 'Vikailmoitus lähetetty onnistuneesti! Ylläpito on saanut tiedon.',
    'issue.successDetail': 'Ilmoitus välittyi järjestelmän ylläpitäjille. Kiitos avustasi tilan ylläpidossa!',
    'issue.validationError': 'Täytä vähintään otsikko ja kuvaus.',
    'issue.tab': '⚠️ Vikailmoitukset',

    // Landing Page
    'landing.welcome': 'Tervetuloa Xamk Game Roomiin',
    'landing.subtitle': 'Kaakkois-Suomen ammattikorkeakoulun virallinen pelitila opiskelijoille ja henkilökunnalle.',
    'landing.newsHeader': '📢 Uutiset & Tiedotteet',
    'landing.announcementsCount': 'tiedotetta',
    'landing.noAnnouncements': 'Ei aktiivisia tiedotteita tällä hetkellä. Tervetuloa pelaamaan!',
    'landing.rulesSummaryTitle': '📌 Tilan pelisäännöt lyhyesti:',
    'landing.rule1': 'Varaus on aina tehtävä ennen pelaamisen aloittamista.',
    'landing.rule2': 'Opiskelijan päiväkiintiö on enintään 4 tuntia / päivä.',
    'landing.rule3': 'Muista aina kirjautua ulos Steam-, Epic- ja Discord-tileiltäsi pelivuoron päätyttyä.',
    'landing.rule4': 'Konsolikaapissa on yhteinen 4K TV: vain yksi konsoli voi olla kerrallaan käytössä.',
    'landing.loginHeader': 'Kirjaudu sisään pelihuoneeseen',
    'landing.loginNotice': 'Varausjärjestelmä ja laitteiden varaus avautuvat kirjautumisen jälkeen.',
    'landing.hoursTitle': 'Aukioloajat:',
    'landing.hoursValue': 'Ma–Pe klo 08:00–18:00',
    'landing.equipmentTitle': 'Varattavat laitteet:',
    'landing.equipmentValue': '6 kpl PC, PS5, Switch',
    'landing.discordLink': 'Liity Discordiin ↗',
    'landing.rulesNotice': 'Tutustu tilan sääntöihin ja muista kirjautua ulos henkilökohtaisilta pelitileiltäsi (Steam, Discord).',
    'landing.statusPreview': 'Tilan tilanne',
    'landing.openFloorPlan': 'Tutustu tilan pohjakuvaan',
    'landing.quickDevLogin': 'Pikakirjautuminen kehitysympäristössä:',

    // Wishlist & Games Catalog
    'games.title': 'Pelit & Toivelista',
    'games.subtitle': 'Tutustu Xamk Game Roomin asennettuihin peleihin ja äänestä suosikkejasi opiskelijoiden toivelistalla.',
    'games.filterAll': 'Kaikki pelit',
    'games.installed': 'Asennettu',
    'games.loading': 'Ladataan pelivalikoimaa...',
    'games.emptyWishlist': 'Toivelistalla ei ole vielä pelejä. Ole ensimmäinen ja ehdota peliä!',
    'games.emptyCategory': 'Tällä kategorialla ei löytynyt vielä pelejä.',
    'games.noDesc': 'Ei tarkempaa kuvausta.',
    'wishlist.tabCatalog': '🎮 Pelivalikoima',
    'wishlist.tabWishlist': '⭐ Toivelista',
    'wishlist.introTitle': '⭐ Opiskelijoiden toivelista & äänestys',
    'wishlist.introDesc': 'Tässä ovat opiskelijoiden ehdottamat pelit. Anna äänesi eniten toivomillesi peleille! Ylläpito hankkii ja asentaa suosituimmat pelit tilaan mahdollisuuksien mukaan.',
    'wishlist.proposeNew': '➕ Ehdota uutta peliä',
    'wishlist.vote': '👍 Äänestä',
    'wishlist.votes': 'ääntä',
    'wishlist.voted': 'Ääni annettu!',
    'wishlist.propose': '⭐ Ehdota peliä',
    'wishlist.modalTitle': '⭐ Ehdota peliä toivelistalle',
    'wishlist.modalDesc': 'Haluaisitko pelata jotain tiettyä peliä Xamk Game Roomissa? Lähetä ehdotuksesi muiden opiskelijoiden äänestettäväksi ja ylläpidon hankittavaksi!',
    'wishlist.gameName': 'Pelin nimi',
    'wishlist.gameNamePlaceholder': 'esim. Tekken 8 tai Helldivers 2',
    'wishlist.platform': 'Alusta',
    'wishlist.reasonDesc': 'Perustelu tai kuvaus (vapaaehtoinen)',
    'wishlist.reasonPlaceholder': 'Miksi tämä peli sopisi tilaan?',
    'wishlist.submitWish': 'Lähetä toive',
    'wishlist.success': 'Toive lisätty onnistuneesti! Ylläpito käy toiveet läpi.',
  },
  en: {
    // Common / Generic
    'common.cancel': 'Cancel',
    'common.back': '← Back',
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
    'nav.book': '📅 Book Station',
    'nav.status': '🟢 Live Status',
    'nav.games': '🎮 Games & Wishlist',
    'nav.rules': '📖 Rules & Guide',
    'nav.floorplan': '🗺️ Floor Plan',
    'nav.myBookings': '📋 My Bookings',
    'nav.admin': '⚙️ Admin Panel',
    'nav.superadmin': '⚡ SuperAdmin Override',
    'nav.login': 'Log in',
    'nav.logout': 'Log out',
    'nav.discord': '💬 Discord',
    'nav.menu': 'Menu',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',

    // Hero / Footer / Common
    'app.welcome': 'Welcome to Xamk Game Room!',
    'app.footer': 'South-Eastern Finland University of Applied Sciences',
    'footer.school': 'South-Eastern Finland University of Applied Sciences',
    'footer.discord': '💬 Discord Community',
    'footer.report': '⚠️ Report Issue',

    // Booking Calendar
    'booking.title': 'Make a New Reservation',
    'booking.desc': 'Opening hours Mon–Fri 08:00–18:00. Bookings up to 2 months in advance.',
    'booking.openFloorPlan': '🗺️ Room Floor Plan',
    'booking.typeLabel': 'Reservation Type',
    'booking.type.individual': '🎮 Single Station (max 4h)',
    'booking.type.room': '🏢 Whole Room (max 4h)',
    'booking.type.roomAdmin': '🏢 Whole Room (max 1 day)',
    'booking.type.event': '🏆 Event (Admin)',
    'booking.date': 'Date',
    'booking.startTime': 'Start Time (08:00–18:00)',
    'booking.endTime': 'End Time',
    'booking.selectStation': 'Select an available station for the selected time',
    'booking.checkingAvailable': 'Checking station availability...',
    'booking.noAvailable': 'No stations available for the selected time interval. The room may be fully booked or reserved.',
    'booking.roomNotice': 'Notice about room reservation: A single student can reserve the entire room (up to 4 hours per reservation and per day). The booker name and student email are displayed publicly on the status board so peers can contact you to join.',
    'booking.roomConflict': 'Notice: The whole room is already booked for the selected time',
    'booking.booker': 'Booker:',
    'booking.contactBooker': 'You can contact the booker via email to ask if you can join!',
    'booking.sharedTvNotice': 'Shared TV Notice: This console shares a 4K TV with the other console. When you make this reservation, the system automatically locks the other console for the same period.',
    'booking.sharedTvBadge': '📺 Shared TV',
    'booking.submit': 'Confirm Booking',
    'booking.loginToBook': 'Log in to Book',
    'booking.processing': 'Processing...',

    // Day Schedule & Reservations
    'schedule.title': 'Daily Reservations & Schedule',
    'schedule.desc': 'Inspect station reservations for the selected day. See which machines are booked and for what time, even if currently available.',
    'schedule.dateLabel': 'Selected Day',
    'schedule.today': 'Today',
    'schedule.tomorrow': 'Tomorrow',
    'schedule.prevDay': '← Previous Day',
    'schedule.nextDay': 'Next Day →',
    'schedule.timelineView': '📊 Timeline Matrix',
    'schedule.listView': '📋 Station Cards',
    'schedule.summaryView': '📑 All Day Bookings',
    'schedule.freeAllDay': 'Free all day (08:00–18:00)',
    'schedule.free': 'Free',
    'schedule.busy': 'Booked',
    'schedule.tvLocked': 'TV Locked',
    'schedule.roomLocked': 'Room Reserved',
    'schedule.clickSlotHint': 'Click a free time slot to prefill the booking form!',
    'schedule.noBookingsForDay': 'No bookings for this day. All stations are free from 08:00 to 18:00!',
    'schedule.roomAlert': 'The entire game room is reserved for group use or an event',
    'schedule.bookerInfo': 'Booker',
    'schedule.contactBooker': 'Contact booker',
    'schedule.time': 'Time',
    'schedule.station': 'Station / Room',
    'schedule.type': 'Type',
    'schedule.todayBookingsCount': 'reservation(s) today',
    'schedule.quickSelectSlot': 'Select slot',
    'schedule.currentLiveStatus': 'Room status right now at',

    // Status
    'status.title': 'Realtime Room Availability',
    'status.desc': 'Dynamic reservation status for the upcoming hour computed directly from active bookings.',
    'status.free': 'AVAILABLE',
    'status.busy': 'OCCUPIED',
    'status.refresh': '🔄 Refresh',
    'status.sharedTvInUse': '📺 The console cabinet TV is currently in use. The other console is locked.',
    'status.roomBookedNow': '🏢 The entire room is currently booked',
    'status.booker': 'Booker:',

    // News
    'news.badge': '📢 Announcement',
    'news.pinned': '📌 Important Notice',

    // My Bookings
    'myBookings.title': '📋 My Reservations',
    'myBookings.desc': 'View and manage your active and past reservations.',
    'myBookings.active': 'Active Reservations',
    'myBookings.past': 'Past and Cancelled Reservations',
    'myBookings.noneActive': 'You have no active reservations at the moment.',
    'myBookings.nonePast': 'No past reservations.',
    'myBookings.cancel': 'Cancel Booking',
    'myBookings.cancelling': 'Cancelling...',
    'myBookings.cancelConfirm': 'Are you sure you want to cancel this reservation?',
    'myBookings.requireLogin': 'Please log in to view your reservations.',

    // Floor Plan Modal
    'floorplan.title': 'Room Floor Plan',
    'floorplan.desc': 'Xamk Game Room — Floor map and equipment layout.',
    'floorplan.sketchHeader': '📐 GAME ROOM FLOOR PLAN',
    'floorplan.pcZone': '🖥️ PC GAMING STATIONS (6 PCS)',
    'floorplan.consoleZone': '🎮 CONSOLE CABINET',
    'floorplan.sharedTvZone': '📺 SHARED 4K TV',
    'floorplan.doorZone': '🚪 ENTRANCE',
    'floorplan.close': 'Close',

    // Rules & Guide
    'rules.title': '📖 Room Rules and Guidelines',
    'rules.subtitle': 'The gaming space is intended for students and staff of South-Eastern Finland University of Applied Sciences. Following shared rules ensures a pleasant and functional gaming environment for all!',
    'rules.openFloorPlan': '🗺️ Open Floor Plan',
    'rules.joinDiscord': '💬 Join Xamk Discord',
    'rules.generalTitle': 'General Room Rules',
    'rules.generalBadge': 'For All Users',
    'rules.steamTitle': 'PC Gaming & Steam Instructions',
    'rules.steamBadge': '6 PC Gaming Stations',
    'rules.consoleTitle': 'Console Cabinet & Shared TV',
    'rules.consoleBadge': 'PS5 + Nintendo Switch',
    'rules.discordTitle': 'Xamk Gaming Discord Community',
    'rules.discordBadge': 'Community & LFG',
    'rules.visualOverviewTitle': '🖼️ Visual Tour of the Gaming Space',
    'rules.visualOverviewSub': 'Explore equipment and layout of the gaming room.',

    // Login
    'login.title': 'Log in',
    'login.desc': 'Log in with your university email (@edu.xamk.fi or @xamk.fi).',
    'login.sessionNotice': 'The system uses single session sign-in (your session remains active until you log out).',
    'login.tryQuick': 'Try quick test accounts:',
    'login.step1': 'Step 1: Enter your email',
    'login.step2': 'Step 2: Enter 6-digit verification code',
    'login.emailLabel': 'University email',
    'login.emailPlaceholder': 'firstname.lastname@edu.xamk.fi',
    'login.nameLabel': 'Full name or alias (optional)',
    'login.namePlaceholder': 'John Doe',
    'login.allowedHint': 'Allowed domains: @edu.xamk.fi or @xamk.fi',
    'login.sendCode': 'Send verification code',
    'login.verifyCode': 'Verify and continue',
    'login.quickStudent': '🎓 Student',
    'login.quickAdmin': '⚡ SuperAdmin',
    'login.codeSentAlert': '📧 Verification code sent to',
    'login.devCodeHint': 'Development code:',
    'login.enterCodeLabel': 'Enter 6-digit code',
    'login.invalidEmailDomain': 'Only university email addresses (@edu.xamk.fi or @xamk.fi) are allowed.',
    'login.emptyCodeError': 'Please enter the 6-digit verification code.',
    'login.changeEmail': 'Change email',

    // Issues & Bug reporting
    'issue.reportBtn': '⚠️ Report Issue',
    'issue.title': 'Report a Bug or Problem',
    'issue.desc': 'Noticed broken hardware, a software issue, or room malfunction? Submit a report directly to the admins.',
    'issue.target': 'Station / Hardware',
    'issue.targetPlaceholder': 'Select station or space',
    'issue.targetConsole': 'Console cabinet / Shared TV',
    'issue.targetNetwork': 'Network connection / Internet',
    'issue.targetFurniture': 'Furniture / Room cleanliness',
    'issue.targetOther': 'Other / General feedback',
    'issue.reportTitle': 'Title / Short summary',
    'issue.reportTitlePlaceholder': 'E.g. PC 3 monitor flickering',
    'issue.description': 'Description / Details',
    'issue.descriptionPlaceholder': 'Describe the issue with as much detail as possible...',
    'issue.name': 'Name (optional)',
    'issue.email': 'Email for follow-up',
    'issue.submit': 'Submit Report to Admin',
    'issue.submitting': 'Sending report...',
    'issue.success': 'Issue reported successfully! Admins have been notified.',
    'issue.successDetail': 'Report submitted to system administrators. Thank you for helping maintain the space!',
    'issue.validationError': 'Please fill in at least title and description.',
    'issue.tab': '⚠️ Bug Reports',

    // Landing Page
    'landing.welcome': 'Welcome to Xamk Game Room',
    'landing.subtitle': 'South-Eastern Finland University of Applied Sciences official gaming space.',
    'landing.newsHeader': '📢 News & Announcements',
    'landing.announcementsCount': 'announcements',
    'landing.noAnnouncements': 'No active announcements at the moment. Welcome to play!',
    'landing.rulesSummaryTitle': '📌 Game Room Rules in Brief:',
    'landing.rule1': 'A reservation must always be made before gaming.',
    'landing.rule2': 'Student quota is maximum 4 hours per day.',
    'landing.rule3': 'Always remember to sign out from Steam, Epic, and Discord accounts after your session.',
    'landing.rule4': 'The console cabinet shares a 4K TV: only one console can be in use at a time.',
    'landing.loginHeader': 'Log in to Game Room',
    'landing.loginNotice': 'The booking system and station reservations will open after logging in.',
    'landing.hoursTitle': 'Hours:',
    'landing.hoursValue': 'Mon–Fri 08:00–18:00',
    'landing.equipmentTitle': 'Available hardware:',
    'landing.equipmentValue': '6 PCs, PS5, Switch',
    'landing.discordLink': 'Join Discord ↗',
    'landing.rulesNotice': 'Check out the room guidelines and remember to sign out from personal gaming accounts (Steam, Discord).',
    'landing.statusPreview': 'Live Status',
    'landing.openFloorPlan': 'View Floor Plan',
    'landing.quickDevLogin': 'Quick login for testing:',

    // Wishlist & Games Catalog
    'games.title': 'Games & Wishlist',
    'games.subtitle': 'Explore games installed at Xamk Game Room and vote for your favorites on the student wishlist.',
    'games.filterAll': 'All Games',
    'games.installed': 'Installed',
    'games.loading': 'Loading games catalog...',
    'games.emptyWishlist': 'No games on the wishlist yet. Be the first to suggest one!',
    'games.emptyCategory': 'No games found in this category.',
    'games.noDesc': 'No detailed description.',
    'wishlist.tabCatalog': '🎮 Game Catalog',
    'wishlist.tabWishlist': '⭐ Wishlist',
    'wishlist.introTitle': '⭐ Student Wishlist & Voting',
    'wishlist.introDesc': 'Here are games suggested by students. Vote for your most desired games! Admins will acquire and install the top-voted games whenever possible.',
    'wishlist.proposeNew': '➕ Propose New Game',
    'wishlist.vote': '👍 Vote',
    'wishlist.votes': 'votes',
    'wishlist.voted': 'Voted!',
    'wishlist.propose': '⭐ Propose a Game',
    'wishlist.modalTitle': '⭐ Propose a Game to Wishlist',
    'wishlist.modalDesc': 'Would you like to play a specific game at Xamk Game Room? Submit your suggestion for peers to vote on and admins to acquire!',
    'wishlist.gameName': 'Game title',
    'wishlist.gameNamePlaceholder': 'e.g. Tekken 8 or Helldivers 2',
    'wishlist.platform': 'Platform',
    'wishlist.reasonDesc': 'Rationale or description (optional)',
    'wishlist.reasonPlaceholder': 'Why would this game be great for the room?',
    'wishlist.submitWish': 'Submit Wish',
    'wishlist.success': 'Wish added successfully! Admins will review the suggestion.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pelihuone_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    return saved === 'en' || saved === 'fi' ? saved : 'fi';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['fi']?.[key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
