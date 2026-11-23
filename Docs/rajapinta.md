# Rajapinta, pelihuoneen varausjärjestelmä

Tämä tiedosto kuvaa julkisen HTTP-rajapinnan lupaukset sanoina. Yksityiskohtaiset C#-tietosopimukset (`src/backend/Contracts/`) ja päätepisteiden tarkat DTO-mallit löytyvät tiedostosta [`Docs/rajapinnat.md`](./rajapinnat.md).

## Versio

Kaikki reitit ovat polun `/api` alla. Rikkova muutos (kentän poistaminen tai nimen muuttaminen) vaatii uuden sopimusversion.

## Reitit

### Autentikointi ja käyttäjät (`/api/auth` ja `/api/users`)

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| POST `/api/auth/send-code` | Lähettää 6-numeroisen vahvistuskoodin (OTP, 15 min) koulusähköpostiin | Kaikki (`@edu.xamk.fi` ja `@xamk.fi`) |
| POST `/api/auth/verify-code` | Vahvistaa koodin ja kirjaa käyttäjän sisään | Kaikki |
| POST `/api/auth/login` | Pikakirjautuminen koulun sähköpostilla kehityskäytössä | Kaikki |
| GET `/api/users` | Listaa järjestelmän käyttäjät | Admin ja SuperAdmin |
| GET `/api/users/{id}` | Hakee yksittäisen käyttäjän tiedot | Admin ja SuperAdmin |
| PUT `/api/users/{id}/role` | Muuttaa käyttäjän roolia (`User`, `Admin`, `SuperAdmin`) | SuperAdmin |
| PUT `/api/users/{id}/ban` | Asettaa tai poistaa käyttäjän käyttöeston syyn kera | Admin ja SuperAdmin |

### Pelipisteet (`/api/stations`)

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| GET `/api/stations` | Listaa kaikki aktiiviset pelipisteet (8 kpl) | Kaikki |
| GET `/api/stations/admin` | Listaa kaikki pelipisteet mukaan lukien huoltotilassa olevat | Admin ja SuperAdmin |
| GET `/api/stations/available` | Laskee vapaana olevat pelipisteet aikavälille (`startUtc`, `endUtc`) huomioiden `UsesSharedTv` | Kaikki |
| PUT `/api/stations/{id}/status` | Päivittää pelipisteen tilan (aktiivinen tai huollossa) ja näyttönimen | Admin ja SuperAdmin |

### Varaukset (`/api/reservations`)

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| GET `/api/reservations` | Listaa aktiiviset varaukset sivuina (tukee suodatusta: `userId`, `fromUtc`, `toUtc`) | Kaikki (julkinen listaus anonymisoitu) |
| GET `/api/reservations/{id}` | Hakee yksittäisen varauksen tiedot | Varaaja ja Admin |
| POST `/api/reservations` | Luo uuden yksittäis- (`Individual`), tila- (`Room`) tai tapahtumavarauksen (`Event`) | Kirjautunut käyttäjä ja Admin |
| POST `/api/reservations/override` | Luo `SuperAdmin`-tapahtuman ja peruuttaa päällekkäiset varaukset peruutussyyllä | SuperAdmin |
| DELETE `/api/reservations/{id}` | Peruuttaa tulevan varauksen ennen sen alkamista | Varaaja ja Admin |
| POST `/api/reservations/{id}/end` | Lopettaa käynnissä olevan aktiivisen varauksen kesken (`EndUtc = nowUtc`) ja vapauttaa laitteen | Varaaja ja Admin |

### Pelikirjasto ja toivelista (`/api/games`)

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| GET `/api/games` | Listaa pelikirjaston asennetut pelit | Kaikki |
| GET `/api/games/wishlist` | Listaa käyttäjien ehdottamat toivelistapelit äänimäärän mukaan | Kaikki |
| POST `/api/games/wishlist` | Ehdottaa uutta peliä toivelistalle | Kirjautunut käyttäjä |
| POST `/api/games` | Lisää uuden pelin suoraan pelikirjastoon | Admin ja SuperAdmin |
| PUT `/api/games/{id}/toggle-wishlist` | Siirtää pelin toivelistan ja asennettujen välillä | Admin ja SuperAdmin |
| POST `/api/games/{id}/vote` | Äänestää toivelistalla olevaa peliä | Kirjautunut käyttäjä |

