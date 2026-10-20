using Microsoft.Extensions.Logging;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.News;
using Pelihuone.Domain.Common;
using Pelihuone.Domain.ValueObjects;
using NewsEntity = Pelihuone.Domain.Models.News;

namespace Pelihuone.Application.News;

public sealed class NewsService : INewsService
{
    private readonly INewsRepository _newsRepository;
    private readonly IUserRepository _userRepository;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<NewsService> _logger;

    public NewsService(
        INewsRepository newsRepository,
        IUserRepository userRepository,
        IDateTimeProvider dateTimeProvider,
        IUnitOfWork unitOfWork,
        ILogger<NewsService> logger)
    {
        _newsRepository = newsRepository;
        _userRepository = userRepository;
        _dateTimeProvider = dateTimeProvider;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<IReadOnlyList<NewsResponse>>> GetAllNewsAsync(CancellationToken cancellationToken = default)
    {
        var newsList = await _newsRepository.GetAllAsync(cancellationToken);
        var responses = newsList.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<NewsResponse>>(responses);
    }

    public async Task<Result<NewsResponse>> CreateNewsAsync(
        CreateNewsRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<NewsResponse>(Error.Forbidden("News.Forbidden", "Vain ylläpitäjä (Admin) voi luoda uutisia ja tiedotteita."));
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Result.Failure<NewsResponse>(Error.Validation("News.InvalidTitle", "Uutisen otsikko on pakollinen."));
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return Result.Failure<NewsResponse>(Error.Validation("News.InvalidContent", "Uutisen sisältö on pakollinen."));
        }

        try
        {
            var now = _dateTimeProvider.UtcNow;
            var news = NewsEntity.Create(
                NewsId.New(),
                request.Title,
                request.Content,
                user.Id,
                now,
                request.IsPinned);

            await _newsRepository.AddAsync(news, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Uusi tiedote {NewsId} julkaistu käyttäjän {UserId} toimesta.", news.Id.Value, user.Id.Value);

            return Result.Success(MapToResponse(news));
        }
        catch (DomainException ex)
        {
            return Result.Failure<NewsResponse>(Error.Validation("News.DomainError", ex.Message));
        }
    }

    public async Task<Result<bool>> DeleteNewsAsync(
        Guid newsId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<bool>(Error.Forbidden("News.Forbidden", "Vain ylläpitäjä voi poistaa tiedotteita."));
        }

        var news = await _newsRepository.GetByIdAsync(new NewsId(newsId), cancellationToken);
        if (news is null)
        {
            return Result.Failure<bool>(Error.NotFound("News.NotFound", "Uutista ei löytynyt."));
        }

        await _newsRepository.DeleteAsync(news, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Tiedote {NewsId} poistettu käyttäjän {UserId} toimesta.", newsId, user.Id.Value);

        return Result.Success(true);
    }

    private static NewsResponse MapToResponse(NewsEntity news)
    {
        return new NewsResponse(
            news.Id.Value,
            news.Title,
            news.Content,
            news.AuthorUserId.Value,
            news.CreatedAtUtc,
            news.IsPinned);
    }
}
