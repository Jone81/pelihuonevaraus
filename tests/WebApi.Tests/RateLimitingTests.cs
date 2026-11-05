using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.WebApi.Endpoints;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// Integraatiotestit API-päätepisteiden pyyntörajoituksille (Rate Limiting).
/// </summary>
public class RateLimitingTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    /// <summary>
    /// Alustaa uuden <see cref="RateLimitingTests"/>-testiluokan ja luo HTTP-asiakkaan testisovellukseen.
    /// </summary>
    /// <param name="factory">Testisovelluksen tehdasluokka.</param>
    public RateLimitingTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Varmistaa, että autentikointipäätepisteen pyyntörajan (<c>AuthPolicy</c>: 5 pyyntöä minuutissa) ylittäminen
    /// palauttaa HTTP 429 Too Many Requests ja ProblemDetails-vastauksen.
    /// </summary>
    [Fact]
    public async Task AuthEndpoint_WhenExceedingRateLimit_Returns429TooManyRequestsWithProblemDetails()
    {
        // Arrange: Valmistellaan toistettava kirjautumispyyntö
        var request = new LoginRequest("limittest@edu.xamk.fi", "Limit Tester");
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

        var problem = await lastResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(429, problem.Status);
        Assert.Equal("Liikaa pyyntöjä", problem.Title);
    }
}
