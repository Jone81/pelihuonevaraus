# ADR 0002, CQRS, MediatR, HybridCache ja SignalR -arkkitehtuuripäivitys

Tila: hyväksytty. Päivä: 2026-11-23.

## Tilanne

Pelihuonevaraus-järjestelmän sovelluskerros (`src/backend/Application`) on toteutettu palveluluokilla (`ReservationService`, `GamingStationService`, `GameService` jne.), joita `src/backend/WebApi`-päätepisteet kutsuvat suoraan. Järjestelmän kasvaessa ja hallintapaneelin laajentuessa on tarve:
1. Erottaa luku- (`Query`) ja kirjoituspolut (`Command`) selkeästi toisistaan (CQRS) ja keskittää poikkileikkaavat huolenaiheet (validointi, lokitus, välimuistitus) yhteen putkeen (MediatR).
2. Vähentää toistuvia tietokantahakuja hitaasti muuttuvissa kyselyissä (pelipisteet, pelikirjasto, tiedotteet, sivuston asetukset, tilastot) vaarantamatta reaaliaikaista varaus- ja `SharedTV`-tarkistusta.
3. Poistaa käyttöliittymän viiveellinen 10 sekunnin pollaus ja päivittää varauskalenteri, tilan tilannekuva sekä admin-paneelin vikailmoitus- ja varausnäkymät reaaliaikaisesti kaikille avoimille selaimille (SignalR).

## Vaihtoehdot

1. Jatketaan nykyisillä `I*Service`-palveluilla ilman MediatRia, lisätään manuaalinen `IMemoryCache` jokaiseen palveluun ja pidetään frontendin pollaus.
   - Haitta: validointi, lokitus ja välimuistin hallinta hajautuvat jokaiseen palveluluokkaan, ja reaaliaikaiset päivitykset viivästyvät.
2. Käytetään `MediatR 12.x` (Apache 2.0) CQRS-välittäjänä + pipeline-käyttäytymiset (`ValidationBehavior`, `LoggingBehavior`, `CachingBehavior`), .NET 10:n `HybridCache` `ICacheService`-abstraktion takana sekä ASP.NET Core SignalR -hubi (`/hubs/gameroom`) `IRealtimeNotifier`-abstraktion takana.
   - Hyöty: `Domain` pysyy 0-riippuvuuskerroksena, `Application` ei viittaa EF Coreen eikä ASP.NET Coreen, kaikki olemassa olevat säännöt (#1–#12) pysyvät `Docs/domain.md`:n `Paikka`-sarakkeen mukaisissa paikoissa, ja `HybridCache` toimii paikallisesti muistissa ilman ulkoista Redis-palvelinta mutta tukee L2-laajennusta myöhemmin.

## Päätös

Valitaan vaihtoehto 2.

## Seuraukset

- **CQRS + MediatR (`MediatR 12.4.1`)**:
  - `src/backend/Application/Features/<Osa-alue>/Commands|Queries/` sisältää komento- ja kyselytietueet (`IRequest<Result<T>>`) ja niiden käsittelijät.
  - `ValidationBehavior` suorittaa `FluentValidation`-validaattorit automaattisesti ennen käsittelijää ja palauttaa `Result.Failure(Error.Validation(...))` poikkeusten sijaan.
  - `LoggingBehavior` lokittaa pyynnön nimen, keston ja onnistumisen GDPR-turvallisesti ilman henkilötietoja.
  - `CachingBehavior` välimuistittaa `ICacheableQuery`-kyselyt automaattisesti `ICacheService`-rajapinnan kautta.
  - `src/backend/WebApi/Endpoints/*` kutsuvat sovelluskerrosta `ISender`-rajapinnan kautta.
- **Caching (`HybridCache` + `ICacheService`)**:
  - Välimuistitetaan hitaasti muuttuvat kyselyt: `stations`, `games`, `news`, `settings`, `statistics`, ja vastaavat kirjoituskomennot invalidoivat kyseiset tagit välittömästi.
  - **Poikkeus (`Docs/domain.md`)**: *"Vapaana nyt"* -laskenta (`GET /api/stations/available`) sekä varausten päällekkäisyys- ja `SharedTV`-tarkistukset eivät koskaan käytä välimuistia, jotta tuplavarauksia ei voi syntyä.
- **SignalR (`/hubs/gameroom` + `IRealtimeNotifier`)**:
  - `Application` määrittelee `IRealtimeNotifier`-rajapinnan, jonka `WebApi` toteuttaa `SignalRRealtimeNotifier`-luokalla ja `GameRoomHub`-hubilla.
  - Onnistuneiden komentojen jälkeen lähetetään tapahtumat (`ReservationChanged`, `StationStatusChanged`, `SettingsChanged`, `IssueReportChanged`, `NewsChanged`, `GamesChanged`).
  - Frontend (`src/frontend`) kuuntelee hubia `@microsoft/signalr`-kirjastolla ja invalidoi kohdennetusti TanStack Query -välimuistiavaimet.
