# Versiohallinta — pelihuoneen varausjärjestelmä

Tämä tiedosto määrittelee, miten repo rakentuu, miten haarat ja commitit elävät ja miten agentin sessio päättyy. Roolit on kuvattu `Docs/agentit.md`:ssä; tässä sanotaan, kuka saa tehdä minkäkin git-toimen.

## Haarat

| Haara | Mitä siellä on | Kuka luo | Kuka yhdistää siihen |
|-------|----------------|----------|----------------------|
| `master` | Julkaistu tuotantolinja. Vain se, mikä on käyty läpi ja jonka `Docs/arkkitehtuuri.md`:n **Valmis**-lauseet pitävät. | Ihminen alustuksessa | Ihminen, pull requestilla `development`/`dev`-haarasta |
| `development` / `dev` | Yhteinen työlinja. Feature-haarat lähtevät siitä ja palaavat siihen. | Ihminen alustuksessa | Ihminen, pull requestilla feature-haarasta |
| `feature/NNN-aihe` | Yhden specin tai osa-alueen työ (`feature/001-varaa-pelipiste`, `feature/002-jarjesta-tapahtuma`, `feature/ui`). | Johtaja-agentti tai ihminen | — (poistetaan yhdistämisen jälkeen) |

- Yksi spec, yksi feature-haara.
- Pitkäikäisiin haaroihin (`master`, `development`) ei pushata suoraan. Ei rebasea, ei force pushia mihinkään haaraan.

## Repon alustus

1. `Docs/tarkistus.md` pidetään suunnittelun työlokina; ennen puhdasta koeajoa se voidaan siirtää sivuun, jotta agentti lukee vain varsinaisen spesifikaation.
2. Ensimmäinen vaihe sisältää kuvauksen: `AGENTS.md`, `Docs/`, `specs/`, `.gitignore` ja `.editorconfig`.
3. `development`-haara luodaan `master`-haarasta ennen toteutusaskelia.

## Spec ennen koodia

- Uusi ominaisuus alkaa aina uudella `specs/NNN-*.md`-tiedostolla, joka commitoidaan **ennen** ensimmäistä koodiriviä.
- Kuvauksen muutos ja koodin muutos ovat eri commiteissa. Jos liiketoimintasääntö muuttuu, järjestys on `Docs/domain.md` → `specs/NNN-*.md` → koodi, jokainen omana committina.
- Uusi rakennepäätös on uusi `Docs/adr/NNNN-*.md`, ei vanhan päätöksen hiljainen ylikirjoitus.
- Työntekijä-agentti ei muuta `Docs/`- tai `specs/`-kansioita koskaan; kuvauksen muutos on johtajan ja ihmisen asia.

## Askeleen työnkulku

1. Johtaja varmistaa aktiivisen feature-haaran.
2. Johtaja antaa yhden specin **Tehtävät**-askeleen yhdelle kerroskohtaiselle työntekijälle. Yksi askel on yksi commit.
3. Katselmoija lukee diffin ennen committia `Docs/domain.md`:n `Paikka`-saraketta, `Docs/arkkitehtuuri.md`:n kieltoja ja specin kriteerejä vasten. Löydöt korjataan ennen committia.
4. `dotnet build --nologo`, `dotnet test --nologo` (sekä UI-askeleissa `npm --prefix src/Client run build && npm --prefix src/Client run lint`) ovat vihreitä ennen committia. Punaista testiä tai varoitusta ei commitoida.
5. Johtaja commitoi feature-haaraan.
6. Kun specin kaikki askeleet ovat tehty ja hyväksymiskriteerit ajettu, johtaja avaa pull requestin `development`-haaraan.

## Commit

- **Yksi asia per commit:** yksi tehtävälistan askel. Muotoilun siivous on oma commit.
- **Otsikko** nimeää päätöksen tai käyttäytymisen asiakkaan sanoin, ei tiedostonimeä: `"Varaus estää PS5:n ja Switchin samanaikaisen käytön yhteisellä TV:llä"` eikä `"päivitetty ReservationService.cs"`.
- **Runko** kertoo specin ja askeleen, säännöt, ajetut kriteerit ja testien tulosteen.
- Testi ja toteutus ovat samassa commitissa.

Esimerkki:

```text
Varaus estää PS5:n ja Switchin samanaikaisen käytön yhteisellä TV:llä

Spec 001, askel 3: ReservationService tarkistaa säännöt 6, 7 ja 8 Docs/domain.md:n Paikan mukaan.
Nykyhetki haetaan IDateTimeProvider-rajapinnan kautta.

Kriteerit K1, K7, K8 vihreitä Application- ja Integration-testeinä.
dotnet test: Passed 42, Failed 0.
```

## Pull request

- Yksi pull request per feature-haara. Otsikko on specin nimi: `001 Varaa pelipiste`.
- Runko: mitä tehtiin askeleittain, mitkä hyväksymiskriteerit ajettiin ja mitä ne tulostivat, mitkä jäivät ajamatta ja miksi.
- **Ihminen yhdistää.** Agentti avaa pull requestin eikä koskaan yhdistä sitä itse.
- Yhdistetään merge-committina, ei squashina, jotta jokainen askel näkyy historiassa.

## Ei repoon

`.gitignore` vartioi näitä, mutta sääntö pätee, vaikka tiedosto yritettäisiin lisätä väkisin:

- Tietokannat ja käännöstulokset: `*.db`, `bin/`, `obj/`, `.vs/`, `TestResults/`, `src/Client/dist/`, `node_modules/`.
- Tokenit, salasanat, konekohtaiset asetukset (`appsettings.*.local.json`, `.env`).
- Koodia, joka ei käänny, sisältää varoituksia tai jonka testi on punainen.

**Jos salaisuus pääsi repoon:** se vaihdetaan (rotatoidaan) heti, koska poisto uudella commitilla jättää sen git-historiaan. Johtaja ilmoittaa asiasta lopetusviestissä ensimmäisenä rivinä, ja ihminen päättää historian siivouksesta.

## Agentin lopetus

Sessio päättyy viestiin, jonka vain johtaja kirjoittaa. Pelkkä sana "valmis" ei kelpaa. Viestissä on tässä järjestyksessä:

1. Haaran nimi ja tieto siitä, onko haara pushattu (ja jos ei, miksi).
2. Commitit: hash ja otsikko.
3. Ajetut tarkistukset ja niiden tuloste: `dotnet build`, `dotnet test`, `npm run build && npm run lint`, HTTP-kriteerit.
4. Kriteerit, jotka jäivät ajamatta, ja syy.
5. Katselmoijan löydöt, jotka jäivät korjaamatta, ja syy.
6. Avoimet kysymykset ihmiselle, viittauksella `Docs/domain.md`:n sääntöön tai `Docs/havainnot.md`:n Avoimet-kohtaan.
7. Jos askel jäi kesken: mihin kohtaan jäätiin ja mikä kysymys avautui.

