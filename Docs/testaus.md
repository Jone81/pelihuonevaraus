# Testaus — pelihuoneen varausjärjestelmä

`Docs/arkkitehtuuri.md` määrittelee kerrokset ja kiellot. `specs/`-tiedostot määrittelevät hyväksymiskriteerit Given–When–Then-muodossa. Tämä tiedosto määrittelee yhteisen testiaineiston, kiinteän kellon käytön, hyväksymiskriteerien ajotavan, sääntöjen kattavuusmatriisin sekä sen, kuka ajaa testit missäkin vaiheessa.

## Testiaineisto

Yksi vakioitu lähtötila kaikille testitasoille ja speceille (`DatabaseSeeder` / testien alustus). Specin `Given`-osa kuvaa vain poikkeaman tästä lähtötilasta:

| Mitä | Arvo |
|------|------|
| **Pelihuone (`GameRoom`)** | `Xamk Game Room` (sisältää 8 pelipistettä ja yhteisen 4K-TV:n) |
| **Pelipisteet (`GamingStation`)** | 8 kpl aktiivisia (`IsActive = true`):<br/>• `PC 1`–`PC 6` (`PC-01`–`PC-06`, `UsesSharedTv = false`)<br/>• `PlayStation 5` (`PS5-01`, `UsesSharedTv = true`)<br/>• `Nintendo Switch` (`SW-01`, `UsesSharedTv = true`) |
| **Aukioloajat & Asetukset** | Arkisin Ma–Pe klo `08:00–18:00` (`Europe/Helsinki`), yksittäisvaraus `30 min – 4 h`, ennakkovaraus max `2 kk` |
| **Käyttäjät (`User`)** | • Opiskelija 1: `student@edu.xamk.fi` (`UserRole.User`)<br/>• Opiskelija 2: `toinen.opiskelija@edu.xamk.fi` (`UserRole.User`)<br/>• Ylläpitäjä: `admin@xamk.fi` (`UserRole.Admin`)<br/>• Pääkäyttäjä: `superadmin@xamk.fi` (`UserRole.SuperAdmin`) |
| **Kiinteä "nyt" (`NowUtc`)** | Seuraavan arkipäivän (keskiviikko) klo **09:00** Suomen aikaa, ellei kriteeri toisin sano |
| **Tila ennen kriteeriä** | Ei aktiivisia varauksia kyseiselle testipäivälle |

Aineisto syntyy kullakin tasolla:
- **Domain- ja Application-yksikkötestit (`tests/Application.Tests`):** Luodaan suoraan Domain-tehdasmetodeilla (`Reservation.Create`, `TimeWindow.Create`, `SchoolEmail.Create`, `User.Create`) ja sovelluspalveluilla käyttäen muistipohjaisia NSubstitute-testikorvikkeita ja kiinteää kelloa ilman tietokantaa tai HTTP-palvelinta.
- **Infrastruktuuritestit (`tests/Infrastructure.Tests`):** Testataan EF Core -määrityksiä, `ApplicationDbContext`-tallennusta, `OutboxInterceptor`-siepparia ja repositorioita PostgreSQL-/InMemory-kantoja vasten.
- **Minimal API -päätepistetestit (`tests/WebApi.Tests`):** Ajetaan `WebApplicationFactory<Program>`-palvelinta vasten testaten reititystä, HTTP-statuskoodeja, Rate Limitingiä ja virhemuunnoksia.
- **Rinnakkaisuuden rasitustestit (`tests/Integration.Tests`):** Ajetaan rinnakkaiset kilpailutilannetestit (esim. 10 samanaikaista varausta samalle laitteelle) PostgreSQL-konttia (`Testcontainers.PostgreSql`) vasten.

## Kiinteä kello käynnissä olevassa ohjelmassa

Domain ja Application eivät koskaan kutsu `DateTimeOffset.UtcNow`:ta suoraan. Kaikki aikatarkistukset kulkevat `IDateTimeProvider`-abstraktion (`UtcNow`) tai metodiparametrin (`nowUtc`) kautta.
- Yksikkö- ja integraatiotesteissä `IDateTimeProvider` korvataan ohjattavalla kellolla, jolloin kelloa voidaan siirtää esim. klo 09:00 → 10:30 ilman odottamista.
- Käynnissä olevassa kehityspalvelimessa (`Development`) vahvistuskoodit palautetaan vastauksen `devCode`-kentässä, jotta kirjautumisketju voidaan ajaa deterministisesti ilman ulkoista sähköpostipalvelinta.

## Hyväksymiskriteerien ajo

Kaikki backend-testit ajetaan ratkaisutasolla komennolla:

```bash
dotnet test --nologo --no-restore
```

Sekä projektikohtaisesti:

