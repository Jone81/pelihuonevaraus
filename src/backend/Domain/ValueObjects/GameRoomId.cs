namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Vahvasti tyypitetty arvo-objekti pelitilan (<see cref="Models.GameRoom"/>) yksilöivälle tunnisteelle.
/// </summary>
/// <param name="Value">Tunnisteen taustalla oleva <see cref="Guid"/>-arvo.</param>
public readonly record struct GameRoomId(Guid Value)
{
    /// <summary>
    /// Luo uuden satunnaisen <see cref="GameRoomId"/>-tunnisteen.
    /// </summary>
    /// <returns>Uusi yksilöllinen <see cref="GameRoomId"/>.</returns>
    public static GameRoomId New() => new(Guid.NewGuid());

    /// <summary>
    /// Palauttaa tyhjän <see cref="GameRoomId"/>-tunnisteen (<see cref="Guid.Empty"/>).
    /// </summary>
    public static GameRoomId Empty => new(Guid.Empty);

    /// <summary>
    /// Palauttaa tunnisteen merkkijonoesityksen.
    /// </summary>
    /// <returns>Tunnisteen <see cref="Guid"/>-arvo merkkijonona.</returns>
    public override string ToString() => Value.ToString();
}
