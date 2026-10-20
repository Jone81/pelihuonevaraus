using Pelihuone.Domain.Common;
using Pelihuone.Domain.Exceptions;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

public sealed class News : Entity<NewsId>
{
    public string Title { get; private set; }
    public string Content { get; private set; }
    public UserId AuthorUserId { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public bool IsPinned { get; private set; }

#pragma warning disable CS8618
    private News() : base(NewsId.Empty)
    {
    }
#pragma warning restore CS8618

    private News(
        NewsId id,
        string title,
        string content,
        UserId authorUserId,
        DateTimeOffset createdAtUtc,
        bool isPinned)
        : base(id)
    {
        Title = title;
        Content = content;
        AuthorUserId = authorUserId;
        CreatedAtUtc = createdAtUtc;
        IsPinned = isPinned;
    }

    public static News Create(
        NewsId id,
        string title,
        string content,
        UserId authorUserId,
        DateTimeOffset createdAtUtc,
        bool isPinned = false)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Uutisen otsikko ei voi olla tyhjä.");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new DomainException("Uutisen sisältö ei voi olla tyhjä.");
        }

        return new News(id, title.Trim(), content.Trim(), authorUserId, createdAtUtc, isPinned);
    }

    public void Update(string title, string content, bool isPinned)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Uutisen otsikko ei voi olla tyhjä.");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new DomainException("Uutisen sisältö ei voi olla tyhjä.");
        }

        Title = title.Trim();
        Content = content.Trim();
        IsPinned = isPinned;
    }
}
