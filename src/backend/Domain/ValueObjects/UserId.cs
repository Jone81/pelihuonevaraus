namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Vahvasti tyypitetty arvo-objekti käyttäjän (<see cref="Models.User"/>) yksilöivälle tunnisteelle.
/// </summary>
/// <param name="Value">Tunnisteen taustalla oleva <see cref="Guid"/>-arvo.</param>
public readonly record struct UserId(Guid Value)
{
    /// <summary>
    /// Luo uuden satunnaisen <see cref="UserId"/>-tunnisteen.
    /// </summary>
    /// <returns>Uusi yksilöllinen <see cref="UserId"/>.</returns>
    public static UserId New() => new(Guid.NewGuid());

    /// <summary>
    /// Palauttaa tyhjän <see cref="UserId"/>-tunnisteen (<see cref="Guid.Empty"/>).
    /// </summary>
    public static UserId Empty => new(Guid.Empty);

    /// <summary>
    /// Palauttaa tunnisteen merkkijonoesityksen.
    /// </summary>
    /// <returns>Tunnisteen <see cref="Guid"/>-arvo merkkijonona.</returns>
    public override string ToString() => Value.ToString();
}
