# Havainnot, pelihuoneen varausjärjestelmä

Kirjattu pelihuonekäynnin jälkeen. Tilauksen kysymykset ja asiakkaan vastaukset ovat tiedostossa `Docs/tilaus.md`. Tässä kuvataan se, mitä fyysisessä tilassa havaittiin ja mitkä oletukset tehtiin.

## Tila

Kampuksen pelihuone (`GameRoom`: *Xamk Game Room*) sisältää yhteensä 8 pelipistettä (`GamingStation`):

| Pelipisteen nimi | Laitekoodi | Tyyppi | Näyttö ja huomiot |
|------------------|------------|--------|-------------------|
| **PC 1** | `PC-01` | `PC` | Oma pelinäyttö |
| **PC 2** | `PC-02` | `PC` | Oma pelinäyttö |
| **PC 3** | `PC-03` | `PC` | Oma pelinäyttö |
| **PC 4** | `PC-04` | `PC` | Oma pelinäyttö |
| **PC 5** | `PC-05` | `PC` | Oma pelinäyttö |
| **PC 6** | `PC-06` | `PC` | Oma pelinäyttö |
| **PlayStation 5** | `PS5-01` | `PlayStation5` | Kytketty huoneen ainoaan yhteiseen 4K-televisioon (`UsesSharedTv = true`) |
| **Nintendo Switch** | `SW-01` | `NintendoSwitch` | Kytketty samaan yhteiseen 4K-televisioon (`UsesSharedTv = true`) |

- Aukioloajat: Ma-Pe klo 08:00-18:00 (Suomen aikaa `Europe/Helsinki`).
- Hallinnointi: Opiskelijakunnan ylläpitäjät (`Admin`) hoitavat pelikirjastoa, tiedotteita ja laitehuoltoja. Opettaja (`SuperAdmin`) vastaa tilasta, turnauksista ja poikkeusvarauksista.

## Nykyinen tapa ja sen ongelmat

Varaukset on tähän asti kirjattu pelihuoneen oven ruutupaperille sekä `#pelihuone-varaukset`-Discord-kanavalle. Kolme ongelmatapausta asiakkaan ja opiskelijoiden sanoin:

1. "Yksi porukka varasi Discordissa PS5:n klo 14-16 ja toinen kirjoitti oven paperilapulle Nintendo Switchin samalle ajalle. Molemmat tulivat paikalle, mutta huoneessa on vain yksi TV, johon molemmat konsolit on kytketty."
2. "Joku varasi PC 1:n klo 08-18 joka päivälle koko kuukaudeksi etukäteen, eikä kukaan muu päässyt koneelle iltapäivisin."
3. "Perjantaina oli CS2-turnaus ja koko tila piti olla varattu klo 12 alkaen, mutta kolme opiskelijaa istui koneilla ja sanoi varanneensa vuoron paperilapulta jo viime viikolla."

## Huoneessa selvinneet

| Kysymys (`Docs/tilaus.md`) | Mitä huoneessa nähtiin |
|----------------------------|------------------------|
| Montako pelipistettä huoneessa on ja miten ne on nimetty? | Pöydissä on tarrat `PC 1` - `PC 6` (koodit `PC-01` - `PC-06`). Sohvaryhmän luona on `PlayStation 5` (`PS5-01`) ja `Nintendo Switch` (`SW-01`). Yhteensä tasan 8 pelipistettä. |
| Voiko konsoleita käyttää yhtä aikaa? | Ei voi. Molempien konsolien HDMI-kaapelit menevät samaan seinällä olevaan 4K-televisioon (`SharedTV`). Jos PS5 on varattu, Switchiä ei voi käyttää samanaikaisesti, ja päinvastoin. |
| Miten rikkinäinen laite merkitään nyt? | Näytön päälle oli teipattu maalarinteipillä lappu "PC 3 näyttö pimeänä". Kukaan Discordissa varannut ei tiennyt tästä ennen saapumistaan paikalle. |

Ristiriita tilauksen kanssa: Tilauksessa puhuttiin vain siitä, että samaa pelipistettä ei saa kahdelle samaan aikaan. Huoneessa paljastui, että PS5 ja Switch ovat kaksi eri pelipistettä, mutta ne jakavat saman fyysisen television (`SharedTV`). Tämä synnytti uuden ehdottoman säännön (`Docs/domain.md` sääntö #8).

## Avoimet

Näihin kysymyksiin tehtiin eksplisiittiset oletukset:

| Avoin kysymys | Oletus tässä toteutuksessa |
|---------------|----------------------------|
| Sallitaanko varauksen luominen, jos alkamisaika on jo kuluvalla tunnilla pari minuuttia menneisyydessä (esimerkiksi kello on 10:03 ja opiskelija valitsee 10:00)? | Kyllä, 15 minuutin joustovara (`GracePeriod`). Varaus sallitaan, kunhan `StartUtc >= NowUtc - 15 min`, jotta paikalle saapuva opiskelija voi varata vapaan koneen tasatunnista alkaen. |
| Miten sähköpostivahvistus toimii kehitysympäristössä ilman oikeaa SMTP-palvelinta? | Kehitysympäristössä (`Development`) palvelin palauttaa 6-numeroisen vahvistuskoodin suoraan API-vastauksen `devCode`-kentässä ja tarjoaa pikakirjautumispainikkeet testausta varten. |
| Mitä tapahtuu, jos opiskelija yrittää varata yksittäistä pelipistettä silloin, kun tilassa on koko tilan varaus (`Room`) tai tapahtuma (`Event`)? | Pyyntö hylätään tilakoodilla `409 Conflict` (`Reservation.RoomReserved`), koska koko tila on suljettu yksittäisvarauksilta. |
| Voiko ylläpitäjä muuttaa aukioloaikoja tai varauskiintiöitä ilman koodimuutosta? | Kyllä. `SettingsService` tallentaa aukioloajat ja kiintiöt (`OpenTimeHour`, `CloseTimeHour`, `MaxIndividualHours`, `MaxAdvanceBookingMonths`), joita `ReservationService` lukee dynaamisesti. |

## Koeajo

Spec 001 ja Spec 002 on ajettu suunnittelutilassa askel kerrallaan ja todennettu automaattitesteillä (`dotnet test`) sekä käyttöliittymän tarkistuksilla.

- Agentin kysymykset: askeleen suunnittelussa täsmennettiin, tallennetaanko tapahtuman jyräämät opiskelijavaraukset poistettuina riveinä vai tilassa `Cancelled` syyn kanssa. Vahvistettiin ratkaisun `ADR 0001` mukaisesti, että varaukset merkitään tilaan `Cancelled` peruutussyyllä, jotta opiskelija näkee Omat varaukset -näkymässä peruutuksen syyn.
- Käyttöliittymän tarkennukset: alkuperäisessä käyttöliittymäluonnoksessa aikataulumatriisi näytti vain yhden valitun laitteen rivin kerrallaan, jolloin konsolien yhteisen TV:n (`SharedTV`) varaukset eivät näkyneet samassa taulukossa. Lisättiin sääntö (`UI-6`), että aikataulumatriisi listaa aina kaikki 8 pelipistettä yhtä aikaa ja tukee aikavälin valintaa hiirellä.
- Puuttunut sääntö: PS5 ja Nintendo Switch jakavat saman television (`UsesSharedTv = true`). Toisen konsolin varaus lukitsee molemmat konsolit samalle aikavälille tilakoodilla `409 Conflict` (`Reservation.SharedTvConflict`). Tämä on lisätty tiedoston `Docs/domain.md` sääntöön #8 ja `Docs/rajapinta.md` -virhetaulukkoon.
