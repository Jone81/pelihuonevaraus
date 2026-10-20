using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Events;

public sealed record ReservationCreatedDomainEvent(
    ReservationId ReservationId,
    UserId UserId,
    ReservationType Type,
    GamingStationId? GamingStationId,
    TimeWindow TimeWindow,
    DateTimeOffset OccurredOnUtc) : IDomainEvent;
