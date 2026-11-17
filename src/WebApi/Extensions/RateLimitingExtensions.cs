using Pelihuone.WebApi.RateLimiting;

namespace Pelihuone.WebApi.Extensions;

/// <summary>
/// Laajennusmetodit WebApi-kerroksen pyyntörajoitusten (Rate Limiting) rekisteröimiseksi
/// riippuvuuksien injektointikonttiin.
/// </summary>
public static class RateLimitingExtensions
{
    /// <summary>
    /// Rekisteröi <see cref="IRateLimitPolicyProvider"/>-palvelun sekä konfiguroi
    /// varaus- ja autentikointipäätepisteiden pyyntörajoituskäytännöt.
    /// </summary>
    /// <param name="services">Sovelluksen palvelukokoelma.</param>
    /// <returns>Päivitetty palvelukokoelma ketjutusta varten.</returns>
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddSingleton<IRateLimitPolicyProvider, RateLimitPolicyProvider>();

        RateLimitPolicyProvider policyProvider = new RateLimitPolicyProvider();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = policyProvider.HandleRejectedAsync;
            options.AddPolicy(RateLimitPolicies.Reservation, policyProvider.GetReservationPartition);
            options.AddPolicy(RateLimitPolicies.Auth, policyProvider.GetAuthPartition);
        });

        return services;
    }
}
