# Spec 001 — Varaa pelipiste

## Tarina

Opiskelijana haluan nähdä, mitkä pelipisteet ovat vapaana tänään tai valitsemanani arkipäivänä, varata vapaan pelipisteen (esim. `PC 2` tai `PlayStation 5`) haluamalleni aikavälille klo 08:00–18:00 ja tarvittaessa perua varaukseni ennen sen alkua, jotta pääsen pelaamaan ilman tuplavarauksia tai kiistaa yhteisestä televisiosta.

## Käsitteet

Sanasto ja kentät: `Docs/domain.md`. Ei uusia sanoja.

## Tekemiset

| Tekeminen | Onnistuu kun | Epäonnistuu kun |
|-----------|--------------|-----------------|
| Katso vapaat pelipisteet | Aikaikkunan loppu > alku. Palauttaa kaikki aktiiviset pelipisteet, joilla ei ole päällekkäistä varausta, koko tilan varausta eikä `SharedTV`-lukkoa. | Loppu ≤ alku → `400 Bad Request`. |
| Varaa pelipiste | Käyttäjällä on `@edu.xamk.fi` / `@xamk.fi` -tunnus eikä käyttöestoa; aika on arkipäivänä klo 08:00–18:00, kesto 30 min – 4 h, enintään 2 kk etukäteen; pelipiste ja mahdollinen `SharedTV` ovat vapaana eikä koko tilassa ole tapahtumaa. | Muoto- tai raja-arvovirhe → `400`. Käyttöesto → `403`. Laite varattu, `SharedTV` varattu tai koko tila varattu → `409 Conflict` ja syy. |
| Peru varaus | Pyynnön tekijä on varauksen omistaja (tai `Admin`), varaus on tilassa `Active` ja nykyhetki on ennen varauksen alkamisaikaa (`nowUtc < StartUtc`). | Toisen opiskelijan varaus → `403`. Jo alkanut tai jo peruttu varaus → `409 Conflict` ja syy. |
| Listaa omat varaukset | Käyttäjä on tunnistettu. Palauttaa käyttäjän varaukset sivuina. | — |

## Säännöt ja Paikka

Vain viittaukset `Docs/domain.md`:n riveihin, ei kopiota:

- **1** (aikaikkunan loppu > alku) — `TimeWindow` (Domain)
- **2** (aukioloajat 08:00–18:00, ei menneisyyteen) — `OpeningHours` / `ReservationService`
- **3** (kesto 30 min – 4 h, ennakko max 2 kk) — `Reservation` / `ReservationService`
- **4** (yksittäisvarauksella on oltava pelipiste) — `Reservation.Create` (Domain)
- **5** (peruutus vain ennen alkamista ja vain kerran) — `Reservation.Cancel` (Domain)
- **6** (samaa pelipistettä ei kahdelle samaan aikaan) — `ReservationService` (Use case)
- **7** (ei yksittäisvarauksia koko tilan varauksen tai tapahtuman aikana) — `ReservationService` (Use case)
- **8** (konsolien yhteinen TV: `PlayStation 5` ↔ `Nintendo Switch`) — `ReservationService` (Use case)
- **9** (vain `@edu.xamk.fi` / `@xamk.fi` sähköposti) — `SchoolEmail` (Domain)
- **11** (käyttöestossa oleva ei voi varata) — `User` / `ReservationService`

## Hyväksymiskriteerit

Lähtötila on `Docs/testaus.md`:n testiaineisto: kello on keskiviikko klo **09:00**, kaikki 8 pelipistettä (`PC 1`–`PC 6`, `PlayStation 5`, `Nintendo Switch`) ovat aktiivisia ja vapaita.

