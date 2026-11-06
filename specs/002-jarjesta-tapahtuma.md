# Spec 002 — Järjestä tapahtuma ja hallitse tilaa

## Tarina

Opettajana (`SuperAdmin`) tai pelihuoneen ylläpitäjänä (`Admin`) haluan varata koko pelihuoneen tapahtumaa tai turnausta varten, jyrätä tarvittaessa päällekkäiset yksittäisvaraukset selkeällä peruutussyyllä sekä hallita laitteiden huoltotiloja ja käyttöestoja, jotta kampuksen turnaukset ja tilan ylläpito sujuvat ilman ristiriitoja.

## Käsitteet

Sanasto ja kentät: `Docs/domain.md` sekä rakennepäätös `Docs/adr/0001-tapahtuma-ja-pelipisteet.md`. Ei uusia sanoja.

## Tekemiset

| Tekeminen | Onnistuu kun | Epäonnistuu kun |
|-----------|--------------|-----------------|
| Varaa koko tila (`Room`) | Tilassa ei ole yhtäkään päällekkäistä yksittäis- tai tilavarausta valitulla aikavälillä. | Yksikin pelipiste tai tila on varattu → `409 Conflict` (`Reservation.RoomBusy`). |
| Järjestä tapahtuma jyräyksellä (`Override`) | Tekijä on `SuperAdmin` ja antaa peruutussyyn. Luo koko tilan tapahtumavarauksen (`Event`) ja merkitsee kaikki aikavälille osuvat opiskelijavaraukset tilaan `Cancelled` annetulla syyllä. | Tekijä ei ole `SuperAdmin` → `403 Forbidden` (`Reservation.UnauthorizedOverride`). Peruutussyy puuttuu → `400 Bad Request`. |
| Aseta laite huoltotilaan | Tekijä on `Admin` tai `SuperAdmin`. Pelipisteen `IsActive`-tila päivittyy. | Ei-aktiivista laitetta yritetään varata → `409 Conflict` (`GamingStation.NotActive`). |
| Aseta käyttäjä käyttöestoon (`Ban`) | Tekijä on `Admin` tai `SuperAdmin`, kohde ei ole `SuperAdmin`, ja syy on annettu. | Kohde on `SuperAdmin` → hylätään (`DomainException` / `400`). Tekijä on tavallinen `User` → `403 Forbidden`. |

## Säännöt ja Paikka

Vain viittaukset `Docs/domain.md`:n riveihin ja `ADR 0001`:een:

- **1** (aikaikkunan loppu > alku) — `TimeWindow` (Domain)
- **2** (`SuperAdmin` saa varata myös aukioloaikojen ulkopuolelle) — `OpeningHours` / `ReservationService`
- **4** (tila- ja tapahtumavarauksella on oltava `GameRoomId`, ei yksittäistä `GamingStationId`:tä) — `Reservation.Create` (Domain)
- **7** (tapahtuman tai tilavarauksen aikana ei sallita yksittäisvarauksia, eikä normaalia tilavarausta voi luoda varatun laitteen päälle) — `ReservationService` (Use case)
- **10** (`SuperAdmin`-override peruuttaa päällekkäiset varaukset syykoodilla) — `ReservationService.OverrideAndCreateEventAsync` (Use case; `ADR 0001`)
- **11** (käyttöestossa oleva käyttäjä ei voi varata, eikä `SuperAdmin`-tiliä voi bannata) — `User.Ban` (Domain) + `ReservationService` (Use case)

## Hyväksymiskriteerit

Lähtötila on `Docs/testaus.md`:n testiaineisto: kello on keskiviikko klo **09:00**, pelihuoneessa on 8 vapaata pelipistettä.

