# Rajapinta — pelihuoneen varausjärjestelmä

Tämä tiedosto kuvaa julkisen HTTP-rajapinnan lupaukset sanoina. Yksityiskohtaiset C#-tietosopimukset (`src/Contracts/`) löytyvät myös tiedostosta [`Docs/rajapinnat.md`](./rajapinnat.md).

## Versio

Kaikki reitit ovat polun `/api` alla. Rikkova muutos (kentän poistaminen tai nimen muuttaminen) vaatii uuden sopimusversion.

## Reitit

| Verbi ja polku | Tekeminen | Kuka |
|----------------|-----------|------|
| POST `/api/auth/send-code` | Lähettää 6-numeroisen vahvistuskoodin koulun sähköpostiin | Kaikki (`@edu.xamk.fi` / `@xamk.fi`) |
| POST `/api/auth/verify` | Vahvistaa koodin ja kirjaa käyttäjän sisään | Kaikki |
| POST `/api/auth/login` | Pikakirjautuminen koulun sähköpostilla | Kaikki |
| GET `/api/stations` | Listaa kaikki pelihuoneen 8 pelipistettä | Kaikki |
| GET `/api/stations/available` | Laskee vapaana olevat pelipisteet aikavälille (`startUtc`, `endUtc`) | Kaikki |
| GET `/api/reservations` | Listaa aktiiviset varaukset aikaväliltä sivuina | Kaikki |
| GET `/api/reservations/user/{userId}` | Listaa yhden käyttäjän omat varaukset sivuina | Opiskelija / Admin |
| POST `/api/reservations` | Luo uuden yksittäis- tai tilavarauksen | Opiskelija / Admin |
| POST `/api/reservations/override` | Luo `SuperAdmin`-tapahtuman ja peruuttaa ristiriitaiset varaukset | `SuperAdmin` |
| DELETE `/api/reservations/{id}` | Peruuttaa tulevan varauksen ennen sen alkua | Varaaja / Admin |
| GET `/api/games` | Listaa pelikatalogin ja toivelistan sivuina | Kaikki |
| POST `/api/games/wishlist` | Ehdottaa uutta peliä yhteisön toivelistalle | Opiskelija |
| POST `/api/games/{id}/upvote` | Äänestää toivelistalla olevaa peliä | Opiskelija |
| GET `/api/news` | Listaa pelihuoneen tiedotteet (kiinnitetyt ensin) | Kaikki |
| POST `/api/issues` | Lähettää vikailmoituksen rikkinäisestä laitteesta | Opiskelija / Admin |

## Kentät sanoina

Vastauksessa palautetaan vain DTO-sopimuksen (`src/Contracts/`) kentät. Domain-entiteettejä ei koskaan palauteta suoraan.

| Reitti | Sisään | Ulos |
|--------|--------|------|
| Kirjaudu (`/api/auth/verify`) | sähköposti, 6-numeroinen koodi, valinnainen näyttönimi | käyttäjän tunniste, sähköposti, näyttönimi, rooli (`User`, `Admin`, `SuperAdmin`) |
| Kaikki pelipisteet (`GET /api/stations`) | — | lista: tunniste, nimi, laitekoodi, tyyppi (`PC`, `PlayStation5`, `NintendoSwitch`), käyttääkö yhteistä TV:tä, onko käytössä |
| Vapaat pelipisteet (`GET /api/stations/available`) | alkuhetki (`startUtc`), loppuhetki (`endUtc`) | lista vapaista pelipisteistä samassa muodossa kuin yllä |
| Luo varaus (`POST /api/reservations`) | idempotenssiavain, käyttäjän tunniste, varaustyyppi (`1`=laite, `2`=tila, `3`=tapahtuma), pelipisteen tunniste (jos laitevaraus), alkuhetki, loppuhetki | luodun varauksen tunniste (`Guid`) |
| Jyräysvaraus (`POST /api/reservations/override`) | samat kuin varauksessa + tekijän `SuperAdmin`-tunniste ja peruutuksen syy | luodun tapahtumavarauksen tunniste (`Guid`) |
| Peru varaus (`DELETE /api/reservations/{id}`) | varauksen tunniste polussa, käyttäjän tunniste kyselyparametrina | `204 No Content` |
| Listaa varaukset (`GET /api/reservations`) | alkuhetki, loppuhetki, sivu, sivukoko | sivu, sivukoko, kokonaismäärä, varaukset (tunniste, tyyppi, pelipisteen nimi, alkuhetki, loppuhetki, tila) — **ei muiden opiskelijoiden sähköposteja julkisessa listassa** |

## Virheet

Kaikki virheet palautetaan RFC 9457 `ProblemDetails` -muodossa (`type`, `title`, `status`, `detail`). Sääntövirhe on **paluuarvo** (`Result<T>`) käyttötapauspalvelusta, ei poikkeus.

| Tilanne | Koodi | Virheen koodi (`title`) | Miksi |
|---------|-------|-------------------------|-------|
| Puuttuva tai väärän muotoinen kenttä, virheellinen sähköpostipääte tai kesto | `400 Bad Request` | `Error.Validation` / `Reservation.InvalidDuration` / `Reservation.OutsideOpeningHours` | Syötteen muoto- tai raja-arvovirhe tarkistetaan ennen tietokantahakua. |
| Käyttäjä on käyttöestossa tai hänellä ei ole `SuperAdmin`-oikeutta overrideen | `403 Forbidden` | `User.Banned` / `Reservation.UnauthorizedOverride` | Käyttäjä tunnistettiin, mutta oikeudet tai käyttöesto estävät toimenpiteen. |
| Pelipistettä, varausta tai käyttäjää ei löydy | `404 Not Found` | `GamingStation.NotFound` / `Reservation.NotFound` | Haettua tunnistetta ei ole olemassa. |
| Sääntö hylkää tilan vuoksi: pelipiste on jo varattu, yhteinen TV (`SharedTV`) on varattu toiselle konsolille, koko tila on varattu tai alkanutta varausta yritetään perua | `409 Conflict` | `Reservation.StationOverlap` / `Reservation.SharedTvConflict` / `Reservation.RoomReserved` / `Reservation.AlreadyStarted` | Pyyntö on muodoltaan kelvollinen, mutta järjestelmän nykyinen tila estää sen suorittamisen. |

## Paginaatio

Listausreitit (`GET /api/reservations`, `GET /api/reservations/user/{userId}`, `GET /api/games`) palauttavat sivutetun `PagedResult<T>`-rakenteen: `items`, `page`, `pageSize`, `totalCount`, `totalPages`. Oletussivukoko on 20, enimmäiskoko 100.

Poikkeus: `GET /api/stations` ja `GET /api/stations/available` eivät käytä sivutusta, koska pelihuoneessa on kiinteästi 8 pelipistettä ja aikataulumatriisi tarvitsee kaikki 8 pistettä yhdellä kertaa.

