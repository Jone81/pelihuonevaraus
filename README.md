# 🎮 Pelihuonevaraus — Xamk Game Room

Oppilaitoksen (Xamk) pelitilan ja pelipisteiden nykyaikainen ajanvarausjärjestelmä.

- **Frontend:** React 19 + TypeScript + Vite + TanStack Query
- **Backend:** .NET 10 Web API (Clean Architecture, Result-Pattern, FluentValidation)
- **Tietokanta:** PostgreSQL (EF Core) automaattisella InMemory-varajärjestelmällä kehitykseen
- **Testit:** xUnit-testisarja (37 yksikkö- ja integraatiotestiä)

---

## 🚀 Pikaohje: Projektin käynnistäminen toisella koneella

### 1. Esivaatimukset
Varmista, että koneellesi on asennettu:
- [Git](https://git-scm.com/)
- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js (v18 tai uudempi)](https://nodejs.org/)

---

### 2. Koodin lataaminen
Kloonaa repository (tai aja `git pull`):
```bash
git clone https://github.com/Jone81/pelihuonevaraus.git
cd pelihuonevaraus
```

---

### 3. Palveluiden käynnistäminen

Sovellus koostuu kahdesta osasta: **Backend (.NET)** ja **Frontend (React)**. Käynnistä molemmat omiin terminaali-ikkunoihinsa:

#### Terminaali 1: Backend (.NET Web API)
Projektin juurihakemistossa aja:
```bash
dotnet run --project src/WebApi
```
> 💡 **Huom:** Erillistä tietokanta-asennusta ei vaadita kehityskäytössä! Jos PostgreSQL ei ole päällä, järjestelmä käyttää automaattisesti InMemory-tietokantaa ja alustaa oletuslaitteet, -pelit ja -käyttäjät (`DatabaseSeeder`).
> 
> Palvelin käynnistyy osoitteeseen: **http://localhost:5134**

---

#### Terminaali 2: Frontend (React + Vite)
Projektin juurihakemistossa aja:
```bash
cd src/Client
npm install
npm run dev
```
> Käyttöliittymä aukeaa selaimeen osoitteeseen: **http://localhost:5173**  
> (Vite välittää `/api`-kutsut automaattisesti paikalliseen backendiin).

---

## 🔑 Sisäänkirjautuminen ja pikanapit

> ⚡ **Helpoin tapa kirjautua:**  
> Kirjautumisikkunassa ja etusivulla on suoraan valmiit **pikapainikkeet**, joita klikkaamalla pääsee sisään ilman tietojen kirjoittamista:
> - **Opiskelija** (peruskäyttäjän näkymä ja omat varaukset)
> - **Pääkäyttäjä** (Admin- ja SuperAdmin-hallintavalikot)

Halutessasi voit kirjautua myös manuaalisesti millä tahansa koulun osoitteella (`@edu.xamk.fi` tai `@xamk.fi`):
1. **Opiskelijatunnus:** `opiskelija@edu.xamk.fi` (koodi: `123456`)
2. **Pääkäyttäjätunnus:** `admin@xamk.fi` (koodi: `123456`)

*(Kehitystilassa vahvistuskoodi `123456` toimii aina yleisenä testikoodina, tai koodin voi lukea suoraan API-vastauksesta).*

---

## 🧪 Testien ajaminen

Voit ajaa koko ratkaisun testit (37 kpl) yhdellä komennolla:
```bash
dotnet test --nologo
```
