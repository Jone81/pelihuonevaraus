using Pelihuone.Domain.Common;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Events;

public sealed record ReservationCancelledDomainEvent(
    ReservationId ReservationId,
    UserId CancelledByUserId,
    string? Reason,
    DateTimeOffset OccurredOnUtc) : IDomainEvent;
