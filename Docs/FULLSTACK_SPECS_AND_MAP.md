# Full stack -spesifikaatio ja järjestelmän toimintakartta (Xamk Game Room)

Tämä dokumentti kuvaa Pelihuonevaraus (Xamk Game Room) -järjestelmän koko teknologiapinon, kerrosarkkitehtuurin, komponenttien välisen tietovirran, kaikki REST API -kutsut päästä päähän sekä tietomallit.

---

## 1. Full stack -teknologiapino ja laatuvaatimukset

| Osa-alue | Teknologia tai kirjasto | Sijainti projektissa | Rooli ja konfiguraatio |
| :--- | :--- | :--- | :--- |
| **Käyttöliittymä (Frontend)** | React 19 + TypeScript 5.x + Vite | `src/frontend/` | SPA-käyttöliittymä, tiukka tyyppitarkistus (`"strict": true`, `"noImplicitReturns": true`), ei `any`- tai `var`-avainsanoja (`no-var: error`). |
| **Palvelintila ja välimuisti** | TanStack React Query v5 | `src/frontend/src/components/` | Asynkroninen datan haku, automaattinen taustapäivitys (`refetchInterval`) ja välimuistin invalidointi mutaatioiden jälkeen. |
| **Tyylit ja UI-komponentit** | Tailwind CSS + Radix UI / Shadcn | `src/frontend/src/components/ui/` | Xamk Dark Cockpit -teema (`#0B0C10`, `#F5B700`, `#D70E2F`), kosketusystävälliset (min. 44×44 px) ja saavutettavat (WCAG 2.1 AA) komponentit. |
| **HTTP-rajapinta (API)** | ASP.NET Core 10 Minimal APIs | `src/backend/WebApi/` | RESTful JSON API, kiinteän aikaikkunan Rate Limiting (`AuthPolicy`, `ReservationPolicy`), CORS (`AllowClient`) ja RFC 9457 `ProblemDetails`-virheenkäsittely. |
| **Sovelluslogiikka (Application)** | .NET 10 + FluentValidation | `src/backend/Application/` | Käyttötapauspalvelut (`*Service`), syötteiden validointi, `Result<T>`-virheidenkäsittelymalli ja Discord Webhook -ilmoitukset. |
| **Toimialuemalli (Domain)** | Puhdas C# (.NET 10, 0 ulkoista riippuvuutta) | `src/backend/Domain/` | Taktinen DDD: Juurientiteetit (`AggregateRoot`), arvo-objektit (`SchoolEmail`, `TimeWindow`, vahvasti tyypitetyt ID:t) ja domain-tapahtumat (`IDomainEvent`). |
| **Tietokanta ja persistenssi** | EF Core 10 + PostgreSQL (`Npgsql`) / InMemory | `src/backend/Infrastructure/` | `ApplicationDbContext`, optimistinen rivilukitus (`xmin`), `OutboxInterceptor` (Transactional Outbox), automaattinen PostgreSQL ja InMemory -varakäynti ja `DatabaseSeeder`. |
| **Kääntäjäpalomuuri** | MSBuild + Roslyn Analyzers + `.editorconfig` | `Directory.Build.props`, `.editorconfig` | `TreatWarningsAsErrors=true`, `EnforceCodeStyleInBuild=true`, `GenerateDocumentationFile=true` (`CS1591`), eksplisiittiset tyypit pakotettu (`IDE0008 = error`, `var` kielletty). |
| **Testaus (QA)** | xUnit + NSubstitute + Testcontainers | `tests/*` | Yksikkö-, repositorio-, API- ja rinnakkaisvarausten rasitustestit (`Application.Tests`, `Infrastructure.Tests`, `WebApi.Tests`, `Integration.Tests`). |

---

## 2. Arkkitehtuurikartta ja riippuvuuksien suunta (Clean Architecture)

Järjestelmä noudattaa tiukkaa kerrosarkkitehtuuria ja Dependency Inversion -periaatetta. Ulommat kerrokset riippuvat vain sisemmistä kerroksista, eikä `Domain`-kerroksella ole lainkaan ulkoisia pakettiriippuvuuksia.

