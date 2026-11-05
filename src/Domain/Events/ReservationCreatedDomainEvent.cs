using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Events;

/// <summary>
/// Domain-tapahtuma, joka nostetaan, kun uusi varaus on luotu onnistuneesti.
/// </summary>
/// <param name="ReservationId">Luodun varauksen yksilöivä tunniste.</param>
/// <param name="UserId">Varauksen tehneen käyttäjän tunniste.</param>
/// <param name="Type">Varauksen tyyppi (yksittäinen laite, koko tila tai tapahtuma).</param>
/// <param name="GamingStationId">Varatun pelipisteen tunniste, mikäli kyseessä on laitekohtainen varaus.</param>
/// <param name="TimeWindow">Varauksen aikaväli.</param>
/// <param name="OccurredOnUtc">Luontihetken UTC-aikaleima.</param>
public sealed record ReservationCreatedDomainEvent(
    ReservationId ReservationId,
    UserId UserId,
    ReservationType Type,
    GamingStationId? GamingStationId,
    TimeWindow TimeWindow,
    DateTimeOffset OccurredOnUtc) : IDomainEvent;
