# Tarkistus — pelihuoneen varausjärjestelmä

Työloki suunnittelupäätöksistä ja tarkistuskierroksista. Aloitettu vaiheessa 0 (`Docs/tilaus.md`) ja täydennetty vaiheessa 6 ennen koeajoa.

## Oma kierros (ennen tekoälyä)

| # | Löytö | Tyyppi |
|---|-------|--------|
| 1 | `Docs/domain.md` säännössä #8 (konsolien yhteinen TV) luki aluksi vain "Use case", mutta ei sanottu, mistä tieto yhteisestä TV:stä saadaan (`GamingStation.UsesSharedTv`). | Paikka ilman riittävää perustelua |
| 2 | `Docs/arkkitehtuuri.md` Valmis-kohta sanoi aluksi yleisesti "varausjärjestelmä toimii virheettömästi". | Lause, joka sopisi mihin tahansa varausjärjestelmään |
| 3 | Spec 001 kriteeri sanoi "käyttöliittymä näyttää varatut ajat". | Hyväksymiskriteeri, jota ei voi todeta yhdellä kutsulla tai katseella |
| 4 | Mitä tapahtuu opiskelijavarauksille, kun `SuperAdmin` luo tapahtuman niiden päälle — poistetaanko ne vai merkitäänkö peruutetuiksi? | Agentti joutuisi päättämään itse |

## Tekoälyn löydöt

**Vaihe 0 (`Docs/tilaus.md`)** — prompti: *"Mitkä tärkeät kysymykset puuttuvat, joiden vastaus on arvo tai sääntö?"*
- Ehdotti kysymystä: *"Saako varauksen luoda, jos valittu tasatunti alkoi 5 minuuttia sitten?"* (synnytti 15 minuutin `GracePeriod`-oletuksen `Docs/havainnot.md`:hen).
- Ehdotti kysymystä: *"Voiko kahdella konsolilla pelata yhtä aikaa?"* (selvitettiin huoneessa → yhteinen 4K-TV).

**Vaihe 2 (`Docs/domain.md`)** — prompti: *"Onko jokainen Paikka perusteltu kysymyksellä 'mitä tietoa tarkistus tarvitsee'?"*
- Ehdotti säännön #5 (*varauksen voi perua vain ennen sen alkua*) siirtämistä `ReservationService`-use caseen, koska "tarvitaan nykyinen kellonaika".

**Vaihe 6, kuivaharjoitus** — uusi sessio luki `AGENTS.md`, `Docs/` ja `specs/`:
- Ilmoitti joutuvansa arvaamaan, palauttaako `SuperAdmin`-override poistetut rivit vai peruutetut varaukset, jos `ADR 0001` ei sano sitä eksplisiittisesti.
- Huomautti, että jos aikataulumatriisi näyttää vain yhden valitun laitteen kerrallaan, käyttäjä ei näe miksi Nintendo Switch on lukittu silloin kun PlayStation 5 on varattu.

**Vaihe 6, kattavuus** — säännölle #11 (`SuperAdmin`-käyttäjää ei voi asettaa käyttöestoon) puuttui oma hylkäyskriteeri `Spec 002`:sta.

## Päätökset

| Löytö | Päätös | Miksi |
|-------|--------|-------|
| Oma 1: `UsesSharedTv`-perustelu | **Korjattu** | Täydennetty `Docs/domain.md` sääntöön #8: tarkistus tarvitsee kohdelaitteen `UsesSharedTv`-kentän sekä muiden `UsesSharedTv`-laitteiden aktiiviset varaukset. |
| Oma 2: geneerinen Valmis-lause | **Korjattu** | Korvattu `Docs/arkkitehtuuri.md`:ssä konkreettisilla, todettavilla lauseilla (409 SharedTV, SuperAdmin override, Domain-testit ilman tietokantaa). |
| Oma 3: epämääräinen UI-kriteeri | **Korjattu** | Muutettu `Spec 001` ja `Spec 003` Given–When–Then-muotoon (kaikki 8 laitetta aikataulumatriisissa + Drag-to-Select aikavälin valinta). |
| Oma 4 + AI: tapahtuman jyräys (`override`) | **Korjattu (`ADR 0001`)** | Kirjattu `Docs/adr/0001-tapahtuma-ja-pelipisteet.md`: päällekkäiset varaukset merkitään tilaan `Cancelled` peruutussyyllä, ei poisteta tietokannasta. |
| AI vaihe 2: sääntö #5 use caseen | **Hylätty** | Nykyhetki (`nowUtc`) annetaan parametrina `Reservation.Cancel(reason, nowUtc)`-metodille. Silloin sääntö tarvitsee vain `Reservation`-olion omaa dataa (`Status` ja `TimeWindow.StartUtc`), eikä mikään reitti voi ohittaa sitä. |
| AI vaihe 6: säännön #11 hylkäystesti puuttui | **Korjattu** | Lisätty `Spec 002` kriteeri K6 sekä Domain-yksikkötesti (`SuperAdmin`-bannaus heittää `DomainException`). |

