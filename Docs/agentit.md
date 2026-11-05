# Agenttien roolit — pelihuoneen varausjärjestelmä

`AGENTS.md` koskee jokaista agenttia. Tämä tiedosto määrittelee, mitä kukin rooli lukee, mitä se saa muuttaa, mitä se ei saa tehdä ja mitä se palauttaa. Rooleja on seitsemän: johtaja, viisi kerroskohtaista työntekijää (`Domain`, `Application`, `Infrastructure`, `API`, `UI`) ja katselmoija.

Miksi näin: yksi agentti, joka tekee domainin, tallennuksen, rajapinnan ja käyttöliittymän samalla kertaa, sekoittaa kerrosvastuut. Kun kirjoitusoikeus on rajattu yhteen kansioon/projektiin ja katselmoija on eri agentti kuin tekijä, jokainen sääntö pysyy `Docs/domain.md`:n määräämässä paikassa.

## Johtaja

- **Tehtävä:** lukee kuvauksen, esittää suunnitelman ihmiselle, jakaa yhden `Tehtävät`-askeleen kerrallaan, kokoaa tulokset, ajaa lopputarkistukset, commitoi ja kirjoittaa lopetusviestin.
- **Lukee:** kaiken (`AGENTS.md`-lukujärjestys 1–9).
- **Saa muuttaa:** ei sovelluskoodia. Git-toimet (haara, commit, push, pull request) ovat vain johtajan. `Docs/`- ja `specs/`-tiedostoja johtaja muuttaa vain ihmisen pyynnöstä ja omassa commitissaan.
- **Ei saa:** kirjoittaa tai korjata koodia itse, vaikka korjaus olisi yhden rivin; yhdistää pull requestia; antaa samaa askelta kahdelle työntekijälle yhtä aikaa.
- **Palauttaa ihmiselle:** suunnitelman ennen työtä, kysymykset työn aikana, lopetusviestin `Docs/versiohallinta.md`:n muodossa.
- **Valmis kun:** askeleen Definition of Done täyttyy (`AGENTS.md`).

Tehtävänanto työntekijälle on aina tässä muodossa:

```text
Spec: 001-varaa-pelipiste, askel 3
Rooli: Application-työntekijä
Säännöt ja Paikat: 6 (laitepäällekkäisyys), 7 (tilavaraus), 8 (SharedTV) — ReservationService
Kriteerit: K1, K7, K8 use case -testinä
Saat kirjoittaa: src/Application/** ja tests/Application.UnitTests/**
Tallennuksen rajapinnat, joita käytät: IReservationRepository, IGamingStationRepository
Palauta: muutetut tiedostot, dotnet test -tuloste, kysymykset
```

## Domain-työntekijä (`@ARKKITEHTI` / Domain)

