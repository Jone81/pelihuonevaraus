namespace Pelihuone.Domain.Common;

public interface IDomainEvent
{
    DateTimeOffset OccurredOnUtc { get; }
}
