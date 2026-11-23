namespace Pelihuone.Contracts.Issues;

/// <summary>
/// Pyynnön tietomalli uuden vikailmoituksen lähettämiseksi.
/// </summary>
/// <param name="ReporterEmail">Ilmoittajan sähköpostiosoite (valinnainen, jos poimitaan istunnosta).</param>
/// <param name="ReporterName">Ilmoittajan nimi (valinnainen, jos poimitaan istunnosta).</param>
/// <param name="Target">Vikailmoituksen kohde (esim. laitteen nimi tai yleinen tila).</param>
/// <param name="Title">Vikailmoituksen lyhyt otsikko.</param>
/// <param name="Description">Tarkempi kuvaus havaitusta viasta.</param>
public sealed record CreateIssueReportRequest(
    string? ReporterEmail,
    string? ReporterName,
    string Target,
    string Title,
    string Description);

/// <summary>
/// Vastausmalli, joka sisältää tallennetun vikailmoituksen tiedot ja ratkaisutilan.
/// </summary>
/// <param name="Id">Vikailmoituksen yksilöivä tunniste.</param>
/// <param name="ReporterEmail">Ilmoittajan sähköpostiosoite.</param>
/// <param name="ReporterName">Ilmoittajan nimi.</param>
/// <param name="Target">Vikailmoituksen kohde.</param>
/// <param name="Title">Vikailmoituksen otsikko.</param>
/// <param name="Description">Vikailmoituksen tarkka kuvaus.</param>
/// <param name="CreatedAt">Vikailmoituksen luontiaika.</param>
/// <param name="IsResolved">Ilmaisee, onko vikailmoitus ratkaistu.</param>
/// <param name="ResolvedAt">Ratkaisuhetken aikaleima, jos ratkaistu.</param>
/// <param name="AdminNotes">Ylläpitäjän kirjaamat muistiinpanot ratkaisusta.</param>
public sealed record IssueReportResponse(
    Guid Id,
    string ReporterEmail,
    string ReporterName,
    string Target,
    string Title,
    string Description,
    DateTimeOffset CreatedAt,
    bool IsResolved,
    DateTimeOffset? ResolvedAt,
    string? AdminNotes);

/// <summary>
/// Pyynnön tietomalli vikailmoituksen merkitsemiseksi ratkaistuksi.
/// </summary>
/// <param name="AdminNotes">Ylläpitäjän valinnaiset muistiinpanot tehdyistä korjaustoimenpiteistä.</param>
public sealed record ResolveIssueReportRequest(
    string? AdminNotes);