- **Tehtävä:** käsitteet, arvo-objektit (`TimeWindow`, `OpeningHours`, `SchoolEmail`), entiteetit (`Reservation`, `User`, `GamingStation`, `GameRoom`, `Game`, `News`, `IssueReport`) ja niiden sisäiset säännöt (#1, #4, #5, #9, #11).
- **Lukee:** `Docs/domain.md`, `Docs/arkkitehtuuri.md`, `Docs/testaus.md`, `Docs/adr/`, spec ja sen askel.
- **Saa muuttaa:** `src/Domain/**`, `src/Contracts/**`, `src/Application/Abstractions/**`, `tests/Domain.UnitTests/**`.
- **Ei saa:** viitata ulkoiseen NuGet-pakettiin, tietokantaan tai HTTP-kirjastoon; kutsua järjestelmän kelloa suoraan (`DateTimeOffset.UtcNow`); käyttää `var`-avainsanaa.
- **Palauttaa johtajalle:** muutetut tiedostot, Domain-testien tuloste, lista säännöistä ja niiden testeistä, kysymykset.
- **Valmis kun:** askeleen Domain-kriteerit ovat vihreitä eikä `src/Domain` viittaa mihinkään ulkoiseen kirjastoon.

## Application-työntekijä (`@BACKEND`)

- **Tehtävä:** käyttötapauspalvelut (`ReservationService`, `GamingStationService`, `UserService`, `GameService`, `NewsService`, `SettingsService`, `StatisticsService`, `IssueReportService`), FluentValidation-validaattorit ja hakua vaativat säännöt (#2, #3, #6, #7, #8, #10, #11) sekä "vapaana nyt" -laskenta.
- **Lukee:** `Docs/domain.md`, `Docs/arkkitehtuuri.md`, `Docs/rajapinta.md`, `Docs/testaus.md`, spec ja sen askel, Domainin ja Contractsin julkiset tyypit.
- **Saa muuttaa:** `src/Application/**` (pl. `Abstractions/`), `tests/Application.UnitTests/**`.
- **Ei saa:** muuttaa `src/Domain/**`; viitata EF Coreen tai ASP.NET Coreen; heittää liiketoimintavirheitä poikkeuksina (`Result<T>`-pakko); lokittaa henkilötietoja (PII).
- **Palauttaa johtajalle:** muutetut tiedostot, use case -testien tuloste, kriteeri → testi -lista, kysymykset.
- **Valmis kun:** askeleen kriteerit menevät läpi use case -testinä ja jokainen sääntöhylkäys palauttaa `Result.Failure(...)`.

## Infrastructure-työntekijä (`@TIETOKANTA`)

- **Tehtävä:** repositorioiden toteutus EF Corella (`ApplicationDbContext`, PostgreSQL + InMemory fallback), Fluent API -konfiguraatiot, `OutboxInterceptor`, `SystemDateTimeProvider` ja `DatabaseSeeder`.
- **Lukee:** `Docs/arkkitehtuuri.md`, `Docs/testaus.md`, `src/Application/Abstractions/**`, `src/Domain/**`, spec ja sen askel.
- **Saa muuttaa:** `src/Infrastructure/**`, `tests/Integration.Tests/**`.
- **Ei saa:** tarkistaa liiketoimintasääntöjä repositoriossa; muuttaa `src/Domain/**` tai `src/Application/**`; tallentaa tietokantatiedostoja repoon.
- **Palauttaa johtajalle:** muutetut tiedostot, testien tuloste, kysymykset.
- **Valmis kun:** repositoriot ja `OutboxInterceptor` toimivat sekä PostgreSQL-konttia että muistitietokantaa vasten.

## API-työntekijä (`@API`)

- **Tehtävä:** Minimal API -päätepisteet (`src/WebApi/Endpoints/`), RFC 9457 `ProblemDetails` -muunnokset (`ResultExtensions`, `GlobalExceptionHandler`), Rate Limiting ja API/E2E-testit.
- **Lukee:** `Docs/rajapinta.md`, `Docs/arkkitehtuuri.md`, `Docs/testaus.md`, spec ja sen askel, `src/Contracts/**`.
- **Saa muuttaa:** `src/WebApi/**`, `tests/E2E.Tests/**`.
- **Ei saa:** tarkistaa liiketoimintasääntöjä endpointissa; kutsua repositorioita ohi käyttötapauspalvelun; palauttaa Domain-entiteettejä suoraan HTTP-vastauksessa.
- **Palauttaa johtajalle:** muutetut tiedostot, API-testien tuloste kriteerinumeroin, kysymykset.
- **Valmis kun:** askeleen HTTP-kriteerit menevät läpi oikeilla statuskoodeilla (`200`, `201`, `204`, `400`, `403`, `404`, `409`).

## UI-työntekijä (`@UI`)

- **Tehtävä:** React + TypeScript -käyttöliittymä (`src/Client/**`), Xamk-brändiohjeiston mukainen ulkoasu, `shadcn/ui`-komponentit, URL-reititys (`router.tsx`), kaikkien 8 laitteen aikataulumatriisi (`Drag-to-Select`) ja kaksikielisyys (`fi` / `en`).
- **Lukee:** `Docs/UI_SPEC.md`, `Docs/rajapinta.md`, `specs/003-*.md` (tai kyseinen spec).
- **Saa muuttaa:** `src/Client/**`.
- **Ei saa:** muokata backend-projekteja; käyttää `any`-tyyppiä tai `var`-avainsanaa; jättää kääntäjä- tai ESLint-varoituksia.
- **Palauttaa johtajalle:** muutetut tiedostot, `npm --prefix src/Client run build && npm --prefix src/Client run lint` -tuloste, kysymykset.
- **Valmis kun:** UI kääntyy ja läpäisee ESLintin nollalla varoituksella ja täyttää `Docs/UI_SPEC.md`:n invariantit `UI-1`–`UI-6`.

## Katselmoija (`@QA` / Reviewer)

- **Tehtävä:** lukee askeleen diffin ennen committia ja etsii poikkeamat kuvauksesta. Ei kirjoita koodia, ei ehdota uutta sääntöä.
- **Lukee:** diffin, `Docs/domain.md` (`Paikka`-sarake), `Docs/arkkitehtuuri.md` (`Kiellot`), `Docs/testaus.md` (`Kattavuusmatriisi`), `Docs/rajapinta.md`, specin kriteerit ja askeleen "valmis kun".
- **Tarkistaa tässä järjestyksessä:**
  1. Sääntö on täsmälleen siinä kerroksessa, jonka `Paikka`-sarake määrää.
  2. `Docs/arkkitehtuuri.md`:n kieltoja ei rikota (ei `var`-avainsanaa, ei suoraa kellokutsua, ei puuttuvia XML/JSDoc-kommentteja).
  3. Jokaiselle askeleen säännölle on testi.
  4. Nimet ovat sanaston mukaiset.
  5. Repoon ei tule kiellettyä tiedostoa.
- **Saa muuttaa:** ei mitään.
- **Palauttaa johtajalle:** löytölistan muodossa `tiedosto:rivi — sääntö/kielto — mitä korjataan`. Tyhjä lista on hyväksyntä.

## Viestit roolien välillä

| Suunta | Sisältö | Muoto |
|--------|---------|-------|
| Johtaja → työntekijä | Tehtävänanto | Yllä oleva tehtävänantolohko |
| Työntekijä → johtaja | Tulos | Muutetut tiedostot, testikomento ja tuloste, sääntö → testi -lista, kysymykset |
| Johtaja → katselmoija | Katselmointipyyntö | Spec, askel, diff, säännöt joita askel koskee |
| Katselmoija → johtaja | Löydöt | `tiedosto:rivi — sääntö/kielto — korjaus`, tai tyhjä lista |
| Johtaja → ihminen | Suunnitelma, kysymys, lopetusviesti | `AGENTS.md` (Ensin suunnitelma); `Docs/versiohallinta.md` (Agentin lopetus) |

Kysymys kulkee aina ylöspäin: työntekijä ei kysy ihmiseltä, ihminen ei vastaa työntekijälle.

## Milloin hierarkiaa ei käytetä

Korjaus, joka koskee yhtä tiedostoa, ei lisää eikä muuta sääntöä eikä muuta julkista tyyppiä, saa olla sen kerroksen työntekijän tekemä ilman uutta suunnitelmaa. Katselmoija lukee silti diffin, ja johtaja commitoi. Johtaja ei tee korjausta itse missään tapauksessa.

