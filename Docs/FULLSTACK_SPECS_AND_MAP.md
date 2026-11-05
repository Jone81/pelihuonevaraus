# 🗺️ Full Stack -Spesifikaatio & Järjestelmän Toimintakartta (Xamk Game Room)

Tämä dokumentti kuvaa **Pelihuonevaraus (Xamk Game Room)** -järjestelmän koko teknologiapinon (Full Stack Specs), kerrosarkkitehtuurin, komponenttien välisen tietovirran, kaikki REST API -kutsut päästä päähän (React UI → API Client → Minimal API Endpoint → Application Service → Repository → Tietokanta) sekä tietomallit.

---

## 1. Full Stack -Teknologiapino & Laatuvaatimukset

| Osa-alue | Teknologia / Kirjasto | Sijainti projektissa | Rooli ja konfiguraatio |
| :--- | :--- | :--- | :--- |
| **Käyttöliittymä (Frontend)** | React 19 + TypeScript 5.x + Vite | `src/Client/` | SPA-käyttöliittymä, tiukka tyyppitarkistus (`"strict": true`, `"noImplicitReturns": true`), ei `any`- tai `var`-avainsanoja (`no-var: error`). |
| **Palvelintila & Välimuisti** | TanStack React Query v5 | `src/Client/src/components/` | Asynkroninen datan haku, automaattinen taustapäivitys (`refetchInterval`) ja välimuistin invalidointi mutaatioiden jälkeen. |
| **Tyylit & UI-komponentit** | Tailwind CSS + Radix UI / Shadcn | `src/Client/src/components/ui/` | Xamk Dark Cockpit -teema (`#0B0C10`, `#F5B700`, `#D70E2F`), kosketusystävälliset (min. 44×44 px) ja saavutettavat (WCAG 2.1 AA) komponentit. |
| **HTTP-rajapinta (API)** | ASP.NET Core 10 Minimal APIs | `src/WebApi/` | RESTful JSON API, kiinteän aikaikkunan Rate Limiting (`AuthPolicy`, `ReservationPolicy`), CORS (`AllowClient`) ja RFC 9457 `ProblemDetails`-virheenkäsittely. |
| **Sovelluslogiikka (Application)** | .NET 10 + FluentValidation | `src/Application/` | Käyttötapauspalvelut (`*Service`), syötteiden validointi, `Result<T>`-virheidenkäsittelymalli (ilman poikkeusten heittoa ohjausrakenteena) ja Discord Webhook -ilmoitukset. |
| **Toimialuemalli (Domain)** | puhdas C# (.NET 10, 0 ulkoista riippuvuutta) | `src/Domain/` | Taktinen DDD: Juurientiteetit (`AggregateRoot`), arvo-objektit (`SchoolEmail`, `TimeWindow`, vahvasti tyypitetyt ID:t) ja domain-tapahtumat (`IDomainEvent`). |
| **Tietokanta & Persistenssi** | EF Core 10 + PostgreSQL (`Npgsql`) / InMemory | `src/Infrastructure/` | `ApplicationDbContext`, optimistinen rivilukitus (`xmin`), `OutboxInterceptor` (Transactional Outbox), automaattinen PostgreSQL → InMemory -varakäynti ja `DatabaseSeeder`. |
| **Kääntäjäpalomuuri** | MSBuild + Roslyn Analyzers + `.editorconfig` | `Directory.Build.props`, `.editorconfig` | `TreatWarningsAsErrors=true`, `EnforceCodeStyleInBuild=true`, `GenerateDocumentationFile=true` (`CS1591`), eksplisiittiset tyypit pakotettu (`IDE0008 = error`, `var` kielletty). |
| **Testaus (QA)** | xUnit + NSubstitute + Testcontainers | `tests/*` | Yksikkö-, repositorio-, API- ja rinnakkaisvarausten rasitustestit (`Application.Tests`, `Infrastructure.Tests`, `WebApi.Tests`, `Integration.Tests`). |

---

## 2. Arkkitehtuurikartta & Riippuvuuksien Suunta (Clean Architecture)

Järjestelmä noudattaa tiukkaa kerrosarkkitehtuuria ja Dependency Inversion -periaatetta. Ulommat kerrokset riippuvat vain sisemmistä kerroksista, eikä `Domain`-kerroksella ole lainkaan ulkoisia pakettiriippuvuuksia.

