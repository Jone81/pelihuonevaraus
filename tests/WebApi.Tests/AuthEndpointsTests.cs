using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Users;
using Pelihuone.Contracts.Users;
using Pelihuone.WebApi.Endpoints;

namespace Pelihuone.WebApi.Tests;

public class AuthEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointsTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithSchoolEmail_ReturnsSuccess()
    {
        // Arrange (Sääntö 7: Oppilaitossähköpostit sallittu)
        var request = new LoginRequest("test.opiskelija@edu.xamk.fi", "Testi Opiskelija");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var user = await response.Content.ReadFromJsonAsync<UserResponse>();
        Assert.NotNull(user);
        Assert.Equal("test.opiskelija@edu.xamk.fi", user.Email);
    }

    [Fact]
    public async Task Login_WithNonSchoolEmail_ReturnsBadRequestProblemDetails()
    {
        // Arrange (Sääntö 7: Ulkopuoliset sähköpostit hylätään)
        var request = new LoginRequest("user@gmail.com", "Matti Ulkopuolinen");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(400, problem.Status);
        Assert.Equal("Validointivirhe", problem.Title);
    }
}
