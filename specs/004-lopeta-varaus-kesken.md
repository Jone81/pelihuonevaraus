# Spec 004, lopeta aktiivinen varaus kesken

## Tarina

Opiskelijana tai ylläpitäjänä haluan lopettaa parhaillaan käynnissä olevan varaukseni kesken, jos lopetan pelaamisen ja poistun pelihuoneesta etuajassa, jotta varaamani pelipiste (ja mahdollinen yhteinen 4K-TV) vapautuu heti seuraavalle käyttäjälle.

## Käsitteet

Sanasto ja kentät: `Docs/domain.md`. Ei uusia käsitteitä.

## Tekemiset

| Tekeminen | Onnistuu kun | Epäonnistuu kun |
|-----------|--------------|-----------------|
| Lopeta varaus kesken (`POST /api/reservations/{id}/end`) | Varaus on tilassa `Active`, käynnissä juuri nyt (`StartUtc < nowUtc < EndUtc`) ja kutsuja on varauksen omistaja tai `Admin`/`SuperAdmin`. Varauksen `EndUtc` päivitetään arvoon `nowUtc`, jolloin laite vapautuu heti. | Varaus ei löydy (`404 Not Found`), kutsuja ei ole omistaja eikä ylläpitäjä (`403 Forbidden`), tai varaus ei ole käynnissä / on peruttu (`409 Conflict`, `Reservation.CannotEndEarly`). |

## Säännöt ja paikka

Vain viittaukset tiedoston `Docs/domain.md` riveihin:

- 1 (aikaikkunan loppu > alku), `TimeWindow.TruncateEnd` (Domain)
- 5 (tulevan varauksen peruutus ennen alkua säilyy erillisenä), `Reservation.Cancel` (Domain)
- 12 (käynnissä olevan aktiivisen varauksen ennenaikainen lopettaminen asettaa `EndUtc = nowUtc` ja vapauttaa laitteen), `Reservation.EndEarly` + `TimeWindow.TruncateEnd` (Domain) ja `ReservationService.EndReservationEarlyAsync` (Application)

## Hyväksymiskriteerit

Lähtötila on `Docs/testaus.md`:n testiaineisto.

1. Given opiskelijalla 1 on aktiivinen varaus `PC 1`:lle klo 09:00-12:00 ja kello on klo 10:15. When opiskelija 1 kutsuu `POST /api/reservations/{id}/end`. Then vastaus on `200 OK`, varauksen `EndUtc` on klo 10:15, `Status` pysyy `Active` ja `PC 1` on vapaa uuteen varaukseen klo 10:15 alkaen.
2. Given opiskelijalla 1 on aktiivinen varaus `PC 1`:lle klo 11:00-13:00 ja kello on klo 09:00 (varaus ei ole vielä alkanut). When opiskelija 1 kutsuu `POST /api/reservations/{id}/end`. Then pyyntö hylätään tilakoodilla `409 Conflict` (`Reservation.CannotEndEarly`).
3. Given opiskelijalla 1 on varaus `PC 1`:lle klo 08:00-09:00 ja kello on klo 09:30 (varaus on jo päättynyt) tai varaus on peruttu. When opiskelija 1 kutsuu `POST /api/reservations/{id}/end`. Then pyyntö hylätään tilakoodilla `409 Conflict` (`Reservation.CannotEndEarly`).
4. Given opiskelijalla 1 on käynnissä oleva varaus klo 09:00-12:00 ja kello on klo 10:00. When opiskelija 2 yrittää lopettaa varauksen. Then pyyntö hylätään tilakoodilla `403 Forbidden` (`Reservation.Forbidden`).
5. Given opiskelijalla 1 on käynnissä oleva varaus klo 09:00-12:00 ja kello on klo 10:00. When `Admin` tai `SuperAdmin` kutsuu `POST /api/reservations/{id}/end`. Then pyyntö onnistuu (`200 OK`) ja `EndUtc` päivittyy klo 10:00:aan.

## Tehtävät

1. Domain & Contracts: `TimeWindow.TruncateEnd`, `Reservation.EndEarly` (sääntö #12), `EndReservationRequest` ja `IReservationService.EndReservationEarlyAsync`. Valmis kun Domain-yksikkötestit ovat vihreitä (`tests/Application.Tests`).
2. Application: `ReservationService.EndReservationEarlyAsync` ja kattavat use case -testit (K1–K5) kiinteällä kellolla (`IDateTimeProvider`). Valmis kun `tests/Application.Tests` on vihreä.
3. API: `POST /api/reservations/{id:guid}/end` päätepisteeseen `ReservationEndpoints` ja HTTP-testit (`200`, `403`, `404`, `409`). Valmis kun `tests/WebApi.Tests` on vihreä.
