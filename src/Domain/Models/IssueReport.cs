using Pelihuone.Domain.Common;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

/// <summary>
/// Edustaa käyttäjän tekemää vikailmoitusta tai palautetta pelihuoneen laitteista tai tilasta.
/// </summary>
public sealed class IssueReport : Entity<IssueReportId>
{
    /// <summary>
    /// Ilmoittajan sähköpostiosoite.
    /// </summary>
    public string ReporterEmail { get; private set; }

    /// <summary>
    /// Ilmoittajan nimi.
    /// </summary>
    public string ReporterName { get; private set; }

    /// <summary>
    /// Vikailmoituksen kohde (esim. tietty pelipiste tai yleinen tila).
    /// </summary>
    public string Target { get; private set; }

    /// <summary>
    /// Vikailmoituksen lyhyt otsikko.
    /// </summary>
    public string Title { get; private set; }

    /// <summary>
    /// Tarkempi kuvaus havaitusta viasta tai ongelmasta.
    /// </summary>
    public string Description { get; private set; }

    /// <summary>
    /// Vikailmoituksen luontiaika.
    /// </summary>
    public DateTimeOffset CreatedAt { get; private set; }

    /// <summary>
    /// Ilmaisee, onko ylläpito merkinnyt vikailmoituksen ratkaistuksi.
    /// </summary>
    public bool IsResolved { get; private set; }

    /// <summary>
    /// Aikaleima sille hetkelle, jolloin vikailmoitus ratkaistiin.
    /// </summary>
    public DateTimeOffset? ResolvedAt { get; private set; }

    /// <summary>
    /// Ylläpitäjän kirjaamat muistiinpanot tai toimenpiteet vian ratkaisemiseksi.
    /// </summary>
    public string? AdminNotes { get; private set; }

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
    private IssueReport() : base(IssueReportId.Empty)
    {
    }
#pragma warning restore CS8618

    private IssueReport(
        IssueReportId id,
        string reporterEmail,
        string reporterName,
        string target,
        string title,
        string description,
        DateTimeOffset createdAt)
        : base(id)
    {
        ReporterEmail = reporterEmail;
        ReporterName = reporterName;
        Target = target;
        Title = title;
        Description = description;
        CreatedAt = createdAt;
        IsResolved = false;
        ResolvedAt = null;
        AdminNotes = null;
    }

    /// <summary>
    /// Luo uuden vikailmoituksen ja tarkistaa, että kohde, otsikko ja kuvaus on annettu.
    /// </summary>
    /// <param name="id">Vikailmoituksen yksilöivä tunniste.</param>
    /// <param name="reporterEmail">Ilmoittajan sähköpostiosoite.</param>
    /// <param name="reporterName">Ilmoittajan nimi.</param>
    /// <param name="target">Vikailmoituksen kohde.</param>
    /// <param name="title">Vikailmoituksen otsikko.</param>
    /// <param name="description">Vikailmoituksen tarkempi kuvaus.</param>
    /// <param name="createdAt">Luontihetken aikaleima.</param>
    /// <returns>Validoitu <see cref="IssueReport"/>-entiteetti.</returns>
    public static IssueReport Create(
        IssueReportId id,
        string reporterEmail,
        string reporterName,
        string target,
        string title,
        string description,
        DateTimeOffset createdAt)
    {
        // Domain-sääntö: Vikailmoituksella on aina oltava kohde, otsikko ja kuvaus.
        if (string.IsNullOrWhiteSpace(target))
        {
            throw new DomainException("Kohteen (esim. laite tai tila) määrittely on pakollinen.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Vikailmoituksen otsikko ei voi olla tyhjä.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new DomainException("Vikailmoituksen kuvaus ei voi olla tyhjä.");
        }

        return new IssueReport(
            id,
            reporterEmail.Trim(),
            reporterName.Trim(),
            target.Trim(),
            title.Trim(),
            description.Trim(),
            createdAt);
    }

    /// <summary>
    /// Merkitsee vikailmoituksen ratkaistuksi ja tallentaa ylläpidon mahdolliset kommentit.
    /// </summary>
    /// <param name="adminNotes">Ylläpidon muistiinpanot ratkaisusta.</param>
    /// <param name="resolvedAt">Ratkaisuhetken aikaleima.</param>
    public void Resolve(string? adminNotes, DateTimeOffset resolvedAt)
    {
        // Päivitetään vikailmoituksen tila ratkaistuksi ja siistitään mahdollinen muistiinpanoteksti.
        IsResolved = true;
        ResolvedAt = resolvedAt;
        AdminNotes = string.IsNullOrWhiteSpace(adminNotes) ? null : adminNotes.Trim();
    }
}
