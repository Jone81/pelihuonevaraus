namespace Pelihuone.Contracts.News;

/// <summary>
/// Vastausmalli, joka sisältää julkaistun uutisen tiedot.
/// </summary>
/// <param name="Id">Uutisen yksilöivä tunniste.</param>
/// <param name="Title">Uutisen otsikko.</param>
/// <param name="Content">Uutisen sisältöteksti.</param>
/// <param name="AuthorUserId">Uutisen julkaisseen käyttäjän tunniste.</param>
/// <param name="CreatedAtUtc">Julkaisuhetken UTC-aikaleima.</param>
/// <param name="IsPinned">Ilmaisee, onko uutinen kiinnitetty listan alkuun.</param>
public sealed record NewsResponse(
    Guid Id,
    string Title,
    string Content,
    Guid AuthorUserId,
    DateTimeOffset CreatedAtUtc,
    bool IsPinned);
