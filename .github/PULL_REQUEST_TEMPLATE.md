## Yhteenveto

- **Spec / aihe:** (esim. `Spec 004: Lopeta aktiivinen varaus kesken`)
- **Mitä tehtiin askeleittain:**
  - [ ] Askel 1: ...
  - [ ] Askel 2: ...

## Tarkistukset (`AGENTS.md` & `Docs/testaus.md`)

- [ ] `dotnet build PelihuoneVaraus.slnx --nologo` — 0 virhettä, 0 varoitusta
- [ ] `dotnet test PelihuoneVaraus.slnx --nologo` — kaikki testit vihreinä
- [ ] `npm --prefix src/frontend run lint && npm --prefix src/frontend run build` — 0 virhettä, 0 varoitusta
- [ ] Katselmoija (`@QA`) on palauttanut tyhjän löytölistan
- [ ] GitHub Actions `CI — Build, Lint & Test` on vihreä

## Ajetut hyväksymiskriteerit

- Ajetut kriteerit ja tulokset:
  - ...
- Ajamatta jääneet kriteerit ja syy (jos on):
  - ...

## Ennen `master`-yhdistystä (`Docs/arkkitehtuuri.md` — Valmis)

- [ ] Toinen varaus samalle pelipisteelle samalle aikavälille hylätään (`409 Conflict`, `Reservation.StationOverlap`)
- [ ] PS5:n ja Nintendo Switchin yhteinen TV (`SharedTV`) estää päällekkäisen varauksen (`409 Conflict`, `Reservation.SharedTvConflict`)
- [ ] `SuperAdmin`-tapahtumavaraus (`override`) peruuttaa päällekkäiset opiskelijavaraukset peruutussyyllä
- [ ] Jo alkaneen tai menneen varauksen peruminen hylätään `Reservation`-entiteetissä (`409 Conflict`)
- [ ] Domain-sääntöjen (#1, #4, #5, #9, #11) yksikkötestit eivät käynnistä web-palvelinta eivätkä avaa tietokantaa
- [ ] Yhdistetään merge-committina (ei squashina), ja yhdistämisen tekee aina ihminen