```mermaid
flowchart TB
    subgraph Client ["📱 Frontend (src/Client — React + TypeScript)"]
        UI_App["App.tsx & RouterProvider\n(Navigaatio, Modaalit, Teema)"]
        UI_Comp["Näkymäkomponentit\n(ReservationCalendar, StationList,\nReservationForm, MyReservations,\nGamesCatalog, AdminPanel)"]
        UI_Query["TanStack Query Välimuisti\n(useQuery / useMutation)"]
        UI_Api["REST API Client\n(src/Client/src/api/client.ts)"]
        
        UI_App --> UI_Comp
        UI_Comp --> UI_Query
        UI_Query --> UI_Api
    end

    subgraph WebApi ["🌐 Esityskerros (src/WebApi)"]
        MW["Middleware-putki\n(GlobalExceptionHandler, CORS, RateLimiter)"]
        EP["Minimal API Päätepisteet\n(Auth, Station, Reservation, Game,\nNews, Settings, Statistics, Issue)"]
        RES["ResultExtensions.ToHttpResult()\n(Result<T> -> HTTP 200/201/204 tai ProblemDetails)"]
        
        MW --> EP
        EP --> RES
    end

    subgraph Contracts ["📦 Jaetut Sopimukset (src/Contracts)"]
        DTO["Request & Response DTO-tietueet\n(Reservations, Users, GamingStations,\nGames, News, Settings, Statistics, Issues)"]
    end

    subgraph Application ["⚙️ Sovelluskerros (src/Application)"]
        VAL["FluentValidation Validaattorit\n(CreateReservation, CancelReservation, Email)"]
        SVC["Sovelluspalvelut\n(ReservationService, UserService,\nGamingStationService, GameService,\nNewsService, SettingsService,\nStatisticsService, IssueReportService,\nDiscordNotificationService)"]
        ABS["Abstraktiot & Rajapinnat\n(I*Repository, IUnitOfWork, IDateTimeProvider)"]
        
        SVC --> VAL
        SVC --> ABS
    end

    subgraph Domain ["🏛️ Toimialuekerros (src/Domain)"]
        AGG["Aggregaatit & Entiteetit\n(GameRoom, GamingStation, Reservation,\nUser, Game, News, IssueReport)"]
        VO["Arvo-objektit & Invariantit\n(TimeWindow, OpeningHours, SchoolEmail,\nUserId, ReservationId, GamingStationId)"]
        EVT["Domain-tapahtumat\n(ReservationCreatedDomainEvent,\nReservationCancelledDomainEvent)"]
        
        AGG --> VO
        AGG --> EVT
    end

    subgraph Infrastructure ["🗄️ Infrastruktuurikerros (src/Infrastructure)"]
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

## 3. Kutsujen Elinkaari & Sekvenssikaaviot (End-to-End Flows)

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
    
    alt Käyttäjä on bannattu (user.IsBanned(nowUtc))
        Svc-->>API: Result.Failure(Error.Forbidden("User.Banned"))
        API-->>UI: HTTP 403 Forbidden (ProblemDetails: bannin kesto & syy)
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
        Svc->>Svc: 7. Reservation.Create(...) -> nostaa ReservationCreatedDomainEvent
        Svc->>Repo: 8. ReservationRepository.AddAsync() + UnitOfWork.SaveChangesAsync()
        Repo->>DB: Tallentaa Reservation + OutboxMessage samassa transaktiossa
        Svc->>Discord: 9. SendReservationCreatedAsync() (jos koko tilan/tapahtuman varaus)
        Svc-->>API: Result.Success(ReservationResponse)
        API-->>UI: HTTP 201 Created (ReservationResponse)
        UI->>UI: Invalidoi ['reservations'], ['reservations-day'], ['available-stations']
    end
```

