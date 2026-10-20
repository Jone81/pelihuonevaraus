# ENTERPRISE PRODUCTION MULTI-AGENT PROTOCOL — AJANVARAUSJÄRJESTELMÄ

Toimit osana rinnakkaista moniagenttiympäristöä (Git Worktrees). Tunnista roolisi keskustelun alussa annetusta tunnisteesta (`@ARKKITEHTI`, `@TIETOKANTA`, `@BACKEND`, `@API`, `@UI` tai `@QA`).

---

## 0. GLOBAALIT PAKOLLISET SÄÄNNÖT (KOSKEE JOKAISTA AGENTTIA)

1. **GIT- JA KANSIOPALOMUURI:**
   - Sinulla on VAIN LUKU -oikeus Git-komentoihin (`git status`, `git diff`, `git log`). Älä koskaan aja `commit`, `push`, `merge`, `checkout` tai `reset`.
   - Muokkaa VAIN oman roolisi sallittuja kansioita.
2. **KERROSKOHTAINEN KÄÄNNÖS JA DI-ERISTYS (KRIITTINEN RINNAKKAISAJOSSA):**
   - Älä käännä koko `.sln`-ratkaisua `feature/*`-haaroissa, vaan käännä ja testaa VAIN oma projektisi lipulla `/nr:false` (esim. `dotnet build src/Infrastructure /nr:false`).
   - Jokainen kerros rekisteröi omat palvelunsa omaan `DependencyInjection.cs`-tiedostoonsa (`AddApplication()`, `AddInfrastructure()`). Älä koskaan muokkaa toisen kerroksen DI-tiedostoa.
3. **TIETOTURVA & GDPR (PII-SUOJA):**
   - ÄLÄ KOSKAAN kirjoita lokitiedostoihin asiakkaan henkilötietoja (nimi, sähköposti, puhelinnumero, varauksen lisätiedot). Lokita vain `CustomerId` (Guid) ja `BookingId` (Guid).
4. **AIKA, VIRHEET JA LOKITUS:**
   - Kaikki ajat palvelimella ovat `DateTimeOffset` (UTC) ja haetaan `TimeProvider`-abstraktion kautta.
   - `Directory.Build.props` pakottaa `TreatWarningsAsErrors=true`. Koodissa ei saa olla yhtäkään kääntäjävaroitusta, `// TODO`-kommenttia tai käyttämätöntä muuttujaa.

---

## 1. @ARKKITEHTI (Haara: `dev`)
- **Sallittu kirjoitusalue:** `src/Domain/**`, `src/Application/Abstractions/**`, `src/Contracts/**`, `.antigravity/specs/**`.
- **Tuotantosäännöt:**
  1. **Domain-mallit ja Invariantit:** `src/Domain` on 100 % riippumaton ulkoisista kirjastoista. `TimeSlot`-arvokohde varmistaa `StartUtc < EndUtc` ja sisältää `OverlapsWith`-tarkistuksen.
  2. **Domain Events & Outbox-sopimus:** Kun varaus luodaan tai perutaan, `Booking`-aggregaatti nostaa Domain Eventin (`BookingConfirmedDomainEvent`, `BookingCancelledDomainEvent`), jotta sähköposti-/SMS-ilmoitukset voidaan käsitellä luotettavasti taustalla.
  3. **Idempotenssi- ja Sivutussopimukset:** Kaikki listaus-DTO:t (`src/Contracts/`) käyttävät sivutusta (`PagedResult<T>`), ja varauspyynnöt tukevat `IdempotencyKey`-tunnistetta.

---

## 2. @TIETOKANTA (Haara: `feature/db`)
- **Sallittu kirjoitusalue:** `src/Infrastructure/**`, `tests/Infrastructure.Tests/**`.
- **Tuotantosäännöt:**
  1. **PostgreSQL Lukitus ja Aikavälit:**
     - Tallenna ajat `timestamptz`-tyyppinä.
     - Ota käyttöön optimistinen rivilukitus (`UseXminAsConcurrencyToken()`) JA tietokantatason päällekkäisvarausesto (`btree_gist` / uniikki ehdollinen indeksi aktiivisille varauksille), jotta kaksi rinnakkaista transaktiota ei voi koskaan varata samaa slottia.
  2. **Transactional Outbox:** Toteuta `OutboxMessage`-taulu ja `SaveChangesAsync`-sieppari (Interceptor), joka tallentaa Domain Eventit tietokantaan samassa atomisessa transaktiossa varauksen kanssa.
  3. **Kyselysuorituskyky:** Käytä `.AsNoTracking()` kaikissa lukuoperaatioissa, suoraa DTO-projektiota ja määrittele oma `src/Infrastructure/DependencyInjection.cs` (`AddInfrastructure`).

---

