using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Pelihuone.Application.Common.Behaviors;

/// <summary>
/// MediatR-putken lokituskäyttäytyminen, joka kirjaa pyynnön nimen, suoritusajan ja lopputuloksen ilman henkilötietoja (GDPR).
/// </summary>
/// <typeparam name="TRequest">Käsiteltävän MediatR-pyynnön tyyppi.</typeparam>
/// <typeparam name="TResponse">Pyynnön paluuarvon tyyppi.</typeparam>
public sealed class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="LoggingBehavior{TRequest, TResponse}"/>-instanssin.
    /// </summary>
    /// <param name="logger">Lokituspalvelu pyyntöjen suoritusmerkintöjen kirjaamiseen.</param>
    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Suorittaa pyynnön, mittaa sen keston ja lokittaa lopputuloksen ilman henkilötietoja.
    /// </summary>
    /// <param name="request">Käsiteltävä pyyntö.</param>
    /// <param name="next">Putken seuraava käsittelijä.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Käsittelijän palauttama vastaus.</returns>
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        string requestName = typeof(TRequest).Name;
        Stopwatch stopwatch = Stopwatch.StartNew();

        try
        {
            TResponse response = await next();
            stopwatch.Stop();

            if (response is Result result && result.IsFailure)
            {
                _logger.LogWarning(
                    "CQRS-pyyntö {RequestName} epäonnistui ajassa {ElapsedMs} ms. Virhekoodi: {ErrorCode}",
                    requestName,
                    stopwatch.ElapsedMilliseconds,
                    result.Error.Code);
            }
            else
            {
                _logger.LogInformation(
                    "CQRS-pyyntö {RequestName} onnistui ajassa {ElapsedMs} ms.",
                    requestName,
                    stopwatch.ElapsedMilliseconds);
            }

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(
                ex,
                "CQRS-pyyntö {RequestName} aiheutti odottamattoman poikkeuksen ajassa {ElapsedMs} ms.",
                requestName,
                stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}
