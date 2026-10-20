# =====================================================================
# PELIHUONEEN VARAUSJÄRJESTELMÄ - MULTI-AGENT WORKSPACE SETUP
# =====================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "=== 1. Luodaan Clean Architecture .NET Solution & Projektit ===" -ForegroundColor Cyan

dotnet new sln -n PelihuoneVaraus
dotnet new classlib -n Pelihuone.Domain -o src/Domain
dotnet new classlib -n Pelihuone.Application -o src/Application
dotnet new classlib -n Pelihuone.Infrastructure -o src/Infrastructure
dotnet new webapi -n Pelihuone.WebApi -o src/WebApi
dotnet new xunit -n Pelihuone.Application.Tests -o tests/Application.Tests
dotnet new xunit -n Pelihuone.Infrastructure.Tests -o tests/Infrastructure.Tests

# Lisätään projektit Solutioniin
dotnet sln PelihuoneVaraus.sln add src/Domain/Pelihuone.Domain.csproj
dotnet sln PelihuoneVaraus.sln add src/Application/Pelihuone.Application.csproj
dotnet sln PelihuoneVaraus.sln add src/Infrastructure/Pelihuone.Infrastructure.csproj
dotnet sln PelihuoneVaraus.sln add src/WebApi/Pelihuone.WebApi.csproj
dotnet sln PelihuoneVaraus.sln add tests/Application.Tests/Pelihuone.Application.Tests.csproj
dotnet sln PelihuoneVaraus.sln add tests/Infrastructure.Tests/Pelihuone.Infrastructure.Tests.csproj

# Projektien väliset viittaukset
dotnet add src/Application/Pelihuone.Application.csproj reference src/Domain/Pelihuone.Domain.csproj
dotnet add src/Infrastructure/Pelihuone.Infrastructure.csproj reference src/Domain/Pelihuone.Domain.csproj
dotnet add src/Infrastructure/Pelihuone.Infrastructure.csproj reference src/Application/Pelihuone.Application.csproj
dotnet add src/WebApi/Pelihuone.WebApi.csproj reference src/Application/Pelihuone.Application.csproj
dotnet add src/WebApi/Pelihuone.WebApi.csproj reference src/Infrastructure/Pelihuone.Infrastructure.csproj
dotnet add tests/Application.Tests/Pelihuone.Application.Tests.csproj reference src/Application/Pelihuone.Application.csproj
dotnet add tests/Infrastructure.Tests/Pelihuone.Infrastructure.Tests.csproj reference src/Infrastructure/Pelihuone.Infrastructure.csproj

Write-Host "=== 2. Alustetaan React + Vite UI-sovellus ===" -ForegroundColor Cyan
# Luodaan SPA-sovellus src/Client -kansioon
npm create vite@latest src/Client -- --template react-ts
Set-Location src/Client
npm install
Set-Location ../..

Write-Host "=== 3. Luodaan Directory.Build.props (Kääntäjäpalomuuri) ===" -ForegroundColor Cyan
$buildPropsContent = @"
<Project>
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
  </PropertyGroup>
</Project>
"@
Set-Content -Path "Directory.Build.props" -Value $buildPropsContent -Encoding UTF8

Write-Host "=== 4. Luodaan kansiot spekseille ja alustetaan Git ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path ".antigravity/specs" | Out-Null
New-Item -ItemType Directory -Force -Path "src/Contracts" | Out-Null

git init
git branch -M dev
git add .
git commit -m "chore: initial solution structure and compiler rules"

Write-Host "=== 5. Luodaan .antigravityrules (Agenttien tuotantosäännöt) ===" -ForegroundColor Cyan
$rulesContent = @"
# ENTERPRISE PRODUCTION MULTI-AGENT PROTOCOL — PELIHUONEEN VARAUSJÄRJESTELMÄ

Toimit osana rinnakkaista moniagenttiympäristöä (Git Worktrees). Tunnista roolisi keskustelun alussa annetusta tunnisteesta (`@ARKKITEHTI`, `@TIETOKANTA`, `@BACKEND`, `@API` tai `@UI`).