### Tiedotteet (`/api/news`)

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| GET `/api/news` | Listaa tiedotteet (kiinnitetyt ensin, sitten uusimmat) | Kaikki |
| POST `/api/news` | Luo uuden tiedotteen | Admin ja SuperAdmin |
| DELETE `/api/news/{id}` | Poistaa tiedotteen | Admin ja SuperAdmin |

### Vikailmoitukset (`/api/issues`)

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| POST `/api/issues` | Lähettää vikailmoituksen rikkinäisestä laitteesta tai tilasta | Kaikki |
| GET `/api/issues` | Listaa kaikki vikailmoitukset (ratkaisemattomat ensin) | Admin ja SuperAdmin |
| PUT `/api/issues/{id}/resolve` | Merkitsee vikailmoituksen ratkaistuksi | Admin ja SuperAdmin |

### Asetukset ja tilastot (`/api/settings` ja `/api/statistics`)

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| GET `/api/settings` | Hakee järjestelmän aukioloajat, varauskiintiöt ja huoltotilan | Kaikki |
| PUT `/api/settings` | Päivittää aukioloaikoja, kiintiöitä, huoltotilaa tai Discord-webhookia | Admin ja SuperAdmin |
| GET `/api/statistics` | Hakee varausmäärien ja suosituimpien pelipisteiden tilastot | Admin ja SuperAdmin |

### Reaaliaikaiset ilmoitukset (SignalR `/hubs/gameroom`)

Palvelin lähettää SignalR-hubin (`GameRoomHub`, polku `/hubs/gameroom`) kautta reaaliaikaiset tapahtumat yhdistetyille selaimille onnistuneiden kirjoituskomentojen jälkeen:
- `ReservationChanged` (varauksen luonti, peruutus, kesken lopetus tai tapahtumavaraus)
- `StationStatusChanged` (pelipisteen huoltotilan muutos)
- `SettingsChanged` (sivuston asetusten tai huoneen huoltotilan muutos)
- `IssueReportChanged` (uusi vikailmoitus tai kuittaus)
- `NewsChanged` (tiedotteen julkaisu tai poisto)
- `GamesChanged` (pelin lisäys, toivelistaehdotus, tilanvaihto tai äänestys)

---

## Kentät sanoina

Vastauksessa palautetaan vain DTO-sopimuksen (`src/backend/Contracts/`) kentät. Domain-entiteettejä ei koskaan palauteta suoraan rajapinnasta.

