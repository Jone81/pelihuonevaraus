namespace Pelihuone.Contracts.Common;

/// <summary>
/// Yleiskäyttöinen tietorakenne sivutettujen kyselytulosten palauttamiseen API-rajapinnasta.
/// </summary>
/// <typeparam name="T">Sivutetun listan alkioiden tyyppi.</typeparam>
/// <param name="Items">Kyseisen sivun tulosalkiot.</param>
/// <param name="PageNumber">Nykyisen sivun numero (alkaen numerosta 1).</param>
/// <param name="PageSize">Yhdelle sivulle mahtuvien alkioiden enimmäismäärä.</param>
/// <param name="TotalCount">Kaikkien hakuehtoon täsmäävien alkioiden kokonaismäärä.</param>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    int TotalCount)
{
    /// <summary>
    /// Sivujen kokonaismäärä laskettuna kokonaismäärästä ja sivukoosta.
    /// </summary>
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;

    /// <summary>
    /// Ilmaisee, onko nykyisen sivun jälkeen vielä lisää sivuja.
    /// </summary>
    public bool HasNextPage => PageNumber < TotalPages;

    /// <summary>
    /// Ilmaisee, onko nykyistä sivua edeltäviä sivuja olemassa.
    /// </summary>
    public bool HasPreviousPage => PageNumber > 1;

    /// <summary>
    /// Luo uuden <see cref="PagedResult{T}"/>-instanssin annetuilla sivutustiedoilla.
    /// </summary>
    /// <param name="items">Sivun alkiot.</param>
    /// <param name="pageNumber">Sivun numero.</param>
    /// <param name="pageSize">Sivun koko.</param>
    /// <param name="totalCount">Kokonaislukumäärä.</param>
    /// <returns>Valmis sivutettu vastausolio.</returns>
    public static PagedResult<T> Create(IReadOnlyList<T> items, int pageNumber, int pageSize, int totalCount) =>
        new(items, pageNumber, pageSize, totalCount);
}
