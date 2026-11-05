using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="GameRoom"/>-entiteetin tietokantataulun rakenteen, relaatiot ja arvokonversiot.
/// </summary>
public sealed class GameRoomConfiguration : IEntityTypeConfiguration<GameRoom>
{
    /// <summary>
    /// Konfiguroi <see cref="GameRoom"/>-entiteetin sarakkeet, pelipisterelaation ja optimistisen rivilukituksen.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<GameRoom> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("game_rooms");

        builder.HasKey(r => r.Id);

        // Muunnetaan vahvasti tyypitetty GameRoomId-arvo-objekti tietokannan Guid-arvoksi
        builder.Property(r => r.Id)
            .HasConversion(id => id.Value, value => new GameRoomId(value));

        builder.Property(r => r.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(r => r.HasSharedTv)
            .IsRequired();

        // Yhden suhde moneen -relaatio pelipisteisiin kaskadipoistolla
        builder.HasMany(r => r.Stations)
            .WithOne()
            .HasForeignKey("GameRoomId")
            .OnDelete(DeleteBehavior.Cascade);

        // Otetaan käyttöön optimistinen rivilukitus PostgreSQL xmin-sarakkeella
        builder.UseXminAsConcurrencyToken();
    }
}
