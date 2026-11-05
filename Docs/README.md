# 📚 Pelihuonevaraus (Xamk Game Room) — Dokumentaatio & Spec-Driven Development

Tämä `Docs/`-kansio sekä juuren [`AGENTS.md`](../AGENTS.md) ja [`specs/`](../specs/)-kansio muodostavat **Spec-Driven Development (SDD)** -kokonaisuuden Xamk Game Room -ajanvarausjärjestelmälle.

---

## 1. Spec-Driven Development (SDD) — Vaiheet ja Tiedostot (`05-Pelihuone`)

| Vaihe | Tiedosto | Mitä agentti ja kehittäjä siitä saavat |
| :--- | :--- | :--- |
| **Perussäännöt** (*Constitution*) | [`../AGENTS.md`](../AGENTS.md) | Lukujärjestys, agenttien roolit, suunnitelmapakko, pysähtymissäännöt, tarkistuskomennot ja Definition of Done. |
| **0. Luokka: Tilaus** | [`tilaus.md`](./tilaus.md) | Asiakkaan alkuperäinen tilaus, tarkentavat kysymykset ja vastaukset sanatarkasti sekä huoneessa selvitettävät asiat. |
| **1. Huone: Havainnot** | [`havainnot.md`](./havainnot.md) | Pelipisteiden inventaario (`PC 1`–`PC 6`, `PS5`, `Switch`), yhteinen 4K-TV (`SharedTV`), 3 ongelmatapausta, eksplisiittiset oletukset ja koeajon havainnot. |
| **2. Sanasto & Säännöt** | [`domain.md`](./domain.md) | Asiakkaan kieli ja koodin vastineet, käsitteet, liiketoimintainvariantit (#1–#11) `Paikka`-sarakkeineen ja perusteluineen sekä "vapaana nyt" laskettuna näkymänä. |
| **3. Tarinat & Kriteerit** | [`../specs/001-varaa-pelipiste.md`](../specs/001-varaa-pelipiste.md)<br/>[`../specs/002-jarjesta-tapahtuma.md`](../specs/002-jarjesta-tapahtuma.md)<br/>[`../specs/003-kayttoliittyma-ja-aikataulumatriisi.md`](../specs/003-kayttoliittyma-ja-aikataulumatriisi.md) | Käyttäjätarinat, Given–When–Then-hyväksymiskriteerit (mukaan lukien hylkäykset), ei-tavoitteet ja vaiheistetut tehtävälistat. |
| **4. Rakenne, Rajapinta, ADR & Testaus** | [`arkkitehtuuri.md`](./arkkitehtuuri.md)<br/>[`rajapinta.md`](./rajapinta.md)<br/>[`adr/0001-tapahtuma-ja-pelipisteet.md`](./adr/0001-tapahtuma-ja-pelipisteet.md)<br/>[`testaus.md`](./testaus.md) | Kerrosjako, kiellot, elinkaari, REST-reitit ja virhekoodit sanoina, rakennepäätös tapahtumien jyräyksestä (`ADR 0001`) sekä vakioitu testiaineisto ja kattavuusmatriisi. |
| **5. Agenttien roolit & Git** | [`agentit.md`](./agentit.md)<br/>[`versiohallinta.md`](./versiohallinta.md) | Johtajan, kerroskohtaisten työntekijöiden ja katselmoijan vastuut sekä haara-, commit-, PR- ja lopetusviestikäytännöt. |
| **6. Tarkistuskierros** | [`tarkistus.md`](./tarkistus.md) | Suunnittelun työloki: omat ja tekoälyn kuivaharjoituksen löydöt sekä tehdyt päätökset perusteluineen. |

---

## 2. Syventävät Tekniset Viitedokumentit

1. **[Käyttöliittymäspesifikaatio — Xamk Brand & SDD (`UI_SPEC.md`)](./UI_SPEC.md)**  
   Domain → UI -sillat, Xamk-brändiohjeisto, referenssikuvat (`./images/`), `shadcn/ui`-komponentit, URL-reititys ja UI-invariantit (`UI-1`–`UI-6`).
2. **[Käyttöliittymä & Cockpit-designjärjestelmä (`UI_SPECS.md`)](./UI_SPECS.md)**  
   Komponenttirekisteri, väritokenit, interaktiivisen aikamatriisin (`Drag-to-Select`) määrittely sekä mobiili- ja kosketusoptimoinnin säännöt.
3. **[Laajennettu Rajapinta- ja Sopimusreferenssi (`rajapinnat.md`)](./rajapinnat.md)**  
   Kaikkien REST HTTP -päätepisteiden syöte- ja vastaussopimukset (`src/Contracts`), RFC 9457 `ProblemDetails` -virhemallit sekä sisäiset `I*Service`- ja `I*Repository`-rajapinnat.
4. **[Full Stack -spesifikaatio & Järjestelmän toimintakartta (`FULLSTACK_SPECS_AND_MAP.md`)](./FULLSTACK_SPECS_AND_MAP.md)**  
   Koko teknologiapinon kuvaus, sekvenssikaaviot, REST API -kutsuhakemisto, tietokannan ER-kaavio sekä React-komponenttien ja TanStack Query -välimuistiavaimien kartta.
5. **[Moniagentti- ja tuotantosäännöt (`RULES.md`)](./RULES.md)**  
   Enterprise Production Multi-Agent Protocol, `Directory.Build.props`-kääntäjäpalomuuri, eksplisiittisten tyyppien pakotus (`var`-kielto) ja XML/JSDoc-kommentointivaatimukset.
6. **[Alkuperäinen toimialuemuistio (`DOMAIN_SPEC.md`)](./DOMAIN_SPEC.md)**  
   Tiivis toimialueen peruskuvaus.
7. **[Käynnistys- ja pikaohje (`../README.md`)](../README.md)**  
   Projektin juuren pikaohje palvelimien käynnistämiseen, testaukseen ja kirjautumiseen.
