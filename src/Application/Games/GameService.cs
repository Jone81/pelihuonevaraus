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

/// <summary>
/// Toteuttaa pelivalikoiman ja toivelistapelien käsittelyn liiketoimintalogiikan.
/// </summary>
public sealed class GameService : IGameService
{
    private readonly IGameRepository _gameRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GameService> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="GameService"/>-instanssin.
    /// </summary>
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

    /// <summary>
    /// Hakee kaikki järjestelmään tallennetut pelit ja muuntaa ne vastausmalleiksi.
    /// </summary>
    public async Task<Result<IReadOnlyList<GameResponse>>> GetAllGamesAsync(CancellationToken cancellationToken = default)
    {
        // Haetaan kaikki pelit tietovarastosta ja muunnetaan ne DTO-malleiksi
        var games = await _gameRepository.GetAllAsync(cancellationToken);
        var responses = games.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<GameResponse>>(responses);
    }

    /// <summary>
    /// Hakee tietylle alustalle kuuluvat pelit.
    /// </summary>
    public async Task<Result<IReadOnlyList<GameResponse>>> GetGamesByPlatformAsync(
        GamingPlatform platform,
        CancellationToken cancellationToken = default)
    {
        // Suodatetaan pelit valitun pelialustan mukaan
        var games = await _gameRepository.GetByPlatformAsync(platform, cancellationToken);
        var responses = games.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<GameResponse>>(responses);
    }

    /// <summary>
    /// Hakee kaikki toivelistalla olevat pelit.
    /// </summary>
    public async Task<Result<IReadOnlyList<GameResponse>>> GetWishlistAsync(CancellationToken cancellationToken = default)
    {
        // Haetaan opiskelijoiden toivomat pelit tietovarastosta
        var wishlist = await _gameRepository.GetWishlistAsync(cancellationToken);
        var responses = wishlist.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<GameResponse>>(responses);
    }

    /// <summary>
    /// Lisää uuden pelitoiveen toivelistalle.
    /// </summary>
    public async Task<Result<GameResponse>> AddWishlistGameAsync(
        WishGameRequest request,
        CancellationToken cancellationToken = default)
    {
        // Varmistetaan, että pelin nimi on annettu
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure<GameResponse>(Error.Validation("Game.InvalidName", "Pelin nimi on pakollinen."));
        }

        // Jäsennetään pelialusta tai käytetään oletuksena PC-alustaa
        if (!Enum.TryParse<GamingPlatform>(request.Platform, true, out var platform))
        {
            platform = GamingPlatform.PC;
        }

        try
        {
            // Luodaan uusi peli toivelistatilassa ja tallennetaan tietokantaan
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
            // Käsitellään toimialuekerroksen validointivirheet hallitusti
            return Result.Failure<GameResponse>(Error.Validation("Game.DomainError", ex.Message));
        }
    }

    /// <summary>
    /// Luo uuden virallisen pelin tai toivelistapelin ylläpitäjän toimesta.
    /// </summary>
    public async Task<Result<GameResponse>> CreateGameAsync(
        CreateGameRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Tarkistetaan, että kutsuja on ylläpitäjä
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<GameResponse>(Error.Forbidden("Game.Forbidden", "Vain ylläpitäjä voi lisätä virallisia pelejä valikoimaan."));
        }

        // Validoidaan pakollinen pelin nimi
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure<GameResponse>(Error.Validation("Game.InvalidName", "Pelin nimi on pakollinen."));
        }

        // Jäsennetään pelialusta tai asetetaan oletukseksi PC
        if (!Enum.TryParse<GamingPlatform>(request.Platform, true, out var platform))
        {
            platform = GamingPlatform.PC;
        }

        try
        {
            // Luodaan peli-entiteetti ja tallennetaan muutokset
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

    /// <summary>
    /// Vaihtaa pelin tilan toivelistan ja saatavilla olevan pelivalikoiman välillä (vain ylläpitäjille).
    /// </summary>
    public async Task<Result<GameResponse>> ToggleWishlistStatusAsync(
        Guid gameId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Tarkistetaan ylläpitäjäoikeudet
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<GameResponse>(Error.Forbidden("Game.Forbidden", "Vain ylläpitäjä voi hyväksyä toivelistapelejä pelivalikoimaan."));
        }

        // Haetaan muokattava peli tietokannasta
        var game = await _gameRepository.GetByIdAsync(new GameId(gameId), cancellationToken);
        if (game is null)
        {
            return Result.Failure<GameResponse>(Error.NotFound("Game.NotFound", "Peliä ei löytynyt."));
        }

        // Vaihdetaan pelin tila toivelistalta saataville tai päinvastoin
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

    /// <summary>
    /// Kasvattaa toivelistapelin äänimäärää yhdellä.
    /// </summary>
    public async Task<Result<GameResponse>> UpvoteWishlistGameAsync(Guid gameId, CancellationToken cancellationToken = default)
    {
        // Haetaan äänestettävä peli
        var game = await _gameRepository.GetByIdAsync(new GameId(gameId), cancellationToken);
        if (game is null)
        {
            return Result.Failure<GameResponse>(Error.NotFound("Game.NotFound", "Peliä ei löytynyt."));
        }

        // Lisätään ääni ja tallennetaan muutos
        game.Upvote();
        await _gameRepository.UpdateAsync(game, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pelin {GameId} toiveääni lisätty, uusi määrä: {Votes}", game.Id.Value, game.VotesCount);

        return Result.Success(MapToResponse(game));
    }

    // Muuntaa toimialueen Game-entiteetin rajapinnan GameResponse-tiedonsiirto-olioksi
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
