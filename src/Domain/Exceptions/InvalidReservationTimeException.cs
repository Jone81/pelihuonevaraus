using Pelihuone.Domain.Common;

namespace Pelihuone.Domain.Exceptions;

/// <summary>
/// Poikkeus, joka heitetään, kun varauksen aikaväli rikkoo kesto-, aukiolo- tai ennakkovaraussääntöjä.
/// </summary>
public class InvalidReservationTimeException : DomainException
{
    /// <summary>
    /// Alustaa uuden <see cref="InvalidReservationTimeException"/>-poikkeuksen annetulla virheviestillä.
    /// </summary>
    /// <param name="message">Kuvaus varausajan sääntörikkomuksesta.</param>
    public InvalidReservationTimeException(string message) : base(message)
    {
    }
}
