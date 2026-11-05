# 🔌 Rajapinnat ja Tietosopimukset (`rajapinnat.md`)

Tämä dokumentti määrittelee **Pelihuonevaraus (Xamk Game Room)** -järjestelmän kaikki ulkoiset **REST HTTP -rajapinnat (Endpoints)**, jaetut **tietosopimukset (`src/Contracts`)**, sisäiset **sovelluspalvelurajapinnat (`I*Service`)**, **repositoriorajapinnat (`I*Repository`)** sekä **käyttöliittymän API-asiakkaan (`src/Client/src/api/client.ts`)**.

---

## 1. Yleiset HTTP REST API -käytännöt

- **Perusosoite (Kehitys):** `http://localhost:5134/api` (Vite-kehityspalvelin välittää `/api`-kutsut automaattisesti proxylla osoitteesta `http://localhost:5173`).
- **Sisältötyyppi:** `application/json` (virhevastauksissa `application/problem+json` RFC 9457 -standardin mukaisesti).
- **Tunnistautumis- ja valtuutusotsake:**
  - `X-User-Id: <Guid>` — välitetään ylläpitäjän (`Admin` ja `SuperAdmin`) operaatioissa sekä käyttäjäkohtaisissa pyynnöissä.
- **Idempotenssiotsake:**
  - `Idempotency-Key: <Guid>` — tuettu `POST /api/reservations`-varauspyynnöissä estämään mobiiliverkon pätkimisestä tai tuplaklikkauksesta johtuvat kaksoisvaraukset.

### Standardoidut virhevastaukset (`ProblemDetails` — RFC 9457)

