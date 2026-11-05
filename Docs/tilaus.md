# Tilaus — pelihuoneen varausjärjestelmä

Kirjattu luokassa ennen pelihuoneessa käyntiä. Asiakas on opiskelijakunnan ja kampuksen pelihuoneen vastuuhenkilö (opettaja asiakkaan roolissa). Vastaukset sanatarkasti; tulkinnat ja säännöt ovat `Docs/domain.md`:ssä.

## Tilaus

Opiskelijakunta ylläpitää kampuksen **pelihuonetta**. Siellä on pelitietokoneita ja konsoleita. Nyt varaukset tehdään Discord-kanavalla ja oven paperilapulla. Se ei toimi: sama kone on luvattu kahdelle, joku istuu koneella koko iltapäivän, ja turnauspäivänä tilassa on ihmisiä, jotka "varasivat koneen viime viikolla".

Asiakas kuvaa tarpeen näin:

> Opiskelijan pitää pystyä varaamaan yksi pelipiste tietyksi ajaksi. Henkilökunnan pitää pystyä järjestämään tapahtuma, joka varaa koko tilan. Kenen tahansa pitää nähdä, mikä on vapaana juuri nyt ja tänään.
>
> Säännöt ovat ehdottomia: samaa pelipistettä ei saa kahdelle samaan aikaan, tapahtuman aikana ei ole yksittäisvarauksia, varaus on aukioloaikojen sisällä, varauksella on yläraja, ja varauksen voi perua vain ennen sen alkua.
>
> Sääntöjen ei pidä olla kiinni tallennustavassa. Ensi vuonna tila laajenee toiselle kampukselle, ja silloin katsotaan uudestaan, mihin data menee.
>
> Seuraava tekijä ei ole käynyt huoneessa eikä muista tätä keskustelua. Ennen kuin se kirjoittaa ohjelman, sen pitää lukea reposta kieli, säännöt ja niiden paikka, osien rajat ja se, miten repoa käsitellään.

## Tarkennukset

| Kysymys | Vastaus |
|---------|---------|
| Mitkä ovat pelihuoneen aukioloajat? | "Arkisin maanantaista perjantaihin klo 08:00–18:00. Viikonloppuisin ovi on lukossa, paitsi jos opettaja järjestää turnauksen." |
| Mikä on yksittäisen varauksen vähimmäis- ja enimmäiskesto? | "Puoli tuntia on lyhin varaus, ja opiskelija saa varata yhden pelipisteen enintään neljäksi tunniksi kerrallaan." |
| Kuinka pitkälle tulevaisuuteen varauksen saa tehdä? | "Enintään kaksi kuukautta etukäteen. Muuten joku varaa koko lukukauden perjantait." |
| Miten opiskelija ja henkilökunta tunnistetaan? | "Koulun sähköpostilla: opiskelijoilla `@edu.xamk.fi` ja henkilökunnalla `@xamk.fi`. Ulkopuolisilla sähköposteilla ei ole asiaa tilaan." |
| Kuka saa varata koko tilan tai luoda tapahtuman? | "Opiskelija voi tehdä tilavarauksen enintään 4 tunniksi, jos tilassa ei ole muita varauksia. Ylläpitäjä (`Admin`) voi varata koko päivän (max 10 h). Opettaja (`SuperAdmin`) voi luoda tapahtuman milloin vain, myös aukioloaikojen ulkopuolelle." |
| Mitä tapahtuu olemassa oleville opiskelijavarauksille, kun `SuperAdmin` luo tapahtuman samalle ajalle? | "Opettajan tapahtuma voittaa aina. Päällekkäiset yksittäisvaraukset peruutetaan automaattisesti ja niihin kirjataan peruutuksen syy." |
| Voiko varauksen perua sen jälkeen, kun se on jo alkanut? | "Ei. Peruutus on tehtävä ennen varauksen alkua. Alkanutta tai mennyttä varausta ei voi perua jälkikäteen." |
| Mitä pelipisteitä huoneessa on ja miten ne on nimetty? | "Katsokaa huoneesta. Siellä on pelikoneita ja pari konsolia." |
| Voiko kaikkia konsoleita käyttää yhtä aikaa? | "Katsokaa huoneesta, miten ne on kytketty näyttöihin." |

## Huoneessa selvitettävät

Asiakas vastasi "katsokaa itse huoneesta":

- Montako pelipistettä huoneessa tarkalleen on ja mitkä ovat niiden nimet ja tarrat?
- Miten konsolit (PlayStation 5 ja Nintendo Switch) on kytketty televisioon — onko niillä omat näytöt vai yhteinen TV?
- Miten nykyinen paperilappu ovessa ja Discord-kanava toimivat käytännössä, ja missä kohtaa ristiriidat syntyvät?
- Onko jokin pelipiste huollossa tai pois käytöstä, ja miten se merkitään?

## Kysymättä jääneet

Huomattiin vasta `Docs/domain.md`:tä ja `specs/`-tiedostoja kirjoittaessa:

| Kysymys | Vastaus |
|---------|---------|
| Saako samalla opiskelijalla olla monta varausta samana päivänä eri aikoihin? | Päiväkohtainen kiintiö on oletuksena 4 tuntia (`MaxIndividualHours`), jota ylläpitäjä voi säätää asetuksista. Ks. `Docs/havainnot.md`. |
| Miten opiskelijat tietävät, mitä pelejä millekin koneelle tai konsolille on asennettu? | Lisätty pelikatalogi ja toivelista (`Game`), jossa ylläpitäjä ylläpitää asennettuja pelejä ja opiskelijat voivat äänestää pelitoiveita. |
| Miten rikkinäisestä ohjaimesta tai näytöstä ilmoitetaan? | Lisätty vikailmoituslomake (`IssueReport`), josta viat menevät suoraan ylläpitäjän hallintapaneeliin. |

