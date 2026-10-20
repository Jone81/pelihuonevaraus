using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Pelihuone.Domain.Common;

namespace Pelihuone.Infrastructure.Outbox;

public sealed class OutboxInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        DbContext? dbContext = eventData.Context;
        if (dbContext is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        InsertOutboxMessages(dbContext);

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void InsertOutboxMessages(DbContext dbContext)
    {
        List<IDomainEvent> domainEvents = [];

        foreach (var entry in dbContext.ChangeTracker.Entries())
        {
            if (entry.Entity is null)
            {
                continue;
            }

            var type = entry.Entity.GetType();
            var domainEventsProperty = type.GetProperty("DomainEvents");
            if (domainEventsProperty?.GetValue(entry.Entity) is IReadOnlyCollection<IDomainEvent> events && events.Count > 0)
            {
                domainEvents.AddRange(events);

                var clearMethod = type.GetMethod("ClearDomainEvents");
                clearMethod?.Invoke(entry.Entity, null);
            }
        }

        if (domainEvents.Count == 0)
        {
            return;
        }

        var outboxMessages = domainEvents.Select(domainEvent => new OutboxMessage
        {
            Id = Guid.NewGuid(),
            Type = domainEvent.GetType().Name,
            Content = JsonSerializer.Serialize(domainEvent, domainEvent.GetType()),
            OccurredOnUtc = domainEvent.OccurredOnUtc,
            ProcessedOnUtc = null,
            Error = null
        });

        dbContext.Set<OutboxMessage>().AddRange(outboxMessages);
    }
}
