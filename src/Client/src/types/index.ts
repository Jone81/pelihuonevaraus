/**
 * @file index.ts
 * @description Sovelluksen jaetut TypeScript-tyypit ja tietomallien rajapinnat (DTO).
 * Nämä vastaavat backend-palvelimen REST API -rajapinnan tietorakenteita.
 */

/** Käyttäjän käyttöoikeusrooli järjestelmässä */
export type UserRole = 'User' | 'Admin' | 'SuperAdmin';

/**
 * Järjestelmään kirjautuneen tai rekisteröityneen käyttäjän tiedot.
 */
export interface User {
  /** Käyttäjän yksilöllinen tunniste (GUID) */
  id: string;
  /** Oppilaitoksen sähköpostiosoite (@edu.xamk.fi tai @xamk.fi) */
  email: string;
  /** Käyttäjän näyttönimi tai nimimerkki */
  displayName: string;
  /** Käyttäjän rooli (User, Admin tai SuperAdmin) */
  role: UserRole;
  /** Käyttöeston (bannin) päättymisaika ISO 8601 UTC -muodossa tai null */
  bannedUntilUtc?: string | null;
  /** Ylläpitäjän kirjaama syy käyttöestolle */
  banReason?: string | null;
  /** Ilmaisee, onko käyttäjä parhaillaan käyttöestossa (bannattu) */
  isBanned?: boolean;
}

/**
 * Pyyntö käyttäjän määräaikaisen tai pysyvän käyttöeston (bannin) asettamiseksi tai poistamiseksi.
 */
export interface BanUserRequest {
  /** Käyttöeston pituus tunteina (null tai <= 0 poistaa eston, jos isPermanent on false) */
  durationHours: number | null;
  /** Valinnainen syy tai selite käyttöestolle */
  reason?: string | null;
  /** Asetetaanko käyttäjälle pysyvä käyttöesto */
  isPermanent?: boolean;
}

/**
 * Varaustyypin numeerinen koodi:
 * 1 = Yksittäinen pelipiste (Individual)
 * 2 = Koko pelitila (Room)
 * 3 = Tapahtuma / Admin-varaus (Event)
 */
export type ReservationType = 1 | 2 | 3; // 1 = Individual, 2 = Room, 3 = Event

/**
 * Yksittäisen pelipisteen tai konsolin tiedot.
 */
export interface GamingStation {
  /** Pelipisteen yksilöllinen tunniste */
  id: string;
  /** Pelipisteen näyttönimi (esim. "PC 1" tai "PlayStation 5") */
  name: string;
  /** Valinnainen laitekoodi */
  stationCode?: string;
  /** Laitteen tyyppi tai kategoria (esim. "PC", "PS5", "Switch") */
  type: string;
  /** Käyttääkö laite konsolikaapin yhteistä televisiota (lukitsee toisen konsolin varauksen ajaksi) */
  usesSharedTv: boolean;
  /** Onko pelipiste aktiivinen ja varattavissa */
  isActive: boolean;
}

/**
 * Yksittäisen varauksen tiedot.
 */
export interface Reservation {
  /** Varauksen yksilöllinen tunniste */
  id: string;
  /** Varauksen tehneen käyttäjän tunniste */
  userId: string;
  /** Varaustyyppi merkkijonona (esim. "Individual", "Room", "Event") */
  reservationType: string;
  /** Varatun pelipisteen tunniste (jos yksittäinen laitevaraus) */
  gamingStationId?: string | null;
  /** Pelitilan tunniste (jos koko tilan tai tapahtuman varaus) */
  gameRoomId?: string | null;
  /** Varauksen alkamisaika ISO 8601 UTC -muodossa */
  startUtc: string;
  /** Varauksen päättymisaika ISO 8601 UTC -muodossa */
  endUtc: string;
  /** Varauksen kesto minuutteina */
  durationMinutes: number;
  /** Varauksen tila: voimassa ('Active') tai peruttu ('Cancelled') */
  status: 'Active' | 'Cancelled';
  /** Varauksen luontiaika UTC-muodossa */
  createdAtUtc: string;
  /** Mahdollinen peruutuksen tai jyräyksen syy */
  cancellationReason?: string | null;
  /** Varaajan nimi (näytetään julkisesti tilavarauksissa) */
  bookerName?: string | null;
  /** Varaajan sähköposti (näytetään julkisesti tilavarauksissa yhteydenottoa varten) */
  bookerEmail?: string | null;
}