### 3.2 Kirjautuminen, OTP-vahvistus ja Käyttöeston (Bannin) Valvonta
Kuvaa kaksivaiheisen koulusähköpostikirjautumisen (`@edu.xamk.fi` / `@xamk.fi`) sekä adminin asettaman käyttöeston tarkistuksen.

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

    alt Käyttäjä löytyy ja on bannattu (existingUser.IsBanned(nowUtc))
        USvc-->>API: Result.Failure(Error.Forbidden("User.Banned", "Käyttäjätilisi on asetettu käyttöestoon..."))
        API-->>Modal: HTTP 403 Forbidden (Näyttää bannin päättymisajan ja syyn)
    else Käyttäjä aktiivinen tai uusi käyttäjä
        USvc->>URepo: (Jos uusi) AddAsync(newUser) + SaveChangesAsync()
        USvc-->>API: Result.Success(UserResponse)
        API-->>Modal: HTTP 200 OK (UserResponse)
        Modal->>Modal: Tallentaa käyttäjän localStorageen ('pelihuone_user')
    end
```

---

## 4. Täydellinen REST API & Kutsukartta (Endpoint-hakemisto)

Kaikki backendin päätepisteet on rekisteröity tiedostossa [`Program.cs`](../src/WebApi/Program.cs) ja jaettu toiminnallisiin ryhmiin kansiossa `src/WebApi/Endpoints/`. Ylläpitäjän päätepisteet tarkistavat kutsujan oikeudet `X-User-Id`-otsakkeesta.

### 4.1 Autentikointi & Käyttäjähallinta ([`AuthEndpoints.cs`](../src/WebApi/Endpoints/AuthEndpoints.cs))

| HTTP & Reitti | Suojaus / Rate Limit | Request DTO | Response DTO | Palvelu & Metodi (`IUserService`) | Kutsutut `api.*`-metodit & UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | `AuthPolicy` (5/min/IP) | `LoginRequest` | `UserResponse` | `AuthenticateOrCreateUserAsync` | `api.login` → `AuthContext`, `LoginModal` |
| `POST /api/auth/send-code` | `AuthPolicy` (5/min/IP) | `SendVerificationCodeRequest` | `{ message, devCode }` | `SendVerificationCodeAsync` | `LoginModal` (OTP-vaihe 1) |
| `POST /api/auth/verify-code` | `AuthPolicy` (5/min/IP) | `VerifyCodeRequest` | `UserResponse` | `VerifyCodeAndLoginAsync` | `LoginModal` (OTP-vaihe 2) |
| `GET /api/users` | `X-User-Id` (`Admin` / `SuperAdmin`) | — | `IReadOnlyList<UserResponse>` | `GetAllUsersAsync` | `api.getAllUsers` → `AdminPanel` (`queryKey: ['users']`) |
| `GET /api/users/{id:guid}` | Julkinen / Istunto | — | `UserResponse` | `GetUserByIdAsync` | `api.getUser` → `AuthContext` |
| `PUT /api/users/{id:guid}/role` | `X-User-Id` (`SuperAdmin`) | `UpdateUserRoleRequest` | `UserResponse` | `UpdateUserRoleAsync` | `api.updateUserRole` → `AdminPanel` (Käyttäjät-välilehti) |
| `PUT /api/users/{id:guid}/ban` | `X-User-Id` (`Admin` / `SuperAdmin`) | `BanUserRequest` | `UserResponse` | `UpdateUserBanAsync` | `api.updateUserBan` → `AdminPanel` (Bannaus & keston valinta) |

### 4.2 Pelipisteet & Laitetila ([`StationEndpoints.cs`](../src/WebApi/Endpoints/StationEndpoints.cs))

| HTTP & Reitti | Suojaus | Request / Query | Response DTO | Palvelu & Metodi (`IGamingStationService`) | Kutsutut `api.*`-metodit & UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/stations` | Julkinen | — | `IReadOnlyList<GamingStationResponse>` | `GetActiveStationsAsync` | `api.getAllStations` → `App`, `ReservationCalendar`, `StationList` (`['stations']`) |
| `GET /api/stations/admin` | Julkinen / Admin | — | `IReadOnlyList<GamingStationResponse>` | `GetAllStationsForAdminAsync` | `api.getAllStationsForAdmin` → `AdminPanel` (`['admin-stations']`) |
| `GET /api/stations/available` | Julkinen | `?startUtc=...&endUtc=...` | `IReadOnlyList<GamingStationResponse>` | `GetAvailableStationsAsync` | `api.getAvailableStations` → `StationList`, `ReservationForm`, `FloorPlanModal` (`['available-stations']`, `['available-now']`) |
| `PUT /api/stations/{id:guid}/status` | `X-User-Id` (`Admin` / `SuperAdmin`) | `UpdateGamingStationStatusRequest` | `GamingStationResponse` | `UpdateStationStatusAsync` | `api.updateStationStatus` → `AdminPanel` (Laitekohtainen huoltotila) |

