# Moniagenttiprotokolla, ajanvarausjärjestelmä

Toimit osana rinnakkaista moniagenttiympäristöä (Git Worktrees). Tunnista roolisi keskustelun alussa annetusta tunnisteesta (`@ARKKITEHTI`, `@TIETOKANTA`, `@BACKEND`, `@API`, `@UI` tai `@QA`).

---

## 0. Yleiset pakolliset säännöt (koskee jokaista agenttia)

1. Git- ja kansiopalomuuri:
   - Sinulla on vain luku -oikeus Git-komentoihin (`git status`, `git diff`, `git log`). Älä aja komentoja `commit`, `push`, `merge`, `checkout` tai `reset`.
   - Muokkaa vain oman roolisi sallittuja kansioita.
2. Kerroskohtainen käännös ja DI-eristys:
   - Älä käännä koko ratkaisua haaroissa, vaan käännä ja testaa vain oma projektisi lipulla `/nr:false` (esimerkiksi `dotnet build src/Infrastructure /nr:false`).
   - Jokainen kerros rekisteröi omat palvelunsa omaan `DependencyInjection.cs`-tiedostoonsa (`AddApplication()`, `AddInfrastructure()`). Älä koskaan muokkaa toisen kerroksen DI-tiedostoa.
3. Tietoturva ja GDPR:
   - Älä koskaan kirjoita lokitiedostoihin asiakkaan henkilötietoja (nimi, sähköposti, puhelinnumero, varauksen lisätiedot). Lokita vain `CustomerId` ja `BookingId` GUID-tunnisteet.
4. Aika, virheet ja lokitus:
   - Kaikki ajat palvelimella ovat `DateTimeOffset` (UTC) ja haetaan `TimeProvider` tai `IDateTimeProvider`-abstraktion kautta.
   - `Directory.Build.props` pakottaa asetukset `TreatWarningsAsErrors=true`, `EnforceCodeStyleInBuild=true`, `AnalysisLevel=latest-recommended` ja `GenerateDocumentationFile=true`. Koodissa ei saa olla kääntäjävaroituksia, puuttuvia XML-kommentteja (`CS1591`), `// TODO`-kommentteja, käyttämättömiä muuttujia tai varoitusten ohituksia.