Kaikki epäonnistuneet API-kutsut palauttavat rakenteisen JSON-virheen:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Reservation.SharedTvConflict",
  "status": 409,
  "detail": "Jaettu TV on jo varattu kyseisenä aikana toiselle konsolille.",
  "instance": "/api/reservations"
}
```

---

## 2. REST API -päätepisteet ja Tietosopimukset (Endpoints & DTOs)

### 2.1 Autentikointi & Käyttäjähallinta (`/api/auth` & `/api/users`)
Määritelty tiedostossa [`src/WebApi/Endpoints/AuthEndpoints.cs`](../src/WebApi/Endpoints/AuthEndpoints.cs) ja sopimukset tiedostossa [`src/Contracts/Users/UserContracts.cs`](../src/Contracts/Users/UserContracts.cs).

#### `POST /api/auth/send-code`
Lähettää 6-numeroisen kertakäyttöisen vahvistuskoodin (OTP, voimassa 15 min) koulusähköpostiin (`@edu.xamk.fi` tai `@xamk.fi`). Rate limit: `AuthPolicy` (5 pyyntöä / min / IP).
- **Request (`SendVerificationCodeRequest`):**
  ```json
  { "email": "opiskelija@edu.xamk.fi" }
  ```
- **Response (`200 OK`):**
  ```json
  { "message": "Vahvistuskoodi lähetetty sähköpostiin.", "devCode": "482910" }
  ```

#### `POST /api/auth/verify-code`
Varmistaa 6-numeroisen vahvistuskoodin, tarkistaa mahdollisen käyttöeston (bannin) ja kirjaa käyttäjän sisään (tai luo uuden käyttäjän).
- **Request (`VerifyCodeRequest`):**
  ```json
  {
    "email": "opiskelija@edu.xamk.fi",
    "code": "123456",
    "displayName": "Matti Meikäläinen"
  }
  ```
- **Response (`200 OK` — `UserResponse`):**
  ```json
  {
    "id": "b5a1c2d3-e4f5-6789-abcd-ef0123456789",
    "email": "opiskelija@edu.xamk.fi",
    "displayName": "Matti Meikäläinen",
    "role": "User",
    "bannedUntilUtc": null,
    "banReason": null,
    "isBanned": false
  }
  ```
- **Virhevastaukset:** `400 Bad Request` (`Auth.InvalidCode` / `User.InvalidEmail`), `403 Forbidden` (`User.Banned` — jos käyttäjä on bannattu).

#### `POST /api/auth/login`
Suora sisäänkirjautuminen koulusähköpostilla ja valinnaisella näyttönimellä. Tarkistaa myös käyttäjän mahdollisen bannin.
- **Request (`LoginRequest`):** `{ "email": "admin@xamk.fi", "displayName": "Pelihuone Vastaava" }`
- **Response (`200 OK`):** `UserResponse`

#### `GET /api/users`
Palauttaa kaikki järjestelmän käyttäjät, heidän roolinsa sekä mahdollisen käyttöeston (bannin) tilan.
- **Vaadittu otsake:** `X-User-Id` (`Admin` tai `SuperAdmin`)
- **Response (`200 OK`):** `IReadOnlyList<UserResponse>`

#### `GET /api/users/{id:guid}`
Palauttaa yksittäisen käyttäjän profiilitiedot.
- **Response (`200 OK`):** `UserResponse` (`404 Not Found`, jos käyttäjää ei löydy).

#### `PUT /api/users/{id:guid}/role`
Päivittää käyttäjän käyttöoikeusroolin (`User`, `Admin`, `SuperAdmin`).
- **Vaadittu otsake:** `X-User-Id` (vain `SuperAdmin`)
- **Request (`UpdateUserRoleRequest`):** `{ "role": "Admin" }`
- **Response (`200 OK`):** `UserResponse`

#### `PUT /api/users/{id:guid}/ban`
Asettaa käyttäjälle määräaikaisen tai pysyvän käyttöeston (bannin / porttikiellon) valitulla tuntimäärällä ja syyllä, tai poistaa voimassa olevan eston (`durationHours <= 0` tai `null` kun `isPermanent: false`). Pääkäyttäjää (`SuperAdmin`) ei voi bannata.
- **Vaadittu otsake:** `X-User-Id` (`Admin` tai `SuperAdmin`)
- **Request (`BanUserRequest`):**
  ```json
  {
    "durationHours": 72,
    "reason": "Sääntörikkomus pelitilassa",
    "isPermanent": false
  }
  ```
- **Response (`200 OK`):** `UserResponse`

---

### 2.2 Pelipisteet & Laitetila (`/api/stations`)
Määritelty tiedostossa [`src/WebApi/Endpoints/StationEndpoints.cs`](../src/WebApi/Endpoints/StationEndpoints.cs) ja sopimukset tiedostossa [`src/Contracts/GamingStations/GamingStationResponse.cs`](../src/Contracts/GamingStations/GamingStationResponse.cs).

| Metodi & Polku | Kuvaus | Kyselyparametrit / Runko | Vastaus (`200 OK`) |
| :--- | :--- | :--- | :--- |
| `GET /api/stations` | Hakee kaikki aktiiviset (`IsActive = true`) pelipisteet. | — | `IReadOnlyList<GamingStationResponse>` |
| `GET /api/stations/admin` | Hakee kaikki 8 pelipistettä mukaan lukien huoltotilassa olevat. | — | `IReadOnlyList<GamingStationResponse>` |
| `GET /api/stations/available` | Hakee valitulla aikavälillä vapaana olevat pelipisteet (huomioi tilavaraukset, laitehuollon ja jaetun TV:n). | `?startUtc=<ISO>&endUtc=<ISO>` | `IReadOnlyList<GamingStationResponse>` |
| `PUT /api/stations/{id:guid}/status` | Asettaa pelipisteen käyttöön (`true`) tai huoltotilaan (`false`). Vaatii `X-User-Id` (`Admin`/`SuperAdmin`). | `UpdateGamingStationStatusRequest`: `{ "isActive": false }` | `GamingStationResponse` |

**`GamingStationResponse`-rakenne:**
```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "name": "PlayStation 5",
  "stationCode": "PS5-01",
  "type": "PlayStation5",
  "usesSharedTv": true,
  "isActive": true
}
```

---

### 2.3 Varaukset & SuperAdmin-jyräys (`/api/reservations`)
Määritelty tiedostossa [`src/WebApi/Endpoints/ReservationEndpoints.cs`](../src/WebApi/Endpoints/ReservationEndpoints.cs) ja sopimukset tiedostoissa [`CreateReservationRequest.cs`](../src/Contracts/Reservations/CreateReservationRequest.cs), [`CancelReservationRequest.cs`](../src/Contracts/Reservations/CancelReservationRequest.cs), [`OverrideReservationRequest.cs`](../src/Contracts/Reservations/OverrideReservationRequest.cs) ja [`ReservationResponse.cs`](../src/Contracts/Reservations/ReservationResponse.cs).

#### `POST /api/reservations`
Luo uuden laite-, tila- tai tapahtumavarauksen. Rate limit: `ReservationPolicy` (10 pyyntöä / min / IP).
- **Valinnainen otsake:** `Idempotency-Key: <Guid>`
- **Request (`CreateReservationRequest`):**
  ```json
  {
    "idempotencyKey": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userId": "b5a1c2d3-e4f5-6789-abcd-ef0123456789",
    "reservationType": 1,
    "gamingStationId": "11111111-1111-1111-1111-111111111111",
    "startUtc": "2026-11-06T10:00:00.000Z",
    "endUtc": "2026-11-06T12:00:00.000Z"
  }
  ```
  *(Huom: `reservationType`: `1` = Individual, `2` = Room, `3` = Event)*
- **Response (`201 Created` — `ReservationResponse`):**
  ```json
  {
    "id": "99999999-8888-7777-6666-555555555555",
    "userId": "b5a1c2d3-e4f5-6789-abcd-ef0123456789",
    "reservationType": "Individual",
    "gamingStationId": "11111111-1111-1111-1111-111111111111",
    "gameRoomId": null,
    "startUtc": "2026-11-06T10:00:00+00:00",
    "endUtc": "2026-11-06T12:00:00+00:00",
    "durationMinutes": 120.0,
    "status": "Active",
    "createdAtUtc": "2026-11-05T10:15:00+00:00",
    "cancellationReason": null,
    "bookerName": null,
    "bookerEmail": null
  }
  ```

#### `POST /api/reservations/override`
SuperAdmin-toiminto: peruuttaa kaikki aikavälille osuvat opiskelijavaraukset annetulla syyllä ja luo tilalle uuden tapahtuma-/tilavarauksen.
- **Request (`OverrideReservationRequest`):**
  ```json
  {
    "reservationRequest": { ...CreateReservationRequest },
    "reason": "Xamk CS2 LAN -turnaus"
  }
  ```
- **Response (`201 Created`):** `ReservationResponse`

#### `DELETE /api/reservations/{id:guid}`
Peruuttaa aktiivisen varauksen. Sallittu varauksen omistajalle sekä `Admin`- ja `SuperAdmin`-käyttäjille.
- **Request (`CancelReservationRequest`):** `{ "userId": "<Guid>", "reason": "Este" }`
- **Response:** `204 No Content`

#### `GET /api/reservations`
Palauttaa aikavälin aktiiviset varaukset kalenteria ja tilanäkymää varten.
- **Kyselyparametrit:** `?startUtc=<ISO>&endUtc=<ISO>&stationId=<Guid (valinnainen)>`
- **Response (`200 OK`):** `IReadOnlyList<ReservationResponse>`

#### `GET /api/users/{userId:guid}/reservations`
Palauttaa käyttäjän omat varaukset sivutettuna.
- **Kyselyparametrit:** `?page=1&pageSize=20`
- **Response (`200 OK`):** `PagedResult<ReservationResponse>` (`items`, `page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`).

---

### 2.4 Pelivalikoima & Toivelista (`/api/games`)
Määritelty tiedostossa [`src/WebApi/Endpoints/GameEndpoints.cs`](../src/WebApi/Endpoints/GameEndpoints.cs) ja sopimukset tiedostossa [`src/Contracts/Games/GameContracts.cs`](../src/Contracts/Games/GameContracts.cs).

| Metodi & Polku | Suojaus | Request DTO | Response DTO | Kuvaus |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/games` | Julkinen | `?platform=PC&isWishlist=false` | `IReadOnlyList<GameResponse>` | Hakee pelikatalogin ja/tai toivelistan pelit. |
| `POST /api/games` | `X-User-Id` (`Admin`/`SuperAdmin`) | `CreateGameRequest` | `GameResponse` (`201`) | Lisää uuden pelin suoraan asennettuun valikoimaan. |
| `POST /api/games/wishlist` | Kirjautunut | `WishGameRequest` | `GameResponse` (`201`) | Lisää opiskelijan pelitoiveen toivelistalle (1 ääni). |
| `POST /api/games/{id:guid}/upvote` | Kirjautunut | — | `GameResponse` (`200`) | Kasvattaa toivelistapelin äänimäärää (`VotesCount + 1`). |
| `PUT /api/games/{id:guid}/toggle-wishlist` | `X-User-Id` (`Admin`/`SuperAdmin`) | — | `GameResponse` (`200`) | Siirtää pelin toivelistalta asennetuksi (tai päinvastoin). |
| `DELETE /api/games/{id:guid}` | `X-User-Id` (`Admin`/`SuperAdmin`) | — | `204 No Content` | Poistaa pelin tai pelitoiveen. |

