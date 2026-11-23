namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Vahvasti tyypitetty arvo-objekti vikailmoituksen (<see cref="Models.IssueReport"/>) yksilöivälle tunnisteelle.
/// </summary>
/// <param name="Value">Tunnisteen taustalla oleva <see cref="Guid"/>-arvo.</param>
public readonly record struct IssueReportId(Guid Value)
{
    /// <summary>
    /// Luo uuden satunnaisen <see cref="IssueReportId"/>-tunnisteen.
    /// </summary>
    /// <returns>Uusi yksilöllinen <see cref="IssueReportId"/>.</returns>
    public static IssueReportId New() => new(Guid.NewGuid());

    /// <summary>
    /// Palauttaa tyhjän <see cref="IssueReportId"/>-tunnisteen (<see cref="Guid.Empty"/>).
    /// </summary>
    public static IssueReportId Empty => new(Guid.Empty);

    /// <summary>
    /// Palauttaa tunnisteen merkkijonoesityksen.
    /// </summary>
    /// <returns>Tunnisteen <see cref="Guid"/>-arvo merkkijonona.</returns>
    public override string ToString() => Value.ToString();
}
