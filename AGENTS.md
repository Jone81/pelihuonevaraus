# AGENTS.md, pelihuoneen varausjärjestelmä

Tämä repo on kuvaus ennen koodia. Tämä tiedosto koskee jokaista agenttia roolista riippumatta. Roolikohtaiset rajat ovat tiedostossa `Docs/agentit.md`.

## Lue tässä järjestyksessä

1. `Docs/domain.md`, kieli, säännöt ja kunkin säännön vastuutaho (`Paikka`-sarake).
2. `Docs/arkkitehtuuri.md`, osat, riippuvuuden suunta, kiellot, elinkaari, ei-tavoitteet ja valmis-kriteerit.
3. `Docs/rajapinta.md`, reitit, kentät sanoina, statuskoodit ja paginaatio.
4. `Docs/testaus.md`, testiaineisto, kiinteä kello ajossa, kriteerien ajo, kattavuusmatriisi ja työnjako.
5. `Docs/versiohallinta.md`, haarat, commit, pull request, kielletyt tiedostot ja session päätös.
6. `Docs/agentit.md`, oma roolisi: mitä luet, mitä saat muuttaa ja mitä palautat.
7. `Docs/adr/`, tehdyt rakennepäätökset (kuten `0001-tapahtuma-ja-pelipisteet.md`).
8. Se `specs/NNN-*.md`, jota pyydetty muutos koskee, ja vain sen **Tehtävät**-osion pyydetty askel.
9. `Docs/tilaus.md` ja `Docs/havainnot.md`, asiakkaan sanat, huoneessa tehdyt havainnot ja oletukset. Näihin palataan, kun jokin tuntuu puuttuvan.

Työntekijä lukee kohdat 1-8 vain siltä osin kuin `Docs/agentit.md` sen roolille sallii. Johtaja ja katselmoija lukevat kaiken.

## Roolit

```mermaid
flowchart TD
    H[Ihminen] <--> J[Johtaja]
    J --> D[Domain-työntekijä]
    J --> A[Application-työntekijä]
    J --> I[Infrastructure-työntekijä]
    J --> P[API-työntekijä]
    J --> U[UI-työntekijä]
    D & A & I & P & U --> K[Katselmoija]
    K --> J
```

- **Johtaja** on ainoa, joka puhuu ihmiselle, tekee git-toimia ja jakaa työtä. Johtaja ei kirjoita koodia itse.
- **Työntekijä** saa yhden Tehtävät-askeleen ja kirjoittaa vain oman kerroksensa projektiin ja sen testiprojektiin (`src/Domain`, `src/Application`, `src/Infrastructure`, `src/WebApi` tai `src/Client`). Se palauttaa muutetut tiedostot, testien tulosteen ja kysymykset johtajalle.
- **Katselmoija** lukee diffin `Docs/domain.md`:n `Paikka`-saraketta, `Docs/arkkitehtuuri.md`:n kieltoja ja specin kriteerejä vasten. Se ei muuta tiedostoja, vaan palauttaa löytölistan. Tyhjä lista on hyväksyntä.
- Samaan projektiin kirjoittaa kerrallaan yksi työntekijä. Askel, joka koskee kahta kerrosta, jaetaan kahdeksi peräkkäiseksi tehtäväksi.

## Ensin suunnitelma

Ennen kuin yhtään tiedostoa muutetaan, johtaja esittää suunnitelman pyydetylle askeleelle:
1. Mitkä tiedostot luettiin (`AGENTS.md`:n lukujärjestyksessä).
2. Mitkä tiedostot luodaan tai muutetaan.
3. Mikä rooli tekee minkä osan.
4. Missä kerroksessa kukin sääntö tarkistetaan (viittaus `Docs/domain.md`:n riviin).
5. Mitkä testit kirjoitetaan ja miten valmius todetaan.

Johtaja odottaa ihmisen hyväksyntää ennen ensimmäistä tehtävänantoa.

## Älä

- Älä keksi käsitettä, projektia, reittiä, roolia tai haaraa, jota kuvaus ei nimeä.
- Älä aloita tutoriaalista äläkä yleisestä Clean Architecture -pohjasta. Projektit ovat `Docs/arkkitehtuuri.md`:ssä määritellyt osat, ei enempää.
- Älä tee useampaa tehtävälistan askelta yhdellä kertaa, äläkä anna samaa askelta kahdelle työntekijälle.
- Älä kutsu järjestelmän kelloa (`DateTime.Now` tai `DateTimeOffset.UtcNow`) suoraan Domainissa tai Applicationissa. Nykyhetki annetaan parametrina tai `IDateTimeProvider`-rajapinnan kautta.
- Älä käytä `var`-avainsanaa C#- tai TypeScript-koodissa (`.editorconfig` ja `Directory.Build.props` pakottavat eksplisiittiset tyypit: `IDE0008 = error`).
- Älä tallenna "vapaana nyt" -tilaa tietokantaan; se on laskettu näkymä aktiivisista varauksista ja kellonajasta.
- Älä muuta `Docs/`- tai `specs/`-tiedostoa työntekijänä. Kuvauksen muutos on johtajan ja ihmisen asia ja oma commit.
- Älä commitoi, pushaa tai yhdistä pull requestia muuna kuin johtajana. Pull requestin yhdistää aina ihminen.

## Pysähdy ja kysy, jos

- säännöllä ei ole `Paikka`-merkintää `Docs/domain.md`:ssä
- spec on ristiriidassa `Docs/`-tiedostojen kanssa
- `Docs/havainnot.md`:n **Avoimet**-kohta koskee tehtävää, jota teet
- joudut valitsemaan statuskoodin, kentän nimen tai kirjaston, jota `Docs/rajapinta.md` tai `Docs/arkkitehtuuri.md` ei mainitse
- askel vaatii kirjoittamista projektiin, johon roolisi ei saa kirjoittaa

Työntekijä kysyy johtajalta, johtaja ihmiseltä. Työntekijä ei arvaa eikä kysy ihmiseltä suoraan. Työntekijä kysyy johtajalta aina kohdatessaan epäselvyyden.

## Tarkistukset

- Backend-käännös ajetaan komennolla `dotnet build --nologo` repon juuressa tai kerroskohtaisesti parametrilla `/nr:false`. Tulos on 0 varoitusta ja 0 virhettä.
- Backend-testit ajetaan komennolla `dotnet test --nologo`. Domain-testit eivät käynnistä web-palvelinta eivätkä avaa tietokantaa.
- Frontend-käännös ja linttaus ajetaan komennolla `npm --prefix src/Client run build && npm --prefix src/Client run lint`. Tulos on 0 virhettä ja 0 varoitusta.
- Hyväksymiskriteerit: specin Given-When-Then-rivit ajetaan HTTP-kutsuina käynnissä olevaa rajapintaa vasten `Docs/testaus.md`:n testiaineistolla ja kellolla. Ihminen ajaa ne. Valmis ilman ajoa ei kelpaa.

## Definition of done

Askeleen kriteerit on ajettu. Katselmoija on palauttanut tyhjän löytölistan. Jokaiselle askeleen säännölle on testi. Jokainen askel muodostaa yhden commitin, jonka viesti on kirjoitettu asiakkaan sanoin. Repoon ei viedä tietokantatiedostoa, käännöstulosta eikä tokenia. Johtajan lopetusviesti noudattaa `Docs/versiohallinta.md`:n muotoa: haara, commitit, tarkistusten tuloste ja avoimet kysymykset.


