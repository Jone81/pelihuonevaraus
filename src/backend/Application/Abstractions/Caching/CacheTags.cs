namespace Pelihuone.Application.Abstractions.Caching;

/// <summary>
/// Keskitetyt välimuistitunnisteet (tagit) kyselytulosten ryhmäkohtaiseen invalidoimiseen.
/// </summary>
public static class CacheTags
{
    /// <summary>
    /// Välimuistitunniste pelipisteitä koskeville kyselyille.
    /// </summary>
    public const string Stations = "stations";

    /// <summary>
    /// Välimuistitunniste pelikirjastoa koskeville kyselyille.
    /// </summary>
    public const string Games = "games";

    /// <summary>
    /// Välimuistitunniste tiedotteita koskeville kyselyille.
    /// </summary>
    public const string News = "news";

    /// <summary>
    /// Välimuistitunniste sivuston asetuksia koskeville kyselyille.
    /// </summary>
    public const string Settings = "settings";

    /// <summary>
    /// Välimuistitunniste tilastoja koskeville kyselyille.
    /// </summary>
    public const string Statistics = "statistics";
}
