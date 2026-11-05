namespace Pelihuone.Domain.Common;

/// <summary>
/// Rajapinta domain-tapahtumille, jotka kuvaavat järjestelmän liiketoimintalogiikassa tapahtuneita merkittäviä muutoksia.
/// </summary>
public interface IDomainEvent
{
    /// <summary>
    /// UTC-aikaleima sille hetkelle, jolloin domain-tapahtuma luotiin.
    /// </summary>
    DateTimeOffset OccurredOnUtc { get; }
}
