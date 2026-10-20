using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

public sealed class GameRoomConfiguration : IEntityTypeConfiguration<GameRoom>
{
    public void Configure(EntityTypeBuilder<GameRoom> builder)
    {
        builder.ToTable("game_rooms");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasConversion(id => id.Value, value => new GameRoomId(value));

        builder.Property(r => r.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(r => r.HasSharedTv)
            .IsRequired();

        builder.HasMany(r => r.Stations)
            .WithOne()
            .HasForeignKey("GameRoomId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}