/**
 * Pyyntö uuden varauksen luomiseksi.
 */
export interface CreateReservationRequest {
  /** Idempotenssiavain tuplalähetysten estämiseksi */
  idempotencyKey: string;
  /** Varaajan käyttäjätunniste */
  userId: string;
  /** Varaustyyppi (1 = Laite, 2 = Tila, 3 = Tapahtuma) */
  reservationType: ReservationType;
  /** Varattavan pelipisteen tunniste (pakollinen tyypillä 1) */
  gamingStationId?: string | null;
  /** Alkamisaika UTC-muodossa */
  startUtc: string;
  /** Päättymisaika UTC-muodossa */
  endUtc: string;
}

/**
 * Pyyntö olemassa olevan varauksen peruuttamiseksi.
 */
export interface CancelReservationRequest {
  /** Peruutusta pyytävän käyttäjän tunniste */
  userId: string;
  /** Valinnainen peruutuksen syy */
  reason?: string;
}

/**
 * SuperAdmin-pyyntö päällekkäisten varausten jyräämiseksi ja uuden varauksen luomiseksi.
 */
export interface OverrideReservationRequest {
  /** Uuden luotavan varauksen tiedot */
  reservationRequest: CreateReservationRequest;
  /** Perustelu jyräykselle (tallennetaan peruttavien varausten peruutussyyksi) */
  reason: string;
}

/**
 * Pelivalikoiman tai toivelistan pelin tiedot.
 */
export interface Game {
  /** Pelin yksilöllinen tunniste */
  id: string;
  /** Pelin nimi */
  name: string;
  /** Alusta, jolle peli kuuluu (esim. "PC", "PS5", "Switch") */
  platform: string;
  /** Pelin kuvaus tai toiveen perustelu */
  description: string;
  /** Onko peli opiskelijoiden toivelistalla (`true`) vai jo asennettuna tilaan (`false`) */
  isWishlist: boolean;
  /** Toivelistapelin saamien äänten lukumäärä */
  votesCount?: number;
}

/**
 * Pyyntö uuden vikailmoituksen luomiseksi.
 */
export interface CreateIssueReportRequest {
  /** Ilmoittajan sähköpostiosoite yhteydenottoa varten */
  reporterEmail?: string;
  /** Ilmoittajan nimi */
  reporterName?: string;
  /** Vian kohde tai laite (esim. "PC 1" tai "Verkkoyhteys") */
  target: string;
  /** Vikailmoituksen lyhyt otsikko */
  title: string;
  /** Tarkempi kuvaus ongelmasta */
  description: string;
}

/**
 * Palvelimelta palautettavan vikailmoituksen tiedot.
 */
export interface IssueReportResponse {
  /** Vikailmoituksen tunniste */
  id: string;
  /** Ilmoittajan sähköposti */
  reporterEmail: string;
  /** Ilmoittajan nimi */
  reporterName: string;
  /** Vian kohde tai laite */
  target: string;
  /** Vikailmoituksen otsikko */
  title: string;
  /** Vikailmoituksen kuvaus */
  description: string;
  /** Luontiaika ISO-muodossa */
  createdAt: string;
  /** Onko vikailmoitus merkitty ratkaistuksi */
  isResolved: boolean;
  /** Ratkaisuaika ISO-muodossa */
  resolvedAt?: string | null;
  /** Ylläpidon kirjaamat muistiinpanot tai ratkaisukuvaus */
  adminNotes?: string | null;
}

