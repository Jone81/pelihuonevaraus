namespace Pelihuone.Contracts.News;

/// <summary>
/// Pyynnön tietomalli olemassa olevan uutisen tai tiedotteen päivittämiseksi.
/// </summary>
/// <param name="Title">Tiedotteen päivitetty otsikko.</param>
/// <param name="Content">Tiedotteen päivitetty sisältöteksti.</param>
/// <param name="IsPinned">Kiinnitetäänkö tiedote uutislistan kärkeen ja yläbanneriin.</param>
public sealed record UpdateNewsRequest(
    string Title,
    string Content,
    bool IsPinned = false);
