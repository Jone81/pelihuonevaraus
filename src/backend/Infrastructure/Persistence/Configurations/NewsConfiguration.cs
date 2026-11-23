using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="News"/>-entiteetin tietokantataulun rakenteen, rajoitteet ja arvokonversiot.
/// </summary>
public sealed class NewsConfiguration : IEntityTypeConfiguration<News>
{
    /// <summary>
    /// Konfiguroi <see cref="News"/>-entiteetin sarakkeet, aikaleimatyypin ja optimistisen rivilukituksen.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<News> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("news");

        builder.HasKey(n => n.Id);

        // Muunnetaan vahvasti tyypitetty NewsId-arvo-objekti tietokannan Guid-arvoksi
        builder.Property(n => n.Id)
            .HasConversion(id => id.Value, value => new NewsId(value));

        builder.Property(n => n.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(n => n.Content)
            .HasMaxLength(4000)
            .IsRequired();

        // Muunnetaan kirjoittajan UserId-arvo-objekti tietokannan Guid-arvoksi
        builder.Property(n => n.AuthorUserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .IsRequired();

        // Tallennetaan luontiaika aikavyöhykkeellisenä aikaleimana (timestamptz)
        builder.Property(n => n.CreatedAtUtc)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(n => n.IsPinned)
            .IsRequired();

        // Otetaan käyttöön optimistinen rivilukitus PostgreSQL xmin-sarakkeella
        builder.UseXminAsConcurrencyToken();
    }
}
