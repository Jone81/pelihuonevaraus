using NSubstitute;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.News;
using Pelihuone.Contracts.News;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Microsoft.Extensions.Logging.Abstractions;
using NewsEntity = Pelihuone.Domain.Models.News;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="NewsService"/>-palveluluokalle, joka vastaa uutisten ja tiedotteiden julkaisusta sekä hausta.
/// </summary>
public class NewsServiceTests
{
    private readonly INewsRepository _newsRepository = Substitute.For<INewsRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly NewsService _service;

    /// <summary>
    /// Alustaa uuden <see cref="NewsServiceTests"/>-testiluokan ja luo testattavan uutispalvelun mock-riippuvuuksilla.
    /// </summary>
    public NewsServiceTests()
    {
        // Asetetaan aikapalvelu palauttamaan nykyinen UTC-aika
        _dateTimeProvider.UtcNow.Returns(DateTimeOffset.UtcNow);

        _service = new NewsService(
            _newsRepository,
            _userRepository,
            _dateTimeProvider,
            _unitOfWork,
            NullLogger<NewsService>.Instance);
    }

    /// <summary>
    /// Varmistaa, että <see cref="NewsService.GetAllNewsAsync"/> palauttaa kaikki julkaistut uutiset.
    /// </summary>
    [Fact]
    public async Task GetAllNews_ReturnsAllPublishedNews()
    {
        // Arrange: Valmistellaan yksi julkaistu ja kiinnitetty tiedote
        List<NewsEntity> news = new List<NewsEntity>
        {
            NewsEntity.Create(NewsId.New(), "Uutinen 1", "Sisältö 1", UserId.New(), DateTimeOffset.UtcNow, true),
        };
        _newsRepository.GetAllAsync(Arg.Any<CancellationToken>()).Returns(news);

        // Act: Haetaan kaikki uutiset
        Result<IReadOnlyList<NewsResponse>> result = await _service.GetAllNewsAsync();

        // Assert: Varmistetaan, että tiedote palautetaan oikealla otsikolla
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value);
        Assert.Equal("Uutinen 1", result.Value[0].Title);
    }

    /// <summary>
    /// Varmistaa, että ylläpitäjä (Admin) pystyy julkaisemaan uuden tiedotteen onnistuneesti.
    /// </summary>
    [Fact]
    public async Task CreateNews_WhenAdmin_Succeeds()
    {
        // Arrange: Luodaan Admin-roolissa oleva käyttäjä
        Guid adminId = Guid.NewGuid();
        User admin = User.Create(new UserId(adminId), SchoolEmail.Create("admin@xamk.fi"), "Admin", UserRole.Admin, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(adminId), Arg.Any<CancellationToken>()).Returns(admin);

        CreateNewsRequest request = new CreateNewsRequest("Turnaus tulossa", "Ilmoittaudu nyt!", adminId, true);

        // Act: Julkaistaan uusi tiedote Admin-tunnuksilla
        Result<NewsResponse> result = await _service.CreateNewsAsync(request, adminId);

        // Assert: Tarkistetaan, että uutinen luotiin ja lisättiin repositorioon
        Assert.True(result.IsSuccess);
        Assert.Equal("Turnaus tulossa", result.Value.Title);
        await _newsRepository.Received(1).AddAsync(Arg.Any<NewsEntity>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että tavallinen opiskelijakäyttäjä ei voi julkaista tiedotteita.
    /// </summary>
    [Fact]
    public async Task CreateNews_WhenNormalUser_ReturnsForbidden()
    {
        // Arrange: Alustetaan tavallinen opiskelijakäyttäjä
        Guid userId = Guid.NewGuid();
        User normalUser = User.Create(new UserId(userId), SchoolEmail.Create("opiskelija@edu.xamk.fi"), "Opiskelija", UserRole.User, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(normalUser);

        CreateNewsRequest request = new CreateNewsRequest("Oma tiedote", "Sisältö", userId);

        // Act: Yritetään luoda tiedote ilman ylläpito-oikeuksia
        Result<NewsResponse> result = await _service.CreateNewsAsync(request, userId);

        // Assert: Varmistetaan, että operaatio estetään Forbidden-virheellä
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    /// <summary>
    /// Varmistaa, että ylläpitäjä (Admin) pystyy päivittämään olemassa olevan tiedotteen tiedot.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenAdmin_Succeeds()
    {
        // Arrange: Luodaan Admin-käyttäjä ja olemassa oleva tiedote
        Guid adminId = Guid.NewGuid();
        User admin = User.Create(new UserId(adminId), SchoolEmail.Create("admin-edit@xamk.fi"), "Admin", UserRole.Admin, DateTimeOffset.UtcNow);
        NewsEntity existing = NewsEntity.Create(NewsId.New(), "Vanha otsikko", "Vanha sisältö", new UserId(adminId), DateTimeOffset.UtcNow, false);

        _userRepository.GetByIdAsync(new UserId(adminId), Arg.Any<CancellationToken>()).Returns(admin);
        _newsRepository.GetByIdAsync(existing.Id, Arg.Any<CancellationToken>()).Returns(existing);

        UpdateNewsRequest request = new UpdateNewsRequest("Uusi otsikko", "Uusi sisältö", true);

        // Act: Päivitetään tiedote Admin-tunnuksilla
        Result<NewsResponse> result = await _service.UpdateNewsAsync(existing.Id.Value, request, adminId);

        // Assert: Tarkistetaan, että kentät ja kiinnitys päivittyivät ja muutos tallennettiin
        Assert.True(result.IsSuccess);
        Assert.Equal("Uusi otsikko", result.Value.Title);
        Assert.Equal("Uusi sisältö", result.Value.Content);
        Assert.True(result.Value.IsPinned);
        await _newsRepository.Received(1).UpdateAsync(existing, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että tavallinen opiskelijakäyttäjä ei voi muokata tiedotteita.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenNormalUser_ReturnsForbidden()
    {
        // Arrange: Alustetaan tavallinen opiskelijakäyttäjä
        Guid userId = Guid.NewGuid();
        User normalUser = User.Create(new UserId(userId), SchoolEmail.Create("student-edit@edu.xamk.fi"), "Opiskelija", UserRole.User, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(normalUser);

        UpdateNewsRequest request = new UpdateNewsRequest("Otsikko", "Sisältö", false);

        // Act: Yritetään päivittää tiedote ilman Admin-oikeuksia
        Result<NewsResponse> result = await _service.UpdateNewsAsync(Guid.NewGuid(), request, userId);

        // Assert: Operaatio estetään Forbidden-virheellä
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    /// <summary>
    /// Varmistaa, että olemattoman tiedotteen päivittäminen palauttaa NotFound-virheen.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenNotFound_ReturnsNotFound()
    {
        // Arrange: Luodaan Admin-käyttäjä ilman löytyvää tiedotetta
        Guid adminId = Guid.NewGuid();
        User admin = User.Create(new UserId(adminId), SchoolEmail.Create("admin-missing@xamk.fi"), "Admin", UserRole.Admin, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(adminId), Arg.Any<CancellationToken>()).Returns(admin);

        UpdateNewsRequest request = new UpdateNewsRequest("Otsikko", "Sisältö", false);

        // Act: Päivitetään olematonta tiedotetta
        Result<NewsResponse> result = await _service.UpdateNewsAsync(Guid.NewGuid(), request, adminId);

        // Assert: Palautuu NotFound-virhe
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.NotFound, result.Error.Type);
    }

    /// <summary>
    /// Varmistaa, että tyhjällä otsikolla tehty päivitys palauttaa Validation-virheen.
    /// </summary>
    [Fact]
    public async Task UpdateNews_WhenTitleEmpty_ReturnsValidationError()
    {
        // Arrange: Luodaan Admin-käyttäjä
        Guid adminId = Guid.NewGuid();
        User admin = User.Create(new UserId(adminId), SchoolEmail.Create("admin-valid@xamk.fi"), "Admin", UserRole.Admin, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(adminId), Arg.Any<CancellationToken>()).Returns(admin);

        UpdateNewsRequest request = new UpdateNewsRequest("   ", "Sisältö", false);

        // Act: Yritetään päivittää tyhjällä otsikolla
        Result<NewsResponse> result = await _service.UpdateNewsAsync(Guid.NewGuid(), request, adminId);

        // Assert: Palautuu Validation-virhe
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
    }
}
