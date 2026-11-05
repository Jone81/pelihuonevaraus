using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Application.Users;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Infrastructure.Persistence;
using Pelihuone.WebApi.Endpoints;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// Integraatiotestit autentikointipäätepisteille (<see cref="AuthEndpoints"/>).
/// </summary>
public class AuthEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    /// <summary>
    /// Alustaa uuden <see cref="AuthEndpointsTests"/>-testiluokan ja luo HTTP-asiakkaan muistitietokantaa käyttävään testisovellukseen.
    /// </summary>
    /// <param name="factory">Testisovelluksen tehdasluokka.</param>
    public AuthEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
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

    /// <summary>
    /// Varmistaa, että ylläpitäjä voi hakea käyttäjälistan X-User-Id-otsakkeen avulla.
    /// </summary>
    [Fact]
    public async Task GetAllUsers_WhenAdmin_ReturnsUsersList()
    {
        // Arrange: Haetaan siemennetty admin-käyttäjä
        using IServiceScope scope = _factory.Services.CreateScope();
        ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        User admin = await db.Users.FirstAsync((User u) => u.Role == UserRole.SuperAdmin);

        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, "/api/users");
        request.Headers.Add("X-User-Id", admin.Id.Value.ToString());

        // Act
        HttpResponseMessage response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        List<UserResponse>? users = await response.Content.ReadFromJsonAsync<List<UserResponse>>();
        Assert.NotNull(users);
        Assert.NotEmpty(users);
    }

    /// <summary>
    /// Varmistaa, että ylläpitäjä voi asettaa käyttäjälle määräaikaisen käyttöeston (bannin) rajapinnan kautta.
    /// </summary>
    [Fact]
    public async Task BanUser_WhenAdmin_ReturnsUpdatedUserWithBan()
    {
        // Arrange
        using IServiceScope scope = _factory.Services.CreateScope();
        ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        User admin = await db.Users.FirstAsync((User u) => u.Role == UserRole.SuperAdmin);
        User student = await db.Users.FirstAsync((User u) => u.Role == UserRole.User);

        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Put, $"/api/users/{student.Id.Value}/ban");
        request.Headers.Add("X-User-Id", admin.Id.Value.ToString());
        request.Content = JsonContent.Create(new BanUserRequest(DurationHours: 48, Reason: "Testibanni"));

        // Act
        HttpResponseMessage response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        UserResponse? updatedUser = await response.Content.ReadFromJsonAsync<UserResponse>();
        Assert.NotNull(updatedUser);
        Assert.True(updatedUser.IsBanned);
        Assert.Equal("Testibanni", updatedUser.BanReason);
    }

    /// <summary>
    /// Varmistaa, että anonyymi käyttäjä ilman X-User-Id-otsaketta ei voi bannata käyttäjiä (HTTP 401 Unauthorized).
    /// </summary>
    [Fact]
    public async Task BanUser_WhenAnonymous_ReturnsUnauthorized()
    {
        // Arrange: Ei X-User-Id-otsaketta
        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Put, $"/api/users/{Guid.NewGuid()}/ban");
        request.Content = JsonContent.Create(new BanUserRequest(DurationHours: 24));

        // Act
        HttpResponseMessage response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    /// <summary>
    /// Varmistaa, että SuperAdmin voi päivittää käyttäjän roolia rajapinnan kautta.
    /// </summary>
    [Fact]
    public async Task UpdateUserRole_WhenSuperAdmin_UpdatesRoleSuccessfully()
    {
        // Arrange
        using IServiceScope scope = _factory.Services.CreateScope();
        ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        User admin = await db.Users.FirstAsync((User u) => u.Role == UserRole.SuperAdmin);
        User student = await db.Users.FirstAsync((User u) => u.Role == UserRole.User);

        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Put, $"/api/users/{student.Id.Value}/role");
        request.Headers.Add("X-User-Id", admin.Id.Value.ToString());
        request.Content = JsonContent.Create(new UpdateUserRoleRequest(Role: "Admin"));

        // Act
        HttpResponseMessage response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        UserResponse? updatedUser = await response.Content.ReadFromJsonAsync<UserResponse>();
        Assert.NotNull(updatedUser);
        Assert.Equal("Admin", updatedUser.Role);
    }

    /// <summary>
    /// Varmistaa, että tavallinen käyttäjä ei voi päivittää rooleja (HTTP 403 Forbidden).
    /// </summary>
    [Fact]
    public async Task UpdateUserRole_WhenNotSuperAdmin_ReturnsForbidden()
    {
        // Arrange
        using IServiceScope scope = _factory.Services.CreateScope();
        ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        User student = await db.Users.FirstAsync((User u) => u.Role == UserRole.User);

        HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Put, $"/api/users/{student.Id.Value}/role");
        request.Headers.Add("X-User-Id", student.Id.Value.ToString());
        request.Content = JsonContent.Create(new UpdateUserRoleRequest(Role: "Admin"));

        // Act
        HttpResponseMessage response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
