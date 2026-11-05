using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="User"/>-entiteetin tietokantataulun rakenteen, yksilöllisen sähköposti-indeksin
/// ja arvokonversiot.
/// </summary>
public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    /// <summary>
    /// Konfiguroi <see cref="User"/>-entiteetin sarakkeet, <see cref="SchoolEmail"/>-konversion,
    /// lasketut rooliominaisuudet ja optimistisen rivilukituksen.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        // Muunnetaan vahvasti tyypitetty UserId-arvo-objekti tietokannan Guid-arvoksi
        builder.Property(u => u.Id)
            .HasConversion(id => id.Value, value => new UserId(value));

        // Muunnetaan SchoolEmail-arvo-objekti merkkijonoksi ja varmistetaan sen yksilöllisyys
        builder.Property(u => u.Email)
            .HasConversion(e => e.Value, value => SchoolEmail.Create(value))
            .HasMaxLength(255)
            .IsRequired();

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.DisplayName)
            .HasMaxLength(100)
            .IsRequired();

        // Tallennetaan käyttäjärooli (enum) kokonaislukuna
        builder.Property(u => u.Role)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(u => u.CreatedAtUtc)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Jätetään lasketut apuominaisuudet pois tietokantataulusta
        builder.Ignore(u => u.IsSuperAdmin);
        builder.Ignore(u => u.IsAdmin);

        // Otetaan käyttöön optimistinen rivilukitus PostgreSQL xmin-sarakkeella
        builder.UseXminAsConcurrencyToken();
    }
}
