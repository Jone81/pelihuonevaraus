using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="IssueReport"/>-entiteetin tietokantataulun rakenteen, rajoitteet ja arvokonversiot.
/// </summary>
public sealed class IssueReportConfiguration : IEntityTypeConfiguration<IssueReport>
{
    /// <summary>
    /// Konfiguroi <see cref="IssueReport"/>-entiteetin sarakkeet, pituusrajoitteet ja optimistisen rivilukituksen.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<IssueReport> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("issue_reports");

        builder.HasKey(i => i.Id);

        // Muunnetaan vahvasti tyypitetty IssueReportId-arvo-objekti tietokannan Guid-arvoksi
        builder.Property(i => i.Id)
            .HasConversion(id => id.Value, value => new IssueReportId(value));

        // Ilmoittajan tiedot ja vikailmoituksen kohde
        builder.Property(i => i.ReporterEmail)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(i => i.ReporterName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(i => i.Target)
            .HasMaxLength(100)
            .IsRequired();

        // Vikailmoituksen otsikko ja tarkempi kuvaus
        builder.Property(i => i.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Description)
            .HasMaxLength(4000)
            .IsRequired();

        // Aikaleimat ja ratkaisutila
        builder.Property(i => i.CreatedAt)
            .IsRequired();

        builder.Property(i => i.IsResolved)
            .IsRequired();

        builder.Property(i => i.ResolvedAt);

        builder.Property(i => i.AdminNotes)
            .HasMaxLength(2000);

        // Otetaan käyttöön optimistinen rivilukitus PostgreSQL xmin-sarakkeella
        builder.UseXminAsConcurrencyToken();
    }
}
