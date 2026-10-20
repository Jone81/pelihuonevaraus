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

public class GameServiceTests
{
    private readonly IGameRepository _gameRepository = Substitute.For<IGameRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly GameService _service;

    public GameServiceTests()
    {
        _service = new GameService(
            _gameRepository,
            _userRepository,
            _unitOfWork,
            NullLogger<GameService>.Instance);
    }

    [Fact]
    public async Task GetAllGamesAsync_ReturnsAllGames()
    {
        // Arrange
        var games = new List<Game>
        {
            Game.Create(GameId.New(), "CS2", GamingPlatform.PC, "Shooter", false),
            Game.Create(GameId.New(), "Tekken 8", GamingPlatform.PlayStation5, "Fighting", true),
        };
        _gameRepository.GetAllAsync(Arg.Any<CancellationToken>()).Returns(games);

        // Act
        var result = await _service.GetAllGamesAsync();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
    }

    [Fact]
    public async Task AddWishlistGame_CreatesWishlistGameSuccessfully()
    {
        // Arrange
        var request = new WishGameRequest("Helldivers 2", "PC", "Co-op game");

        // Act
        var result = await _service.AddWishlistGameAsync(request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Value.IsWishlist);
        Assert.Equal("Helldivers 2", result.Value.Name);
        await _gameRepository.Received(1).AddAsync(Arg.Any<Game>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateGame_WhenUserIsNotAdmin_ReturnsForbidden()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var normalUser = User.Create(new UserId(userId), SchoolEmail.Create("opiskelija@edu.xamk.fi"), "Matti", UserRole.User, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(normalUser);

        var request = new CreateGameRequest("New Game", "PC", "Desc");

        // Act
        var result = await _service.CreateGameAsync(request, userId);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    [Fact]
    public async Task UpvoteWishlistGame_IncrementsVotesSuccessfully()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        var game = Game.Create(new GameId(gameId), "Hollow Knight: Silksong", GamingPlatform.PC, "Metroidvania", true, 5);
        _gameRepository.GetByIdAsync(new GameId(gameId), Arg.Any<CancellationToken>()).Returns(game);

        // Act
        var result = await _service.UpvoteWishlistGameAsync(gameId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(6, result.Value.VotesCount);
        await _gameRepository.Received(1).UpdateAsync(game, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
