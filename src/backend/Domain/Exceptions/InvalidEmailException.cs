using Pelihuone.Domain.Common;

namespace Pelihuone.Domain.Exceptions;

/// <summary>
/// Poikkeus, joka heitetään, kun annettu sähköpostiosoite on tyhjä, virheellisen muotoinen tai ei kuulu sallittuun oppilaitoksen verkkotunnukseen.
/// </summary>
public class InvalidEmailException : DomainException
{
    /// <summary>
    /// Alustaa uuden <see cref="InvalidEmailException"/>-poikkeuksen annetulla virheviestillä.
    /// </summary>
    /// <param name="message">Kuvaus sähköpostiosoitteen validointivirheestä.</param>
    public InvalidEmailException(string message) : base(message)
    {
    }
}
