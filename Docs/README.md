# 📚 Pelihuonevaraus (Xamk Game Room) — Dokumentaatio

Tämä `Docs/`-kansio sisältää kaikki Xamk Game Room -ajanvarausjärjestelmän arkkitehtuuri-, toimialue-, käyttöliittymä- ja kehitysdokumentit.

## Sisällysluettelo

1. **[Toimialuemäärittely (`DOMAIN_SPEC.md`)](./DOMAIN_SPEC.md)**  
   Taktinen Domain-Driven Design (DDD) -kuvaus: sanasto (`GameRoom`, `GamingStation`, `Reservation`, `TimeWindow`, `OpeningHours`, `SharedTV`, `User`, `Admin`, `SuperAdmin`), käsitteet ja liiketoimintainvariantit (#1–#8).

2. **[Käyttöliittymäspesifikaatio — SDD (`UI_SPEC.md`)](./UI_SPEC.md)**  
   Spec-Driven Development -määrittely käyttöliittymälle: Domain → UI -sillat, Xamk-brändiohjeisto, referenssikuvat (`./images/`), URL-reititys ja hyväksymiskriteerit.

3. **[Käyttöliittymä & Cockpit-designjärjestelmä (`UI_SPECS.md`)](./UI_SPECS.md)**  
   Yksityiskohtainen komponenttirekisteri, väritokenit, interaktiivisen aikamatriisin (`Drag-to-Select`) määrittely sekä mobiili- ja kosketusoptimoinnin säännöt.

4. **[Moniagentti- ja tuotantosäännöt (`RULES.md`)](./RULES.md)**  
   Enterprise Production Multi-Agent Protocol: kerroskohtaiset säännöt (`@ARKKITEHTI`, `@TIETOKANTA`, `@BACKEND`, `@API`, `@UI`, `@QA`), `Directory.Build.props`-kääntäjäpalomuuri, eksplisiittisten tyyppien pakotus (`var`-kielto), pakollinen koodin kommentointi sekä tietoturva- ja GDPR-vaatimukset.

5. **[Full Stack -spesifikaatio & Järjestelmän toimintakartta (`FULLSTACK_SPECS_AND_MAP.md`)](./FULLSTACK_SPECS_AND_MAP.md)**  
   Koko teknologiapinon kuvaus, Clean Architecture -kerroskartta, päästä päähän -sekvenssikaaviot, täydellinen REST API -kutsuhakemisto (`UI → api.* → Endpoint → Service → Repository → DB`), tietokannan ER-kaavio sekä React-komponenttien ja TanStack Query -välimuistiavaimien kartta.

6. **[Käynnistys- ja pikaohje (`../README.md`)](../README.md)**  
   Projektin juuren pikaohje palvelimien käynnistämiseen, testaukseen ja kirjautumiseen.
