using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.WebApi.Endpoints;

namespace Pelihuone.WebApi.Tests;

public class RateLimitingTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RateLimitingTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AuthEndpoint_WhenExceedingRateLimit_Returns429TooManyRequestsWithProblemDetails()
    {
        // Arrange
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

        // Assert
        Assert.NotNull(lastResponse);
        Assert.Equal(HttpStatusCode.TooManyRequests, lastResponse.StatusCode);
        Assert.Equal("application/problem+json", lastResponse.Content.Headers.ContentType?.MediaType);

        var problem = await lastResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(429, problem.Status);
        Assert.Equal("Liikaa pyyntöjä", problem.Title);
    }
}
