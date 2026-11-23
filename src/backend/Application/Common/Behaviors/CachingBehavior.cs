using MediatR;
using Pelihuone.Application.Abstractions.Caching;

namespace Pelihuone.Application.Common.Behaviors;

/// <summary>
/// MediatR-putken välimuistikäyttäytyminen, joka välimuistittaa <see cref="ICacheableQuery"/>-rajapinnan toteuttavat kyselyt
/// ja estää epäonnistuneiden <see cref="Result"/>-tulosten serialisoinnin ja tallentamisen välimuistiin.
/// </summary>
/// <typeparam name="TRequest">Käsiteltävän MediatR-pyynnön tyyppi.</typeparam>
/// <typeparam name="TResponse">Pyynnön paluuarvon tyyppi.</typeparam>
public sealed class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICacheService _cacheService;

    /// <summary>
    /// Alustaa uuden <see cref="CachingBehavior{TRequest, TResponse}"/>-instanssin.
    /// </summary>
    /// <param name="cacheService">Välimuistipalvelu kyselytulosten tallentamiseen ja hakemiseen.</param>
    public CachingBehavior(ICacheService cacheService)
    {
        _cacheService = cacheService;
    }

    /// <summary>
    /// Hakee välimuistitettavan kyselyn tuloksen välimuistista tai suorittaa käsittelijän ja tallentaa vain onnistuneen tuloksen.
    /// </summary>
    /// <param name="request">Käsiteltävä pyyntö.</param>
    /// <param name="next">Putken seuraava käsittelijä.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Välimuistista haettu tai käsittelijän palauttama vastaus.</returns>
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not ICacheableQuery cacheableQuery)
        {
            return await next();
        }

        try
        {
            return await _cacheService.GetOrCreateAsync(
                cacheableQuery.CacheKey,
                async _ =>
                {
                    TResponse response = await next();

                    // Estetään epäonnistuneen Result-olion serialisointi ja tallennus välimuistiin
                    if (response is Result result && result.IsFailure)
                    {
                        throw new UncacheableFailureException(response);
                    }

                    return response;
                },
                cacheableQuery.Expiration,
                cacheableQuery.CacheTags,
                cancellationToken);
        }
        catch (UncacheableFailureException exception)
        {
            return exception.Response;
        }
    }

    private sealed class UncacheableFailureException : Exception
    {
        public TResponse Response { get; }

        public UncacheableFailureException(TResponse response)
        {
            Response = response;
        }
    }
}
