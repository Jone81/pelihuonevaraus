namespace Pelihuone.Application.Abstractions.Caching;

/// <summary>
/// Merkintärajapinta CQRS-kyselyille, joiden tulokset voidaan tallentaa välimuistiin.
/// </summary>
public interface ICacheableQuery
{
    /// <summary>
    /// Yksilöllinen avain, jolla kyselyn tulos tallennetaan välimuistiin.
    /// </summary>
    string CacheKey { get; }

    /// <summary>
    /// Valinnainen voimassaoloaika välimuistimerkinnälle. Jos arvo on <c>null</c>, käytetään oletusvoimassaoloaikaa.
    /// </summary>
    TimeSpan? Expiration { get; }

    /// <summary>
    /// Välimuistitunnisteet, joihin kyselyn tulos liitetään invalidoimista varten.
    /// </summary>
    IReadOnlyCollection<string> CacheTags { get; }
}
