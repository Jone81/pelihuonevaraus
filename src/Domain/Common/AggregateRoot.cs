namespace Pelihuone.Domain.Common;

/// <summary>
/// Abstrakti kantaluokka domain-mallin juurientiteeteille (Aggregate Root), jotka vastaavat
/// eheysrajoista sekä domain-tapahtumien keräämisestä.
/// </summary>
/// <typeparam name="TId">Entiteetin yksilöivän tunnisteen tyyppi.</typeparam>
public abstract class AggregateRoot<TId> : Entity<TId>
    where TId : notnull
{
    // Sisäinen lista odottavista domain-tapahtumista ennen tietokantatallennusta.
    private readonly List<IDomainEvent> _domainEvents = [];

    /// <summary>
    /// Kokoelma entiteetin tilamuutosten yhteydessä nostetuista domain-tapahtumista.
    /// </summary>
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    /// <summary>
    /// Alustaa uuden juurientiteetin annetulla tunnisteella.
    /// </summary>
    /// <param name="id">Juurientiteetin yksilöivä tunniste.</param>
    protected AggregateRoot(TId id) : base(id)
    {
    }

    /// <summary>
    /// Lisää uuden domain-tapahtuman entiteetin tapahtumajonoon myöhempää julkaisua varten.
    /// </summary>
    /// <param name="domainEvent">Nostettava domain-tapahtuma.</param>
    protected void RaiseDomainEvent(IDomainEvent domainEvent)
    {
        // Tallennetaan tapahtuma muistiin, jotta sovelluskerros voi käsitellä sen tallennuksen yhteydessä.
        _domainEvents.Add(domainEvent);
    }

    /// <summary>
    /// Tyhjentää kaikki entiteettiin kertyneet domain-tapahtumat sen jälkeen, kun ne on käsitelty.
    /// </summary>
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
