namespace Pelihuone.Infrastructure.Outbox;

/// <summary>
/// Edustaa Transactional Outbox -tauluun tallennettavaa viestiä, joka sisältää
/// serialisoidun domain-tapahtuman luotettavaa taustakäsittelyä varten.
/// </summary>
public sealed class OutboxMessage
{
    /// <summary>
    /// Outbox-viestin yksilöllinen tunniste.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Domain-tapahtuman CLR-tyypin nimi.
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Domain-tapahtuman sisältö JSON-muotoon serialisoituna.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// UTC-aikaleima sille, milloin domain-tapahtuma tapahtui.
    /// </summary>
    public DateTimeOffset OccurredOnUtc { get; set; }

    /// <summary>
    /// UTC-aikaleima sille, milloin viesti on käsitelty, tai <c>null</c> jos viestiä ei ole vielä käsitelty.
    /// </summary>
    public DateTimeOffset? ProcessedOnUtc { get; set; }

    /// <summary>
    /// Mahdollinen virheilmoitus, mikäli viestin käsittely on epäonnistunut.
    /// </summary>
    public string? Error { get; set; }
}
