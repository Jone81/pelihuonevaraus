namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Vahvasti tyypitetty arvo-objekti varauksen (<see cref="Models.Reservation"/>) yksilöivälle tunnisteelle.
/// </summary>
/// <param name="Value">Tunnisteen taustalla oleva <see cref="Guid"/>-arvo.</param>
public readonly record struct ReservationId(Guid Value)
{
    /// <summary>
    /// Luo uuden satunnaisen <see cref="ReservationId"/>-tunnisteen.
    /// </summary>
    /// <returns>Uusi yksilöllinen <see cref="ReservationId"/>.</returns>
    public static ReservationId New() => new(Guid.NewGuid());

    /// <summary>
    /// Palauttaa tyhjän <see cref="ReservationId"/>-tunnisteen (<see cref="Guid.Empty"/>).
    /// </summary>
    public static ReservationId Empty => new(Guid.Empty);

    /// <summary>
    /// Palauttaa tunnisteen merkkijonoesityksen.
    /// </summary>
    /// <returns>Tunnisteen <see cref="Guid"/>-arvo merkkijonona.</returns>
    public override string ToString() => Value.ToString();
}