/**
 * Pyyntö vikailmoituksen merkitsemiseksi ratkaistuksi.
 */
export interface ResolveIssueReportRequest {
  /** Ylläpidon valinnainen kommentti ratkaisusta */
  adminNotes?: string;
}

/**
 * Opiskelijan pyyntö uuden pelin ehdottamiseksi toivelistalle.
 */
export interface WishGameRequest {
  /** Ehdotettavan pelin nimi */
  name: string;
  /** Pelialusta */
  platform: string;
  /** Perustelu tai kuvaus */
  description: string;
}

/**
 * Admin-pyyntö uuden pelin lisäämiseksi pelivalikoimaan tai toivelistalle.
 */
export interface CreateGameRequest {
  /** Pelin nimi */
  name: string;
  /** Pelialusta */
  platform: string;
  /** Pelin kuvaus */
  description: string;
  /** Lisätäänkö toivelistalle (`true`) vai suoraan asennettuihin (`false`) */
  isWishlist?: boolean;
}

/**
 * Tiedotteen tai uutisen tiedot.
 */
export interface NewsItem {
  /** Tiedotteen yksilöllinen tunniste */
  id: string;
  /** Tiedotteen otsikko */
  title: string;
  /** Tiedotteen sisältöteksti */
  content: string;
  /** Tiedotteen julkaisseen admin-käyttäjän tunniste */
  authorUserId: string;
  /** Julkaisuaika UTC-muodossa */
  createdAtUtc: string;
  /** Onko tiedote kiinnitetty tärkeäksi tiedotteeksi */
  isPinned: boolean;
}

/**
 * Admin-pyyntö uuden tiedotteen luomiseksi.
 */
export interface CreateNewsRequest {
  /** Tiedotteen otsikko */
  title: string;
  /** Tiedotteen leipäteksti */
  content: string;
  /** Julkaisijan käyttäjätunniste */
  authorUserId: string;
  /** Kiinnitetäänkö tiedote listan kärkeen */
  isPinned?: boolean;
}

/**
 * RFC 7807 -standardin mukainen virhekuvausobjekti taustajärjestelmältä.
 */
export interface ProblemDetails {
  /** Virhetyypin URI-viite */
  type?: string;
  /** Lyhyt yhteenveto virheestä */
  title?: string;
  /** HTTP-statuskoodi */
  status?: number;
  /** Yksityiskohtainen selitys virheestä käyttäjälle */
  detail?: string;
  /** Pyynnön polku tai instanssi */
  instance?: string;
  /** Sovelluskohtainen virhekoodi */
  code?: string;
  /** Jäljitystunniste lokitusta varten */
  traceId?: string;
}

/**
 * Yksittäisen pelipisteen käyttötilasto.
 */
export interface StationUsageStat {
  /** Pelipisteen tunniste */
  stationId: string;
  /** Pelipisteen nimi */
  stationName: string;
  /** Pelipisteen tyyppi */
  stationType: string;
  /** Varausten kokonaismäärä */
  reservationCount: number;
  /** Varattujen tuntien kokonaismäärä */
  totalHours: number;
}

/**
 * Varaustyyppikohtainen tilastoerittely.
 */
export interface ReservationTypeStat {
  /** Varaustyyppi (esim. "Individual", "Room", "Event") */
  reservationType: string;
  /** Kyseisen tyypin varausten lukumäärä */
  count: number;
}

/**
 * Ylläpitopaneelin tilastonäkymän kokonaisdata.
 */
export interface StatisticsResponse {
  /** Kaikkien varausten kokonaismäärä */
  totalReservations: number;
  /** Aktiivisten varausten määrä */
  activeReservations: number;
  /** Peruttujen varausten määrä */
  cancelledReservations: number;
  /** Rekisteröityneiden käyttäjien määrä */
  totalUsers: number;
  /** Pelivalikoiman pelien kokonaismäärä */
  totalGames: number;
  /** Toivelistalla olevien pelien määrä */
  wishlistGamesCount: number;
  /** Pelipistekohtaiset käyttötilastot */
  stationUsage: StationUsageStat[];
  /** Varausten jakauma tyypeittäin */
  typeBreakdown: ReservationTypeStat[];
}

