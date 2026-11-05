using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Domain.Common;

namespace Pelihuone.WebApi.Middleware;

/// <summary>
/// Globaali poikkeustenkäsittelijä, joka muuntaa käsittelemättömät poikkeukset ja toimialuevirheet
/// RFC 9457 ProblemDetails -standardin mukaisiksi JSON-vastauksiksi.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="GlobalExceptionHandler"/>-luokan instanssin.
    /// </summary>
    /// <param name="logger">Lokituksen palvelu virheiden tallentamiseen.</param>
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Käsittelee HTTP-pyynnön aikana syntyneen poikkeuksen asynkronisesti ja kirjoittaa ProblemDetails-vastauksen.
    /// </summary>
    /// <param name="httpContext">Nykyisen HTTP-pyynnön konteksti.</param>
    /// <param name="exception">Syntynyt poikkeus.</param>
    /// <param name="cancellationToken">Peruutustoken asynkroniselle operaatiolle.</param>
    /// <returns><c>true</c>, kun poikkeus on käsitelty ja vastaus kirjoitettu.</returns>
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // Kirjataan virhe lokiin virheenkorjausta varten
        _logger.LogError(exception, "Käsittelemätön virhe pyyntöä käsiteltäessä: {Message}", exception.Message);

        int statusCode;
        string title;
        string detail;

        // Jos kyseessä on toimialuekerroksen sääntörikkomus, palautetaan 400 Bad Request selkeällä viestillä
        if (exception is DomainException domainEx)
        {
            statusCode = StatusCodes.Status400BadRequest;
            title = "Toimintasääntövirhe";
            detail = domainEx.Message;
        }
        else
        {
            // Odottamattomissa virheissä palautetaan geneerinen 500 Internal Server Error tietoturvasyistä
            statusCode = StatusCodes.Status500InternalServerError;
            title = "Palvelinvirhe";
            detail = "Palvelimella tapahtui odottamaton virhe. Yritä myöhemmin uudelleen.";
        }

        // Muodostetaan RFC 9457 -standardin mukainen ProblemDetails-vastaus
        ProblemDetails problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = $"https://tools.ietf.org/html/rfc9110#section-15.{(statusCode == 400 ? "5.1" : "6.1")}",
            Instance = httpContext.Request.Path
        };

        // Liitetään mukaan pyynnön traceId jäljitettävyyden parantamiseksi
        string? traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;
        if (!string.IsNullOrEmpty(traceId))
        {
            problemDetails.Extensions["traceId"] = traceId;
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}