---

## 0. GLOBAALIT PAKOLLISET SÄÄNNÖT (KOSKEE JOKAISTA AGENTTIA)

1. **GIT- JA KANSIOPALOMUURI:**
   - Sinulla on VAIN LUKU -oikeus Git-komentoihin (`git status`, `git diff`, `git log`). Älä koskaan aja `commit`, `push`, `merge`, `checkout` tai `reset`.
   - Muokkaa VAIN oman roolisi sallittuja kansioita (Domain2.md-määrityksen mukaisesti).
2. **KERROSKOHTAINEN KÄÄNNÖS JA DI-ERISTYS (KRIITTINEN RINNAKKAISAJOSSA):**
   - Älä käännä koko `.sln`-ratkaisua `feature/*`-haaroissa, vaan käännä ja testaa VAIN oma projektisi lipulla `/nr:false` (esim. `dotnet build src/Infrastructure /nr:false`).
   - Jokainen kerros rekisteröi omat palvelunsa omaan `DependencyInjection.cs`-tiedostoonsa (`AddApplication()`, `AddInfrastructure()`). Älä koskaan muokkaa toisen kerroksen DI-tiedostoa.
3. **TIETOTURVA & GDPR (PII-SUOJA):**
   - ÄLÄ KOSKAAN kirjoita lokitiedostoihin asiakkaan henkilötietoja (sähköposti `@edu.xamk.fi`). Lokita vain `UserId` (Guid) ja `ReservationId` (Guid).
4. **AIKA, VIRHEET JA LOKITUS:**
   - Kaikki ajat palvelimella ovat `DateTimeOffset` (UTC) ja haetaan `TimeProvider`-abstraktion kautta.
   - `Directory.Build.props` pakottaa `TreatWarningsAsErrors=true`. Koodissa ei saa olla yhtäkään kääntäjävaroitusta, `// TODO`-kommenttia tai käyttämätöntä muuttujaa.

---

## 1. @ARKKITEHTI (Haara: `dev`)
- **Sallittu kirjoitusalue:** `src/Domain/**`, `src/Application/Abstractions/**`, `src/Contracts/**`, `.antigravity/specs/**`.
- **Tuotantosäännöt:**
  1. **Domain-mallit ja Invariantit:** `src/Domain` on 100 % riippumaton ulkoisista kirjastoista. `TimeWindow`-arvokohde varmistaa aukioloajat (08:00–18:00) ja kesto-rajoitukset (min 30 min, max 4h / 1 pv).
  2. **SharedTV- ja Resurssilukot:** Määrittele mallit niin, että konsolien (`PlayStation5`, `NintendoSwitch`) yhteinen näyttölaite (`SharedTV`) otetaan huomioon estävänä sääntönä (jos toinen on varattu, toista ei voi varata samalle aikavälille).
  3. **SuperAdmin-oikeudet:** Määrittele roolirakenteeseen `SuperAdmin`-taso, jolla on oikeus ohittaa päällekkäisyyssäännöt ja jyrätä tarvittaessa olemassa olevat varaukset uuden tapahtuman tieltä.

---

## 2. @TIETOKANTA (Haara: `feature/db`)
- **Sallittu kirjoitusalue:** `src/Infrastructure/**`, `tests/Infrastructure.Tests/**`.
- **Tuotantosäännöt:**
  1. **PostgreSQL Lukitus ja Aikavälit:**
     - Tallenna ajat `timestamptz`-tyyppinä.
     - Ota käyttöön optimistinen rivilukitus (`UseXminAsConcurrencyToken()`) JA tietokantatason päällekkäisvarausesto (`btree_gist` / uniikki ehdollinen indeksi aktiivisille varauksille), jotta kahta pelipistettä tai SharedTV-laitetta ei voi varata päällekkäin.
  2. **Kyselysuorituskyky:** Käytä `.AsNoTracking()` kaikissa lukuoperaatioissa (ml. reaaliaikainen vapaiden pelipisteiden laskenta ilman erillistä tilaa) ja määrittele oma `src/Infrastructure/DependencyInjection.cs` (`AddInfrastructure`).

