using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

public sealed class GameConfiguration : IEntityTypeConfiguration<Game>
{
    public void Configure(EntityTypeBuilder<Game> builder)
    {
        builder.ToTable("games");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Id)
            .HasConversion(id => id.Value, value => new GameId(value));

        builder.Property(g => g.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(g => g.Platform)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(g => g.Description)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(g => g.IsWishlist)
            .IsRequired();

        builder.Property(g => g.VotesCount)
            .HasDefaultValue(0)
            .IsRequired();

        builder.UseXminAsConcurrencyToken();
    }
}