---

### 2.5 Uutiset & Tiedotteet (`/api/news`)
Määritelty tiedostossa [`src/WebApi/Endpoints/NewsEndpoints.cs`](../src/WebApi/Endpoints/NewsEndpoints.cs) ja sopimukset tiedostossa [`src/Contracts/News/NewsContracts.cs`](../src/Contracts/News/NewsContracts.cs).

- `GET /api/news` → `IReadOnlyList<NewsResponse>` (kiinnitetyt `isPinned: true` ensin, sitten uusimmat).
- `POST /api/news` (`X-User-Id`: `Admin`/`SuperAdmin`, runko `CreateNewsRequest`: `{ title, content, isPinned }`) → `NewsResponse` (`201 Created`).
- `DELETE /api/news/{id:guid}` (`X-User-Id`: `Admin`/`SuperAdmin`) → `204 No Content`.

---

### 2.6 Sivustoasetukset & Varauskiintiöt (`/api/settings`)
Määritelty tiedostossa [`src/WebApi/Endpoints/SettingsEndpoints.cs`](../src/WebApi/Endpoints/SettingsEndpoints.cs) ja sopimukset tiedostossa [`src/Contracts/Settings/SiteSettingsContracts.cs`](../src/Contracts/Settings/SiteSettingsContracts.cs).