---

## 3. @BACKEND (Haara: `feature/backend`)
- **Sallittu kirjoitusalue:** `src/Application/**` (pl. `Abstractions/`), `tests/Application.Tests/**`.
- **Tuotantosäännöt:**
  1. **Result-Pattern & FluentValidation:** Käsittele kaikki liiketoimintavirheet `Result<T>`-rakenteella. Validoi koulun sähköposti (`@edu.xamk.fi` / `@xamk.fi`).
  2. **Use Case -säännöt:** Sijoita Use Case -tasolle säännöt #1, #4, #6, #7 ja #8 (päällekkäisyystarkistukset, tapahtumien konfliktit, SharedTV-esto, sähköpostitunnistus ja SuperAdminin jyräämisoikeus).
  3. **Yksikkötestit:** Kirjoita xUnit-testit (`FakeTimeProvider`) kaikille reunatapauksille. Määrittele `src/Application/DependencyInjection.cs` (`AddApplication`).

---

## 4. @API (Haara: `feature/api`)
- **Sallittu kirjoitusalue:** `src/WebApi/**`, `tests/WebApi.Tests/**`.
- **Tuotantosäännöt:**
  1. **RFC 9457 ProblemDetails & Global Exception Handler:** Toteuta `IExceptionHandler`, joka muuntaa odottamattomat virheet turvallisiksi `ProblemDetails`-vastauksiksi.
  2. **Autentikointi ja Rate Limiting:** Varmista, että kirjautuminen tapahtuu vain koulun tunnisteilla ja varauspäätepisteet on suojattu turhic-skripteiltä.

---

## 5. @UI (Haara: `feature/ui` — Mobile-First React + TypeScript)
- **Sallittu kirjoitusalue:** `src/Client/**`.
- **Tuotantosäännöt:**
  1. **Mobile-First & Kosketusergonomia:**
     - Vähintään 44x44px kosketusalueet, ei vaakavieritystä 320px mobiiliruudulla.
  2. **Reaaliaikainen kalenteri ja TanStack Query:**
     - Hae vapaat pelipisteet ja tilat dynaamisesti ilman turhaa paikallista tilaa. Käsittele `409 Conflict` -tilanteet (jos joku muu ehti varata laitteen sekuntia aiemmin) invalidoimalla välimuisti välittömästi.
"@
Set-Content -Path ".antigravityrules" -Value $rulesContent -Encoding UTF8

Write-Host "=== 6. Luodaan Git Worktree -kansiot rinnakkaisajoa varten ===" -ForegroundColor Cyan
# Siirrytään kansion ulkopuolelle parent-tasolle tai tehdään erillinen hakemisto agenteille, 
# jotta Visual Studio / VS Code ei takerru lukkoihin.
$parentDir = Split-Path -Parent (Get-Location)
$agentsDir = Join-Path$parentDir "PelihuoneVaraus-Agents"
New-Item -ItemType Directory -Force -Path $agentsDir | Out-Null

git branch dev-arch
git branch feature/db
git branch feature/backend
git branch feature/api
git branch feature/ui

git worktree add "$agentsDir/dev-arch" dev-arch
git worktree add "$agentsDir/feat-db" feature/db
git worktree add "$agentsDir/feat-backend" feature/backend
git worktree add "$agentsDir/feat-api" feature/api
git worktree add "$agentsDir/feat-ui" feature/ui

Write-Host "=== VALMIS! Projekti ja Worktreet on luotu onnistuneesti. ===" -ForegroundColor Green
Write-Host "Pääprojekti sijaitsee täällä: $(Get-Location)"
Write-Host "Agenttien Worktree-kansiot luotiin tänne: $agentsDir"