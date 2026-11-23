using Pelihuone.Domain.Common;
using Pelihuone.Domain.Exceptions;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

/// <summary>
/// Edustaa pelihuoneen etusivulla julkaistavaa uutista tai tiedotetta.
/// </summary>
public sealed class News : Entity<NewsId>
{
    /// <summary>
    /// Uutisen tai tiedotteen otsikko.
    /// </summary>
    public string Title { get; private set; }

    /// <summary>
    /// Uutisen varsinainen sisältöteksti.
    /// </summary>
    public string Content { get; private set; }

    /// <summary>
    /// Uutisen julkaisseen ylläpitäjän käyttäjätunniste.
    /// </summary>
    public UserId AuthorUserId { get; private set; }

    /// <summary>
    /// Uutisen julkaisuhetken UTC-aikaleima.
    /// </summary>
    public DateTimeOffset CreatedAtUtc { get; private set; }

    /// <summary>
    /// Ilmaisee, onko uutinen kiinnitetty listan kärkeen tärkeänä tiedotteena.
    /// </summary>
    public bool IsPinned { get; private set; }

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
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

    /// <summary>
    /// Luo uuden uutisen ja validoi, etteivät otsikko ja sisältö ole tyhjiä.
    /// </summary>
    /// <param name="id">Uutisen yksilöivä tunniste.</param>
    /// <param name="title">Uutisen otsikko.</param>
    /// <param name="content">Uutisen sisältö.</param>
    /// <param name="authorUserId">Julkaisijan käyttäjätunniste.</param>
    /// <param name="createdAtUtc">Luontihetken UTC-aikaleima.</param>
    /// <param name="isPinned">Kiinnitetäänkö uutinen listan alkuun.</param>
    /// <returns>Validoitu <see cref="News"/>-entiteetti.</returns>
    public static News Create(
        NewsId id,
        string title,
        string content,
        UserId authorUserId,
        DateTimeOffset createdAtUtc,
        bool isPinned = false)
    {
        // Domain-sääntö: Uutisella on oltava sekä otsikko että sisältö.
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

    /// <summary>
    /// Päivittää olemassa olevan uutisen otsikon, sisällön ja kiinnitystilan.
    /// </summary>
    /// <param name="title">Päivitetty otsikko.</param>
    /// <param name="content">Päivitetty sisältö.</param>
    /// <param name="isPinned">Päivitetty kiinnitystila.</param>
    public void Update(string title, string content, bool isPinned)
    {
        // Varmistetaan, etteivät päivitetyt arvot ole tyhjiä.
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