```mermaid
flowchart TB
    subgraph Client ["Frontend (src/frontend, React ja TypeScript)"]
        UI_App["App.tsx & RouterProvider\n(Navigaatio, Modaalit, Teema)"]
        UI_Comp["Näkymäkomponentit\n(ReservationCalendar, StationList,\nReservationForm, MyReservations,\nGamesCatalog, AdminPanel)"]
        UI_Query["TanStack Query Välimuisti\n(useQuery / useMutation)"]
        UI_Api["REST API Client\n(src/frontend/src/api/client.ts)"]
        
        UI_App --> UI_Comp
        UI_Comp --> UI_Query
        UI_Query --> UI_Api
    end

    subgraph WebApi ["Esityskerros (src/backend/WebApi)"]
        MW["Middleware-putki\n(GlobalExceptionHandler, CORS, RateLimiter)"]
        EP["Minimal API Päätepisteet\n(Auth, Station, Reservation, Game,\nNews, Settings, Statistics, Issue)"]
        RES["ResultExtensions.ToHttpResult()\n(Result<T> HTTP-vastaukseksi)"]
        
        MW --> EP
        EP --> RES
    end

    subgraph Contracts ["Jaetut sopimukset (src/backend/Contracts)"]
        DTO["Request & Response DTO-tietueet\n(Reservations, Users, GamingStations,\nGames, News, Settings, Statistics, Issues)"]
    end

    subgraph Application ["Sovelluskerros (src/backend/Application)"]
        VAL["FluentValidation Validaattorit\n(CreateReservation, CancelReservation, Email)"]
        SVC["Sovelluspalvelut\n(ReservationService, UserService,\nGamingStationService, GameService,\nNewsService, SettingsService,\nStatisticsService, IssueReportService,\nDiscordNotificationService)"]
        ABS["Abstraktiot & Rajapinnat\n(I*Repository, IUnitOfWork, IDateTimeProvider)"]
        
        SVC --> VAL
        SVC --> ABS
    end

    subgraph Domain ["Toimialuekerros (src/backend/Domain)"]
        AGG["Aggregaatit & Entiteetit\n(GameRoom, GamingStation, Reservation,\nUser, Game, News, IssueReport)"]
        VO["Arvo-objektit & Invariantit\n(TimeWindow, OpeningHours, SchoolEmail,\nUserId, ReservationId, GamingStationId)"]
        EVT["Domain-tapahtumat\n(ReservationCreatedDomainEvent,\nReservationCancelledDomainEvent)"]
        
        AGG --> VO
        AGG --> EVT
    end

    subgraph Infrastructure ["Infrastruktuurikerros (src/backend/Infrastructure)"]
        REPO["EF Core Repositoriot\n(ReservationRepository, UserRepository,\nGamingStationRepository, GameRepository,\nNewsRepository, GameRoomRepository,\nIssueReportRepository)"]
        DBC["ApplicationDbContext & OutboxInterceptor\n(PostgreSQL timestamptz + xmin / InMemory)"]
        JSON_CFG["Paikallinen Asetustallennus\n(site-settings.json)"]
        
        REPO --> DBC
    end

    UI_Api == "HTTP / JSON\n(X-User-Id, Idempotency-Key)" ==> MW
    EP --> SVC
    EP --> DTO
    SVC --> DTO
    SVC --> AGG
    SVC -. "Tallentaa tilasäännöt" .-> JSON_CFG
    REPO -. "Toteuttaa" .-> ABS
    DBC --> AGG
```

---

## 3. Kutsujen elinkaari ja sekvenssikaaviot

### 3.1 Varauksen luonti (`POST /api/reservations`)
Kuvaa koko tarkistusketjun aina lomakkeen lähetyksestä huoltotila-, banni-, aukiolo-, kiintiö- ja SharedTV-tarkistuksiin sekä Outbox- ja Discord-viestintään.

```mermaid
sequenceDiagram
    autonumber
    actor User as Opiskelija / Admin
    participant UI as ReservationCalendar / Form (React)
    participant API as ReservationEndpoints (WebApi)
    participant Svc as ReservationService (Application)
    participant Set as SettingsService (Application)
    participant Repo as Repositories & UnitOfWork (Infra)
    participant DB as PostgreSQL / InMemory + Outbox
    participant Discord as DiscordNotificationService

    User->>UI: Valitsee laitteen/tilan, ajan ja painaa "Vahvista varaus"
    UI->>UI: Generoi tai lukee Idempotency-Key (UUID)
    UI->>API: POST /api/reservations (CreateReservationRequest + Idempotency-Key)
    API->>Svc: CreateReservationAsync(request, cancellationToken)
    
    Svc->>Svc: 1. CreateReservationRequestValidator.ValidateAsync()
    Svc->>Repo: 2. UserRepository.GetByIdAsync(request.UserId)
    Repo-->>Svc: User
    
    alt Käyttäjä on asetettu käyttöestoon (user.IsBanned(nowUtc))
        Svc-->>API: Result.Failure(Error.Forbidden("User.Banned"))
        API-->>UI: HTTP 403 Forbidden (ProblemDetails: kesto ja syy)
    end

    Svc->>Set: 3. GetSettingsAsync() (aukioloajat, kiintiöt, huoltotila, SharedTV-lukko)
    Set-->>Svc: SiteSettingsResponse

    alt Huoltotila päällä (IsMaintenanceMode && !user.IsAdmin)
        Svc-->>API: Result.Failure(Error.Conflict("Reservation.MaintenanceMode"))
        API-->>UI: HTTP 409 Conflict (ProblemDetails: huoltotiedote)
    end

    Svc->>Svc: 4. Tarkista ennakkovarausraja, minimikesto, arkipäiväsääntö ja aukioloajat
    Svc->>Repo: 5. Tarkista laitteen aktiivisuus (Station.IsActive) ja päiväkiintiö
    Svc->>Repo: 6. GetOverlappingReservationsAsync(timeWindow)
    
    alt Päällekkäisyys (Laite varattu / Koko tila varattu / SharedTV-konsoliristiriita)
        Svc-->>API: Result.Failure(Error.Conflict("Reservation.*Conflict"))
        API-->>UI: HTTP 409 Conflict (ProblemDetails)
        UI->>UI: Invalidoi TanStack Queryn aikaslottivälimuisti
    else Ei ristiriitoja
        Svc->>Svc: 7. Reservation.Create luo varauksen ja nostaa ReservationCreatedDomainEvent-tapahtuman
        Svc->>Repo: 8. ReservationRepository.AddAsync() + UnitOfWork.SaveChangesAsync()
        Repo->>DB: Tallentaa Reservation + OutboxMessage samassa transaktiossa
        Svc->>Discord: 9. SendReservationCreatedAsync() (jos koko tilan tai tapahtuman varaus)
        Svc-->>API: Result.Success(ReservationResponse)
        API-->>UI: HTTP 201 Created (ReservationResponse)
        UI->>UI: Invalidoi ['reservations'], ['reservations-day'], ['available-stations']
    end
```

