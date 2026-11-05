using Pelihuone.Domain.Common;

namespace Pelihuone.Domain.Exceptions;

/// <summary>
/// Poikkeus, joka heitetään, kun varauksen peruuttaminen epäonnistuu esimerkiksi puuttuvien oikeuksien tai jo alkaneen varausajan vuoksi.
/// </summary>
public class ReservationCancellationException : DomainException
{
    /// <summary>
    /// Alustaa uuden <see cref="ReservationCancellationException"/>-poikkeuksen annetulla virheviestillä.
    /// </summary>
    /// <param name="message">Kuvaus peruutuksen epäonnistumisen syystä.</param>
    public ReservationCancellationException(string message) : base(message)
    {
    }
}