1. **Given:** `PC 2` on vapaa klo 10:00–12:00. **When:** opiskelija 1 varaa `PC 2`:n klo 10:00–12:00. **Then:** varaus syntyy (`201 Created`) ja `GET /api/stations/available` klo 10:00–12:00 palauttaa 7 vapaata pistettä (ei `PC 2`:ta).
2. **Given:** lähtötila. **When:** opiskelija 1 yrittää luoda varauksen, jonka alkuaika on klo 14:00 ja loppuaika klo 12:00. **Then:** hylätään (`400 Bad Request`), syy: loppuajan on oltava alkuajan jälkeen.
3. **Given:** lähtötila. **When:** opiskelija 1 yrittää varata `PC 1`:n klo 17:00–19:00 (aukioloajan 08:00–18:00 ulkopuolelle). **Then:** hylätään (`400 Bad Request`, `Reservation.OutsideOpeningHours`).
4. **Given:** kello on 09:00. **When:** opiskelija 1 yrittää varata `PC 1`:n samalle päivälle klo 08:00–09:00 (menneisyyteen). **Then:** hylätään (`400 Bad Request`).
5. **Given:** lähtötila. **When:** opiskelija 1 yrittää varata `PC 1`:n 15 minuutiksi (klo 10:00–10:15). **Then:** hylätään (`400 Bad Request`, vähimmäiskesto 30 min).
6. **Given:** lähtötila. **When:** opiskelija 1 yrittää varata `PC 1`:n 5 tunniksi (klo 10:00–15:00). **Then:** hylätään (`400 Bad Request`, yksittäisvarauksen enimmäiskesto 4 h).
7. **Given:** opiskelija 1 on varannut `PC 2`:n klo 10:00–12:00. **When:** opiskelija 2 yrittää varata `PC 2`:n klo 11:00–13:00. **Then:** hylätään (`409 Conflict`, `Reservation.StationOverlap`).
8. **Given:** opiskelija 1 on varannut `PlayStation 5`:n klo 14:00–16:00. **When:** opiskelija 2 yrittää varata `Nintendo Switch`:n klo 15:00–17:00. **Then:** hylätään (`409 Conflict`, `Reservation.SharedTvConflict`), koska konsolit jakavat saman television, eikä `Nintendo Switch` näy vapaiden laitteiden listassa klo 14:00–16:00.
9. **Given:** opiskelijalla 1 on varaus klo 14:00–16:00 ja kello on 09:00. **When:** opiskelija 1 peruu varauksensa. **Then:** peruutus onnistuu (`200 OK`), varauksen tila on `Cancelled` ja laite on jälleen vapaa klo 14:00–16:00.
10. **Given:** opiskelijalla 1 on varaus klo 10:00–12:00 ja kello siirretään aikaan **10:30** (varaus on jo alkanut). **When:** opiskelija 1 yrittää perua varauksen. **Then:** hylätään (`409 Conflict`, `Reservation.AlreadyStarted`).
11. **Given:** käyttäjä yrittää kirjautua sähköpostilla `pelaaja@gmail.com`. **When:** kutsutaan kirjautumista. **Then:** hylätään (`400 Bad Request`), koska vain `@edu.xamk.fi` ja `@xamk.fi` sallitaan.

Kriteerit 2, 4, 9, 10 ja 11 todennetaan myös suoraan yksikkötesteinä ilman tietokantaa tai HTTP-palvelinta.

## Ei-tavoitteet

- Ei toistuvia viikkovarauksia (jokainen varaus tehdään erikseen).
- Ei jonotuslistaa varatuille pelipisteille.
- Ei automaattista toisen opiskelijan varauksen jyräämistä opiskelijaroolilla (se kuuluu vain `SuperAdmin`-roolille, ks. `Spec 002`).

## Tehtävät

Yksi askel kerrallaan. Jokaisella askeleella on oma todennettava valmiuskriteerinsä.

1. **Domain: `TimeWindow`, `OpeningHours`, `SchoolEmail`, `Reservation`, `GamingStation`, `User` ja säännöt 1, 4, 5, 9.** Nykyhetki annetaan parametrina. Valmis kun `tests/Application.Tests` Domain-testit ovat vihreitä eikä `src/Domain` viittaa ulkoisiin paketteihin.
2. **Application (Abstraktiot & Sopimukset): repositorioiden rajapinnat (`IReservationRepository`, `IGamingStationRepository`, `IUserRepository`) ja DTO-tietueet (`src/Contracts`).** Valmis kun `src/Application` ja `src/Contracts` kääntyvät virheittä.
3. **Application (Use caset): `ReservationService` ja `GamingStationService` (säännöt 2, 3, 6, 7, 8, 11 sekä "vapaana nyt" -laskenta).** Valmis kun kriteerit 1–10 menevät läpi `tests/Application.Tests`-testeissä.
4. **Infrastructure: EF Core (`ApplicationDbContext`), repositoriot, `OutboxInterceptor`, `SystemDateTimeProvider` ja `DatabaseSeeder`.** Valmis kun `tests/Infrastructure.Tests` ja `tests/Integration.Tests` (mukaan lukien 10 rinnakkaisen varauspyynnön kilpailutilannetesti) menevät läpi.
5. **API: `/api/auth`, `/api/stations` ja `/api/reservations` -päätepisteet sekä RFC 9457 `ProblemDetails` -virhemuunnokset.** Valmis kun kriteerit 1–11 menevät läpi HTTP-kutsuina (`tests/WebApi.Tests`).
6. **Siivous ja katselmointi:** `Docs/arkkitehtuuri.md`:n **Kiellot** ja **Valmis**-lauseet tarkistettu rivi riviltä diffiä vasten. Valmis kun `dotnet test --no-restore --nologo` on 100 % vihreä nollalla varoituksella.