### 3.2 Kirjautuminen, OTP-vahvistus ja käyttöeston valvonta
Kuvaa kaksivaiheisen koulusähköpostikirjautumisen (`@edu.xamk.fi` ja `@xamk.fi`) sekä ylläpitäjän asettaman käyttöeston tarkistuksen.

```mermaid
sequenceDiagram
    autonumber
    actor User as Käyttäjä
    participant Modal as LoginModal / AuthContext
    participant API as AuthEndpoints (/api/auth/*)
    participant USvc as UserService
    participant URepo as UserRepository

    User->>Modal: Syöttää @edu.xamk.fi / @xamk.fi -sähköpostin
    Modal->>API: POST /api/auth/send-code { email }
    API->>USvc: SendVerificationCodeAsync(email)
    USvc->>USvc: EmailValidator + Generoi 6-numeroinen OTP (voimassa 15 min)
    USvc-->>API: Result.Success(code)
    API-->>Modal: HTTP 200 OK { message, devCode }

    User->>Modal: Syöttää 6-numeroisen vahvistuskoodin
    Modal->>API: POST /api/auth/verify-code { email, code, displayName }
    API->>USvc: VerifyCodeAndLoginAsync(email, code, displayName)
    USvc->>USvc: Tarkista koodi ja kutsu AuthenticateOrCreateUserAsync()
    USvc->>URepo: GetByEmailAsync(schoolEmail)

    alt Käyttäjä löytyy ja on käyttöestossa (existingUser.IsBanned(nowUtc))
        USvc-->>API: Result.Failure(Error.Forbidden("User.Banned", "Käyttäjätilisi on asetettu käyttöestoon..."))
        API-->>Modal: HTTP 403 Forbidden (Näyttää käyttöeston päättymisajan ja syyn)
    else Käyttäjä aktiivinen tai uusi käyttäjä
        USvc->>URepo: (Jos uusi) AddAsync(newUser) + SaveChangesAsync()
        USvc-->>API: Result.Success(UserResponse)
        API-->>Modal: HTTP 200 OK (UserResponse)
        Modal->>Modal: Tallentaa käyttäjän selaimeen
    end
```

---

## 4. Täydellinen REST API ja kutsukartta

Kaikki backendin päätepisteet on rekisteröity tiedostossa [`Program.cs`](../src/backend/WebApi/Program.cs) ja jaettu toiminnallisiin ryhmiin kansiossa `src/backend/WebApi/Endpoints/`. Ylläpitäjän päätepisteet tarkistavat kutsujan oikeudet `X-User-Id`-otsakkeesta.

### 4.1 Autentikointi ja käyttäjähallinta ([`AuthEndpoints.cs`](../src/backend/WebApi/Endpoints/AuthEndpoints.cs))

| HTTP ja reitti | Suojaus ja Rate Limit | Request DTO | Response DTO | Palvelu ja metodi (`IUserService`) | Kutsutut `api.*`-metodit ja UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | `AuthPolicy` (5/min/IP) | `LoginRequest` | `UserResponse` | `AuthenticateOrCreateUserAsync` | `api.login`, `AuthContext`, `LoginModal` |
| `POST /api/auth/send-code` | `AuthPolicy` (5/min/IP) | `SendVerificationCodeRequest` | `{ message, devCode }` | `SendVerificationCodeAsync` | `LoginModal` (OTP-vaihe 1) |
| `POST /api/auth/verify-code` | `AuthPolicy` (5/min/IP) | `VerifyCodeRequest` | `UserResponse` | `VerifyCodeAndLoginAsync` | `LoginModal` (OTP-vaihe 2) |
| `GET /api/users` | `X-User-Id` (`Admin` ja `SuperAdmin`) | Ei runkoa | `IReadOnlyList<UserResponse>` | `GetAllUsersAsync` | `api.getAllUsers`, `AdminPanel` (`queryKey: ['users']`) |
| `GET /api/users/{id:guid}` | Julkinen tai istunto | Ei runkoa | `UserResponse` | `GetUserByIdAsync` | `api.getUser`, `AuthContext` |
| `PUT /api/users/{id:guid}/role` | `X-User-Id` (`SuperAdmin`) | `UpdateUserRoleRequest` | `UserResponse` | `UpdateUserRoleAsync` | `api.updateUserRole`, `AdminPanel` (Käyttäjät-välilehti) |
| `PUT /api/users/{id:guid}/ban` | `X-User-Id` (`Admin` ja `SuperAdmin`) | `BanUserRequest` | `UserResponse` | `UpdateUserBanAsync` | `api.updateUserBan`, `AdminPanel` (Bannaus ja keston valinta) |

### 4.2 Pelipisteet ja laitetila ([`StationEndpoints.cs`](../src/backend/WebApi/Endpoints/StationEndpoints.cs))

