# Rajapinnat ja tietosopimukset (rajapinnat.md)

Tämä dokumentti määrittelee Pelihuonevaraus (Xamk Game Room) -järjestelmän kaikki ulkoiset REST HTTP -rajapinnat (Endpoints), jaetut tietosopimukset (`src/backend/Contracts`), sisäiset sovelluspalvelurajapinnat (`I*Service`), repositoriorajapinnat (`I*Repository`) sekä käyttöliittymän API-asiakkaan (`src/frontend/src/api/client.ts`).

---

## 1. Yleiset HTTP REST API -käytännöt

- Perusosoite kehityksessä: `http://localhost:5134/api` (Vite-kehityspalvelin välittää `/api`-kutsut automaattisesti välityspalvelimella osoitteesta `http://localhost:5173`).
- Sisältötyyppi: `application/json` (virhevastauksissa `application/problem+json` RFC 9457 -standardin mukaisesti).
- Tunnistautumis- ja valtuutusotsake: `X-User-Id: <Guid>`, välitetään ylläpitäjän (`Admin` ja `SuperAdmin`) operaatioissa sekä käyttäjäkohtaisissa pyynnöissä.
- Idempotenssiotsake: `Idempotency-Key: <Guid>`, tuettu `POST /api/reservations`-varauspyynnöissä estämään kaksoisvaraukset verkon pätkiessä.

### 1.1 Roolit ja rajapintojen lupatasot

Jokainen REST-päätepiste ja palvelumetodi noudattaa yhtä seuraavista viidestä valtuutustasosta:

| Lupataso | Vaadittu otsake tai tila | Kuvaus ja sallitut kutsujat | Virhekoodi puuttuessa |
| :--- | :--- | :--- | :--- |
| **1. Julkinen (`Public`)** | Ei vaadita | Lukuoperaatiot (`GET /api/stations`, `GET /api/reservations`, `GET /api/games`, `GET /api/news`, `/health/*`), OTP-kirjautuminen sekä vikailmoituksen jättö (`POST /api/issues`). | Ei virhettä |
| **2. Aktiivinen käyttäjä (`Authenticated User`)** | Kirjautunut `userId` (`!user.IsBanned(nowUtc)`) | Uuden varauksen luonti (`POST /api/reservations`), omien varausten haku ja peruutus, pelitoiveiden lisäys ja äänestys. Jos käyttäjällä on voimassa oleva käyttöesto, kutsu estetään. | `401 Unauthorized` tai `403 Forbidden (User.Banned)` |
| **3. Omistaja tai Admin (`Owner or Admin`)** | `request.UserId == reservation.UserId` TAI `user.IsAdmin` | Varauksen peruutus (`DELETE /api/reservations/{id}`). Opiskelija voi perua vain oman varauksensa; `Admin` ja `SuperAdmin` voivat perua minkä tahansa varauksen. | `403 Forbidden (Reservation.Forbidden)` |
| **4. Ylläpitäjä (`Admin` ja `SuperAdmin`)** | `X-User-Id: <Guid>` (`Role` on `Admin` tai `SuperAdmin`) | Pelien ja toivelistan ylläpito, tiedotteiden julkaisu ja poisto, varauskiintiöiden ja huoltotilan muokkaus (`PUT /api/settings`), laitekohtainen huoltotila (`PUT /api/stations/{id}/status`), vikailmoitusten kuittaus, käyttäjälistaus (`GET /api/users`) ja käyttäjien käyttöestot (`PUT /api/users/{id}/ban`). | `401 Unauthorized` tai `403 Forbidden` |
| **5. Pääkäyttäjä (`SuperAdmin Only`)** | `X-User-Id: <Guid>` (`Role == "SuperAdmin"`) | Käyttäjien roolien muuttaminen (`PUT /api/users/{id}/role`), päällekkäisten opiskelijavarausten jyrääminen (`POST /api/reservations/override`) sekä aukioloaikojen ohitus (`allowAnytime = true`). | `403 Forbidden` |

