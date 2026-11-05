namespace Pelihuone.Contracts.Reservations;

/// <summary>
/// Pyynnön tietomalli uuden pelipiste-, tila- tai tapahtumavarauksen luomiseksi.
/// </summary>
/// <param name="IdempotencyKey">Idempotenssiavain, jolla estetään saman varauspyynnön vahingossa tapahtuva tuplakäsittely.</param>
/// <param name="UserId">Varauksen tekevän käyttäjän tunniste.</param>
/// <param name="ReservationType">Varauksen tyyppi kokonaislukuna (1 = Individual, 2 = Room, 3 = Event).</param>
/// <param name="GamingStationId">Varattavan pelipisteen tunniste, mikäli kyseessä on yksittäisvaraus.</param>
/// <param name="StartUtc">Varauksen alkamisaika UTC-ajassa.</param>
/// <param name="EndUtc">Varauksen päättymisaika UTC-ajassa.</param>
public sealed record CreateReservationRequest(
    string IdempotencyKey,
    Guid UserId,
    int ReservationType,
    Guid? GamingStationId,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc);