| HTTP ja reitti | Suojaus | Request tai kysely | Response DTO | Palvelu ja metodi (`IGamingStationService`) | Kutsutut `api.*`-metodit ja UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/stations` | Julkinen | Ei parametreja | `IReadOnlyList<GamingStationResponse>` | `GetActiveStationsAsync` | `api.getAllStations`, `App`, `ReservationCalendar`, `StationList` (`['stations']`) |
| `GET /api/stations/admin` | Julkinen tai Admin | Ei parametreja | `IReadOnlyList<GamingStationResponse>` | `GetAllStationsForAdminAsync` | `api.getAllStationsForAdmin`, `AdminPanel` (`['admin-stations']`) |
| `GET /api/stations/available` | Julkinen | `?startUtc=...&endUtc=...` | `IReadOnlyList<GamingStationResponse>` | `GetAvailableStationsAsync` | `api.getAvailableStations`, `StationList`, `ReservationForm`, `FloorPlanModal` (`['available-stations']`, `['available-now']`) |
| `PUT /api/stations/{id:guid}/status` | `X-User-Id` (`Admin` ja `SuperAdmin`) | `UpdateGamingStationStatusRequest` | `GamingStationResponse` | `UpdateStationStatusAsync` | `api.updateStationStatus`, `AdminPanel` (Laitekohtainen huoltotila) |

### 4.3 Varaukset ja pääkäyttäjän jyräys ([`ReservationEndpoints.cs`](../src/backend/WebApi/Endpoints/ReservationEndpoints.cs))

| HTTP ja reitti | Suojaus ja Rate Limit | Request tai kysely | Response DTO | Palvelu ja metodi (`IReservationService`) | Kutsutut `api.*`-metodit ja UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/reservations` | `ReservationPolicy` (10/min/IP) + `Idempotency-Key` | `CreateReservationRequest` | `ReservationResponse` (201) | `CreateReservationAsync` | `api.createReservation`, `ReservationCalendar`, `ReservationForm` |
| `POST /api/reservations/override` | `ReservationPolicy` (10/min/IP) (`SuperAdmin`) | `OverrideReservationRequest` | `ReservationResponse` (201) | `CreateAdminOverrideReservationAsync` | `api.overrideReservation`, `ReservationCalendar`, `ReservationForm` |
| `DELETE /api/reservations/{id:guid}` | Omistaja tai `Admin` ja `SuperAdmin` | `CancelReservationRequest` | `204 No Content` | `CancelReservationAsync` | `api.cancelReservation`, `MyReservations`, `ReservationCalendar`, `AdminPanel` |
| `GET /api/reservations/{id:guid}` | Julkinen | Ei runkoa | `ReservationResponse` | `GetReservationByIdAsync` | `api.getReservation` |
| `GET /api/reservations` | Julkinen | `?startUtc=...&endUtc=...&stationId=...` | `IReadOnlyList<ReservationResponse>` | `GetActiveReservationsAsync` | `api.getActiveReservations`, `ReservationCalendar`, `StationList`, `AdminPanel` (`['reservations']`, `['reservations-day']`, `['admin-reservations']`) |
| `GET /api/users/{userId:guid}/reservations` | Kirjautunut käyttäjä | `?page=1&pageSize=20` | `PagedResult<ReservationResponse>` | `GetUserReservationsAsync` | `api.getUserReservations`, `MyReservations` (`['user-reservations']`) |

### 4.4 Pelivalikoima ja toivelista ([`GameEndpoints.cs`](../src/backend/WebApi/Endpoints/GameEndpoints.cs))

| HTTP ja reitti | Suojaus | Request tai kysely | Response DTO | Palvelu ja metodi (`IGameService`) | Kutsutut `api.*`-metodit ja UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/games` | Julkinen | `?platform=PC&isWishlist=false` | `IReadOnlyList<GameResponse>` | `GetGamesAsync` | `api.getGames`, `GamesCatalog`, `AdminPanel` (`['games']`) |
| `POST /api/games` | `X-User-Id` (`Admin` ja `SuperAdmin`) | `CreateGameRequest` | `GameResponse` (201) | `CreateGameAsync` | `api.createGame`, `AdminPanel` (Pelit-välilehti) |
| `POST /api/games/wishlist` | Kirjautunut käyttäjä | `WishGameRequest` | `GameResponse` (201) | `SuggestGameToWishlistAsync` | `api.wishGame`, `GamesCatalog` (Ehdota peliä) |
| `POST /api/games/{id:guid}/upvote` | Kirjautunut käyttäjä | Ei runkoa | `GameResponse` | `UpvoteWishlistGameAsync` | `api.upvoteGame`, `GamesCatalog` (Äänestä toivetta) |
| `PUT /api/games/{id:guid}/toggle-wishlist` | `X-User-Id` (`Admin` ja `SuperAdmin`) | Ei runkoa | `GameResponse` | `ToggleWishlistStatusAsync` | `api.toggleWishlistStatus`, `AdminPanel` (Hyväksy valikoimaan) |
| `DELETE /api/games/{id:guid}` | `X-User-Id` (`Admin` ja `SuperAdmin`) | Ei runkoa | `204 No Content` | `DeleteGameAsync` | `api.deleteGame`, `AdminPanel` |

### 4.5 Uutiset ja tiedotteet ([`NewsEndpoints.cs`](../src/backend/WebApi/Endpoints/NewsEndpoints.cs))

| HTTP ja reitti | Suojaus | Request DTO | Response DTO | Palvelu ja metodi (`INewsService`) | Kutsutut `api.*`-metodit ja UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/news` | Julkinen | Ei runkoa | `IReadOnlyList<NewsResponse>` | `GetAllNewsAsync` | `api.getNews`, `StationList` (Etusivu ja Hero-banneri), `AdminPanel` (`['news']`) |
| `POST /api/news` | `X-User-Id` (`Admin` ja `SuperAdmin`) | `CreateNewsRequest` | `NewsResponse` (201) | `CreateNewsAsync` | `api.createNews`, `AdminPanel` (Tiedotteet-välilehti) |
| `DELETE /api/news/{id:guid}` | `X-User-Id` (`Admin` ja `SuperAdmin`) | Ei runkoa | `204 No Content` | `DeleteNewsAsync` | `api.deleteNews`, `AdminPanel` |

### 4.6 Sivustoasetukset, varauskiintiöt, tilastot, vikailmoitukset ja terveystarkistukset

