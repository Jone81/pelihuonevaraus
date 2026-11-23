using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Contracts.News;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;
using NewsEntity = Pelihuone.Domain.Models.News;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// Integraatiotestit tiedotteiden muokkauspäätepisteelle (<c>PUT /api/news/{id}</c>).
/// </summary>
public class NewsEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    /// <summary>
    /// Alustaa uuden <see cref="NewsEndpointsTests"/>-testiluokan testisovelluksen tehdasluokalla.
    /// </summary>
    /// <param name="factory">Perustestisovelluksen tehdasluokka.</param>
    public NewsEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Varmistaa, että ylläpitäjä voi muokata tiedotetta ja päätepiste palauttaa HTTP 200 OK sekä päivitetyn tiedotteen.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenAdmin_Returns200OkAndUpdatedNews()
    {
        // Arrange: Alustetaan Admin-käyttäjä ja olemassa oleva tiedote tietokantaan
        UserId adminId = new UserId(Guid.NewGuid());
        NewsId newsId = NewsId.New();

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            User admin = User.Create(
                adminId,
                SchoolEmail.Create($"news-admin-{Guid.NewGuid():N}@xamk.fi"),
                "News Admin",
                UserRole.Admin,
                DateTimeOffset.UtcNow);
            NewsEntity news = NewsEntity.Create(
                newsId,
                "Alkuperäinen otsikko",
                "Alkuperäinen sisältö",
                adminId,
                DateTimeOffset.UtcNow,
                false);

            await db.Users.AddAsync(admin);
            await db.News.AddAsync(news);
            await db.SaveChangesAsync();
        }

        UpdateNewsRequest request = new UpdateNewsRequest("Päivitetty otsikko", "Päivitetty sisältö", true);
        using HttpRequestMessage httpReq = new HttpRequestMessage(HttpMethod.Put, $"/api/news/{newsId.Value}")
        {
            Content = JsonContent.Create(request)
        };
        httpReq.Headers.Add("X-User-Id", adminId.Value.ToString());

        // Act: Lähetetään muokkauspyyntö rajapintaan
        HttpResponseMessage response = await _client.SendAsync(httpReq);

        // Assert: Varmistetaan HTTP 200 OK ja päivitetty sisältö
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        NewsResponse? body = await response.Content.ReadFromJsonAsync<NewsResponse>();
        Assert.NotNull(body);
        Assert.Equal(newsId.Value, body.Id);
        Assert.Equal("Päivitetty otsikko", body.Title);
        Assert.Equal("Päivitetty sisältö", body.Content);
        Assert.True(body.IsPinned);
    }

    /// <summary>
    /// Varmistaa, että tavallisen opiskelijan muokkausyritys palauttaa HTTP 403 Forbidden.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenNormalUser_Returns403Forbidden()
    {
        // Arrange: Alustetaan tavallinen opiskelija ja tiedote
        UserId studentId = new UserId(Guid.NewGuid());
        NewsId newsId = NewsId.New();

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            User student = User.Create(
                studentId,
                SchoolEmail.Create($"news-user-{Guid.NewGuid():N}@edu.xamk.fi"),
                "Opiskelija",
                UserRole.User,
                DateTimeOffset.UtcNow);
            NewsEntity news = NewsEntity.Create(
                newsId,
                "Tiedote",
                "Sisältö",
                studentId,
                DateTimeOffset.UtcNow,
                false);

            await db.Users.AddAsync(student);
            await db.News.AddAsync(news);
            await db.SaveChangesAsync();
        }

        UpdateNewsRequest request = new UpdateNewsRequest("Muokattu", "Sisältö", true);
        using HttpRequestMessage httpReq = new HttpRequestMessage(HttpMethod.Put, $"/api/news/{newsId.Value}")
        {
            Content = JsonContent.Create(request)
        };
        httpReq.Headers.Add("X-User-Id", studentId.Value.ToString());

        // Act: Yritetään päivittää ilman Admin-roolia
        HttpResponseMessage response = await _client.SendAsync(httpReq);

        // Assert: HTTP 403 Forbidden
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    /// <summary>
    /// Varmistaa, että olemattoman tiedotteen muokkaus palauttaa HTTP 404 Not Found.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenNotFound_Returns404NotFound()
    {
        // Arrange: Alustetaan Admin-käyttäjä
        UserId adminId = new UserId(Guid.NewGuid());
        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            User admin = User.Create(
                adminId,
                SchoolEmail.Create($"news-admin-404-{Guid.NewGuid():N}@xamk.fi"),
                "Admin 404",
                UserRole.Admin,
                DateTimeOffset.UtcNow);
            await db.Users.AddAsync(admin);
            await db.SaveChangesAsync();
        }

        UpdateNewsRequest request = new UpdateNewsRequest("Otsikko", "Sisältö", false);
        using HttpRequestMessage httpReq = new HttpRequestMessage(HttpMethod.Put, $"/api/news/{Guid.NewGuid()}")
        {
            Content = JsonContent.Create(request)
        };
        httpReq.Headers.Add("X-User-Id", adminId.Value.ToString());

        // Act
        HttpResponseMessage response = await _client.SendAsync(httpReq);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// Varmistaa, että tyhjällä otsikolla tehty muokkauspyyntö palauttaa HTTP 400 Bad Request.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenTitleEmpty_Returns400BadRequest()
    {
        // Arrange: Alustetaan Admin-käyttäjä ja tiedote
        UserId adminId = new UserId(Guid.NewGuid());
        NewsId newsId = NewsId.New();

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            User admin = User.Create(
                adminId,
                SchoolEmail.Create($"news-admin-400-{Guid.NewGuid():N}@xamk.fi"),
                "Admin 400",
                UserRole.Admin,
                DateTimeOffset.UtcNow);
            NewsEntity news = NewsEntity.Create(
                newsId,
                "Alkuperäinen",
                "Sisältö",
                adminId,
                DateTimeOffset.UtcNow,
                false);
            await db.Users.AddAsync(admin);
            await db.News.AddAsync(news);
            await db.SaveChangesAsync();
        }

        UpdateNewsRequest request = new UpdateNewsRequest("", "Sisältö", false);
        using HttpRequestMessage httpReq = new HttpRequestMessage(HttpMethod.Put, $"/api/news/{newsId.Value}")
        {
            Content = JsonContent.Create(request)
        };
        httpReq.Headers.Add("X-User-Id", adminId.Value.ToString());

        // Act
        HttpResponseMessage response = await _client.SendAsync(httpReq);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