### Standardoidut virhevastaukset (ProblemDetails, RFC 9457)

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

## 2. REST API -päätepisteet ja tietosopimukset

### 2.1 Autentikointi ja käyttäjähallinta (`/api/auth` ja `/api/users`)
Määritelty tiedostossa [`src/backend/WebApi/Endpoints/AuthEndpoints.cs`](../src/backend/WebApi/Endpoints/AuthEndpoints.cs) ja sopimukset tiedostossa [`src/backend/Contracts/Users/UserContracts.cs`](../src/backend/Contracts/Users/UserContracts.cs).

#### `POST /api/auth/send-code`
Lähettää 6-numeroisen kertakäyttöisen vahvistuskoodin (OTP, voimassa 15 min) koulusähköpostiin (`@edu.xamk.fi` tai `@xamk.fi`). Rajoitus: `AuthPolicy` (5 pyyntöä minuutissa per IP).
- Request (`SendVerificationCodeRequest`):
  ```json
  { "email": "opiskelija@edu.xamk.fi" }
  ```
- Response (`200 OK`):
  ```json
  { "message": "Vahvistuskoodi lähetetty sähköpostiin.", "devCode": "482910" }
  ```

#### `POST /api/auth/verify-code`
Varmistaa 6-numeroisen vahvistuskoodin, tarkistaa mahdollisen käyttöeston ja kirjaa käyttäjän sisään tai luo uuden käyttäjän.
- Request (`VerifyCodeRequest`):
  ```json
  {
    "email": "opiskelija@edu.xamk.fi",
    "code": "123456",
    "displayName": "Matti Meikäläinen"
  }
  ```
- Response (`200 OK`, `UserResponse`):
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
- Virhevastaukset: `400 Bad Request` (`Auth.InvalidCode` tai `User.InvalidEmail`), `403 Forbidden` (`User.Banned`, jos käyttäjä on asetettu käyttöestoon).

#### `POST /api/auth/login`
Suora sisäänkirjautuminen koulusähköpostilla ja valinnaisella näyttönimellä. Tarkistaa myös käyttäjän mahdollisen käyttöeston.
- Request (`LoginRequest`): `{ "email": "admin@xamk.fi", "displayName": "Pelihuone Vastaava" }`
- Response (`200 OK`): `UserResponse`

#### `GET /api/users`
Palauttaa kaikki järjestelmän käyttäjät, heidän roolinsa sekä mahdollisen käyttöeston tilan.
- Vaadittu otsake: `X-User-Id` (`Admin` tai `SuperAdmin`)
- Response (`200 OK`): `IReadOnlyList<UserResponse>`

#### `GET /api/users/{id:guid}`
Palauttaa yksittäisen käyttäjän profiilitiedot.
- Response (`200 OK`): `UserResponse` (`404 Not Found`, jos käyttäjää ei löydy).

#### `PUT /api/users/{id:guid}/role`
Päivittää käyttäjän käyttöoikeusroolin (`User`, `Admin`, `SuperAdmin`).
- Vaadittu otsake: `X-User-Id` (vain `SuperAdmin`)
- Request (`UpdateUserRoleRequest`): `{ "role": "Admin" }`
- Response (`200 OK`): `UserResponse`

#### `PUT /api/users/{id:guid}/ban`
Asettaa käyttäjälle määräaikaisen tai pysyvän käyttöeston valitulla tuntimäärällä ja syyllä, tai poistaa voimassa olevan eston (`durationHours <= 0` tai `null` kun `isPermanent: false`). Pääkäyttäjää (`SuperAdmin`) ei voi asettaa käyttöestoon.
- Vaadittu otsake: `X-User-Id` (`Admin` tai `SuperAdmin`)
- Request (`BanUserRequest`):
  ```json
  {
    "durationHours": 72,
    "reason": "Sääntörikkomus pelitilassa",
    "isPermanent": false
  }
  ```
- Response (`200 OK`): `UserResponse`

---