5. Koodin dokumentointi:
   - Jokainen luokka, rajapinta, tietue (`record`), enum, julkinen jäsen, React-komponentti ja funktio on dokumentoitava suomenkielisillä kommenteilla (`/// <summary>` C#-koodissa, `/** ... */` JSDoc-kommentit TypeScript-koodissa) sekä selittävillä rivikommenteilla monimutkaisissa lohkoissa.
   - Asetus `<GenerateDocumentationFile>true</GenerateDocumentationFile>` muuttaa puuttuvat dokumentaatiokommentit virheiksi.
6. Asynkronisuus ja suorituskyky:
   - Jokainen asynkroninen metodi ottaa vastaan parametrin `CancellationToken cancellationToken = default` ja välittää sen eteenpäin tietokanta- ja I/O-kutsuille.
   - Älä käytä synkronista blokkausta (`.Result`, `.Wait()`) tai `async void` -metodeja.
7. Tyyppiturvallisuus ja eksplisiittiset tyypit:
   - `var`-avainsanan käyttö on kielletty: käytä C#-koodissa aina eksplisiittisiä tyyppejä. Sääntö on pakotettu käännösvirheeksi (`IDE0008 = error`). Myös TypeScript- ja JavaScript-koodissa `var` on kielletty (`no-var: error`).
   - Frontendissä `tsconfig.app.json` pakottaa `"strict": true` ja ESLint `--max-warnings 0`. Eksplisiittisen `any`-tyypin käyttö on kielletty.
   - Älä koskaan kovakoodaa salaisuuksia, API-avaimia tai ympäristökohtaisia osoitteita lähdekoodiin.

---

## 1. @ARKKITEHTI (Haara: `dev`)
- Sallittu kirjoitusalue: `src/Domain/**`, `src/Application/Abstractions/**`, `src/Contracts/**`, `.antigravity/specs/**`.
- Tuotantosäännöt:
  1. Domain-mallit ja invariantit: `src/Domain` on riippumaton ulkoisista kirjastoista. `TimeWindow`-arvokohde varmistaa `StartUtc < EndUtc` ja sisältää `OverlapsWith`-tarkistuksen.
  2. Domain Events ja Outbox-sopimus: kun varaus luodaan tai perutaan, aggregaatti nostaa tapahtuman (`ReservationCreatedDomainEvent`, `ReservationCancelledDomainEvent`).
  3. Idempotenssi- ja sivutussopimukset: kaikki listaus-DTO:t käyttävät sivutusta (`PagedResult<T>`), ja varauspyynnöt tukevat `IdempotencyKey`-tunnistetta.

---

## 2. @TIETOKANTA (Haara: `feature/db`)
- Sallittu kirjoitusalue: `src/Infrastructure/**`, `tests/Infrastructure.Tests/**`.
- Tuotantosäännöt:
  1. PostgreSQL ja aikavälit: tallenna ajat `timestamptz`-tyyppinä. Ota käyttöön optimistinen rivilukitus (`UseXminAsConcurrencyToken()`).
  2. Transactional Outbox: toteuta `OutboxMessage`-taulu ja `SaveChangesAsync`-sieppari (`OutboxInterceptor`), joka tallentaa Domain Eventit tietokantaan samassa atomisessa transaktiossa varauksen kanssa.
  3. Kyselysuorituskyky: käytä `.AsNoTracking()` kaikissa lukuoperaatioissa, suoraa DTO-projektiota ja määrittele `src/Infrastructure/DependencyInjection.cs`.

---

## 3. @BACKEND (Haara: `feature/backend`)
- Sallittu kirjoitusalue: `src/Application/**` (pl. `Abstractions/`), `tests/Application.Tests/**`.
- Tuotantosäännöt:
  1. Result-malli ja FluentValidation: käsittele kaikki liiketoimintavirheet `Result<T>`-rakenteella. Validoi jokainen syöte ennen tietokantakutsua.
  2. Käyttöoikeus- ja omistajuustarkistus: varmista peruutus- ja muokkaustapauksissa, että pyynnön tekijällä on oikeus kyseiseen varaukseen.
  3. Strukturoitu lokitus ja yksikkötestit: käytä `ILogger`-rajapintaa (ilman henkilötietoja) ja kirjoita xUnit-testit reunatapauksille.

---

## 4. @API (Haara: `feature/api`)
- Sallittu kirjoitusalue: `src/WebApi/**`, `tests/WebApi.Tests/**`.
- Tuotantosäännöt:
  1. RFC 9457 ProblemDetails ja globaali virheenkäsittelijä: toteuta käsittelijä, joka muuntaa odottamattomat virheet turvallisiksi `ProblemDetails`-vastauksiksi vuotamatta pinojälkiä tuotannossa.
  2. Idempotenssi, Rate Limiting ja autentikointi: vaadi tarvittaessa `Idempotency-Key`-otsake ja suojaa päätepisteet Rate Limiterillä.
  3. Terveystarkistukset: lisää `/health/live`- ja `/health/ready`-päätepisteet.

---

## 5. @UI (Haara: `feature/ui`, Mobile-First React ja TypeScript)
- Sallittu kirjoitusalue: `src/Client/**`.
- Tuotantosäännöt:
  1. Kosketusergonomia ja saavutettavuus (WCAG 2.1 AA): vähintään 44×44 px kosketusalueet, näppäimistö- ja ruudunlukijatuki, ei vaakavieritystä kapeilla ruuduilla.
  2. Verkon pätkimisen sieto ja idempotenssi: generoi varauspyynnölle `Idempotency-Key`-otsake ja käsittele `409 Conflict` invalidoimalla välimuisti.
  3. Virherajat ja lataustilat: kääri näkymät virherajoihin ja näytä latauksen aikana luurankokomponentit.

---

## 6. @QA (Haara: `dev`, integrointivarmistus)
- Sallittu kirjoitusalue: `tests/Integration.Tests/**`, `tests/E2E.Tests/**`.
- Tuotantosäännöt:
  1. PostgreSQL-kontti (`Testcontainers`): aja integraatiotestit aitoa PostgreSQL-konttia vasten.
  2. Rinnakkaisen tuplavarauksen rasitustesti: varmista rinnakkaisissa pyynnöissä, että vain yksi varaus hyväksytään ja muut palauttavat tilakoodin 409 Conflict.

---

## 7. Toimialuelaajennukset ja agenttikohtaiset ohjeet

Kaikkien agenttien tulee noudattaa seuraavia laajennuksia ja sääntöjä:

### 1. Arkkitehti
- Laitteiden inventaario ja koodit: tilassa on tasan 8 pelipistettä: 6 kpl PC-koneita (`PC 1` - `PC 6`, laitekoodit `PC-01` - `PC-06`), 1 kpl `PlayStation 5` (`PS5-01`), ja 1 kpl `Nintendo Switch` (`SW-01`).
- SharedTV-invariantti: PS5 ja Switch jakavat saman fyysisen television. Konsolien samanaikainen varaus on estetty (tilakoodi 409 `Reservation.SharedTvConflict`).
- SuperAdmin-oikeudet: SuperAdmin voi ohittaa normaalin aukioloajan (`allowAnytime = true`) ja jyrätä ristiriitaiset opiskelijavaraukset (`POST /api/reservations/override`) tapahtumien järjestämiseksi.
- Pelit ja toivelista: `Game`-entiteetti sisältää nimen, alustan (`PC`, `PlayStation5`, `NintendoSwitch`), kuvauksen sekä `IsWishlist`-tiedon.
- Tiedotteet: `News`-entiteetti sisältää otsikon, sisällön, kiinnitystiedon (`IsPinned`) ja aikaleiman.

### 2. Tietokanta
- Seeder: `DatabaseSeeder` alustaa aina pelihuoneen, 6 kpl PC-koneita, 2 konsolia, pelit, toivelistan, tiedotteet sekä oletuskäyttäjät.
- EF Core -määritykset: kaikilla entiteeteillä on omat selkeät Fluent API -konfiguraationsa.
- Rinnakkaisuus ja indeksit: varauksille on luotu tila- ja laitekohtaiset indeksit aikavälihakujen optimoimiseksi.

### 3. Backend
- Käyttäjien rekisteröinti ja autentikointi: `UserService.AuthenticateOrCreateUserAsync` ei kaadu puuttuvaan nimeen. Jos `displayName` puuttuu, se johdetaan sähköpostiosoitteesta.
- Aukioloaikojen ja menneisyyden tarkistukset: `TimeWindow` ja `CreateReservationRequestValidator` estävät menneisyyteen varaamisen (`StartUtc > UtcNow - 15min`) ja aukioloaikojen ulkopuoliset varaukset muilta kuin SuperAdminilta.
- Result-malli: kaikki virheet käsitellään `Result<T>`-palautteina (`Error.Validation`, `Error.NotFound`, `Error.Conflict`).

### 4. API
- Päätepisteet:
  - `POST /api/auth/login`: hyväksyy kirjautumispyynnön.
  - `GET /api/stations` ja `GET /api/stations/available`: palauttaa vapaat laitteet.
  - `POST /api/reservations`: luo varauksen.
  - `POST /api/reservations/override`: SuperAdminin jyräysvaraus.
  - `GET /api/games`, `POST /api/games`, `POST /api/games/wishlist`: pelikatalogi ja toivelista.
  - `GET /api/news`, `POST /api/news`, `DELETE /api/news/{id}`: tiedotteet.
  - `GET /health/live` ja `GET /health/ready`: terveystarkistukset.
- RFC 9457 ProblemDetails: kaikki virheet palauttavat standardinmukaisen JSON-virherakenteen.

### 5. UI
- Teema: Xamk Dark Theme (musta pohja `#121212`, Xamk-punainen aksentti `#D70E2F`, kultakeltainen huomio `#F4B400`).
- Tilan pohjakuva: päänäkymässä ja reaaliaikanäkymässä on painike, joka avaa pohjapiirroksen modaalissa (`FloorPlanModal`).
- Älykäs ajanvalinta: jos kello on jo yli 17:00 tai viikonloppu, lomake ehdottaa automaattisesti seuraavaa arkipäivää.
- Pelikatalogi: sisältää välilehdet alustoittain sekä opiskelijoiden ehdotustoiminnon.
- Ylläpitonäkymät: ylläpitäjille ja pääkäyttäjille omat hallintapaneelit.

### 6. QA
- Kaikkien testien on mentävä läpi puhtaasti komennolla `dotnet test --nologo`.
- Tarkistettavat skenaariot:
  1. Tuplavaraus samalle laitteelle tuottaa tilakoodin 409 Conflict.
  2. Rinnakkainen PS5- ja Switch-varaus tuottaa tilakoodin 409 SharedTV Conflict.
  3. SuperAdmin override peruuttaa opiskelijavarauksen syykoodilla.
  4. Sisäänkirjautuminen eri käyttäjätunnuksilla toimii.
