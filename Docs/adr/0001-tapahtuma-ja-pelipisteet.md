# ADR 0001 — Tapahtuma varaa pelihuoneen yhtenä varauksena ja peruuttaa päällekkäiset yksittäisvaraukset syykoodilla

**Tila:** hyväksytty · **Päivä:** 2026-10-21

## Tilanne

Pelihuoneessa voidaan tehdä sekä yksittäisen pelipisteen varauksia (`GamingStationId`) että koko tilan kattavia varauksia (`ReservationType.Room` ja `ReservationType.Event`). Kun opettaja (`SuperAdmin`) järjestää tapahtuman tai turnauksen ajalle, jolle opiskelijat ovat jo ehtineet varata yksittäisiä pelipisteitä, järjestelmän on ratkaistava kaksi rakennekysymystä:
1. Tallennetaanko koko tilan tapahtuma yhtenä huonetason varauksena (`GameRoomId`) vai 8 erillisenä laitevarauksena jokaiselle pelipisteelle?
2. Mitä tehdään samalle aikavälille osuville opiskelijoiden yksittäisvarauksille?

## Vaihtoehdot

1. **Tapahtuma luo 8 erillistä laitevarausta ja poistaa vanhat varaukset tietokannasta (`DELETE`).**
   - *Hyöty:* Päällekkäisyystarkistus tarvitsee vain laitekohtaisen haun.
   - *Haitta:* Opiskelijan varaus katoaa jäljettömiin ilman selitystä, ja tapahtuman muokkaus tai peruminen vaatii 8 rivin synkronointia.
2. **Tapahtuma on oma erillinen entiteettitaulunsa (`Event`), ja olemassa olevat varaukset estävät tapahtuman luonnin (`409 Conflict`), kunnes opettaja peruu ne yksitellen käsin.**
   - *Hyöty:* Ei automaattista ylikirjoitusta.
   - *Haitta:* Vastoin asiakkaan vaatimusta (`Docs/tilaus.md`: *"Opettajan tapahtuma voittaa aina"*) ja työläs, jos turnauspäivällä on kymmeniä yksittäisvarauksia.
3. **Tapahtuma on `Reservation`-aggregaatti tyypillä `ReservationType.Event` (kohdistettuna `GameRoomId`:hen), ja `SuperAdmin`-override merkitsee samalle aikavälille osuvat yksittäisvaraukset tilaan `Cancelled` peruutussyyllä samassa transaktiossa.**

## Päätös

Valitaan **Vaihtoehto 3**.

## Seuraukset

- **Selkeä domain-vastuu (`Reservation.Create`):** Sääntö #4 varmistaa `Reservation`-entiteetissä, että `Individual`-varauksella on aina `GamingStationId` ja `Room`/`Event`-varauksella aina `GameRoomId`.
- **Yksittäisvarausten esto tapahtuman aikana (Sääntö #7):** `ReservationService` tarkistaa sekä laitekohtaiset päällekkäisyydet että koko tilan (`Room`/`Event`) varaukset.
- **Läpinäkyvä historia opiskelijalle (Sääntö #10):** Kun `SuperAdmin` kutsuu `OverrideAndCreateEventAsync`-käyttötapausta (`POST /api/reservations/override`), ristiriitaisia varauksia ei poisteta tietokannasta, vaan jokaiselle kutsutaan `reservation.Cancel(reason, nowUtc)`. Opiskelija näkee `Omat varaukset` -näkymässä peruutuksen syyn (esim. *"CS2-turnaus koko tilassa"*) ja jokaisesta peruutuksesta lähtee `ReservationCancelledDomainEvent` Outbox-tauluun.
- **Vapaa tila ("Vapaana nyt") pysyy yhtenäisenä:** Jos aikavälillä on yksikin aktiivinen `Room`- tai `Event`-varaus, `GamingStationService.GetAvailableStationsAsync` palauttaa tyhjän listan (0 vapaata laitetta).