## 2.2 Pelipisteet ja laitetila (`/api/stations`)
Määritelty tiedostossa [`src/backend/WebApi/Endpoints/StationEndpoints.cs`](../src/backend/WebApi/Endpoints/StationEndpoints.cs) ja sopimukset tiedostossa [`src/backend/Contracts/GamingStations/GamingStationResponse.cs`](../src/backend/Contracts/GamingStations/GamingStationResponse.cs).

| Metodi ja polku | Kuvaus | Kyselyparametrit tai runko | Vastaus (`200 OK`) |
| :--- | :--- | :--- | :--- |
| `GET /api/stations` | Hakee kaikki aktiiviset (`IsActive = true`) pelipisteet. | Ei parametreja | `IReadOnlyList<GamingStationResponse>` |
| `GET /api/stations/admin` | Hakee kaikki 8 pelipistettä mukaan lukien huoltotilassa olevat. | Ei parametreja | `IReadOnlyList<GamingStationResponse>` |
| `GET /api/stations/available` | Hakee valitulla aikavälillä vapaana olevat pelipisteet (huomioi tilavaraukset, laitehuollon ja jaetun TV:n). | `?startUtc=<ISO>&endUtc=<ISO>` | `IReadOnlyList<GamingStationResponse>` |
| `PUT /api/stations/{id:guid}/status` | Asettaa pelipisteen käyttöön (`true`) tai huoltotilaan (`false`). Vaatii otsakkeen `X-User-Id` (`Admin` tai `SuperAdmin`). | `UpdateGamingStationStatusRequest`: `{ "isActive": false }` | `GamingStationResponse` |

`GamingStationResponse`-rakenne:
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

## 2.3 Varaukset ja pääkäyttäjän jyräys (`/api/reservations`)
Määritelty tiedostossa [`src/backend/WebApi/Endpoints/ReservationEndpoints.cs`](../src/backend/WebApi/Endpoints/ReservationEndpoints.cs) ja sopimukset tiedostoissa [`CreateReservationRequest.cs`](../src/backend/Contracts/Reservations/CreateReservationRequest.cs), [`CancelReservationRequest.cs`](../src/backend/Contracts/Reservations/CancelReservationRequest.cs), [`OverrideReservationRequest.cs`](../src/backend/Contracts/Reservations/OverrideReservationRequest.cs) ja [`ReservationResponse.cs`](../src/backend/Contracts/Reservations/ReservationResponse.cs).

#### `POST /api/reservations`
Luo uuden laite-, tila- tai tapahtumavarauksen. Rajoitus: `ReservationPolicy` (10 pyyntöä minuutissa per IP).
- Valinnainen otsake: `Idempotency-Key: <Guid>`
- Request (`CreateReservationRequest`):
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
  *(Varaustyypit: `1` = Individual, `2` = Room, `3` = Event)*
- Response (`201 Created`, `ReservationResponse`):
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
Pääkäyttäjän toiminto: peruuttaa kaikki aikavälille osuvat opiskelijavaraukset annetulla syyllä ja luo tilalle uuden tapahtuma- tai tilavarauksen.
- Request (`OverrideReservationRequest`):
  ```json
  {
    "reservationRequest": { ...CreateReservationRequest },
    "reason": "Xamk CS2 LAN -turnaus"
  }
  ```
- Response (`201 Created`): `ReservationResponse`

#### `DELETE /api/reservations/{id:guid}`
Peruuttaa aktiivisen varauksen. Sallittu varauksen omistajalle sekä `Admin`- ja `SuperAdmin`-käyttäjille.
- Request (`CancelReservationRequest`): `{ "userId": "<Guid>", "reason": "Este" }`
- Response: `204 No Content`

#### `GET /api/reservations`
Palauttaa aikavälin aktiiviset varaukset kalenteria ja tilanäkymää varten.
- Kyselyparametrit: `?startUtc=<ISO>&endUtc=<ISO>&stationId=<Guid (valinnainen)>`
- Response (`200 OK`): `IReadOnlyList<ReservationResponse>`

