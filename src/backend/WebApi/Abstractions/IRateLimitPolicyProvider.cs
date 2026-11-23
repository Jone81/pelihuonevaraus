using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Pelihuone.WebApi.Abstractions;

/// <summary>
/// Sisältää WebApi-kerroksen pyyntörajoituskäytäntöjen (Rate Limiting) vakiotunnisteet.
/// </summary>
public static class RateLimitPolicies
{
    /// <summary>
    /// Varauspäätepisteiden rajoituskäytäntö (10 pyyntöä / minuutti / IP-osoite).
    /// </summary>
    public const string Reservation = "ReservationPolicy";

    /// <summary>
    /// Kirjautumis- ja varmistuskoodipäätepisteiden rajoituskäytäntö (5 pyyntöä / minuutti / IP-osoite).
    /// </summary>
    public const string Auth = "AuthPolicy";
}

/// <summary>
/// Määrittelee rajapinnan HTTP-päätepisteiden pyyntörajoitusosioiden (Rate Limit Partitions)
/// ja hylättyjen pyyntöjen virhevastausten muodostamiselle.
/// </summary>
public interface IRateLimitPolicyProvider
{
    /// <summary>
    /// Muodostaa kiinteän aikaikkunan rajoitusosion varauspäätepisteille kutsujan IP-osoitteen perusteella.
    /// </summary>
    /// <param name="httpContext">Nykyisen HTTP-pyynnön konteksti.</param>
    /// <returns>Asiakaskohtainen <see cref="RateLimitPartition{TKey}"/> varauspäätepisteille.</returns>
    RateLimitPartition<string> GetReservationPartition(HttpContext httpContext);

    /// <summary>
    /// Muodostaa kiinteän aikaikkunan rajoitusosion autentikointipäätepisteille kutsujan IP-osoitteen perusteella.
    /// </summary>
    /// <param name="httpContext">Nykyisen HTTP-pyynnön konteksti.</param>
    /// <returns>Asiakaskohtainen <see cref="RateLimitPartition{TKey}"/> autentikointipäätepisteille.</returns>
    RateLimitPartition<string> GetAuthPartition(HttpContext httpContext);

    /// <summary>
    /// Käsittelee pyyntörajoituksen ylittämisen ja kirjoittaa RFC 9457 <c>ProblemDetails</c> -muotoisen
    /// HTTP 429 Too Many Requests -vastauksen.
    /// </summary>
    /// <param name="context">Hylätyn pyynnön konteksti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkroniselle operaatiolle.</param>
    /// <returns>Tehtävä, joka edustaa vastauksen kirjoittamista.</returns>
    ValueTask HandleRejectedAsync(OnRejectedContext context, CancellationToken cancellationToken);
}