/**
 * Sivuston yleiset asetukset, aukioloajat, varausrajoitukset ja huoltotila.
 */
export interface SiteSettingsResponse {
  /** Discord-webhookin URL-osoite ilmoituksia varten */
  discordWebhookUrl: string;
  /** Aukioloaikojen esitysteksti (esim. "08:00 – 18:00 (Ma–Pe)") */
  openingHoursText: string;
  /** Päivittäinen avaamiskellonaika täysinä tunteina (0–23) */
  openTimeHour: number;
  /** Päivittäinen sulkemiskellonaika täysinä tunteina (1–24) */
  closeTimeHour: number;
  /** Onko pelitila avoinna vain arkipäivisin (ma–pe) vai joka päivä (ma–su) */
  onlyWeekdays: boolean;
  /** Kuinka monta kuukautta etukäteen varauksia voi tehdä */
  maxAdvanceBookingMonths: number;
  /** Yksittäisen laitevarauksen ja päiväkiintiön enimmäiskesto tunteina */
  maxIndividualHours: number;
  /** Opiskelijan tilavarauksen enimmäiskesto tunteina */
  maxStudentRoomHours: number;
  /** Varauksen vähimmäiskesto minuutteina (esim. 30 tai 60) */
  minReservationMinutes: number;
  /** Valvotaanko konsolien (PS5 ja Switch) yhteisen television rinnakkaislukkoa */
  enforceSharedTvLock: boolean;
  /** Onko pelihuone asetettu tilapäiseen huoltotilaan (estää uudet opiskelijavaraukset) */
  isMaintenanceMode: boolean;
  /** Käyttäjille näytettävä tiedote huoltokatkon syystä */
  maintenanceMessage: string;
}

/**
 * Pyyntö sivuston asetusten ja varauskiintiöiden päivittämiseksi.
 */
export interface UpdateSiteSettingsRequest {
  /** Uusi Discord-webhookin URL-osoite */
  discordWebhookUrl?: string;
  /** Uusi avaamiskellonaika täysinä tunteina (0–23) */
  openTimeHour?: number;
  /** Uusi sulkemiskellonaika täysinä tunteina (1–24) */
  closeTimeHour?: number;
  /** Onko pelitila avoinna vain arkisin (ma–pe) */
  onlyWeekdays?: boolean;
  /** Ennakkovarauksen enimmäisaika kuukausina (1–12) */
  maxAdvanceBookingMonths?: number;
  /** Yksittäisvarauksen ja päiväkiintiön enimmäiskesto tunteina (1–12) */
  maxIndividualHours?: number;
  /** Opiskelijan tilavarauksen enimmäiskesto tunteina (1–12) */
  maxStudentRoomHours?: number;
  /** Varauksen vähimmäiskesto minuutteina (30–240) */
  minReservationMinutes?: number;
  /** Valvotaanko konsolien (PS5 ja Switch) yhteisen television rinnakkaislukkoa */
  enforceSharedTvLock?: boolean;
  /** Onko pelihuone tilapäisessä huoltotilassa */
  isMaintenanceMode?: boolean;
  /** Huoltotiedotteen viesti */
  maintenanceMessage?: string;
}

/**
 * Admin-pyyntö yksittäisen pelipisteen käyttötilan (käytössä / huollossa) päivittämiseksi.
 */
export interface UpdateGamingStationStatusRequest {
  /** Asetetaanko pelipiste aktiiviseksi (`true`) vai huoltotilaan (`false`) */
  isActive: boolean;
  /** Valinnainen uusi näyttönimi */
  name?: string;
}
