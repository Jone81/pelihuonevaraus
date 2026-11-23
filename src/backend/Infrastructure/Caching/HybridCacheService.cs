using Microsoft.Extensions.Caching.Hybrid;
using Pelihuone.Application.Abstractions.Caching;

namespace Pelihuone.Infrastructure.Caching;

/// <summary>
/// Toteuttaa <see cref="ICacheService"/>-rajapinnan .NET:n <see cref="HybridCache"/>-palvelulla.
/// </summary>
public sealed class HybridCacheService : ICacheService
{
    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(2);
    private readonly HybridCache _hybridCache;

    /// <summary>
    /// Luo uuden <see cref="HybridCacheService"/>-instanssin annetulla <see cref="HybridCache"/>-palvelulla.
    /// </summary>
    /// <param name="hybridCache">Taustalla käytettävä HybridCache-instanssi.</param>
    public HybridCacheService(HybridCache hybridCache)
    {
        ArgumentNullException.ThrowIfNull(hybridCache);
        _hybridCache = hybridCache;
    }

    /// <inheritdoc />
    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, ValueTask<T>> factory,
        TimeSpan? expiration = null,
        IReadOnlyCollection<string>? tags = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(factory);

        TimeSpan effectiveExpiration = expiration ?? DefaultExpiration;
        HybridCacheEntryOptions options = new HybridCacheEntryOptions
        {
            Expiration = effectiveExpiration,
            LocalCacheExpiration = effectiveExpiration
        };

        return await _hybridCache.GetOrCreateAsync(
            key,
            async token => await factory(token),
            options,
            tags,
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        await _hybridCache.RemoveAsync(key, cancellationToken);
    }

    /// <inheritdoc />
    public async Task RemoveByTagAsync(string tag, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tag);
        await _hybridCache.RemoveByTagAsync(tag, cancellationToken);
    }
}