### 4.3 Varaukset & SuperAdmin-jyräys ([`ReservationEndpoints.cs`](../src/WebApi/Endpoints/ReservationEndpoints.cs))

| HTTP & Reitti | Suojaus / Rate Limit | Request / Query | Response DTO | Palvelu & Metodi (`IReservationService`) | Kutsutut `api.*`-metodit & UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/reservations` | `ReservationPolicy` (10/min/IP) + `Idempotency-Key` | `CreateReservationRequest` | `ReservationResponse` (201) | `CreateReservationAsync` | `api.createReservation` → `ReservationCalendar`, `ReservationForm` |
| `POST /api/reservations/override` | `ReservationPolicy` (10/min/IP) (`SuperAdmin`) | `OverrideReservationRequest` | `ReservationResponse` (201) | `CreateAdminOverrideReservationAsync` | `api.overrideReservation` → `ReservationCalendar`, `ReservationForm` |
| `DELETE /api/reservations/{id:guid}` | Omistaja tai `Admin`/`SuperAdmin` | `CancelReservationRequest` | `204 No Content` | `CancelReservationAsync` | `api.cancelReservation` → `MyReservations`, `ReservationCalendar`, `AdminPanel` |
| `GET /api/reservations/{id:guid}` | Julkinen | — | `ReservationResponse` | `GetReservationByIdAsync` | `api.getReservation` |
| `GET /api/reservations` | Julkinen | `?startUtc=...&endUtc=...&stationId=...` | `IReadOnlyList<ReservationResponse>` | `GetActiveReservationsAsync` | `api.getActiveReservations` → `ReservationCalendar`, `StationList`, `AdminPanel` (`['reservations']`, `['reservations-day']`, `['admin-reservations']`) |
| `GET /api/users/{userId:guid}/reservations` | Kirjautunut käyttäjä | `?page=1&pageSize=20` | `PagedResult<ReservationResponse>` | `GetUserReservationsAsync` | `api.getUserReservations` → `MyReservations` (`['user-reservations']`) |

### 4.4 Pelivalikoima & Toivelista ([`GameEndpoints.cs`](../src/WebApi/Endpoints/GameEndpoints.cs))

| HTTP & Reitti | Suojaus | Request / Query | Response DTO | Palvelu & Metodi (`IGameService`) | Kutsutut `api.*`-metodit & UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/games` | Julkinen | `?platform=PC&isWishlist=false` | `IReadOnlyList<GameResponse>` | `GetGamesAsync` | `api.getGames` → `GamesCatalog`, `AdminPanel` (`['games']`) |
| `POST /api/games` | `X-User-Id` (`Admin` / `SuperAdmin`) | `CreateGameRequest` | `GameResponse` (201) | `CreateGameAsync` | `api.createGame` → `AdminPanel` (Pelit-välilehti) |
| `POST /api/games/wishlist` | Kirjautunut käyttäjä | `WishGameRequest` | `GameResponse` (201) | `SuggestGameToWishlistAsync` | `api.wishGame` → `GamesCatalog` (Ehdota peliä) |
| `POST /api/games/{id:guid}/upvote` | Kirjautunut käyttäjä | — | `GameResponse` | `UpvoteWishlistGameAsync` | `api.upvoteGame` → `GamesCatalog` (Äänestä toivetta) |
| `PUT /api/games/{id:guid}/toggle-wishlist` | `X-User-Id` (`Admin` / `SuperAdmin`) | — | `GameResponse` | `ToggleWishlistStatusAsync` | `api.toggleWishlistStatus` → `AdminPanel` (Hyväksy valikoimaan) |
| `DELETE /api/games/{id:guid}` | `X-User-Id` (`Admin` / `SuperAdmin`) | — | `204 No Content` | `DeleteGameAsync` | `api.deleteGame` → `AdminPanel` |

### 4.5 Uutiset & Tiedotteet ([`NewsEndpoints.cs`](../src/WebApi/Endpoints/NewsEndpoints.cs))