## 3. @BACKEND (Haara: `feature/backend`)
- **Sallittu kirjoitusalue:** `src/Application/**` (pl. `Abstractions/`), `tests/Application.Tests/**`.
- **Tuotantosäännöt:**
  1. **Result-Pattern & FluentValidation:** Käsittele kaikki liiketoimintavirheet `Result<T>`-rakenteella. Validoi jokainen syöte ennen tietokantakutsua.
  2. **Käyttöoikeus- ja Omistajuustarkistus (Authorization):** Varmista peruutus- ja muokkaustapauksissa, että pyynnön tekijällä (`CurrentUserId`) on oikeus kyseiseen `Booking`-entiteettiin (estää IDOR-haavoittuvuudet).
  3. **Strukturoitu lokitus ja Yksikkötestit:** Käytä `ILogger`-rajapintaa (ilman PII-dataa) ja kirjoita xUnit-testit (`FakeTimeProvider`) kaikille reunatapauksille. Määrittele `src/Application/DependencyInjection.cs` (`AddApplication`).

---

## 4. @API (Haara: `feature/api`)
- **Sallittu kirjoitusalue:** `src/WebApi/**`, `tests/WebApi.Tests/**`.
- **Tuotantosäännöt:**
  1. **RFC 9457 ProblemDetails & Global Exception Handler:** Toteuta `IExceptionHandler`, joka muuntaa odottamattomat virheet turvallisiksi `ProblemDetails`-vastauksiksi vuotamatta pinojälkiä (Stack Trace) tuotannossa.
  2. **Idempotenssi, Rate Limiting & Auth:**
     - Vaadi `POST /api/bookings`-kutsussa `Idempotency-Key`-otsake tuplaklikkausten estämiseksi.
     - Suojaa päätepisteet JWT/Cookie-autentikaatiolla sekä Rate Limiterillä.
  3. **Health Checks & OpenTelemetry:** Lisää `/health/live`- ja `/health/ready`-päätepisteet (mukaan lukien PostgreSQL-yhteystestaus) sekä OpenTelemetry-metriikat.

---

## 5. @UI (Haara: `feature/ui` — Mobile-First React + TypeScript)
- **Sallittu kirjoitusalue:** `src/Client/**`.
- **Tuotantosäännöt:**
  1. **Mobile-First, Kosketusergonomia & Saavutettavuus (WCAG 2.1 AA):**
     - Vähintään 44x44px kosketusalueet, täysi näppäimistö- ja ruudunlukijatuki (`aria-live`, `role="alert"`), ei vaakavieritystä 320px ruudulla.
  2. **Verkon pätkimisen sieto & Idempotenssi:**
     - Generoi jokaiselle varauslomakkeen avaukselle oma `crypto.randomUUID()`-arvo ja lähetä se `Idempotency-Key`-otsakkeessa, jotta mobiiliverkon uudelleenyritys ei luo kahta varausta.
     - Käsittele `409 Conflict` invalidoimalla TanStack Queryn aikaslottivälimuisti välittömästi.
  3. **Error Boundaries & Skeleton-tilat:** Kääri näkymät React Error Boundaryyn ja näytä latauksen aikana mittojen mukaiset Skeleton-komponentit (ei hyppivää ulkoasua / CLS).

---

## 6. @QA (Haara: `dev` — Yhdistämisen jälkeinen E2E- ja Integraatiovarmistus)
- **Sallittu kirjoitusalue:** `tests/Integration.Tests/**`, `tests/E2E.Tests/**`.
- **Tuotantosäännöt:**
  1. **Oikea PostgreSQL (`Testcontainers`):** Älä koskaan käytä `InMemory`-tietokantaa integraatiotesteissä. Käynnistä oikea PostgreSQL-kontti (`Testcontainers.PostgreSql`) ja `WebApplicationFactory`.
  2. **Rinnakkaisen tuplavarauksen rasitustesti:** Kirjoita testi, joka ampuu `Task.WhenAll`-kutsulla 10 samanaikaista `POST /api/bookings` -pyyntöä täsmälleen samaan `TimeSlot`-aikaikkunaan, ja varmista, että **tasan 1** palauttaa `201 Created` ja **loput 9** palauttavat `409 Conflict`.


---

## 7. DOMAIN SPEC -LAAJENNUKSET JA AGENTTIKOHTAISET OHJEET

Kaikkien agenttien tulee noudattaa seuraavia laajennuksia ja sääntöjä suhteessa `DOMAIN_SPEC.md` -määrittelyyn:

### 1. @ARKKITEHTI
- **Laitteiden inventaario ja koodit:** Tilassa on tasan 8 pelipistettä: 6 kpl PC-koneita (`PC 1` – `PC 6`, laitekoodit `PC-01` – `PC-06`), 1 kpl `PlayStation 5` (`PS5-01`), ja 1 kpl `Nintendo Switch` (`SW-01`).
- **SharedTV-invariantti:** PS5 ja Switch jakavat saman fyysisen television. Konsolien samanaikainen varaus on ehdottomasti estetty (Status 409 `Reservation.SharedTvConflict`).
- **SuperAdmin-oikeudet:** SuperAdmin voi ohittaa normaalin aukioloajan (`allowAnytime = true`) ja jyrätä ristiriitaiset opiskelijavaraukset (`POST /api/reservations/override`) tapahtumien ja LAN-turnausten järjestämiseksi.
- **Pelit ja toivelista (Games & Wishlist):** `Game`-entiteetti sisältää nimen, alustan (`PC`, `PlayStation5`, `NintendoSwitch`), kuvauksen sekä `IsWishlist`-tiedon.
- **Tiedotteet (News):** `News`-entiteetti sisältää otsikon, sisällön, kiinnitystiedon (`IsPinned`) ja aikaleiman.

### 2. @TIETOKANTA
- **Seeder:** `DatabaseSeeder` alustaa aina täsmälleen 1 kpl `GameRoom`, 6 kpl PC:tä, 2 konsolia, 9 oletuspeliä, 2 toivelistapeliä, 2 tiedotetta sekä oletuskäyttäjät (`admin@xamk.fi` ja `opiskelija@edu.xamk.fi`).
- **EF Core -määritykset:** Kaikilla entiteeteillä (`News`, `Game`, `GameRoom`, `GamingStation`, `Reservation`, `User`) on omat selkeät Fluent API -konfiguraationsa.
- **Concurrency & Indeksit:** Varauksille on luotu tila- ja laitekohtaiset indeksit aikavälihauttamisen optimoimiseksi.

### 3. @BACKEND
- **Käyttäjien rekisteröinti & Autentikointi:** `UserService.AuthenticateOrCreateUserAsync` ei saa heittää 500-palvelinvirhettä puuttuvasta nimestä. Jos `displayName` puuttuu, se johdetaan automaattisesti sähköpostin etuliitteestä (`matti.meikalainen@edu.xamk.fi` -> `matti meikalainen`).
- **Aukioloaikojen ja menneisyyden tarkistukset:** `TimeWindow` ja `CreateReservationRequestValidator` estävät menneisyyteen varaamisen (`StartUtc > UtcNow - 15min`) ja aukioloaikojen ulkopuoliset varaukset muilta kuin SuperAdminilta.
- **Result-Pattern:** Kaikki use case -poikkeukset käsitellään `Result<T>`-palautteina (`Error.Validation`, `Error.NotFound`, `Error.Conflict`).

### 4. @API
- **Endpoints:**
  - `POST /api/auth/login`: Hyväksyy `LoginRequest` (email ja valinnainen displayName).
  - `GET /api/stations` & `GET /api/stations/available`: Palauttaa vapaat laitteet.
  - `POST /api/reservations`: Luo varauksen (409 jos laite tai SharedTV varattu).
  - `POST /api/reservations/override`: SuperAdminin jyräysvaraus.
  - `GET /api/games`, `POST /api/games`, `POST /api/games/wishlist`: Pelikatalogi ja toivelista.
  - `GET /api/news`, `POST /api/news`, `DELETE /api/news/{id}`: Uutisvirta ja tiedotteet.
  - `GET /health/live` & `GET /health/ready`: Terveystarkistukset.
- **RFC 9457 ProblemDetails:** Kaikki virheet palauttavat standardinmukaisen JSON-virherakenteen.

### 5. @UI
- **Teema:** Xamk Dark Theme (musta/tummanharmaa pohja `#121212`, Xamk-punainen aksentti `#D70E2F`, kultakeltainen huomio `#F4B400`).
- **Tilan pohjakuva:** Päänäkymässä ja reaaliaikanäkymässä on "Tilan pohjakuva" -painike, joka avaa modulin (`FloorPlanModal`) pohjapiirroksesta (6 PC:tä, 2 konsolia, SharedTV).
- **Älykäs ajanvalinta:** Jos kello on jo yli 17:00 tai viikonloppu, lomake ehdottaa automaattisesti seuraavaa aukiolo-arkipäivää menneisyyteen varaamisen estämiseksi.
- **Pelikatalogi:** Sisältää välilehdet alustoittain (Kaikki, PC, PS5, Switch, Toivelista) sekä opiskelijoiden "Ehdota peliä" -toiminnon.
- **Admin & SuperAdmin -hallinta:** Pääkäyttäjille omat paneelit pelien hyväksymiseen, tiedotteiden julkaisuun ja varausten jyräämiseen.

### 6. @QA
- Kaikkien 31 yksikkö- ja integraatiotestin on mentävä läpi puhtaasti komennolla `dotnet test --nologo`.
- Testaa säännöllisesti:
  1. Tuplavaraus samalle laitteelle -> 409 Conflict.
  2. Rinnakkainen PS5 ja Switch -varaus -> 409 SharedTV Conflict.
  3. SuperAdmin override -> Olemassa oleva opiskelijavaraus peruuntuu syykoodilla.
  4. Sisäänkirjautuminen eri käyttäjätunnuksilla.
