using Pelihuone.Application.Common;
using Pelihuone.Contracts.News;

namespace Pelihuone.Application.News;

public interface INewsService
{
    Task<Result<IReadOnlyList<NewsResponse>>> GetAllNewsAsync(CancellationToken cancellationToken = default);
    Task<Result<NewsResponse>> CreateNewsAsync(CreateNewsRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteNewsAsync(Guid newsId, Guid userId, CancellationToken cancellationToken = default);
}
