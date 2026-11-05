using Pelihuone.Application.Abstractions.Time;

namespace Pelihuone.Infrastructure.Services;

/// <summary>
/// Toteuttaa <see cref="IDateTimeProvider"/>-rajapinnan käyttäen .NETin sisäänrakennettua
/// <see cref="TimeProvider"/>-abstraktiota nykyisen UTC-ajan tarjoamiseksi.
/// </summary>
public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    private readonly TimeProvider _timeProvider;

    /// <summary>
    /// Alustaa uuden <see cref="SystemDateTimeProvider"/>-instanssin annetulla <see cref="TimeProvider"/>-palvelulla.
    /// </summary>
    /// <param name="timeProvider">Aikapalvelu, josta nykyinen aika luetaan.</param>
    public SystemDateTimeProvider(TimeProvider timeProvider)
    {
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// Palauttaa nykyisen UTC-ajan <see cref="TimeProvider"/>-instanssilta.
    /// </summary>
    public DateTimeOffset UtcNow => _timeProvider.GetUtcNow();
}
