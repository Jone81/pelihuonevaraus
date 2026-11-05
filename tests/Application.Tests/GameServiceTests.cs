using NSubstitute;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Common;
using Pelihuone.Application.Games;
using Pelihuone.Contracts.Games;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Microsoft.Extensions.Logging.Abstractions;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="GameService"/>-palveluluokalle, joka vastaa pelivalikoiman ja pelitoivelistan hallinnasta.
/// </summary>
public class GameServiceTests
{
    private readonly IGameRepository _gameRepository = Substitute.For<IGameRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly GameService _service;

    /// <summary>
    /// Alustaa uuden <see cref="GameServiceTests"/>-testiluokan ja luo testattavan palvelun mock-riippuvuuksilla.
    /// </summary>
    public GameServiceTests()
    {
        // Luodaan GameService käyttäen NSubstitute-korvikkeita ja tyhjää lokittajaa
        _service = new GameService(
            _gameRepository,
            _userRepository,
            _unitOfWork,
            NullLogger<GameService>.Instance);
    }

    /// <summary>
    /// Varmistaa, että <see cref="GameService.GetAllGamesAsync"/> palauttaa kaikki tietovarastossa olevat pelit.
    /// </summary>
    [Fact]
    public async Task GetAllGamesAsync_ReturnsAllGames()
    {
        // Arrange: Valmistellaan kahden pelin testilista
        var games = new List<Game>
        {
            Game.Create(GameId.New(), "CS2", GamingPlatform.PC, "Shooter", false),
            Game.Create(GameId.New(), "Tekken 8", GamingPlatform.PlayStation5, "Fighting", true),
        };
        _gameRepository.GetAllAsync(Arg.Any<CancellationToken>()).Returns(games);

        // Act: Haetaan kaikki pelit palvelun kautta
        var result = await _service.GetAllGamesAsync();

        // Assert: Varmistetaan, että haku onnistui ja molemmat pelit palautettiin
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
    }

    /// <summary>
    /// Varmistaa, että uuden pelitoiveen lisääminen luo toivelistapelin ja tallentaa muutokset tietokantaan.
    /// </summary>
    [Fact]
    public async Task AddWishlistGame_CreatesWishlistGameSuccessfully()
    {
        // Arrange: Luodaan pelitoivepyyntö PC-alustalle
        var request = new WishGameRequest("Helldivers 2", "PC", "Co-op game");

        // Act: Lisätään peli toivelistalle
        var result = await _service.AddWishlistGameAsync(request);

        // Assert: Tarkistetaan, että peli merkittiin toivelistapeliksi ja tallennettiin UnitOfWorkin kautta
        Assert.True(result.IsSuccess);
        Assert.True(result.Value.IsWishlist);
        Assert.Equal("Helldivers 2", result.Value.Name);
        await _gameRepository.Received(1).AddAsync(Arg.Any<Game>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että tavallinen opiskelijakäyttäjä ei voi lisätä peliä suoraan viralliseen pelivalikoimaan.
    /// </summary>
    [Fact]
    public async Task CreateGame_WhenUserIsNotAdmin_ReturnsForbidden()
    {
        // Arrange: Alustetaan tavallinen opiskelijakäyttäjä ilman ylläpito-oikeuksia
        var userId = Guid.NewGuid();
        var normalUser = User.Create(new UserId(userId), SchoolEmail.Create("opiskelija@edu.xamk.fi"), "Matti", UserRole.User, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(normalUser);

        var request = new CreateGameRequest("New Game", "PC", "Desc");

        // Act: Yritetään luoda virallinen peli tavallisen käyttäjän tunnuksilla
        var result = await _service.CreateGameAsync(request, userId);

        // Assert: Varmistetaan, että kutsu hylätään Forbidden-virheellä
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    /// <summary>
    /// Varmistaa, että toivelistapelin äänestäminen kasvattaa pelin äänimäärää yhdellä ja tallentaa päivityksen.
    /// </summary>
    [Fact]
    public async Task UpvoteWishlistGame_IncrementsVotesSuccessfully()
    {
        // Arrange: Luodaan toivelistapeli, jolla on entuudestaan 5 ääntä
        var gameId = Guid.NewGuid();
        var game = Game.Create(new GameId(gameId), "Hollow Knight: Silksong", GamingPlatform.PC, "Metroidvania", true, 5);
        _gameRepository.GetByIdAsync(new GameId(gameId), Arg.Any<CancellationToken>()).Returns(game);

        // Act: Annetaan pelille uusi ääni
        var result = await _service.UpvoteWishlistGameAsync(gameId);

        // Assert: Varmistetaan, että äänimäärä kasvoi kuuteen ja muutos tallennettiin
        Assert.True(result.IsSuccess);
        Assert.Equal(6, result.Value.VotesCount);
        await _gameRepository.Received(1).UpdateAsync(game, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
