namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Vahvasti tyypitetty arvo-objekti uutisen (<see cref="Models.News"/>) yksilöivälle tunnisteelle.
/// </summary>
/// <param name="Value">Tunnisteen taustalla oleva <see cref="Guid"/>-arvo.</param>
public readonly record struct NewsId(Guid Value)
{
    /// <summary>
    /// Luo uuden satunnaisen <see cref="NewsId"/>-tunnisteen.
    /// </summary>
    /// <returns>Uusi yksilöllinen <see cref="NewsId"/>.</returns>
    public static NewsId New() => new(Guid.NewGuid());

    /// <summary>
    /// Palauttaa tyhjän <see cref="NewsId"/>-tunnisteen (<see cref="Guid.Empty"/>).
    /// </summary>
    public static NewsId Empty => new(Guid.Empty);

    /// <summary>
    /// Palauttaa tunnisteen merkkijonoesityksen.
    /// </summary>
    /// <returns>Tunnisteen <see cref="Guid"/>-arvo merkkijonona.</returns>
    public override string ToString() => Value.ToString();

    /// <summary>
    /// Muuntaa <see cref="NewsId"/>-arvo-objektin implisiittisesti <see cref="Guid"/>-arvoksi.
    /// </summary>
    /// <param name="id">Muunnettava <see cref="NewsId"/>-tunniste.</param>
    public static implicit operator Guid(NewsId id) => id.Value;
}
