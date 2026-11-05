namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Vahvasti tyypitetty arvo-objekti pelin (<see cref="Models.Game"/>) yksilöivälle tunnisteelle.
/// </summary>
/// <param name="Value">Tunnisteen taustalla oleva <see cref="Guid"/>-arvo.</param>
public readonly record struct GameId(Guid Value)
{
    /// <summary>
    /// Luo uuden satunnaisen <see cref="GameId"/>-tunnisteen.
    /// </summary>
    /// <returns>Uusi yksilöllinen <see cref="GameId"/>.</returns>
    public static GameId New() => new(Guid.NewGuid());

    /// <summary>
    /// Palauttaa tyhjän <see cref="GameId"/>-tunnisteen (<see cref="Guid.Empty"/>).
    /// </summary>
    public static GameId Empty => new(Guid.Empty);

    /// <summary>
    /// Palauttaa tunnisteen merkkijonoesityksen.
    /// </summary>
    /// <returns>Tunnisteen <see cref="Guid"/>-arvo merkkijonona.</returns>
    public override string ToString() => Value.ToString();
}