```bash
dotnet test tests/Application.Tests/Pelihuone.Application.Tests.csproj --nologo --no-restore
dotnet test tests/Infrastructure.Tests/Pelihuone.Infrastructure.Tests.csproj --nologo --no-restore
dotnet test tests/WebApi.Tests/Pelihuone.WebApi.Tests.csproj --nologo --no-restore
dotnet test tests/Integration.Tests/Pelihuone.Integration.Tests.csproj --nologo --no-restore
```

Käyttöliittymän kääntäminen ja lint-tarkistukset ajetaan komennolla:

```bash
npm --prefix src/Client run build && npm --prefix src/Client run lint
```

## Kattavuusmatriisi

Jokaisella `Docs/domain.md`:n säännöllä on oma rivi, kerrostaso ja hylkäyskriteeri:

| Sääntö (`Docs/domain.md`) | Paikka (taso) | Spec ja kriteerit | Hylkäystesti |
|---------------------------|---------------|-------------------|--------------|
| **1** Aikaikkunan loppu > alku | `TimeWindow` (Domain) | Spec 001: K2 | `Application.Tests` (`ReservationServiceTests.CreateReservation_WithInvalidTime_ReturnsValidationError`) |
| **2** Aukioloajat 08:00–18:00 & ei menneisyyteen | `OpeningHours` / `ReservationService` | Spec 001: K3, K4 | `Application.Tests` (`OutsideOpeningHours`, `StartInPast`) |
| **3** Kesto 30 min – 4 h, ennakko max 2 kk | `TimeWindow` / `ReservationService` | Spec 001: K5, K6 | `Application.Tests` (`InvalidDuration`) |
| **4** Yksittäinen = laite, Tila/Tapahtuma = huone | `Reservation.Create` (Domain) | Spec 001: K1, Spec 002: K1 | `Application.Tests` (Domain-mallitarkistukset) |
| **5** Peruutus vain ennen alkamista, vain kerran | `Reservation.Cancel` (Domain) | Spec 001: K9, K10 | `Application.Tests` (`CancelReservation_AlreadyStarted_Fails`) |
| **6** Ei päällekkäistä varausta samalle laitteelle | `ReservationService` (Application) | Spec 001: K7 | `Application.Tests` & `Integration.Tests` (`ConcurrentBookingStressTests`) |
| **7** Tapahtuman/tilavarauksen aikana ei yksittäisvarauksia | `ReservationService` (Application) | Spec 002: K3, K4 | `Application.Tests` (`Reservation.RoomReserved` / `RoomBusy`) |
| **8** Yhteinen TV (`SharedTV` PS5 ↔ Switch) | `ReservationService` (Application) | Spec 001: K8 | `Application.Tests` (`Reservation.SharedTvConflict`) |
| **9** Vain `@edu.xamk.fi` / `@xamk.fi` sähköposti | `SchoolEmail` (Domain) | Spec 001: K11 | `Application.Tests` (`UserServiceTests.AuthenticateOrCreateUserAsync_WithNonSchoolEmail_ReturnsValidationError`) |
| **10** `SuperAdmin` override peruuttaa opiskelijavaraukset syyllä | `ReservationService` (Application) | Spec 002: K2, K5 | `Application.Tests` (`OverrideAndCreateEventAsync_CancelsOverlappingReservations`) |
| **11** Käyttöesto (`IsBanned`) & `SuperAdmin`-suoja | `User` (Domain) / `ReservationService` | Spec 002: K6 | `Application.Tests` (`User.Banned` / `DomainException`) |
| **Vapaana nyt** laskettuna näkymänä | `GamingStationService` (Application) | Spec 001: K1, K8 | `Application.Tests` (`GamingStationServiceTests`) |

## Milloin ja kuka

| Milloin | Kuka | Mitä ajetaan | Tuloste menee |
|---------|------|--------------|---------------|
| Askeleen aikana | Työntekijä | Oman kerroksen käännös ja testiprojekti (`/nr:false`) | Paluuviestiin johtajalle |
| Ennen committia | Katselmoija | Diff kattavuusmatriisia, `Paikka`-saraketta ja kieltoja vasten | Löytölistaan |
| Ennen committia | Johtaja | `dotnet build --nologo /nr:false`, testit ja UI-linttaus | Commit-viestin runkoon |
| Ennen pull requestin yhdistämistä | Ihminen | Specin kriteerit ja E2E-skenaariot | Pull requestin runkoon |
| Ennen `master`-yhdistystä | Ihminen | `Docs/arkkitehtuuri.md`:n **Valmis**-lauseet rivi riviltä | Pull requestin runkoon |

## Mitä ei testata

- Ulkoisen SMTP-sähköpostipalvelimen tai oikean Discord-palvelimen verkkoliikennettä (molemmat on suojattu testikorvikkeilla).
- Kolmannen osapuolen pilvi-infrastruktuurin kuormansietoa.
