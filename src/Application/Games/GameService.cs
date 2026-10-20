using Microsoft.Extensions.Logging;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;
using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Games;

public sealed class GameService : IGameService
{
    private readonly IGameRepository _gameRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GameService> _logger;

    public GameService(
        IGameRepository gameRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ILogger<GameService> logger)
    {
        _gameRepository = gameRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<IReadOnlyList<GameResponse>>> GetAllGamesAsync(CancellationToken cancellationToken = default)
    {
        var games = await _gameRepository.GetAllAsync(cancellationToken);
        var responses = games.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<GameResponse>>(responses);
    }

    public async Task<Result<IReadOnlyList<GameResponse>>> GetGamesByPlatformAsync(
        GamingPlatform platform,
        CancellationToken cancellationToken = default)
    {
        var games = await _gameRepository.GetByPlatformAsync(platform, cancellationToken);
        var responses = games.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<GameResponse>>(responses);
    }

    public async Task<Result<IReadOnlyList<GameResponse>>> GetWishlistAsync(CancellationToken cancellationToken = default)
    {
        var wishlist = await _gameRepository.GetWishlistAsync(cancellationToken);
        var responses = wishlist.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<GameResponse>>(responses);
    }

    public async Task<Result<GameResponse>> AddWishlistGameAsync(
        WishGameRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure<GameResponse>(Error.Validation("Game.InvalidName", "Pelin nimi on pakollinen."));
        }

        if (!Enum.TryParse<GamingPlatform>(request.Platform, true, out var platform))
        {
            platform = GamingPlatform.PC;
        }

        try
        {
            var game = Game.Create(
                GameId.New(),
                request.Name,
                platform,
                request.Description,
                isWishlist: true);

            await _gameRepository.AddAsync(game, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Uusi toivelistapeli {GameId} lisätty.", game.Id.Value);

            return Result.Success(MapToResponse(game));
        }
        catch (DomainException ex)
        {
            return Result.Failure<GameResponse>(Error.Validation("Game.DomainError", ex.Message));
        }
    }

    public async Task<Result<GameResponse>> CreateGameAsync(
        CreateGameRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<GameResponse>(Error.Forbidden("Game.Forbidden", "Vain ylläpitäjä voi lisätä virallisia pelejä valikoimaan."));
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure<GameResponse>(Error.Validation("Game.InvalidName", "Pelin nimi on pakollinen."));
        }

        if (!Enum.TryParse<GamingPlatform>(request.Platform, true, out var platform))
        {
            platform = GamingPlatform.PC;
        }

        try
        {
            var game = Game.Create(
                GameId.New(),
                request.Name,
                platform,
                request.Description,
                request.IsWishlist);

            await _gameRepository.AddAsync(game, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Peli {GameId} lisätty valikoimaan Adminin {UserId} toimesta.", game.Id.Value, user.Id.Value);

            return Result.Success(MapToResponse(game));
        }
        catch (DomainException ex)
        {
            return Result.Failure<GameResponse>(Error.Validation("Game.DomainError", ex.Message));
        }
    }

    public async Task<Result<GameResponse>> ToggleWishlistStatusAsync(
        Guid gameId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<GameResponse>(Error.Forbidden("Game.Forbidden", "Vain ylläpitäjä voi hyväksyä toivelistapelejä pelivalikoimaan."));
        }

        var game = await _gameRepository.GetByIdAsync(new GameId(gameId), cancellationToken);
        if (game is null)
        {
            return Result.Failure<GameResponse>(Error.NotFound("Game.NotFound", "Peliä ei löytynyt."));
        }

        if (game.IsWishlist)
        {
            game.MarkAsAvailable();
        }
        else
        {
            game.MarkAsWishlist();
        }

        await _gameRepository.UpdateAsync(game, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pelin {GameId} toivelistatila muutettu Adminin {UserId} toimesta: IsWishlist={IsWishlist}",
            game.Id.Value, user.Id.Value, game.IsWishlist);

        return Result.Success(MapToResponse(game));
    }

    public async Task<Result<GameResponse>> UpvoteWishlistGameAsync(Guid gameId, CancellationToken cancellationToken = default)
    {
        var game = await _gameRepository.GetByIdAsync(new GameId(gameId), cancellationToken);
        if (game is null)
        {
            return Result.Failure<GameResponse>(Error.NotFound("Game.NotFound", "Peliä ei löytynyt."));
        }

        game.Upvote();
        await _gameRepository.UpdateAsync(game, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pelin {GameId} toiveääni lisätty, uusi määrä: {Votes}", game.Id.Value, game.VotesCount);

        return Result.Success(MapToResponse(game));
    }

    private static GameResponse MapToResponse(Game game)
    {
        return new GameResponse(
            game.Id.Value,
            game.Name,
            game.Platform.ToString(),
            game.Description,
            game.IsWishlist,
            game.VotesCount);
    }
}
