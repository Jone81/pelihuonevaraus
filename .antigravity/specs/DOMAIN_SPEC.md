# Domain, pelihuoneen varausjärjestelmä

Taktinen DDD-kuvaus: sanasto, käsitteet ja säännöt paikkoineen.

## Sanasto
Asiakkaan sanat. Sama sana koodissa.

| Sana koodissa | Yksi lause |
| :--- | :--- |
| **GameRoom** | Oppilaitoksen pelitila, joka sisältää fyysiset pelipisteet ja yhteisen television. |
| **GamingStation** | Pelipiste, joka voi olla joko tietokone (PC) tai konsolityöpiste (PlayStation 5 ja Nintendo Switch). |
| **Reservation** | Oikeus käyttää pelipistettä tai koko tilaa tiettynä aikana (yksittäisvaraus, tilavaraus, tapahtumavaraus). |
| **TimeWindow** | Aikaikkuna, joka määrittää varauksen alku- ja loppuhetken. |
| **OpeningHours** | Aukioloajat (klo 08:00-18:00), joiden sisällä varauksien on pysyttävä. |
| **User** | Järjestelmän käyttäjä (opiskelija tai henkilökunta), joka tunnistetaan koulun sähköpostilla. |
| **Admin** | Ylläpitäjä, joka hallinnoi pelejä, uutisia, tapahtumia ja sivuston asetuksia. |
| **SuperAdmin** | Pääkäyttäjä (opettaja), jolla on oikeus tehdä varauksia milloin vain ja jyrätä tarvittaessa muiden varauksia. |
| **SharedTV** | Konsolien yhteinen näyttölaite, jota PS5 ja Switch eivät voi käyttää samanaikaisesti. |

## Käsitteet
Kentät sanoina.

- Pelipiste: id, tyyppi (PC, Playstation5, NintendoSwitch), tila ja tunniste.
- Varaus: id, tyyppi (yksittäinen, tila, tapahtuma), kohde (pelipiste tai koko tila), aikaikkuna (alku ja loppu), varaaja (käyttäjä-id).
- Aikaikkuna: alkuhetki, loppuhetki.
- Käyttäjä: sähköposti (`@edu.xamk.fi` ja `@xamk.fi`), rooli (Käyttäjä, Admin, SuperAdmin).
- Peli: nimi, alusta, kuvaus, toivelista-tieto.

## Invariantit
Paikan ratkaisee kysymys: mitä tietoa tarkistus tarvitsee? Yhden olion oma data asuu entiteetissä tai arvo-objektissa (`Domain`). Haku tai toinen olio kuuluu käyttötapaukseen (`Application`).

| # | Sääntö | Paikka | Miksi juuri siinä |
| :- | :--- | :--- | :--- |
| 1 | Samaa pelipistettä ei saa kahdelle samaan aikaan | Use case (luo varaus) | Vaatii olemassa olevien varausten haun tietylle laitteelle. Yksi olio ei tiedä muista varauksista. |
| 2 | Varaus vain aukioloaikojen sisällä (08:00-18:00) | Aikaikkuna ja Varaus | Tarkistaa varauksen alku- ja loppuhetken suhteessa sallittuun aikaväliin. |
| 3 | Varauksella on ylä- ja alarajat (min 30 min, yksittäinen max 4 h, tila max 1 pv, ennakko max 2 kk) | Varaus ja Aikaikkuna | Keston ja ennakkoajan tarkistus perustuu varauksen omiin kenttiin. |
| 4 | Tapahtuman tai tilavarauksen aikana ei yksittäisiä varauksia | Use case (luo varaus) | Vaatii tarkistuksen siitä, onko kyseiselle ajalle olemassa koko tilan varausta tai tapahtumaa. |
| 5 | Varauksen voi perua vain ennen sen alkamista (ei jälkikäteen) | Varaus | Vertailee nykyhetkeä (`now`) varauksen alkamisaikaan. |
| 6 | Jos toinen konsoli (PS5 tai Switch) on varattu, toista ei voi varata (sama TV) | Use case (luo varaus) | Vaatii tarkistuksen toisen laitteen tilasta samalle aikavälille (kaksi eri oliota). |
| 7 | Kirjautuminen vain koulun sähköpostitunnuksilla (`@edu.xamk.fi` ja `@xamk.fi`) | Use case ja Autentikointi | Sähköpostin loppuosan tarkistus ulkoisen syötteen perusteella. |
| 8 | SuperAdmin voi jyrätä muiden varaukset tapahtuman takia | Use case (tapahtuman luonti) | Vaatii oikeuksien tarkistuksen ja olemassa olevien varausten haun sekä hallinnoinnin. |

## Arvo vai luku
- Aikaikkuna on arvo (value object): kaksi ajankohtaa, joilla on yhteinen sääntö (alku ennen loppua, aukioloaikojen sisällä), eikä omaa irrallista identiteettiä.
- Kesto (esimerkiksi max 4 tuntia) säilyy lukuna ja aikavälin laskentasääntönä.
- Sähköposti on merkkijono, jolla on organisaatiotunnistuksen tarkistussääntö.

## Laskettu näkymä, reaaliaikainen tilanne
Vapaita pelipisteitä ja tilan sen hetkistä tilaa ("mikä on vapaana nyt ja tänään") ei tallenneta erillisenä tilana. Se lasketaan reaaliaikaisesti aktiivisten varausten ja kellonajan perusteella. Näin vältetään tilatäsmäytysvirheet.

## Käyttäytymiset

| Tekeminen | Kuka aloittaa | Sitovat säännöt | Mitä se ei tee |
| :--- | :--- | :--- | :--- |
| Luo varaus | Käyttäjä | 1, 2, 3, 6 | Ei salli varauksia aukioloaikojen ulkopuolella tai päällekkäin. |
| Luo tapahtuma | SuperAdmin tai Admin | 4, 8 | Ei salli yksittäisvarauksia tapahtuman päälle (jyrää tarvittaessa). |
| Peru varaus | Käyttäjä | 5 | Ei salli peruutusta varauksen alkamisen jälkeen. |
| Kirjaudu sisään | Käyttäjä | 7 | Ei salli ulkopuolisia sähköposteja. |

## Yksi päätös
Päätökset kirjataan ADR-dokumentteihin.
