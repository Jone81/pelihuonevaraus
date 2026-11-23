using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Infrastructure.Outbox;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

/// <summary>
/// Määrittelee <see cref="OutboxMessage"/>-entiteetin tietokantataulun rakenteen ja indeksit
/// Transactional Outbox -viestien tallennusta varten.
/// </summary>
public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    /// <summary>
    /// Konfiguroi <c>outbox_messages</c>-taulun sarakkeet, tietotyypit ja käsittelyindeksin.
    /// </summary>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        // Määritetään taulun nimi ja pääavain
        builder.ToTable("outbox_messages");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Type)
            .HasMaxLength(255)
            .IsRequired();

        // JSON-muotoinen tapahtumasisältö tallennetaan tekstikenttänä
        builder.Property(o => o.Content)
            .HasColumnType("text")
            .IsRequired();

        builder.Property(o => o.OccurredOnUtc)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(o => o.ProcessedOnUtc)
            .HasColumnType("timestamptz");

        builder.Property(o => o.Error)
            .HasColumnType("text");

        // Indeksi nopeuttamaan käsittelemättömien viestien hakua taustaprosessoinnissa
        builder.HasIndex(o => o.ProcessedOnUtc);
    }
}
