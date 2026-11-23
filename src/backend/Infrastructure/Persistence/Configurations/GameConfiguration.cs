using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="Game"/>-entiteetin tietokantataulun rakenteen, rajoitteet ja arvokonversiot.
/// </summary>
public sealed class GameConfiguration : IEntityTypeConfiguration<Game>
{
    /// <summary>
    /// Konfiguroi <see cref="Game"/>-entiteetin sarakkeet, pääavaimen ja optimistisen rivilukituksen.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<Game> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("games");

        builder.HasKey(g => g.Id);

        // Muunnetaan vahvasti tyypitetty GameId-arvo-objekti tietokannan Guid-arvoksi ja takaisin
        builder.Property(g => g.Id)
            .HasConversion(id => id.Value, value => new GameId(value));

        // Pelin nimen maksimipituus ja pakollisuus
        builder.Property(g => g.Name)
            .HasMaxLength(150)
            .IsRequired();

        // Tallennetaan pelialusta (enum) kokonaislukuna tietokantaan
        builder.Property(g => g.Platform)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(g => g.Description)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(g => g.IsWishlist)
            .IsRequired();

        // Toivelistan äänimäärä oletusarvolla 0
        builder.Property(g => g.VotesCount)
            .HasDefaultValue(0)
            .IsRequired();

        // Otetaan käyttöön optimistinen rivilukitus PostgreSQL xmin-sarakkeella
        builder.UseXminAsConcurrencyToken();
    }
}
