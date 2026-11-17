using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Pelihuone.WebApi.RateLimiting;

/// <summary>
/// Oletustoteutus <see cref="IRateLimitPolicyProvider"/>-rajapinnalle, joka rajoittaa
/// varaus- ja autentikointipäätepisteiden pyyntömääriä IP-osoitekohtaisesti.
/// </summary>
public sealed class RateLimitPolicyProvider : IRateLimitPolicyProvider
{
    /// <inheritdoc />
    public RateLimitPartition<string> GetReservationPartition(HttpContext httpContext)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        // Varauspäätepisteiden rajoitus: 10 pyyntöä per minuutti per IP
        string partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: partitionKey,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    }

    /// <inheritdoc />
    public RateLimitPartition<string> GetAuthPartition(HttpContext httpContext)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        // Autentikointipäätepisteen rajoitus: 5 pyyntöä per minuutti per IP
        string partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: partitionKey,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    }

    /// <inheritdoc />
    public async ValueTask HandleRejectedAsync(OnRejectedContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        // Muodostetaan RFC 9457 ProblemDetails -vastaus tilakoodilla 429 Too Many Requests
        ProblemDetails problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Liikaa pyyntöjä",
            Detail = "Olet ylittänyt sallitun pyyntömäärän. Yritä uudelleen hetken kuluttua.",
            Type = "https://tools.ietf.org/html/rfc6585#section-4",
            Instance = context.HttpContext.Request.Path
        };

        await context.HttpContext.Response.WriteAsJsonAsync(
            problem,
            typeof(ProblemDetails),
            options: null,
            contentType: "application/problem+json",
            cancellationToken: cancellationToken);
    }
}
