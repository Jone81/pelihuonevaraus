# Domain — pelihuoneen varausjärjestelmä

Taktinen DDD-kuvaus: sanasto, käsitteet, säännöt paikkoineen.

## Sanasto

Asiakkaan sanat. Sama sana koodissa.

| Sana | Koodissa | Yksi lause |
|------|----------|------------|
| **Pelihuone** | `GameRoom` | Kampuksen pelitila (*Xamk Game Room*), joka sisältää fyysiset pelipisteet ja yhteisen television. |
| **Pelipiste** | `GamingStation` | Yksittäinen pelilaite: pelitietokone (`PC 1`–`PC 6`) tai konsolipiste (`PlayStation 5`, `Nintendo Switch`). |
| **Varaus** | `Reservation` | Oikeus käyttää yhtä pelipistettä (`Individual`) tai koko pelihuonetta (`Room` / `Event`) tietyllä aikaikkunalla. |
| **Aikaikkuna** | `TimeWindow` | Arvo-objekti, joka määrittää varauksen alku- (`StartUtc`) ja loppuhetken (`EndUtc`). |
| **Aukioloaika** | `OpeningHours` | Aikasääntö (oletuksena arkisin klo 08:00–18:00 Suomen aikaa), jonka sisällä normaalien varausten on pysyttävä. |
| **Koulusähköposti** | `SchoolEmail` | Käyttäjän tunnistava organisaatiosähköposti (`@edu.xamk.fi` tai `@xamk.fi`). |
| **Yhteinen TV** | `UsesSharedTv` / `SharedTV` | Huoneen yhteinen 4K-televisio, jota `PlayStation 5` ja `Nintendo Switch` eivät voi käyttää samanaikaisesti. |
| **Käyttäjä** | `User` | Järjestelmän käyttäjä roolilla `User` (opiskelija), `Admin` (ylläpitäjä) tai `SuperAdmin` (opettaja/pääkäyttäjä). |
| **Peli** | `Game` | Pelikatalogin asennettu peli tai opiskelijoiden yhteisöllinen pelitoive (`IsWishlist`). |
| **Tiedote** | `News` | Pelihuoneen etusivulla ja bannerissa näytettävä uutinen tai turnausilmoitus. |
| **Vikailmoitus** | `IssueReport` | Opiskelijan tekemä ilmoitus rikkinäisestä laitteesta tai ohjelmistoviasta. |
| **Vapaana nyt** | *Laskettu näkymä* | Tieto siitä, mitkä pelipisteet ovat vapaina kuluvalla hetkellä tai valitulla aikavälillä. Lasketaan, ei tallenneta. |

## Käsitteet

Kentät sanoina.

- **Pelihuone (`GameRoom`):** tunniste (`GameRoomId`), nimi, sijainti, kuvaus, maksimikapasiteetti.
- **Pelipiste (`GamingStation`):** tunniste (`GamingStationId`), pelihuone (`GameRoomId`), nimi, laitekoodi (`DeviceCode`), tyyppi (`StationType`: `PC`, `PlayStation5`, `NintendoSwitch`), käyttääkö yhteistä TV:tä (`UsesSharedTv`), käytössä (`IsActive`).
- **Varaus (`Reservation`):** tunniste (`ReservationId`), varaaja (`UserId`), tyyppi (`ReservationType`: `Individual`, `Room`, `Event`), pelipiste (`GamingStationId`, voi puuttua tilavarauksessa), pelihuone (`GameRoomId`, voi puuttua yksittäisvarauksessa), aikaikkuna (`TimeWindow`), tila (`ReservationStatus`: `Active`, `Cancelled`, `Completed`), peruutussyy (`CancellationReason`).
- **Käyttäjä (`User`):** tunniste (`UserId`), koulusähköposti (`SchoolEmail`), näyttönimi (`DisplayName`), rooli (`UserRole`), käyttöesto päättyy (`BannedUntilUtc`), käyttöeston syy (`BanReason`).

## Invariantit

