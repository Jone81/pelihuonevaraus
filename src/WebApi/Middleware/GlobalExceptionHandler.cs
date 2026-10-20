using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Domain.Common;

namespace Pelihuone.WebApi.Middleware;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Käsittelemätön virhe pyyntöä käsiteltäessä: {Message}", exception.Message);

        int statusCode;
        string title;
        string detail;

        if (exception is DomainException domainEx)
        {
            statusCode = StatusCodes.Status400BadRequest;
            title = "Toimintasääntövirhe";
            detail = domainEx.Message;
        }
        else
        {
            statusCode = StatusCodes.Status500InternalServerError;
            title = "Palvelinvirhe";
            detail = "Palvelimella tapahtui odottamaton virhe. Yritä myöhemmin uudelleen.";
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = $"https://tools.ietf.org/html/rfc9110#section-15.{(statusCode == 400 ? "5.1" : "6.1")}",
            Instance = httpContext.Request.Path
        };

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