| Reitti | Sisään | Ulos |
|--------|--------|------|
| Kirjaudu (`/api/auth/verify-code`) | sähköposti, 6-numeroinen koodi, valinnainen näyttönimi | käyttäjän tunniste (`Guid`), sähköposti, näyttönimi, rooli (`User`, `Admin`, `SuperAdmin`), käyttöestotiedot |
| Kaikki pelipisteet (`GET /api/stations`) | Ei syötettä | lista: tunniste (`Id`), nimi (`Name`), tyyppi (`Type`), käyttääkö yhteistä TV:tä (`UsesSharedTv`), onko käytössä (`IsActive`) |
| Vapaat pelipisteet (`GET /api/stations/available`) | alkuhetki (`startUtc`), loppuhetki (`endUtc`) | lista vapaista pelipisteistä samassa muodossa kuin yllä |
| Luo varaus (`POST /api/reservations`) | idempotenssiavain, käyttäjän tunniste, varaustyyppi (`1`=laite, `2`=tila, `3`=tapahtuma), pelipisteen tunniste (jos laitevaraus), alkuhetki, loppuhetki | `201 Created`: luodun varauksen täysi vastausmalli (`ReservationResponse`) |
| Jyräysvaraus (`POST /api/reservations/override`) | varauspyyntö (`reservationRequest`) ja peruutussyy (`reason`) | `201 Created`: luodun tapahtumavarauksen vastausmalli (`ReservationResponse`) |
| Peru varaus (`DELETE /api/reservations/{id}`) | varauksen tunniste polussa, pyynnön rungossa käyttäjän tunniste ja peruutussyy (`CancelReservationRequest`) | `200 OK`: peruutettu varaus päivitettynä (`ReservationResponse`, `Status = Cancelled`) |
| Lopeta varaus kesken (`POST /api/reservations/{id}/end`) | varauksen tunniste polussa, pyynnön rungossa käyttäjän tunniste (`EndReservationRequest`) | `200 OK`: päättymisajaltaan katkaistu varaus (`ReservationResponse`, `EndUtc = nowUtc`) |
| Listaa varaukset (`GET /api/reservations`) | valinnaiset kyselyparametrit: `userId`, `fromUtc`, `toUtc`, `page`, `pageSize` | sivutettu vastaus (`PagedResult<ReservationResponse>`): varaukset (tunniste, varaustyyppi, laitetunniste, alku, loppu, kesto, tila). Muiden opiskelijoiden sähköpostit ja nimet anonymisoidaan julkisesta listasta. |

---

## Virheet

Kaikki virheet palautetaan RFC 9457 ProblemDetails -muodossa (`type`, `title`, `status`, `detail`). Sääntövirhe on paluuarvo (`Result<T>`) käyttötapauspalvelusta, ei poikkeus.

| Tilanne | Koodi | Virheen koodi (`title`) | Miksi |
|---------|-------|-------------------------|-------|
| Puuttuva tai väärän muotoinen kenttä, virheellinen sähköpostipääte tai sääntöjen vastainen kesto | `400 Bad Request` | `Error.Validation` / `Reservation.InvalidDuration` / `Reservation.OutsideOpeningHours` / `Reservation.StartInPast` | Syötteen muoto- tai raja-arvovirhe tarkistetaan ennen tietokantahakua. |
| Käyttäjä on käyttöestossa tai yritetään toimenpidettä ilman vaadittua roolia (`Admin`/`SuperAdmin`) | `403 Forbidden` | `User.Banned` / `Reservation.UnauthorizedOverride` / `Reservation.Forbidden` | Käyttäjä tunnistettiin, mutta oikeudet tai aktiivinen banni estävät toimenpiteen. |
| Pelipistettä, varausta tai käyttäjää ei löydy | `404 Not Found` | `GamingStation.NotFound` / `Reservation.NotFound` / `User.NotFound` | Haettua tunnistetta ei ole tietokannassa. |
| Sääntö hylkää tilan vuoksi: pelipiste on jo varattu, yhteinen TV (`SharedTV`) on varattu toiselle konsolille, koko tila on varattu, alkanutta varausta yritetään perua tai ei-käynnissä olevaa varausta yritetään lopettaa kesken | `409 Conflict` | `Reservation.StationOverlap` / `Reservation.SharedTvConflict` / `Reservation.RoomReserved` / `Reservation.AlreadyStarted` / `Reservation.CannotEndEarly` | Pyyntö on muodoltaan kelvollinen, mutta järjestelmän nykytila estää sen suorittamisen. |

---

## Paginaatio

Listausreitit (`GET /api/reservations`, `GET /api/games`) palauttavat sivutetun `PagedResult<T>`-rakenteen: `items`, `page`, `pageSize`, `totalCount`, `totalPages`. Oletussivukoko on 20, enimmäiskoko 100.

Poikkeus: `GET /api/stations` ja `GET /api/stations/available` eivät käytä sivutusta, koska pelihuoneessa on kiinteästi 8 pelipistettä ja aikataulumatriisi tarvitsee kaikki 8 pistettä yhdellä kertaa.