#### `GET /api/users/{userId:guid}/reservations`
Palauttaa käyttäjän omat varaukset sivutettuna.
- Kyselyparametrit: `?page=1&pageSize=20`
- Response (`200 OK`): `PagedResult<ReservationResponse>` (`items`, `page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`).

---

## 2.4 Pelivalikoima ja toivelista (`/api/games`)
Määritelty tiedostossa [`src/backend/WebApi/Endpoints/GameEndpoints.cs`](../src/backend/WebApi/Endpoints/GameEndpoints.cs) ja sopimukset tiedostossa [`src/backend/Contracts/Games/GameContracts.cs`](../src/backend/Contracts/Games/GameContracts.cs).

| Metodi ja polku | Suojaus | Request DTO | Response DTO | Kuvaus |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/games` | Julkinen | `?platform=PC&isWishlist=false` | `IReadOnlyList<GameResponse>` | Hakee pelikatalogin tai toivelistan pelit. |
| `POST /api/games` | `X-User-Id` (`Admin` tai `SuperAdmin`) | `CreateGameRequest` | `GameResponse` (`201`) | Lisää uuden pelin asennettuun valikoimaan. |
| `POST /api/games/wishlist` | Kirjautunut | `WishGameRequest` | `GameResponse` (`201`) | Lisää opiskelijan pelitoiveen toivelistalle (1 ääni). |
| `POST /api/games/{id:guid}/upvote` | Kirjautunut | Ei runkoa | `GameResponse` (`200`) | Kasvattaa toivelistapelin äänimäärää (`VotesCount + 1`). |
| `PUT /api/games/{id:guid}/toggle-wishlist` | `X-User-Id` (`Admin` tai `SuperAdmin`) | Ei runkoa | `GameResponse` (`200`) | Siirtää pelin toivelistalta asennetuksi tai päinvastoin. |
| `DELETE /api/games/{id:guid}` | `X-User-Id` (`Admin` tai `SuperAdmin`) | Ei runkoa | `204 No Content` | Poistaa pelin tai pelitoiveen. |

---

## 2.5 Uutiset ja tiedotteet (`/api/news`)
Määritelty tiedostossa [`src/backend/WebApi/Endpoints/NewsEndpoints.cs`](../src/backend/WebApi/Endpoints/NewsEndpoints.cs) ja sopimukset tiedostossa [`src/backend/Contracts/News/NewsContracts.cs`](../src/backend/Contracts/News/NewsContracts.cs).

- `GET /api/news` palauttaa `IReadOnlyList<NewsResponse>` (kiinnitetyt `isPinned: true` ensin, sitten uusimmat).
- `POST /api/news` (`X-User-Id`: `Admin` tai `SuperAdmin`, runko `CreateNewsRequest`: `{ title, content, isPinned }`) palauttaa `NewsResponse` (`201 Created`).
- `DELETE /api/news/{id:guid}` (`X-User-Id`: `Admin` tai `SuperAdmin`) palauttaa `204 No Content`.

---

## 2.6 Sivustoasetukset ja varauskiintiöt (`/api/settings`)
Määritelty tiedostossa [`src/backend/WebApi/Endpoints/SettingsEndpoints.cs`](../src/backend/WebApi/Endpoints/SettingsEndpoints.cs) ja sopimukset tiedostossa [`src/backend/Contracts/Settings/SiteSettingsContracts.cs`](../src/backend/Contracts/Settings/SiteSettingsContracts.cs).

- `GET /api/settings` palauttaa `SiteSettingsResponse`
- `PUT /api/settings` (`X-User-Id`: `Admin` tai `SuperAdmin`, runko `UpdateSiteSettingsRequest`) palauttaa `SiteSettingsResponse`

`SiteSettingsResponse`-kentät:
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

## 2.7 Käyttötilastot ja vikailmoitukset (`/api/statistics` ja `/api/issues`)
- `GET /api/statistics` ([`StatisticsEndpoints.cs`](../src/backend/WebApi/Endpoints/StatisticsEndpoints.cs)): palauttaa `StatisticsResponse`-olion: `TotalUsers`, `ActiveReservationsCount`, `TotalReservedHoursThisMonth`, `InstalledGamesCount`, `WishlistGamesCount`, `StationUtilizations`.
- `POST /api/issues` ([`IssueEndpoints.cs`](../src/backend/WebApi/Endpoints/IssueEndpoints.cs)): runko `CreateIssueReportRequest`: `{ reporterEmail, reporterName, target, title, description }`, palauttaa `IssueReportResponse` (`201 Created`).
- `GET /api/issues` (`X-User-Id`: `Admin` tai `SuperAdmin`): palauttaa `IReadOnlyList<IssueReportResponse>`.
- `PUT /api/issues/{id:guid}/resolve` (`X-User-Id`: `Admin` tai `SuperAdmin`): runko `ResolveIssueReportRequest`: `{ adminNotes }`, merkitsee vikailmoituksen ratkaistuksi (`IsResolved = true`).

---

## 3. Sisäiset sovellus- ja repositoriorajapinnat (`src/backend/Application`)

### 3.1 Sovelluspalvelurajapinnat (`I*Service`)

| Rajapinta | Toteuttava luokka | Metodeja |
| :--- | :--- | :--- |
| [`IReservationService`](../src/backend/Application/Reservations/IReservationService.cs) | [`ReservationService`](../src/backend/Application/Reservations/ReservationService.cs) | `CreateReservationAsync`, `CreateAdminOverrideReservationAsync`, `CancelReservationAsync`, `GetReservationByIdAsync`, `GetUserReservationsAsync`, `GetActiveReservationsAsync` |
| [`IUserService`](../src/backend/Application/Users/IUserService.cs) | [`UserService`](../src/backend/Application/Users/UserService.cs) | `AuthenticateOrCreateUserAsync`, `GetUserByIdAsync`, `GetAllUsersAsync`, `UpdateUserRoleAsync`, `UpdateUserBanAsync`, `SendVerificationCodeAsync`, `VerifyCodeAndLoginAsync` |
| [`IGamingStationService`](../src/backend/Application/GamingStations/IGamingStationService.cs) | [`GamingStationService`](../src/backend/Application/GamingStations/GamingStationService.cs) | `GetActiveStationsAsync`, `GetAllStationsForAdminAsync`, `GetAvailableStationsAsync`, `UpdateStationStatusAsync` |
| [`IGameService`](../src/backend/Application/Games/IGameService.cs) | [`GameService`](../src/backend/Application/Games/GameService.cs) | `GetGamesAsync`, `CreateGameAsync`, `SuggestGameToWishlistAsync`, `UpvoteWishlistGameAsync`, `ToggleWishlistStatusAsync`, `DeleteGameAsync` |
| [`INewsService`](../src/backend/Application/News/INewsService.cs) | [`NewsService`](../src/backend/Application/News/NewsService.cs) | `GetAllNewsAsync`, `CreateNewsAsync`, `DeleteNewsAsync` |
| [`ISettingsService`](../src/backend/Application/Settings/ISettingsService.cs) | [`SettingsService`](../src/backend/Application/Settings/SettingsService.cs) | `GetSettingsAsync`, `UpdateSettingsAsync` |
| [`IStatisticsService`](../src/backend/Application/Statistics/IStatisticsService.cs) | [`StatisticsService`](../src/backend/Application/Statistics/StatisticsService.cs) | `GetStatisticsAsync` |
| [`IIssueReportService`](../src/backend/Application/Issues/IIssueReportService.cs) | [`IssueReportService`](../src/backend/Application/Issues/IssueReportService.cs) | `CreateReportAsync`, `GetAllReportsAsync`, `ResolveReportAsync` |
| [`IDiscordNotificationService`](../src/backend/Application/Notifications/IDiscordNotificationService.cs) | [`DiscordNotificationService`](../src/backend/Application/Notifications/DiscordNotificationService.cs) | `SendReservationCreatedAsync`, `SendReservationOverriddenAsync` |
| [`IErrorNotificationService`](../src/backend/Application/Notifications/IErrorNotificationService.cs) | [`ErrorNotificationService`](../src/backend/Application/Notifications/ErrorNotificationService.cs) | `SendErrorAlertAsync(exception, path, traceId)` |
| [`IEmailSender`](../src/backend/Application/Notifications/IEmailSender.cs) | [`SmtpEmailSender`](../src/backend/Infrastructure/Services/Email/SmtpEmailSender.cs) | `SendEmailAsync(recipients, subject, body, isHtml)` |

### 3.2 Repositorio- ja infrastruktuuriabstraktiot (`src/backend/Application/Abstractions`)

| Rajapinta | Toteuttava luokka (`src/backend/Infrastructure`) | Keskeiset metodit |
| :--- | :--- | :--- |
| [`IReservationRepository`](../src/backend/Application/Abstractions/Repositories/IReservationRepository.cs) | [`ReservationRepository`](../src/backend/Infrastructure/Repositories/ReservationRepository.cs) | `GetByIdAsync`, `GetOverlappingReservationsAsync`, `GetActiveReservationsInWindowAsync`, `GetUserReservationsForDayAsync`, `GetPagedByUserIdAsync`, `GetAllActiveAsync`, `AddAsync`, `UpdateAsync` |
| [`IGamingStationRepository`](../src/backend/Application/Abstractions/Repositories/IGamingStationRepository.cs) | [`GamingStationRepository`](../src/backend/Infrastructure/Repositories/GamingStationRepository.cs) | `GetByIdAsync`, `GetAllActiveAsync`, `GetAllAsync`, `GetSharedTvStationsAsync`, `AddAsync`, `UpdateAsync` |
| [`IUserRepository`](../src/backend/Application/Abstractions/Repositories/IUserRepository.cs) | [`UserRepository`](../src/backend/Infrastructure/Repositories/UserRepository.cs) | `GetByIdAsync`, `GetByEmailAsync`, `GetAllAsync`, `AddAsync`, `UpdateAsync` |
| [`IGameRoomRepository`](../src/backend/Application/Abstractions/Repositories/IGameRoomRepository.cs) | [`GameRoomRepository`](../src/backend/Infrastructure/Repositories/GameRoomRepository.cs) | `GetDefaultRoomAsync`, `GetByIdAsync`, `AddAsync` |
| [`IGameRepository`](../src/backend/Application/Abstractions/Repositories/IGameRepository.cs) | [`GameRepository`](../src/backend/Infrastructure/Repositories/GameRepository.cs) | `GetByIdAsync`, `GetAllAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync` |
| [`INewsRepository`](../src/backend/Application/Abstractions/Repositories/INewsRepository.cs) | [`NewsRepository`](../src/backend/Infrastructure/Repositories/NewsRepository.cs) | `GetByIdAsync`, `GetAllOrderedAsync`, `AddAsync`, `DeleteAsync` |
| [`IIssueReportRepository`](../src/backend/Application/Abstractions/Repositories/IIssueReportRepository.cs) | [`IssueReportRepository`](../src/backend/Infrastructure/Repositories/IssueReportRepository.cs) | `GetByIdAsync`, `GetAllOrderedAsync`, `AddAsync`, `UpdateAsync` |
| [`IUnitOfWork`](../src/backend/Application/Abstractions/Data/IUnitOfWork.cs) | [`ApplicationDbContext`](../src/backend/Infrastructure/Persistence/ApplicationDbContext.cs) | `SaveChangesAsync(CancellationToken)` |
| [`IDateTimeProvider`](../src/backend/Application/Abstractions/Time/IDateTimeProvider.cs) | [`SystemDateTimeProvider`](../src/backend/Infrastructure/Services/SystemDateTimeProvider.cs) | `UtcNow` |