Paikan ratkaisee kysymys: *mitä tietoa tarkistus tarvitsee?* Yhden olion oma data → entiteetti tai arvo-objekti (`Domain`). Haku tai toinen olio → käyttötapauspalvelu (`Application` / Use case).

| # | Sääntö | Paikka | Miksi juuri siinä |
|---|--------|--------|-------------------|
| 1 | Aikaikkunan loppuhetki on alkuhetken jälkeen (`EndUtc > StartUtc`) | **Aikaikkuna** (`TimeWindow`, Domain) | Kaksi kellonaikaa, joilla on yhteinen sääntö. Virheellistä aikaikkunaa ei voi edes muodostaa. |
| 2 | Varaus ei saa alkaa menneisyydessä (yli 15 min ennen nykyhetkeä) ja sen on oltava aukioloaikojen (08:00–18:00) sisällä, ellei tekijä ole `SuperAdmin` | **Aukioloaika / Use case** (`OpeningHours` + `ReservationService`) | Aukiolosääntö asuu `OpeningHours`-arvo-objektissa; dynaamiset asetukset ja `SuperAdmin`-poikkeus tarkistetaan luontihetkellä. |
| 3 | Varauksella on vähimmäis- ja enimmäiskesto (min 30 min, yksittäinen max 4 h, ennakko max 2 kk) | **Varaus / Use case** (`Reservation` + `ReservationService`) | Kesto on aikaikkunan oma ominaisuus; dynaamiset kiintiörajat (`SiteSettings`) tarkistetaan `ReservationService`-palvelussa. |
| 4 | Yksittäisvarauksella on oltava pelipiste (eikä koko tilaa); tila- ja tapahtumavarauksella on oltava pelihuone (eikä yksittäistä pelipistettä) | **Varaus** (`Reservation.Create`, Domain) | Varauksen omat kentät (`ReservationType`, `GamingStationId`, `GameRoomId`). |
| 5 | Varauksen voi perua vain ennen sen alkamista, eikä jo peruttua varausta voi perua uudestaan | **Varaus** (`Reservation.Cancel`, Domain) | Varauksen oma tila (`Status`) ja alkamisaika (`TimeWindow.StartUtc`) verrattuna parametrina annettuun nykyhetkeen (`nowUtc`). |
| 6 | Samaa pelipistettä ei saa varata kahdelle samaan aikaan | **Use case** (`ReservationService.CreateReservationAsync`, Application) | Vaatii tietokantahaun kyseisen laitteen aktiivisista varauksista samalle aikavälille. Yksi varausolio ei tiedä muista varauksista. |
| 7 | Tapahtuman (`Event`) tai koko tilan varauksen (`Room`) aikana ei saa tehdä yksittäisvarauksia, eikä koko tilaa voi varata jos yksikin laite on jo varattu (ilman overridea) | **Use case** (`ReservationService.CreateReservationAsync`, Application) | Vaatii haun koko pelihuoneen aktiivisista varauksista kyseiselle aikavälille. |
| 8 | Jos toinen yhteistä TV:tä käyttävä konsoli (`PlayStation 5` tai `Nintendo Switch`) on varattu, toista ei voi varata samalle ajalle | **Use case** (`ReservationService.CreateReservationAsync`, Application) | Vaatii sekä kohdelaitteen `UsesSharedTv`-tiedon että kaikkien muiden `UsesSharedTv`-laitteiden aktiivisten varausten tarkistuksen. |
| 9 | Kirjautuminen ja käyttäjän luonti sallitaan vain Xamkin sähköpostilla (`@edu.xamk.fi` tai `@xamk.fi`) | **Koulusähköposti** (`SchoolEmail.Create`, Domain) | Sähköpostin päätesääntö on arvo-objektin oma invariantti: `User`-entiteettiä ei voi luoda ilman kelvollista `SchoolEmail`-arvoa. |
| 10 | `SuperAdmin` voi luoda tapahtuman päällekkäisten varausten päälle, jolloin ristiriitaiset opiskelijavaraukset peruutetaan syyllä | **Use case** (`ReservationService.CreateWithAdminOverrideAsync`, Application) | Vaatii tekijän roolin tarkistuksen (`UserRole.SuperAdmin`), päällekkäisten varausten haun ja jokaisen peruuttamisen (`Cancel`). Ks. `ADR 0001`. |
| 11 | Käyttöestossa (`IsBanned`) oleva käyttäjä ei voi luoda uusia varauksia, eikä `SuperAdmin`-käyttäjää voi asettaa käyttöestoon | **Käyttäjä / Use case** (`User.Ban` Domainissa + `ReservationService`) | `User.Ban` estää `SuperAdmin`-bannin suoraan entiteetissä; varauksen esto tarkistetaan varauksen luonnissa. |