| HTTP ja reitti | Tiedosto | Suojaus | Request ja Response DTO | Palvelu ja metodi | Kutsutut `api.*`-metodit ja UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/settings` | `SettingsEndpoints.cs` | Julkinen ja Admin | `SiteSettingsResponse` | `ISettingsService.GetSettingsAsync` | `api.getSettings`, `AdminPanel` (`['settings']`) |
| `PUT /api/settings` | `SettingsEndpoints.cs` | `X-User-Id` (`Admin` ja `SuperAdmin`) | `UpdateSiteSettingsRequest` ja `SiteSettingsResponse` | `ISettingsService.UpdateSettingsAsync` | `api.updateSettings`, `AdminPanel` (Aukioloajat, kiintiöt, huoltotila, Discord) |
| `GET /api/statistics` | `StatisticsEndpoints.cs` | Julkinen ja Admin | `StatisticsResponse` | `IStatisticsService.GetStatisticsAsync` | `api.getStatistics`, `AdminPanel` (`['statistics']`) |
| `POST /api/issues` | `IssueEndpoints.cs` | Julkinen ja Kirjautunut | `CreateIssueReportRequest` ja `IssueReportResponse` (201) | `IIssueReportService.CreateReportAsync` | `api.createIssueReport`, `BugReportModal` |
| `GET /api/issues` | `IssueEndpoints.cs` | `X-User-Id` (`Admin` ja `SuperAdmin`) | `IReadOnlyList<IssueReportResponse>` | `IIssueReportService.GetAllReportsAsync` | `api.getIssueReports`, `AdminPanel` (`['issues']`) |
| `PUT /api/issues/{id:guid}/resolve` | `IssueEndpoints.cs` | `X-User-Id` (`Admin` ja `SuperAdmin`) | `ResolveIssueReportRequest` ja `IssueReportResponse` | `IIssueReportService.ResolveReportAsync` | `api.resolveIssueReport`, `AdminPanel` (Vikailmoitukset-välilehti) |
| `GET /health/live` | `Program.cs` | Julkinen | HTTP 200 (`Healthy`) | ASP.NET Core HealthChecks | Konttiorkestrointi ja valvonta |
| `GET /health/ready` | `Program.cs` | Julkinen | HTTP 200 (`Healthy`) | ASP.NET Core HealthChecks | Konttiorkestrointi ja valvonta |

---

## 5. Roolitukset, käyttöoikeushierarkia ja lupamatriisi (RBAC ja oikeudet)

Järjestelmässä on viisi toiminnallista käyttöoikeustasoa: Vierailija (Anonyymi), Estetty käyttäjä (`Banned`), Peruskäyttäjä (`UserRole.User = 0`), Ylläpitäjä (`UserRole.Admin = 1`) sekä Pääkäyttäjä (`UserRole.SuperAdmin = 2`).

```mermaid
flowchart LR
    Anon["Vierailija (Anonyymi)\n• Selaa kalenteria, laitteita, pelejä ja uutisia\n• Lähettää vikailmoituksen\n• Kirjautuu Xamk-sähköpostilla (OTP)"]
    Banned["Bannattu (IsBanned = true)\n• Määräaikainen (1 h - 3 kk) tai pysyvä esto\n• Kirjautuminen ja uudet varaukset estetty (403 Forbidden)"]
    User["User (Opiskelija ja Henkilökunta)\n• Yksittäisvaraus (max 4 h / vrk)\n• Tilavaraus (max 4 h)\n• Omien varausten peruutus\n• Pelitoiveiden ehdotus ja äänestys"]
    Admin["Admin (Tilanvalvoja ja Ylläpitäjä)\n• Admin-paneeli (6 välilehteä)\n• Tila- ja tapahtumavaraukset ilman tuntikiintiötä\n• Kaikkien varausten peruutus\n• Pelien, uutisten, kiintiöiden, laitehuollon ja vikojen hallinta\n• Käyttäjien käyttöestot"]
    SuperAdmin["SuperAdmin (Pääkäyttäjä)\n• Aukioloaikojen ohitus (allowAnytime = 24/7)\n• Päällekkäisten varausten jyräys (Override)\n• Käyttäjäroolien muuttaminen (User ja Admin välillä)\n• Suojattu tili (ei voi asettaa käyttöestoon)"]

    Anon --> User
    User -. "Admin asettaa käyttöeston" .-> Banned
    Banned -. "Käyttöesto päättyy tai poistetaan" .-> User
    User -- "SuperAdmin ylentää" --> Admin
    Admin --> SuperAdmin
