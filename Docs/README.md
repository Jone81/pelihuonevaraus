# Pelihuonevaraus (Xamk Game Room), dokumentaatio ja Spec-Driven Development

Tämä `Docs/`-kansio sekä juuren [`AGENTS.md`](../AGENTS.md) ja [`specs/`](../specs/)-kansio muodostavat Spec-Driven Development (SDD) -kokonaisuuden Xamk Game Room -ajanvarausjärjestelmälle.

---

## 1. Spec-Driven Development (SDD), vaiheet ja tiedostot (05-Pelihuone)

| Vaihe | Tiedosto | Mitä agentti ja kehittäjä siitä saavat |
| :--- | :--- | :--- |
| Perussäännöt | [`../AGENTS.md`](../AGENTS.md) | Lukujärjestys, agenttien roolit, suunnitelmapakko, pysähtymissäännöt, tarkistuskomennot ja Definition of Done. |
| 0. Luokka: Tilaus | [`tilaus.md`](./tilaus.md) | Asiakkaan alkuperäinen tilaus, tarkentavat kysymykset ja vastaukset sanatarkasti sekä huoneessa selvitettävät asiat. |
| 1. Huone: Havainnot | [`havainnot.md`](./havainnot.md) | Pelipisteiden inventaario (`PC 1`-`PC 6`, `PS5`, `Switch`), yhteinen 4K-TV (`SharedTV`), 3 ongelmatapausta, eksplisiittiset oletukset ja koeajon havainnot. |
| 2. Sanasto ja säännöt | [`domain.md`](./domain.md) | Asiakkaan kieli ja koodin vastineet, käsitteet, liiketoimintainvariantit (#1-#11) `Paikka`-sarakkeineen ja perusteluineen sekä "vapaana nyt" laskettuna näkymänä. |
| 3. Tarinat ja kriteerit | [`../specs/001-varaa-pelipiste.md`](../specs/001-varaa-pelipiste.md)<br/>[`../specs/002-jarjesta-tapahtuma.md`](../specs/002-jarjesta-tapahtuma.md)<br/>[`../specs/003-kayttoliittyma-ja-aikataulumatriisi.md`](../specs/003-kayttoliittyma-ja-aikataulumatriisi.md) | Käyttäjätarinat, Given-When-Then-hyväksymiskriteerit hylkäyksineen, ei-tavoitteet ja vaiheistetut tehtävälistat. |
| 4. Rakenne, rajapinta, ADR ja testaus | [`arkkitehtuuri.md`](./arkkitehtuuri.md)<br/>[`rajapinta.md`](./rajapinta.md)<br/>[`adr/0001-tapahtuma-ja-pelipisteet.md`](./adr/0001-tapahtuma-ja-pelipisteet.md)<br/>[`testaus.md`](./testaus.md) | Kerrosjako, kiellot, elinkaari, REST-reitit ja virhekoodit sanoina, rakennepäätös tapahtumien jyräyksestä (`ADR 0001`) sekä vakioitu testiaineisto ja kattavuusmatriisi. |
| 5. Agenttien roolit ja git | [`agentit.md`](./agentit.md)<br/>[`versiohallinta.md`](./versiohallinta.md) | Johtajan, kerroskohtaisten työntekijöiden ja katselmoijan vastuut, laatusäännöt (kääntäjäpalomuuri, `var`-kielto, XML ja JSDoc) sekä haara-, commit-, PR- ja lopetusviestikäytännöt. |
| 6. Tarkistuskierros | [`tarkistus.md`](./tarkistus.md) | Suunnittelun työloki: omat ja tekoälyn kuivaharjoituksen löydöt sekä tehdyt päätökset perusteluineen. |

---

## 2. Syventävät tekniset viitedokumentit

1. **[Käyttöliittymäspesifikaatio ja Cockpit-designjärjestelmä (`UI_SPEC.md`)](./UI_SPEC.md)**  
   Toimialuemallin ja käyttöliittymän kytkennät, Xamk-brändiohjeisto, referenssikuvat (`./images/`), `shadcn/ui`-komponentit, väritokenit, URL-reititys ja käyttöliittymäinvariantit (`UI-1`-`UI-6`).
2. **[Laajennettu rajapinta- ja sopimusreferenssi (`rajapinnat.md`)](./rajapinnat.md)**  
   Kaikkien REST HTTP -päätepisteiden syöte- ja vastaussopimukset (`src/Contracts`), RFC 9457 `ProblemDetails` -virhemallit sekä sisäiset `I*Service`- ja `I*Repository`-rajapinnat.
3. **[Full stack -spesifikaatio ja järjestelmän toimintakartta (`FULLSTACK_SPECS_AND_MAP.md`)](./FULLSTACK_SPECS_AND_MAP.md)**  
   Koko teknologiapinon kuvaus, sekvenssikaaviot, REST API -kutsuhakemisto, tietokannan ER-kaavio sekä React-komponenttien ja TanStack Query -välimuistiavaimien kartta.
4. **[Järjestelmäarkkitehtuuri (`arkkitehtuuri.md`)](./arkkitehtuuri.md)**  
   Clean Architecture -kerrosjako, taktinen DDD, Transactional Outbox, kääntäjäpalomuuri sekä luvun 9 kiellot ja valmis-kriteerit.
5. **[Käynnistys- ja pikaohje (`../README.md`)](../README.md)**  
   Projektin juuren pikaohje palvelimien käynnistämiseen, testaukseen ja kirjautumiseen.
