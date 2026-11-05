using Pelihuone.Domain.Common;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Events;

/// <summary>
/// Domain-tapahtuma, joka nostetaan, kun olemassa oleva varaus peruutetaan.
/// </summary>
/// <param name="ReservationId">Peruutetun varauksen yksilöivä tunniste.</param>
/// <param name="CancelledByUserId">Peruutuksen suorittaneen käyttäjän tunniste.</param>
/// <param name="Reason">Valinnainen peruutuksen syy tai perustelu.</param>
/// <param name="OccurredOnUtc">Peruutushetken UTC-aikaleima.</param>
public sealed record ReservationCancelledDomainEvent(
    ReservationId ReservationId,
    UserId CancelledByUserId,
    string? Reason,
    DateTimeOffset OccurredOnUtc) : IDomainEvent;