| HTTP & Reitti | Suojaus | Request DTO | Response DTO | Palvelu & Metodi (`INewsService`) | Kutsutut `api.*`-metodit & UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/news` | Julkinen | — | `IReadOnlyList<NewsResponse>` | `GetAllNewsAsync` | `api.getNews` → `StationList` (Etusivu & Hero-banneri), `AdminPanel` (`['news']`) |
| `POST /api/news` | `X-User-Id` (`Admin` / `SuperAdmin`) | `CreateNewsRequest` | `NewsResponse` (201) | `CreateNewsAsync` | `api.createNews` → `AdminPanel` (Tiedotteet-välilehti) |
| `DELETE /api/news/{id:guid}` | `X-User-Id` (`Admin` / `SuperAdmin`) | — | `204 No Content` | `DeleteNewsAsync` | `api.deleteNews` → `AdminPanel` |

### 4.6 Sivustoasetukset, Varauskiintiöt, Tilastot, Vikailmoitukset & Terveystarkistukset

| HTTP & Reitti | Tiedosto | Suojaus | Request / Response DTO | Palvelu & Metodi | Kutsutut `api.*`-metodit & UI-komponentit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/settings` | `SettingsEndpoints.cs` | Julkinen / Admin | `SiteSettingsResponse` | `ISettingsService.GetSettingsAsync` | `api.getSettings` → `AdminPanel` (`['settings']`) |
| `PUT /api/settings` | `SettingsEndpoints.cs` | `X-User-Id` (`Admin` / `SuperAdmin`) | `UpdateSiteSettingsRequest` → `SiteSettingsResponse` | `ISettingsService.UpdateSettingsAsync` | `api.updateSettings` → `AdminPanel` (Aukioloajat, kiintiöt, huoltotila, Discord) |
| `GET /api/statistics` | `StatisticsEndpoints.cs` | Julkinen / Admin | `StatisticsResponse` | `IStatisticsService.GetStatisticsAsync` | `api.getStatistics` → `AdminPanel` (`['statistics']`) |
| `POST /api/issues` | `IssueEndpoints.cs` | Julkinen / Kirjautunut | `CreateIssueReportRequest` → `IssueReportResponse` (201) | `IIssueReportService.CreateReportAsync` | `api.createIssueReport` → `BugReportModal` |
| `GET /api/issues` | `IssueEndpoints.cs` | `X-User-Id` (`Admin` / `SuperAdmin`) | `IReadOnlyList<IssueReportResponse>` | `IIssueReportService.GetAllReportsAsync` | `api.getIssueReports` → `AdminPanel` (`['issues']`) |
| `PUT /api/issues/{id:guid}/resolve` | `IssueEndpoints.cs` | `X-User-Id` (`Admin` / `SuperAdmin`) | `ResolveIssueReportRequest` → `IssueReportResponse` | `IIssueReportService.ResolveReportAsync` | `api.resolveIssueReport` → `AdminPanel` (Vikailmoitukset-välilehti) |
| `GET /health/live` | `Program.cs` | Julkinen | HTTP 200 (`Healthy`) | ASP.NET Core HealthChecks | Konttiorkestrointi / Valvonta |
| `GET /health/ready` | `Program.cs` | Julkinen | HTTP 200 (`Healthy`) | ASP.NET Core HealthChecks | Konttiorkestrointi / Valvonta |

---

## 5. Tietokantakaavio & Domain-entiteetit (ER-kartta)

Kaikki entiteetit tallennetaan `ApplicationDbContext`-luokan kautta (PostgreSQL-tauluihin tai kehitysympäristön muistitietokantaan) ja jokaisella taululla on oma EF Core -konfiguraationsa kansiossa `src/Infrastructure/Persistence/Configurations/`. Lisäksi järjestelmän dynaamiset aukiolo- ja kiintiösäännöt tallennetaan tiedostoon `site-settings.json`.

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
        boolean UsesSharedTv "PS5 & Switch = true (jaettu TV)"
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
        varchar(500) CancellationReason "Peruutuksen/jyräyksen syy (nullable)"
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

## 6. Käyttöliittymän Komponentti-, Reititys- ja Välimuistikartta (`src/Client`)

Käyttöliittymä rakentuu kolmen kontekstintarjoajan (`LanguageProvider`, `AuthProvider`, `RouterProvider`) ja viiden päävälilehden (`NavTab`) ympärille:

```mermaid
flowchart LR
    subgraph Providers ["Kontekstit & Globaali Tila"]
        Auth["AuthContext\n(user, isAdmin, isSuperAdmin)"]
        Lang["LanguageContext\n(lang: 'fi' | 'en')"]
        Router["RouterContext\n(activeTab, adminSubTab,\nQuickBook Prefill)"]
    end

    subgraph Tabs ["Päänäkymät (App.tsx)"]
        T1["🏠 'overview' -> StationList.tsx\n• Hero-banneri & kiinnitetyt uutiset\n• Reaaliaikainen laitetila ('Juuri nyt')\n• Pikavaraus ('Varaa heti')\n• Päivän kuormitusmittari"]
        T2["📅 'calendar' -> ReservationCalendar.tsx\n• Interaktiivinen Drag-to-Select aikamatriisi\n• Yksittäisvaraus / Tilavaraus / SuperAdmin Jyräys\n• Päivän varauskortit & peruutus"]
        T3["🎮 'games' -> GamesCatalog.tsx\n• Alustasuodatin (Kaikki, PC, PS5, Switch, Toiveet)\n• Pelin ehdotuslomake & +1 äänestys"]
        T4["📋 'my-reservations' -> MyReservations.tsx\n• Käyttäjän omat tulevat & menneet varaukset\n• Peruutuspainike vahvistuksella"]
        T5["🛡️ 'admin' -> AdminPanel.tsx\n1. Pelit & Toivelista ('games')\n2. Uutiset & Tiedotteet ('news')\n3. Käyttäjät, Roolit & Bannaus ('users')\n4. Asetukset, Kiintiöt, Laitehuolto & Varaukset ('settings')\n5. Tilastot & Käyttöaste ('statistics')\n6. Vikailmoitukset ('issues')"]
    end

    subgraph Modals ["Globaalit Modaalit"]
        M1["🔐 LoginModal.tsx\n(OTP-kirjautuminen & pika-tunnukset)"]
        M2["🗺️ FloorPlanModal.tsx\n(Interaktiivinen pohjapiirros 8 laitteesta)"]
        M3["🐛 BugReportModal.tsx\n(Vikailmoituslomake)"]
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
| `['available-stations', start, end]` | `api.getAvailableStations(s, e)` | `ReservationForm`, `FloorPlanModal` | Varauksen luonti/peruutus/jyräys, asetusten tai laitetilan muutos |
| `['available-now']` | `api.getAvailableStations(now, +30m)` | `StationList` (Etusivun live-tila) | Varauksen luonti/peruutus/jyräys, asetusten tai laitetilan muutos |
| `['reservations', start, end]` | `api.getActiveReservations(s, e)` | `ReservationCalendar`, `StationList` | Varauksen luonti, peruutus tai SuperAdmin-jyräys |
| `['reservations-day', dayStart, dayEnd]` | `api.getActiveReservations(s, e)` | `ReservationCalendar`, `StationList` | Varauksen luonti, peruutus tai SuperAdmin-jyräys |
| `['admin-reservations']` | `api.getActiveReservations(-2h, +14d)` | `AdminPanel` (`settings`) | Adminin varauksen peruutus (`adminCancelReservationMutation`) |
| `['user-reservations', userId, page]` | `api.getUserReservations(...)` | `MyReservations` | Varauksen luonti tai peruutus |
| `['games']` | `api.getGames()` | `GamesCatalog`, `AdminPanel` | Pelin lisäys, toiveen ehdotus, äänestys, hyväksyntä tai poisto |
| `['news']` | `api.getNews()` | `StationList`, `AdminPanel` | Tiedotteen julkaisu tai poisto |
| `['users']` | `api.getAllUsers(adminId)` | `AdminPanel` (`users`) | Roolin muutos (`updateUserRoleMutation`) tai bannaus (`updateUserBanMutation`) |
| `['settings']` | `api.getSettings()` | `AdminPanel` (`settings`) | Asetusten ja varauskiintiöiden tallennus (`updateSettingsMutation`) |
| `['statistics']` | `api.getStatistics()` | `AdminPanel` (`statistics`) | Pelin tilan vaihto, varauksen peruutus + 10 s automaattipäivitys |
| `['issues']` | `api.getIssueReports(adminId)` | `AdminPanel` (`issues`) | Vikailmoituksen lähetys tai ratkaistuksi kuittaaminen + 10 s automaattipäivitys |