## Arvo vai luku

- **Aikaikkuna (`TimeWindow`) on arvo-objekti:** Kaksi ajankohtaa (`StartUtc`, `EndUtc`), joilla on yhteinen sääntö (`EndUtc > StartUtc`) ja leikkaustarkistus (`OverlapsWith`), mutta ei omaa identiteettiä.
- **Koulusähköposti (`SchoolEmail`) on arvo-objekti:** Merkkijono, joka normalisoidaan pieniksi kirjaimiksi ja validoidaan `@edu.xamk.fi` / `@xamk.fi` -säännöllä syntyhetkellään.
- **Laitekoodi (`DeviceCode`) ja kesto minuutteina jäävät kentiksi/luvuiksi:** Niillä ei ole monimutkaista yhteissääntöä irrallaan entiteetistään.

## Laskettu näkymä: Reaaliaikainen tilanne ("Vapaana nyt")

Vapaita pelipisteitä ("mikä on vapaana juuri nyt tai valitulla aikavälillä") **ei tallenneta tietokantaan erillisenä lippuna**. Se lasketaan aina aktiivisista pelipisteistä (`IsActive == true`), valitun aikavälin varauksista sekä `UsesSharedTv`-säännöstä (`GamingStationService.GetAvailableStationsAsync`). Näin tallennettu tila ei koskaan jää epäsynkkaan todellisten varausten tai kellonajan kanssa.

## Käyttäytymiset

| Tekeminen | Kuka aloittaa | Sitovat säännöt | Mitä se ei tee |
|-----------|---------------|-----------------|----------------|
| Kirjaudu sisään | Opiskelija / Henkilökunta | 9 | Ei salli ulkopuolisia sähköpostiosoitteita. |
| Varaa pelipiste | Opiskelija / Henkilökunta | 1, 2, 3, 4, 6, 7, 8, 11 | Ei jyrää muiden varauksia, ei salli kahta konsolia samaan TV:seen yhtä aikaa. |
| Peru varaus | Varaaja / Admin | 5 | Ei salli jo alkaneen tai päättyneen varauksen perumista; ei poista riviä tietokannasta vaan merkitsee tilaksi `Cancelled`. |
| Järjestä tapahtuma (Override) | `SuperAdmin` | 1, 4, 10 | Ei hylkää varattujen laitteiden takia, vaan peruuttaa ristiriitaiset varaukset syykoodilla. |
| Katso vapaat pelipisteet | Kaikki | — (vain aktiiviset laitteet) | Ei muuta tietokannan tilaa. |

## Yksi päätös

"Varauksen voi perua vain ennen sen alkua" (sääntö #5) asuu **`Reservation`-entiteetissä**, koska varaus tuntee oman alkamisaikansa ja tilansa — yksikään reitti tai palvelu ei pysty perumaan alkanutta varausta ohittamalla entiteetin. Sen sijaan "samaa pelipistettä ei saa kahdelle samaan aikaan" (#6) ja "konsolien yhteinen TV" (#8) asuvat **`ReservationService`-käyttötapauspalvelussa**, koska yksi varausolio ei tiedä muiden opiskelijoiden tekemistä varauksista eikä muiden laitteiden `UsesSharedTv`-kytkennöistä.

