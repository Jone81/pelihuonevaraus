namespace Pelihuone.Contracts.News;

public sealed record CreateNewsRequest(
    string Title,
    string Content,
    Guid AuthorUserId,
    bool IsPinned = false);