- `GET /api/settings` → `SiteSettingsResponse`
- `PUT /api/settings` (`X-User-Id`: `Admin`/`SuperAdmin`, runko `UpdateSiteSettingsRequest`) → `SiteSettingsResponse`

**`SiteSettingsResponse` / `UpdateSiteSettingsRequest` -kentät:**
```json
{
  "discordWebhookUrl": "https://discord.com/api/webhooks/...",
  "openTimeHour": 8,
  "closeTimeHour": 18,
  "onlyWeekdays": true,
  "maxAdvanceBookingMonths": 2,
  "maxIndividualHours": 4,
  "maxStudentRoomHours": 4,
  "minReservationMinutes": 30,
  "enforceSharedTvLock": true,
  "isMaintenanceMode": false,
  "maintenanceMessage": ""
}
```

---

### 2.7 Käyttötilastot (`/api/statistics`) & Vikailmoitukset (`/api/issues`)
- **`GET /api/statistics`** ([`StatisticsEndpoints.cs`](../src/WebApi/Endpoints/StatisticsEndpoints.cs), [`StatisticsContracts.cs`](../src/Contracts/Statistics/StatisticsContracts.cs)):
  - Palauttaa `StatisticsResponse`-olion: `TotalUsers`, `ActiveReservationsCount`, `TotalReservedHoursThisMonth`, `InstalledGamesCount`, `WishlistGamesCount`, `StationUtilizations` (`StationName`, `ReservationCount`, `TotalHours`).
- **`POST /api/issues`** ([`IssueEndpoints.cs`](../src/WebApi/Endpoints/IssueEndpoints.cs), [`IssueContracts.cs`](../src/Contracts/Issues/IssueContracts.cs)):
  - Runko `CreateIssueReportRequest`: `{ reporterEmail, reporterName, target, title, description }` → `IssueReportResponse` (`201 Created`).
- **`GET /api/issues`** (`X-User-Id`: `Admin`/`SuperAdmin`):
  - Palauttaa `IReadOnlyList<IssueReportResponse>`.
- **`PUT /api/issues/{id:guid}/resolve`** (`X-User-Id`: `Admin`/`SuperAdmin`):
  - Runko `ResolveIssueReportRequest`: `{ adminNotes }` → merkitsee vikailmoituksen ratkaistuksi (`IsResolved = true`).

---

## 3. Sisäiset Sovellus- ja Repositoriorajapinnat (`src/Application`)

### 3.1 Sovelluspalvelurajapinnat (`I*Service`)