```

### Täydellinen toiminto- ja lupamatriisi

| Toiminto ja oikeus | Vierailija (Anonyymi) | Bannattu (`IsBanned`) | `User` (Opiskelija) | `Admin` (Ylläpitäjä) | `SuperAdmin` (Pääkäyttäjä) | Valvova kerros |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Tilanteen, kalenterin, pelien ja uutisten selaus** | Sallittu | Sallittu | Sallittu | Sallittu | Sallittu | Julkiset `GET`-päätepisteet |
| **Vikailmoituksen lähetys (`POST /api/issues`)** | Sallittu | Sallittu | Sallittu | Sallittu | Sallittu | `IssueEndpoints` |
| **Sisäänkirjautuminen (`@edu.xamk.fi` ja `@xamk.fi`)** | Sallittu | Estetty (`403`) | Sallittu | Sallittu | Sallittu | `UserService.AuthenticateOrCreateUserAsync` |
| **Yksittäisen pelipisteen varaus (`Individual`)** | Estetty | Estetty (`403`) | Sallittu *(max 4 h/vrk)* | Sallittu *(max 4 h/vrk)* | Sallittu *(max 4 h/vrk)* | `ReservationService.CreateReservationAsync` |
| **Koko pelitilan varaus (`Room`)** | Estetty | Estetty (`403`) | Sallittu *(max 4 h)* | Sallittu *(ei tuntirajaa)* | Sallittu *(ei tuntirajaa)* | `ReservationService` (`!user.IsAdmin` kiintiötarkistus) |
| **Tapahtumavaraus (`Event`)** | Estetty | Estetty (`403`) | Estetty (`403`) | Sallittu | Sallittu | `ReservationService` (`!user.IsAdmin` tarkistus) |
| **Varaaminen tilan ollessa huoltotilassa (`IsMaintenanceMode`)** | Estetty | Estetty | Estetty (`409`) | Sallittu | Sallittu | `ReservationService` (`isMaintenanceMode && !user.IsAdmin`) |
| **Varaaminen aukioloaikojen ja arkipäivien ulkopuolella (`24/7`)** | Estetty | Estetty | Estetty (`400`) | Estetty (`400`) | Sallittu (`allowAnytime`) | `OpeningHours.IsWithinOpeningHours(..., allowAnytime: user.IsSuperAdmin)` |
| **Päällekkäisten opiskelijavarausten jyräys (`POST /override`)** | Estetty | Estetty | Estetty (`403`) | Estetty (`403`) | Sallittu | `ReservationService.CreateAdminOverrideReservationAsync` (`user.IsSuperAdmin`) |
| **Oman varauksen peruutus (`DELETE /api/reservations/{id}`)** | Estetty | Estetty | Sallittu | Sallittu | Sallittu | `ReservationService.CancelReservationAsync` |
| **Muiden käyttäjien varausten peruutus** | Estetty | Estetty | Estetty (`403`) | Sallittu | Sallittu | `ReservationService` (`reservation.UserId != userId && !user.IsAdmin`) |
| **Pelitoiveen ehdotus ja äänestys (`Wishlist`)** | Estetty | Estetty | Sallittu | Sallittu | Sallittu | `GamesCatalog.tsx` ja `GameEndpoints` |
| **Pelien lisäys, hyväksyntä valikoimaan ja poisto** | Estetty | Estetty | Estetty (`403`) | Sallittu | Sallittu | `GameEndpoints` (`X-User-Id`: `Admin` tai `SuperAdmin`) |
| **Tiedotteiden julkaisu, kiinnitys ja poisto (`News`)** | Estetty | Estetty | Estetty (`403`) | Sallittu | Sallittu | `NewsEndpoints` (`X-User-Id`: `Admin` tai `SuperAdmin`) |
| **Varauskiintiöiden, aukioloaikojen ja huoltotilan muokkaus** | Estetty | Estetty | Estetty (`403`) | Sallittu | Sallittu | `SettingsEndpoints` (`PUT /api/settings`) |
| **Yksittäisen pelipisteen asettaminen huoltotilaan** | Estetty | Estetty | Estetty (`403`) | Sallittu | Sallittu | `StationEndpoints` (`PUT /api/stations/{id}/status`) |
| **Käyttötilastojen ja vikailmoitusten hallinta** | Estetty | Estetty | Estetty (`403`) | Sallittu | Sallittu | `StatisticsEndpoints` ja `IssueEndpoints` |
| **Käyttäjälistan tarkastelu (`GET /api/users`)** | Estetty | Estetty | Estetty (`403`) | Sallittu | Sallittu | `AuthEndpoints` (`Admin` ja `SuperAdmin`) |
| **Käyttäjän asettaminen käyttöestoon (`PUT /users/{id}/ban`)** | Estetty | Estetty | Estetty (`403`) | Sallittu *(ei SuperAdminia)* | Sallittu *(ei SuperAdminia)* | `AuthEndpoints` + `User.Ban` (`DomainException` jos `IsSuperAdmin`) |
| **Käyttäjän roolin muuttaminen (`PUT /users/{id}/role`)** | Estetty | Estetty | Estetty (`403`) | Estetty (`403`) | Sallittu | `AuthEndpoints` (`authUser.Role == "SuperAdmin"`) |

---

## 6. Tietokantakaavio ja domain-entiteetit (ER-kartta)

Kaikki entiteetit tallennetaan `ApplicationDbContext`-luokan kautta (PostgreSQL-tauluihin tai kehitysympäristön muistitietokantaan) ja jokaisella taululla on oma EF Core -konfiguraationsa kansiossa `src/backend/Infrastructure/Persistence/Configurations/`. Lisäksi järjestelmän dynaamiset aukiolo- ja kiintiösäännöt tallennetaan tiedostoon `site-settings.json`.

```mermaid
erDiagram
    USERS ||--o{ RESERVATIONS : "tekee (UserId)"
    GAME_ROOMS ||--o{ GAMING_STATIONS : "sisältää (8 laitetta)"
    GAME_ROOMS ||--o{ RESERVATIONS : "tilavaraus (GameRoomId)"
    GAMING_STATIONS ||--o{ RESERVATIONS : "laitevaraus (GamingStationId)"

    USERS {
        uuid Id PK "UserId (ValueObject)"
        varchar(255) Email UK "SchoolEmail (@edu.xamk.fi / @xamk.fi)"
        varchar(100) DisplayName "Näyttönimi"
        int Role "0=User, 1=Admin, 2=SuperAdmin"
        timestamptz CreatedAtUtc "Luontiaika"
        timestamptz BannedUntilUtc "Käyttöeston päättymisaika (nullable)"
        varchar(500) BanReason "Käyttöeston syy (nullable)"
        uint xmin "Optimistinen rivilukitus"
    }

    GAME_ROOMS {
        uuid Id PK "GameRoomId"
        varchar(100) Name "Xamk Pääpelitila"
        int Capacity "Kapasiteetti (25 hlö)"
        boolean IsActive "Onko tila käytössä"
        uint xmin "Optimistinen rivilukitus"
    }

    GAMING_STATIONS {
        uuid Id PK "GamingStationId"
        varchar(50) Name "PC 1..6, PlayStation 5, Nintendo Switch"
        varchar(20) StationCode UK "PC-01..06, PS5-01, SW-01"
        int Type "0=PC, 1=PlayStation5, 2=NintendoSwitch"
        boolean UsesSharedTv "PS5 ja Switch = true (jaettu TV)"
        boolean IsActive "true=Käytössä, false=Huoltotilassa"
        uint xmin "Optimistinen rivilukitus"
    }

    RESERVATIONS {
        uuid Id PK "ReservationId"
        uuid UserId FK "Varaajan tunniste"
        int ReservationType "1=Individual, 2=Room, 3=Event"
        uuid GamingStationId FK "Varattu pelipiste (nullable)"
        uuid GameRoomId FK "Varattu pelitila (nullable)"
        timestamptz StartUtc "TimeWindow.StartUtc"
        timestamptz EndUtc "TimeWindow.EndUtc"
        int Status "1=Active, 2=Cancelled"
        timestamptz CreatedAtUtc "Luontiaika"
        timestamptz CancelledAtUtc "Peruutusaika (nullable)"
        varchar(500) CancellationReason "Peruutuksen tai jyräyksen syy (nullable)"
        uint xmin "Optimistinen rivilukitus"
    }

    GAMES {
        uuid Id PK "GameId"
        varchar(150) Name "Pelin nimi"
        int Platform "0=PC, 1=PlayStation5, 2=NintendoSwitch"
        varchar(1000) Description "Kuvaus tai perustelu"
        boolean IsWishlist "false=Asennettu, true=Toivelistalla"
        int VotesCount "Äänten määrä toivelistalla"
        timestamptz CreatedAtUtc "Lisäysaika"
    }

    NEWS {
        uuid Id PK "NewsId"
        varchar(200) Title "Tiedotteen otsikko"
        varchar(4000) Content "Sisältöteksti"
        boolean IsPinned "Kiinnitetty etusivun yläbanneriin"
        varchar(100) AuthorName "Julkaisijan nimi"
        timestamptz CreatedAtUtc "Julkaisuaika"
    }

    ISSUE_REPORTS {
        uuid Id PK "IssueReportId"
        varchar(100) Target "Laite tai kohde (esim. PC 1)"
        varchar(200) Title "Vikailmoituksen otsikko"
        varchar(2000) Description "Tarkempi kuvaus"
        varchar(255) ReporterEmail "Ilmoittajan sähköposti"
        varchar(100) ReporterName "Ilmoittajan nimi"
        boolean IsResolved "Onko kuitattu ratkaistuksi"
        varchar(1000) AdminNotes "Ylläpidon ratkaisumuistiinpanot"
        timestamptz CreatedAtUtc "Ilmoitusaika"
        timestamptz ResolvedAtUtc "Ratkaisuaika (nullable)"
    }

    OUTBOX_MESSAGES {
        uuid Id PK "Viestin tunniste"
        varchar(255) Type "Domain-tapahtuman tyyppi"
        jsonb Content "Serialisoitu tapahtumadata"
        timestamptz OccurredOnUtc "Tapahtumahetki"
        timestamptz ProcessedOnUtc "Käsittelyhetki (nullable)"
        text Error "Mahdollinen virheviesti"
    }
```

---

## 7. Käyttöliittymän komponentti-, reititys- ja välimuistikartta (`src/frontend`)

Käyttöliittymä rakentuu kolmen kontekstintarjoajan (`LanguageProvider`, `AuthProvider`, `RouterProvider`) ja viiden päävälilehden (`NavTab`) ympärille:

```mermaid
flowchart LR
    subgraph Providers ["Kontekstit ja globaali tila"]
        Auth["AuthContext\n(user, isAdmin, isSuperAdmin)"]
        Lang["LanguageContext\n(lang: 'fi' | 'en')"]
        Router["RouterContext\n(activeTab, adminSubTab,\nQuickBook Prefill)"]
    end

    subgraph Tabs ["Päänäkymät (App.tsx)"]
        T1["'overview' -> StationList.tsx\n• Hero-banneri ja kiinnitetyt uutiset\n• Reaaliaikainen laitetila ('Juuri nyt')\n• Pikavaraus ('Varaa heti')\n• Päivän kuormitusmittari"]
        T2["'calendar' -> ReservationCalendar.tsx\n• Interaktiivinen Drag-to-Select aikamatriisi\n• Yksittäisvaraus / Tilavaraus / SuperAdmin Jyräys\n• Päivän varauskortit ja peruutus"]
        T3["'games' -> GamesCatalog.tsx\n• Alustasuodatin (Kaikki, PC, PS5, Switch, Toiveet)\n• Pelin ehdotuslomake ja äänestys"]
        T4["'my-reservations' -> MyReservations.tsx\n• Käyttäjän omat tulevat ja menneet varaukset\n• Peruutuspainike vahvistuksella"]
        T5["'admin' -> AdminPanel.tsx\n1. Pelit ja toivelista ('games')\n2. Uutiset ja tiedotteet ('news')\n3. Käyttäjät, roolit ja käyttöestot ('users')\n4. Asetukset, kiintiöt, huolto ja varaukset ('settings')\n5. Tilastot ja käyttöaste ('statistics')\n6. Vikailmoitukset ('issues')"]
    end

    subgraph Modals ["Globaalit modaalit"]
        M1["LoginModal.tsx\n(OTP-kirjautuminen ja pikatunnukset)"]
        M2["FloorPlanModal.tsx\n(Pohjapiirros 8 laitteesta)"]
        M3["BugReportModal.tsx\n(Vikailmoituslomake)"]
    end

    Providers --> Tabs
    Providers --> Modals
    T1 -- "Valitsee laitteen -> navigateToBookingWithPrefill()" --> T2
    M2 -- "Valitsee laitteen pohjakuvasta" --> T2
```

### TanStack Query -välimuistiavaimet (`queryKey`) ja niiden synkronointi

| Välimuistiavain (`queryKey`) | Hakeva API-kutsu | Käyttävät komponentit | Mitkä toiminnot (mutaatiot) invalidoivat avaimen? |
| :--- | :--- | :--- | :--- |
| `['stations']` | `api.getAllStations()` | `App`, `StationList`, `ReservationCalendar` | Laitteen tilan vaihto (`updateStationStatusMutation`) |
| `['admin-stations']` | `api.getAllStationsForAdmin()` | `AdminPanel` (`settings`) | Laitteen tilan vaihto (`updateStationStatusMutation`) |
| `['available-stations', start, end]` | `api.getAvailableStations(s, e)` | `ReservationForm`, `FloorPlanModal` | Varauksen luonti, peruutus tai jyräys, asetusten tai laitetilan muutos |
| `['available-now']` | `api.getAvailableStations(now, +30m)` | `StationList` (Etusivun live-tila) | Varauksen luonti, peruutus tai jyräys, asetusten tai laitetilan muutos |
| `['reservations', start, end]` | `api.getActiveReservations(s, e)` | `ReservationCalendar`, `StationList` | Varauksen luonti, peruutus tai SuperAdmin-jyräys |
| `['reservations-day', dayStart, dayEnd]` | `api.getActiveReservations(s, e)` | `ReservationCalendar`, `StationList` | Varauksen luonti, peruutus tai SuperAdmin-jyräys |
| `['admin-reservations']` | `api.getActiveReservations(-2h, +14d)` | `AdminPanel` (`settings`) | Adminin varauksen peruutus (`adminCancelReservationMutation`) |
| `['user-reservations', userId, page]` | `api.getUserReservations(...)` | `MyReservations` | Varauksen luonti tai peruutus |
| `['games']` | `api.getGames()` | `GamesCatalog`, `AdminPanel` | Pelin lisäys, toiveen ehdotus, äänestys, hyväksyntä tai poisto |
| `['news']` | `api.getNews()` | `StationList`, `AdminPanel` | Tiedotteen julkaisu tai poisto |
| `['users']` | `api.getAllUsers(adminId)` | `AdminPanel` (`users`) | Roolin muutos (`updateUserRoleMutation`) tai käyttöesto (`updateUserBanMutation`) |
| `['settings']` | `api.getSettings()` | `AdminPanel` (`settings`) | Asetusten ja varauskiintiöiden tallennus (`updateSettingsMutation`) |
| `['statistics']` | `api.getStatistics()` | `AdminPanel` (`statistics`) | Pelin tilan vaihto, varauksen peruutus ja 10 s automaattipäivitys |
| `['issues']` | `api.getIssueReports(adminId)` | `AdminPanel` (`issues`) | Vikailmoituksen lähetys tai ratkaistuksi kuittaaminen ja 10 s automaattipäivitys |

---

## 8. Automaattinen virhe- ja kaatumishälytysjärjestelmä ylläpidolle

Järjestelmä valvoo taustalla kaikkia HTTP-pyyntöjä ja prosessitason suoritusta:
1. HTTP 500 -palvelinvirheet: [`GlobalExceptionHandler`](../src/backend/WebApi/Middleware/GlobalExceptionHandler.cs) kutsuu skopatusti [`IErrorNotificationService.SendErrorAlertAsync`](../src/backend/Application/Abstractions/Services/IErrorNotificationService.cs) -palvelua. Toimintasäännöistä johtuvat `DomainException`-virheet eivät laukaise hälytyksiä.
2. Prosessitason kaatumiset: [`src/backend/WebApi/Program.cs`](../src/backend/WebApi/Program.cs) ottaa kiinni `AppDomain.CurrentDomain.UnhandledException`-tapahtuman ja lähettää hätähälytyksen ennen prosessin alasajoa.
3. Vastaanottajien dynaaminen haku: osoitteet haetaan tietokannasta kaikille aktiivisille `Admin`- ja `SuperAdmin`-käyttäjille. Jos tietokantayhteys katkeaa kaatumisen yhteydessä, käytetään konfiguroitua varasähköpostia (`Alerts:AdminEmail` tai `Smtp:AdminEmail`).
4. Spämmisuojaus ja cooldown: 60 sekunnin `AlertCooldown` identtisille poikkeuksille estää sähköpostitulvan.
5. SMTP ja simulaatio: [`SmtpEmailSender`](../src/backend/Infrastructure/Services/Email/SmtpEmailSender.cs) lähettää HTML-raportin (sisältäen virheviestin, HTTP-polun, Trace ID:n, isäntäkoneen ja pinojäljen). Kehitysympäristössä ilman SMTP-palvelinta lähetys simuloidaan sovelluslokiin.
