namespace Pelihuone.Contracts.News;

public sealed record NewsResponse(
    Guid Id,
    string Title,
    string Content,
    Guid AuthorUserId,
    DateTimeOffset CreatedAtUtc,
    bool IsPinned);