| Rajapinta | Toteuttava luokka | Metodeja |
| :--- | :--- | :--- |
| [`IReservationService`](../src/Application/Reservations/IReservationService.cs) | [`ReservationService`](../src/Application/Reservations/ReservationService.cs) | `CreateReservationAsync`, `CreateAdminOverrideReservationAsync`, `CancelReservationAsync`, `GetReservationByIdAsync`, `GetUserReservationsAsync`, `GetActiveReservationsAsync` |
| [`IUserService`](../src/Application/Users/IUserService.cs) | [`UserService`](../src/Application/Users/UserService.cs) | `AuthenticateOrCreateUserAsync`, `GetUserByIdAsync`, `GetAllUsersAsync`, `UpdateUserRoleAsync`, `UpdateUserBanAsync`, `SendVerificationCodeAsync`, `VerifyCodeAndLoginAsync` |
| [`IGamingStationService`](../src/Application/GamingStations/IGamingStationService.cs) | [`GamingStationService`](../src/Application/GamingStations/GamingStationService.cs) | `GetActiveStationsAsync`, `GetAllStationsForAdminAsync`, `GetAvailableStationsAsync`, `UpdateStationStatusAsync` |
| [`IGameService`](../src/Application/Games/IGameService.cs) | [`GameService`](../src/Application/Games/GameService.cs) | `GetGamesAsync`, `CreateGameAsync`, `SuggestGameToWishlistAsync`, `UpvoteWishlistGameAsync`, `ToggleWishlistStatusAsync`, `DeleteGameAsync` |
| [`INewsService`](../src/Application/News/INewsService.cs) | [`NewsService`](../src/Application/News/NewsService.cs) | `GetAllNewsAsync`, `CreateNewsAsync`, `DeleteNewsAsync` |
| [`ISettingsService`](../src/Application/Settings/ISettingsService.cs) | [`SettingsService`](../src/Application/Settings/SettingsService.cs) | `GetSettingsAsync`, `UpdateSettingsAsync` |
| [`IStatisticsService`](../src/Application/Statistics/IStatisticsService.cs) | [`StatisticsService`](../src/Application/Statistics/StatisticsService.cs) | `GetStatisticsAsync` |
| [`IIssueReportService`](../src/Application/Issues/IIssueReportService.cs) | [`IssueReportService`](../src/Application/Issues/IssueReportService.cs) | `CreateReportAsync`, `GetAllReportsAsync`, `ResolveReportAsync` |
| [`IDiscordNotificationService`](../src/Application/Notifications/IDiscordNotificationService.cs) | [`DiscordNotificationService`](../src/Application/Notifications/DiscordNotificationService.cs) | `SendReservationCreatedAsync`, `SendReservationOverriddenAsync` |

### 3.2 Repositorio- ja Infrastruktuuriabstraktiot (`src/Application/Abstractions`)

| Rajapinta | Toteuttava luokka (`src/Infrastructure`) | Keskeiset metodit |
| :--- | :--- | :--- |
| [`IReservationRepository`](../src/Application/Abstractions/Repositories/IReservationRepository.cs) | [`ReservationRepository`](../src/Infrastructure/Repositories/ReservationRepository.cs) | `GetByIdAsync`, `GetOverlappingReservationsAsync`, `GetActiveReservationsInWindowAsync`, `GetUserReservationsForDayAsync`, `GetPagedByUserIdAsync`, `GetAllActiveAsync`, `AddAsync`, `UpdateAsync` |
| [`IGamingStationRepository`](../src/Application/Abstractions/Repositories/IGamingStationRepository.cs) | [`GamingStationRepository`](../src/Infrastructure/Repositories/GamingStationRepository.cs) | `GetByIdAsync`, `GetAllActiveAsync`, `GetAllAsync`, `GetSharedTvStationsAsync`, `AddAsync`, `UpdateAsync` |
| [`IUserRepository`](../src/Application/Abstractions/Repositories/IUserRepository.cs) | [`UserRepository`](../src/Infrastructure/Repositories/UserRepository.cs) | `GetByIdAsync`, `GetByEmailAsync`, `GetAllAsync`, `AddAsync`, `UpdateAsync` |
| [`IGameRoomRepository`](../src/Application/Abstractions/Repositories/IGameRoomRepository.cs) | [`GameRoomRepository`](../src/Infrastructure/Repositories/GameRoomRepository.cs) | `GetDefaultRoomAsync`, `GetByIdAsync`, `AddAsync` |
| [`IGameRepository`](../src/Application/Abstractions/Repositories/IGameRepository.cs) | [`GameRepository`](../src/Infrastructure/Repositories/GameRepository.cs) | `GetByIdAsync`, `GetAllAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync` |
| [`INewsRepository`](../src/Application/Abstractions/Repositories/INewsRepository.cs) | [`NewsRepository`](../src/Infrastructure/Repositories/NewsRepository.cs) | `GetByIdAsync`, `GetAllOrderedAsync`, `AddAsync`, `DeleteAsync` |
| [`IIssueReportRepository`](../src/Application/Abstractions/Repositories/IIssueReportRepository.cs) | [`IssueReportRepository`](../src/Infrastructure/Repositories/IssueReportRepository.cs) | `GetByIdAsync`, `GetAllOrderedAsync`, `AddAsync`, `UpdateAsync` |
| [`IUnitOfWork`](../src/Application/Abstractions/Data/IUnitOfWork.cs) | [`ApplicationDbContext`](../src/Infrastructure/Persistence/ApplicationDbContext.cs) | `SaveChangesAsync(CancellationToken)` |
| [`IDateTimeProvider`](../src/Application/Abstractions/Time/IDateTimeProvider.cs) | [`SystemDateTimeProvider`](../src/Infrastructure/Services/SystemDateTimeProvider.cs) | `UtcNow` |
