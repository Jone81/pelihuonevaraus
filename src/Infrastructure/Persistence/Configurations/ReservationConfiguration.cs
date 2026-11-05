using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="Reservation"/>-entiteetin tietokantataulun rakenteen, omistetun aikaväliobjektin,
/// indeksit sekä optimistisen rivilukituksen.
/// </summary>
public sealed class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    /// <summary>
    /// Konfiguroi <see cref="Reservation"/>-entiteetin sarakkeet, arvokonversiot, <see cref="TimeWindow"/>-arvo-objektin
    /// sarakkeet, rinnakkaisuudenhallinnan ja hakuindeksit.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("reservations");

        builder.HasKey(r => r.Id);

        // Muunnetaan vahvasti tyypitetyt tunnisteet tietokannan Guid-arvoiksi
        builder.Property(r => r.Id)
            .HasConversion(id => id.Value, value => new ReservationId(value));

        builder.Property(r => r.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .IsRequired();

        // Pelipisteen tunniste on valinnainen (esim. koko pelitilan tai tapahtuman varauksissa null)
        builder.Property(r => r.GamingStationId)
            .HasConversion(
                id => id.HasValue ? id.Value.Value : (Guid?)null,
                value => value.HasValue ? new GamingStationId(value.Value) : null);

        // Varauksen tyyppi ja tila tallennetaan kokonaislukuina
        builder.Property(r => r.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(r => r.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(r => r.CreatedAtUtc)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(r => r.CancelledAtUtc)
            .HasColumnType("timestamptz");

        builder.Property(r => r.CancellationReason)
            .HasMaxLength(500);

        // Määritetään TimeWindow omistetuksi arvo-objektiksi (Owned Entity) samalle taululle
        builder.OwnsOne(r => r.TimeWindow, tw =>
        {
            tw.Property(t => t.StartUtc)
                .HasColumnName("start_utc")
                .HasColumnType("timestamptz")
                .IsRequired();

            tw.Property(t => t.EndUtc)
                .HasColumnName("end_utc")
                .HasColumnType("timestamptz")
                .IsRequired();
        });

        // Optimistinen rivilukitus PostgreSQL xmin-sarakkeella
        builder.UseXminAsConcurrencyToken();

        // Indeksit konfliktitarkistuksille ja aikavälihauille
        builder.HasIndex(r => new { r.GamingStationId, r.Status });
        builder.HasIndex(r => r.Status);
    }
}
