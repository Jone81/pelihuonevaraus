namespace Pelihuone.Contracts.Reservations;

/// <summary>
/// Vastausmalli, joka sisältää yksittäisen varauksen tiedot varauskalenteria ja hallintanäkymiä varten.
/// </summary>
/// <param name="Id">Varauksen yksilöivä tunniste.</param>
/// <param name="UserId">Varauksen omistavan käyttäjän tunniste.</param>
/// <param name="ReservationType">Varauksen tyyppi merkkijonona.</param>
/// <param name="GamingStationId">Varatun pelipisteen tunniste, jos kyseessä on laitevaraus.</param>
/// <param name="StartUtc">Varauksen alkamisaika UTC-ajassa.</param>
/// <param name="EndUtc">Varauksen päättymisaika UTC-ajassa.</param>
/// <param name="DurationMinutes">Varauksen kesto minuutteina.</param>
/// <param name="Status">Varauksen tila merkkijonona (Active tai Cancelled).</param>
/// <param name="CreatedAtUtc">Varauksen luontihetken UTC-aikaleima.</param>
/// <param name="CancellationReason">Peruutuksen syy, mikäli varaus on peruttu.</param>
/// <param name="BookerName">Varaajan näyttönimi (näytetään oikeuksien salliessa).</param>
/// <param name="BookerEmail">Varaajan sähköpostiosoite (näytetään ylläpidolle tai varaajalle itselleen).</param>
public sealed record ReservationResponse(
    Guid Id,
    Guid UserId,
    string ReservationType,
    Guid? GamingStationId,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    double DurationMinutes,
    string Status,
    DateTimeOffset CreatedAtUtc,
    string? CancellationReason,
    string? BookerName = null,
    string? BookerEmail = null);
