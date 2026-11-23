namespace Pelihuone.Contracts.News;

/// <summary>
/// Pyynnön tietomalli uuden uutisen tai tiedotteen julkaisemiseksi.
/// </summary>
/// <param name="Title">Uutisen otsikko.</param>
/// <param name="Content">Uutisen sisältöteksti.</param>
/// <param name="AuthorUserId">Uutisen julkaisevan ylläpitäjän tunniste.</param>
/// <param name="IsPinned">Kiinnitetäänkö uutinen uutislistan kärkeen.</param>
public sealed record CreateNewsRequest(
    string Title,
    string Content,
    Guid AuthorUserId,
    bool IsPinned = false);
