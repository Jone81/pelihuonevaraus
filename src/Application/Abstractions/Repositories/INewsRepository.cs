using Pelihuone.Domain.ValueObjects;
using NewsEntity = Pelihuone.Domain.Models.News;

namespace Pelihuone.Application.Abstractions.Repositories;

public interface INewsRepository
{
    Task<NewsEntity?> GetByIdAsync(NewsId id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NewsEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(NewsEntity news, CancellationToken cancellationToken = default);
    Task UpdateAsync(NewsEntity news, CancellationToken cancellationToken = default);
    Task DeleteAsync(NewsEntity news, CancellationToken cancellationToken = default);
}
