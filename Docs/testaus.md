# Testaus — pelihuoneen varausjärjestelmä

`Docs/arkkitehtuuri.md` määrittelee kerrokset ja kiellot. `specs/`-tiedostot määrittelevät hyväksymiskriteerit Given–When–Then-muodossa. Tämä tiedosto määrittelee yhteisen testiaineiston, kiinteän kellon käytön, hyväksymiskriteerien ajotavan, sääntöjen kattavuusmatriisin sekä sen, kuka ajaa testit missäkin vaiheessa.

## Testiaineisto

Yksi vakioitu lähtötila kaikille testitasoille ja speceille (`DatabaseSeeder` / testien alustus). Specin `Given`-osa kuvaa vain poikkeaman tästä lähtötilasta:

| Mitä | Arvo |
|------|------|
| **Pelihuone (`GameRoom`)** | `Xamk Game Room` (kapasiteetti 20 hlö) |
| **Pelipisteet (`GamingStation`)** | 8 kpl aktiivisia (`IsActive = true`):<br/>• `PC 1`–`PC 6` (`PC-01`–`PC-06`, `UsesSharedTv = false`)<br/>• `PlayStation 5` (`PS5-01`, `UsesSharedTv = true`)<br/>• `Nintendo Switch` (`SW-01`, `UsesSharedTv = true`) |
| **Aukioloajat & Asetukset** | Arkisin Ma–Pe klo `08:00–18:00` (`Europe/Helsinki`), yksittäisvaraus `30 min – 4 h`, ennakkovaraus max `2 kk` |
| **Käyttäjät (`User`)** | • Opiskelija 1: `opiskelija@edu.xamk.fi` (`UserRole.User`)<br/>• Opiskelija 2: `toinen.opiskelija@edu.xamk.fi` (`UserRole.User`)<br/>• Pääkäyttäjä: `admin@xamk.fi` (`UserRole.SuperAdmin`) |
| **Kiinteä "nyt" (`NowUtc`)** | Seuraavan arkipäivän (keskiviikko) klo **09:00** Suomen aikaa, ellei kriteeri toisin sano |
| **Tila ennen kriteeriä** | Ei aktiivisia varauksia kyseiselle testipäivälle |

Aineisto syntyy kullakin tasolla:
- **Domain-yksikkötestit (`tests/Domain.UnitTests`):** Luodaan suoraan tehdasmetodeilla (`Reservation.Create`, `TimeWindow.Create`, `SchoolEmail.Create`, `User.Create`) ilman tietokantaa tai HTTP-palvelinta.
- **Application-yksikkötestit (`tests/Application.UnitTests`):** Käytetään muistipohjaisia testikorvikkeita (`FakeDateTimeProvider` / NSubstitute-mockit) ja kiinteää kelloa.
- **Integraatio- ja E2E-testit (`tests/Integration.Tests`, `tests/E2E.Tests`):** Ajetaan `WebApplicationFactory<Program>`-palvelinta ja oikeaa PostgreSQL-konttia (`Testcontainers.PostgreSql`) vasten.

## Kiinteä kello käynnissä olevassa ohjelmassa

Domain ja Application eivät koskaan kutsu `DateTimeOffset.UtcNow`:ta suoraan. Kaikki aikatarkistukset kulkevat `IDateTimeProvider`-abstraktion (`NowUtc`) tai metodiparametrin (`nowUtc`) kautta.
- Yksikkö- ja integraatiotesteissä `IDateTimeProvider` korvataan ohjattavalla kellolla (`FakeDateTimeProvider`), jolloin kelloa voidaan siirtää esim. klo 09:00 → 14:30 ilman odottamista.
- Käynnissä olevassa kehityspalvelimessa (`Development`) vahvistuskoodit palautetaan vastauksen `devCode`-kentässä, jotta kirjautumisketju voidaan ajaa deterministisesti ilman ulkoista sähköpostipalvelinta.

## Hyväksymiskriteerien ajo

Kaikki yksikkö-, integraatio- ja E2E-testit ajetaan komennolla:

```bash
dotnet test --nologo
```

Sekä kerroskohtaisesti:

```bash
dotnet test tests/Domain.UnitTests/Pelihuone.Domain.UnitTests.csproj --nologo
dotnet test tests/Application.UnitTests/Pelihuone.Application.UnitTests.csproj --nologo
dotnet test tests/Integration.Tests/Pelihuone.Integration.Tests.csproj --nologo
dotnet test tests/E2E.Tests/Pelihuone.E2E.Tests.csproj --nologo
```

Käyttöliittymän tyyppi- ja lint-tarkistukset ajetaan komennolla:

```bash
npm --prefix src/Client run build && npm --prefix src/Client run lint
```

## Kattavuusmatriisi

Jokaisella `Docs/domain.md`:n säännöllä on oma rivi, kerrostaso ja hylkäyskriteeri:

| Sääntö (`Docs/domain.md`) | Paikka (taso) | Spec ja kriteerit | Hylkäystesti |
|---------------------------|---------------|-------------------|--------------|
| **1** Aikaikkunan loppu > alku | `TimeWindow` (Domain) | Spec 001: K2 | On (`Domain.UnitTests`) |
| **2** Aukioloajat 08:00–18:00 & ei menneisyyteen | `OpeningHours` / `ReservationService` | Spec 001: K3, K4 | On (`Domain` + `Application`) |
| **3** Kesto 30 min – 4 h, ennakko max 2 kk | `Reservation` / `ReservationService` | Spec 001: K5, K6 | On (`Application.UnitTests`) |
| **4** Yksittäinen = laite, Tila/Tapahtuma = huone | `Reservation.Create` (Domain) | Spec 001: K1, Spec 002: K1 | On (`Domain.UnitTests`) |
| **5** Peruutus vain ennen alkamista, vain kerran | `Reservation.Cancel` (Domain) | Spec 001: K9, K10 | On (`Domain.UnitTests`) |
| **6** Ei päällekkäistä varausta samalle laitteelle | `ReservationService` (Application) | Spec 001: K7 | On (`409 Conflict` + 10 rinnakkaisen pyynnön testi) |
| **7** Tapahtuman/tilavarauksen aikana ei yksittäisvarauksia | `ReservationService` (Application) | Spec 002: K3, K4 | On (`409 Conflict`) |
| **8** Yhteinen TV (`SharedTV` PS5 ↔ Switch) | `ReservationService` (Application) | Spec 001: K8 | On (`409 Conflict`, `Reservation.SharedTvConflict`) |
| **9** Vain `@edu.xamk.fi` / `@xamk.fi` sähköposti | `SchoolEmail` (Domain) | Spec 001: K11 | On (`Domain.UnitTests` + `400 Bad Request`) |
| **10** `SuperAdmin` override peruuttaa opiskelijavaraukset syyllä | `ReservationService` (Application) | Spec 002: K2, K5 | On (ei-SuperAdmin hylätään `403 Forbidden`) |
| **11** Käyttöesto (`IsBanned`) & `SuperAdmin`-suoja | `User` (Domain) / `ReservationService` | Spec 002: K6 | On (`Domain.UnitTests` + `403 Forbidden`) |
| **Vapaana nyt** laskettuna näkymänä | `GamingStationService` (Application) | Spec 001: K1, K8 | On (`Integration.Tests`) |

## Milloin ja kuka

| Milloin | Kuka | Mitä ajetaan | Tuloste menee |
|---------|------|--------------|---------------|
| Askeleen aikana | Työntekijä | Oman kerroksen käännös ja testiprojekti | Paluuviestiin johtajalle |
| Ennen committia | Katselmoija | Diff kattavuusmatriisia, `Paikka`-saraketta ja kieltoja vasten | Löytölistaan |
| Ennen committia | Johtaja | `dotnet build --nologo`, `dotnet test --nologo` ja UI-linttaus | Commit-viestin runkoon |
| Ennen pull requestin yhdistämistä | Ihminen | Specin kriteerit ja E2E-skenaariot | Pull requestin runkoon |
| Ennen `master`-yhdistystä | Ihminen | `Docs/arkkitehtuuri.md`:n **Valmis**-lauseet rivi riviltä | Pull requestin runkoon |

## Mitä ei testata

- Ulkoisen SMTP-sähköpostipalvelimen tai oikean Discord-palvelimen verkkoliikennettä (molemmat on abstrahoitu/mockattu testeissä).
- Kolmannen osapuolen pilvi-infrastruktuurin kuormansietoa.

