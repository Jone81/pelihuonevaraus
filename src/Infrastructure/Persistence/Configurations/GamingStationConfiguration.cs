using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="GamingStation"/>-entiteetin tietokantataulun rakenteen, rajoitteet ja arvokonversiot.
/// </summary>
public sealed class GamingStationConfiguration : IEntityTypeConfiguration<GamingStation>
{
    /// <summary>
    /// Konfiguroi <see cref="GamingStation"/>-entiteetin sarakkeet, lasketut ominaisuudet ja optimistisen rivilukituksen.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<GamingStation> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("gaming_stations");

        builder.HasKey(s => s.Id);

        // Muunnetaan vahvasti tyypitetty GamingStationId-arvo-objekti tietokannan Guid-arvoksi
        builder.Property(s => s.Id)
            .HasConversion(id => id.Value, value => new GamingStationId(value));

        builder.Property(s => s.Name)
            .HasMaxLength(100)
            .IsRequired();

        // Tallennetaan pelipisteen tyyppi (enum) kokonaislukuna
        builder.Property(s => s.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(s => s.IsActive)
            .IsRequired();

        // Jätetään laskettu UsesSharedTv-ominaisuus pois tietokantataulusta
        builder.Ignore(s => s.UsesSharedTv);

        // Otetaan käyttöön optimistinen rivilukitus PostgreSQL xmin-sarakkeella
        builder.UseXminAsConcurrencyToken();
    }
}
