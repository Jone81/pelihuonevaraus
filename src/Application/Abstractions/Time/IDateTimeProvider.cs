namespace Pelihuone.Application.Abstractions.Time;

/// <summary>
/// Rajapinta nykyisen kellonajan hakemiseen, mikä mahdollistaa aikasidonnaisen logiikan yksikkötestauksen.
/// </summary>
public interface IDateTimeProvider
{
    /// <summary>
    /// Palauttaa nykyisen ajan UTC-aikavyöhykkeellä.
    /// </summary>
    DateTimeOffset UtcNow { get; }
}