1. **Given:** tilassa ei ole varauksia klo 12:00–16:00. **When:** ylläpitäjä luo koko tilan varauksen (`ReservationType.Room`) klo 12:00–16:00. **Then:** varaus syntyy (`201 Created`) ja `GET /api/stations/available` klo 12:00–16:00 palauttaa **0 vapaata pelipistettä**.
2. **Given:** opiskelija 1 on varannut `PC 1`:n klo 13:00–15:00 ja opiskelija 2 `PlayStation 5`:n klo 14:00–16:00. **When:** `SuperAdmin` kutsuu `POST /api/reservations/override` klo 12:00–18:00 syyllä `"Xamk CS2 LAN-turnaus"`. **Then:** tapahtuma syntyy (`201 Created`), molempien opiskelijoiden varaukset siirtyvät tilaan `Cancelled` syyllä `"Xamk CS2 LAN-turnaus"`, ja koko tila on varattu tapahtumalle.
3. **Given:** koko tilassa on aktiivinen tapahtuma klo 12:00–18:00. **When:** opiskelija 1 yrittää varata `PC 4`:n klo 14:00–15:00. **Then:** hylätään (`409 Conflict`, `Reservation.RoomReserved`).
4. **Given:** opiskelija 1 on varannut `PC 2`:n klo 13:00–15:00. **When:** opiskelija 2 yrittää tehdä tavallisen koko tilan varauksen (`POST /api/reservations`, `ReservationType.Room`) klo 12:00–16:00 ilman overridea. **Then:** hylätään (`409 Conflict`, `Reservation.RoomBusy`).
5. **Given:** opiskelija 1 on varannut `PC 2`:n klo 13:00–15:00. **When:** tavallinen opiskelija (tai `Admin`, joka ei ole `SuperAdmin`) kutsuu `POST /api/reservations/override`. **Then:** hylätään (`403 Forbidden`, `Reservation.UnauthorizedOverride`), eikä opiskelijan 1 varausta peruta.
6. **Given:** opiskelija 1 asetetaan käyttöestoon (`PUT /api/users/{id}/ban`, kesto 24 h, syy `"Sääntörikkomus"`). **When:** opiskelija 1 yrittää luoda uuden varauksen. **Then:** hylätään (`403 Forbidden`, `User.Banned`), ja jos ylläpitäjä yrittää bannata `SuperAdmin`-käyttäjän, `User.Ban` estää sen Domain-tasolla.
7. **Given:** `SuperAdmin` luo tapahtuman lauantaille klo 18:00–22:00 (normaalien arkiaukioloaikojen ulkopuolelle). **When:** kutsu lähetetään `SuperAdmin`-tunnuksella. **Then:** varaus hyväksytään (`201 Created`).

Kriteerit 4 (kohdistussääntö) ja 6 (`SuperAdmin`-bannauskielto) ajetaan myös suoraan Domain-yksikkötesteinä.

## Ei-tavoitteet

- Ei peruutettujen opiskelijavarausten automaattista siirtämistä seuraavalle päivälle (opiskelija valitsee itse uuden ajan).
- Ei turnauskaavioiden tai otteluparien hallintaa tässä järjestelmässä.

## Tehtävät

1. **Domain: `Reservation`-luontisääntö (#4) koko tilan ja tapahtuman varauksille sekä `User.Ban` / `Unban` (#11).** Valmis kun Domain-yksikkötestit ovat vihreitä (`tests/Application.Tests`).
2. **Application: `ReservationService.OverrideAndCreateEventAsync` (sääntö #10, `ADR 0001`) sekä koko tilan päällekkäisyyssäännöt (#7).** Valmis kun kriteerit 1–7 menevät läpi Application-yksikkötesteinä (`tests/Application.Tests`).
3. **Infrastructure: `GetOverlappingRoomReservationsAsync` ja `GetAllOverlappingInRoomAsync` -kyselyt sekä `OutboxInterceptor`-tallennus peruutetuille varauksille.** Valmis kun testit menevät läpi (`tests/Infrastructure.Tests` ja `tests/Integration.Tests`).
4. **API: `POST /api/reservations/override`, `PUT /api/stations/{id}/status`, `PUT /api/users/{id}/ban` ja `PUT /api/settings` -päätepisteet.** Valmis kun kriteerit 1–7 menevät läpi HTTP-tasolla (`tests/WebApi.Tests`).
