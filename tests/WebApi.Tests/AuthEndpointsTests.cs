using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Users;
using Pelihuone.Contracts.Users;
using Pelihuone.WebApi.Endpoints;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// Integraatiotestit autentikointipäätepisteille (<see cref="AuthEndpoints"/>).
/// </summary>
public class AuthEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    /// <summary>
    /// Alustaa uuden <see cref="AuthEndpointsTests"/>-testiluokan ja luo HTTP-asiakkaan muistitietokantaa käyttävään testisovellukseen.
    /// </summary>
    /// <param name="factory">Testisovelluksen tehdasluokka.</param>
    public AuthEndpointsTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Varmistaa, että kirjautuminen kelvollisella XAMK:n oppilaitossähköpostilla palauttaa HTTP 200 OK ja käyttäjätiedot.
    /// </summary>
    [Fact]
    public async Task Login_WithSchoolEmail_ReturnsSuccess()
    {
        // Arrange (Sääntö 7: Oppilaitossähköpostit sallittu)
        LoginRequest request = new LoginRequest("test.opiskelija@edu.xamk.fi", "Testi Opiskelija");

        // Act: Lähetetään kirjautumispyyntö rajapintaan
        HttpResponseMessage response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert: Tarkistetaan onnistunut tilakoodi ja vastauksen sisältämä sähköposti
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        UserResponse? user = await response.Content.ReadFromJsonAsync<UserResponse>();
        Assert.NotNull(user);
        Assert.Equal("test.opiskelija@edu.xamk.fi", user.Email);
    }

    /// <summary>
    /// Varmistaa, että kirjautuminen muulla kuin oppilaitossähköpostilla palauttaa HTTP 400 Bad Request ja ProblemDetails-virheen.
    /// </summary>
    [Fact]
    public async Task Login_WithNonSchoolEmail_ReturnsBadRequestProblemDetails()
    {
        // Arrange (Sääntö 7: Ulkopuoliset sähköpostit hylätään)
        LoginRequest request = new LoginRequest("user@gmail.com", "Matti Ulkopuolinen");

        // Act: Yritetään kirjautua ulkopuolisella sähköpostiosoitteella
        HttpResponseMessage response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert: Varmistetaan 400 Bad Request ja RFC 9457 ProblemDetails -muotoilu
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        ProblemDetails? problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(400, problem.Status);
        Assert.Equal("Validointivirhe", problem.Title);
    }
}
