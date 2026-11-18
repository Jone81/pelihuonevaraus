# Pelihuonevaraus, Xamk Game Room

Oppilaitoksen (Xamk) pelitilan ja pelipisteiden ajanvarausjärjestelmä.

- Frontend toteutettu teknologioilla React 19, TypeScript, Vite ja TanStack Query.
- Backend toteutettu .NET 10 Web API -ratkaisuna (Clean Architecture, Result-malli, FluentValidation).
- Tietokantana toimii PostgreSQL (EF Core) sekä InMemory-tietokanta paikalliseen kehitykseen.
- Testit sisältävät 37 yksikkö- ja integraatiotestiä xUnit-kehyksellä.
- Kaikki arkkitehtuuri-, domain- ja käyttöliittymädokumentit löytyvät kansiosta [`Docs/`](./Docs/README.md).

---

## Pikaohje projektin käynnistämiseen toisella koneella

### 1. Esivaatimukset
Varmista, että koneelle on asennettu:
- [Git](https://git-scm.com/)
- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js (versio 18 tai uudempi)](https://nodejs.org/)

---

### 2. Koodin lataaminen
Kloonaa repository tai aja `git pull`:
```bash
git clone https://github.com/Jone81/pelihuonevaraus.git
cd pelihuonevaraus
```

---

### 3. Palveluiden käynnistäminen

Sovellus koostuu kahdesta osasta: backend (.NET) ja frontend (React). Käynnistä molemmat omiin terminaali-ikkunoihinsa.

#### Terminaali 1, backend (.NET Web API)
Aja projektin juurihakemistossa:
```bash
dotnet run --project src/WebApi
```
Erillistä tietokanta-asennusta ei vaadita kehityskäytössä. Jos PostgreSQL ei ole käynnissä, järjestelmä käyttää automaattisesti InMemory-tietokantaa ja alustaa oletuslaitteet, pelit ja käyttäjät (`DatabaseSeeder`).

Palvelin käynnistyy osoitteeseen http://localhost:5134.

---

#### Terminaali 2, frontend (React ja Vite)
Aja projektin juurihakemistossa:
```bash
cd src/Client
npm install
npm run dev
```
Käyttöliittymä avautuu osoitteeseen http://localhost:5173. Vite välittää `/api`-kutsut automaattisesti paikalliseen backend-palveluun.

---

## Sisäänkirjautuminen ja pikanapit

Kirjautumisikkunassa ja etusivulla on suoraan valmiit pikapainikkeet:
- Opiskelija (peruskäyttäjän näkymä ja omat varaukset)
- Pääkäyttäjä (Admin- ja SuperAdmin-hallintavalikot)

Voit kirjautua myös manuaalisesti koulun osoitteella (`@edu.xamk.fi` tai `@xamk.fi`):
1. Opiskelijatunnus: `opiskelija@edu.xamk.fi` (koodi `123456`)
2. Pääkäyttäjätunnus: `admin@xamk.fi` (koodi `123456`)

Kehitystilassa vahvistuskoodi `123456` toimii aina testikoodina, tai koodin voi lukea suoraan rajapinnan vastauksesta.

---

## Testien ajaminen

Voit ajaa koko ratkaisun 37 testiä komennolla:
```bash
dotnet test --nologo
```
