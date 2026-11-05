using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Pelihuone.Domain.Common;

namespace Pelihuone.Infrastructure.Outbox;

/// <summary>
/// EF Core -tallennussieppari, joka kerää entiteettien domain-tapahtumat ennen tietokantatallennusta
/// ja muuntaa ne <see cref="OutboxMessage"/>-riveiksi samassa tietokantatransaktiossa (Transactional Outbox -malli).
/// </summary>
public sealed class OutboxInterceptor : SaveChangesInterceptor
{
    /// <summary>
    /// Sieppaa asynkronisen <c>SaveChangesAsync</c>-kutsun ja lisää seurattujen entiteettien
    /// domain-tapahtumat Outbox-viesteiksi tietokantakontekstiin ennen tallennusta.
    /// </summary>
    /// <param name="eventData">Tiedot käynnissä olevasta tietokantatapahtumasta ja kontekstista.</param>
    /// <param name="result">Nykyinen sieppaustulos.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Sieppauksen tulos, joka sallii tallennuksen jatkumisen.</returns>
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        // Varmistetaan, että tietokantakonteksti on käytettävissä
        DbContext? dbContext = eventData.Context;
        if (dbContext is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        // Poimitaan domain-tapahtumat ja lisätään ne Outbox-tauluun ennen varsinaista tallennusta
        InsertOutboxMessages(dbContext);

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    /// <summary>
    /// Käy läpi EF Coren ChangeTrackerin seuraamat entiteetit, kerää niiden julkaisemat domain-tapahtumat,
    /// tyhjentää entiteettien tapahtumalistat ja lisää tapahtumat JSON-serialisoituina Outbox-viesteinä kontekstiin.
    /// </summary>
    private static void InsertOutboxMessages(DbContext dbContext)
    {
        List<IDomainEvent> domainEvents = [];

        // Käydään läpi kaikki muutosseurannassa olevat entiteetit
        foreach (EntityEntry entry in dbContext.ChangeTracker.Entries())
        {
            if (entry.Entity is null)
            {
                continue;
            }

            // Haetaan entiteetin DomainEvents-ominaisuus reflektion avulla
            Type type = entry.Entity.GetType();
            PropertyInfo? domainEventsProperty = type.GetProperty("DomainEvents");
            if (domainEventsProperty?.GetValue(entry.Entity) is IReadOnlyCollection<IDomainEvent> events && events.Count > 0)
            {
                domainEvents.AddRange(events);

                // Tyhjennetään entiteetin tapahtumalista, jottei samoja tapahtumia käsitellä uudelleen
                MethodInfo? clearMethod = type.GetMethod("ClearDomainEvents");
                clearMethod?.Invoke(entry.Entity, null);
            }
        }

        // Jos yhtään domain-tapahtumaa ei löytynyt, ei tarvitse lisätä Outbox-viestejä
        if (domainEvents.Count == 0)
        {
            return;
        }

        // Muunnetaan jokainen domain-tapahtuma JSON-muotoiseksi OutboxMessage-entiteetiksi
        IEnumerable<OutboxMessage> outboxMessages = domainEvents.Select(domainEvent => new OutboxMessage
        {
            Id = Guid.NewGuid(),
            Type = domainEvent.GetType().Name,
            Content = JsonSerializer.Serialize(domainEvent, domainEvent.GetType()),
            OccurredOnUtc = domainEvent.OccurredOnUtc,
            ProcessedOnUtc = null,
            Error = null
        });

        // Lisätään Outbox-viestit kontekstiin, jolloin ne tallentuvat samassa transaktiossa
        dbContext.Set<OutboxMessage>().AddRange(outboxMessages);
    }
}
