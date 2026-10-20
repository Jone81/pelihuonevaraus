using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Domain.Models;
using Pelihuone.Infrastructure.Outbox;

namespace Pelihuone.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IUnitOfWork
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<GamingStation> GamingStations => Set<GamingStation>();
    public DbSet<GameRoom> GameRooms => Set<GameRoom>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<News> News => Set<News>();
    public DbSet<IssueReport> IssueReports => Set<IssueReport>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // PostgreSQL btree_gist -laajennus aikavälilukituksille ja indekseille
        if (Database.IsNpgsql())
        {
            modelBuilder.HasPostgresExtension("btree_gist");
        }

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
