using Pelihuone.Application.Common;
using Pelihuone.Contracts.News;

namespace Pelihuone.Application.News;

/// <summary>
/// Sovelluspalvelurajapinta uutisten ja tiedotteiden julkaisuun sekä hallintaan.
/// </summary>
public interface INewsService
{
    /// <summary>
    /// Hakee kaikki näytettävät uutiset ja tiedotteet.
    /// </summary>
    Task<Result<IReadOnlyList<NewsResponse>>> GetAllNewsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Julkaisee uuden uutisen tai tiedotteen (vaatii ylläpitäjän oikeudet).
    /// </summary>
    Task<Result<NewsResponse>> CreateNewsAsync(CreateNewsRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Poistaa olemassa olevan uutisen tai tiedotteen (vaatii ylläpitäjän oikeudet).
    /// </summary>
    Task<Result<bool>> DeleteNewsAsync(Guid newsId, Guid userId, CancellationToken cancellationToken = default);
}
