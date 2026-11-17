using System.Net;
using System.Net.Http.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.WebApi.Abstractions;
using Pelihuone.WebApi.Endpoints;
using Pelihuone.WebApi.RateLimiting;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// Yksikkö- ja integraatiotestit API-päätepisteiden pyyntörajoituksille (<see cref="IRateLimitPolicyProvider"/>).
/// </summary>
public class RateLimitingTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    /// <summary>
    /// Alustaa uuden <see cref="RateLimitingTests"/>-testiluokan ja luo HTTP-asiakkaan testisovellukseen.
    /// </summary>
    /// <param name="factory">Testisovelluksen tehdasluokka.</param>
    public RateLimitingTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Varmistaa, että <see cref="IRateLimitPolicyProvider"/> on rekisteröity riippuvuuksien injektointikonttiin.
    /// </summary>
    [Fact]
    public void ServiceProvider_ResolvesRateLimitPolicyProvider()
    {
        // Act: Haetaan palveluntarjoaja DI-kontista
        IRateLimitPolicyProvider? provider = _factory.Services.GetService<IRateLimitPolicyProvider>();

        // Assert: Palvelun on oltava rekisteröity RateLimitPolicyProvider-toteutuksena
        Assert.NotNull(provider);
        Assert.IsType<RateLimitPolicyProvider>(provider);
    }

    /// <summary>
    /// Varmistaa, että <see cref="IRateLimitPolicyProvider.GetAuthPartition"/> sallii täsmälleen
    /// 5 pyyntöä minuutissa samaa IP-osoitetta kohden.
    /// </summary>
    [Fact]
    public void GetAuthPartition_EnforcesFivePermitsPerMinutePerIp()
    {
        // Arrange: Alustetaan palveluntarjoaja ja HTTP-konteksti testattavalla IP-osoitteella
        IRateLimitPolicyProvider provider = _factory.Services.GetRequiredService<IRateLimitPolicyProvider>();
        DefaultHttpContext httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("192.0.2.10");

        // Act: Muodostetaan rajoitusosio ja sen rajoitin
        RateLimitPartition<string> partition = provider.GetAuthPartition(httpContext);
        using RateLimiter limiter = partition.Factory(partition.PartitionKey);

        // Assert: 5 ensimmäistä pyyntöä menee läpi ja 6. hylätään
        Assert.Equal("192.0.2.10", partition.PartitionKey);
        for (int i = 0; i < 5; i++)
        {
            using RateLimitLease allowedLease = limiter.AttemptAcquire(1);
            Assert.True(allowedLease.IsAcquired);
        }

        using RateLimitLease rejectedLease = limiter.AttemptAcquire(1);
        Assert.False(rejectedLease.IsAcquired);
    }

    /// <summary>
    /// Varmistaa, että <see cref="IRateLimitPolicyProvider.GetReservationPartition"/> sallii täsmälleen
    /// 10 pyyntöä minuutissa samaa IP-osoitetta kohden.
    /// </summary>
    [Fact]
    public void GetReservationPartition_EnforcesTenPermitsPerMinutePerIp()
    {
        // Arrange: Alustetaan palveluntarjoaja ja HTTP-konteksti testattavalla IP-osoitteella
        IRateLimitPolicyProvider provider = _factory.Services.GetRequiredService<IRateLimitPolicyProvider>();
        DefaultHttpContext httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("192.0.2.20");

        // Act: Muodostetaan rajoitusosio ja sen rajoitin
        RateLimitPartition<string> partition = provider.GetReservationPartition(httpContext);
        using RateLimiter limiter = partition.Factory(partition.PartitionKey);

        // Assert: 10 ensimmäistä pyyntöä menee läpi ja 11. hylätään
        Assert.Equal("192.0.2.20", partition.PartitionKey);
        for (int i = 0; i < 10; i++)
        {
            using RateLimitLease allowedLease = limiter.AttemptAcquire(1);
            Assert.True(allowedLease.IsAcquired);
        }

        using RateLimitLease rejectedLease = limiter.AttemptAcquire(1);
        Assert.False(rejectedLease.IsAcquired);
    }

    /// <summary>
    /// Varmistaa, että autentikointipäätepisteen pyyntörajan (<c>AuthPolicy</c>: 5 pyyntöä minuutissa) ylittäminen
    /// palauttaa HTTP 429 Too Many Requests ja ProblemDetails-vastauksen.
    /// </summary>
    [Fact]
    public async Task AuthEndpoint_WhenExceedingRateLimit_Returns429TooManyRequestsWithProblemDetails()
    {
        // Arrange: Valmistellaan toistettava kirjautumispyyntö
        LoginRequest request = new LoginRequest("limittest@edu.xamk.fi", "Limit Tester");
        HttpResponseMessage? lastResponse = null;

        // Act: AuthPolicy sallii 5 pyyntöä per minuutti
        for (int i = 0; i < 7; i++)
        {
            lastResponse = await _client.PostAsJsonAsync("/api/auth/login", request);
            if (lastResponse.StatusCode == HttpStatusCode.TooManyRequests)
            {
                break;
            }
        }

        // Assert: Varmistetaan, että raja-arvon ylitys palauttaa 429 Too Many Requests ja ProblemDetails-objektin
        Assert.NotNull(lastResponse);
        Assert.Equal(HttpStatusCode.TooManyRequests, lastResponse.StatusCode);
        Assert.Equal("application/problem+json", lastResponse.Content.Headers.ContentType?.MediaType);

        ProblemDetails? problem = await lastResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(429, problem.Status);
        Assert.Equal("Liikaa pyyntöjä", problem.Title);
    }
}
