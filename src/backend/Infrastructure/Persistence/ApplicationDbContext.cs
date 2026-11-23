using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Domain.Models;
using Pelihuone.Infrastructure.Outbox;

namespace Pelihuone.Infrastructure.Persistence;

/// <summary>
/// Sovelluksen pääasiallinen Entity Framework Core -tietokantakonteksti ja <see cref="IUnitOfWork"/>-toteutus,
/// joka hallinnoi domain-entiteettien tietokantatauluja ja tallennustransaktioita.
/// </summary>
public class ApplicationDbContext : DbContext, IUnitOfWork
{
    /// <summary>
    /// Alustaa uuden <see cref="ApplicationDbContext"/>-instanssin annetuilla tietokanta-asetuksilla.
    /// </summary>
    /// <param name="options">Tietokantakontekstin konfiguraatioasetukset.</param>
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Varausten tietokantajoukko.
    /// </summary>
    public DbSet<Reservation> Reservations => Set<Reservation>();

    /// <summary>
    /// Pelipisteiden tietokantajoukko.
    /// </summary>
    public DbSet<GamingStation> GamingStations => Set<GamingStation>();

    /// <summary>
    /// Pelitilojen tietokantajoukko.
    /// </summary>
    public DbSet<GameRoom> GameRooms => Set<GameRoom>();

    /// <summary>
    /// Käyttäjien tietokantajoukko.
    /// </summary>
    public DbSet<User> Users => Set<User>();

    /// <summary>
    /// Pelien ja toivelistan tietokantajoukko.
    /// </summary>
    public DbSet<Game> Games => Set<Game>();

    /// <summary>
    /// Uutisten ja tiedotteiden tietokantajoukko.
    /// </summary>
    public DbSet<News> News => Set<News>();

    /// <summary>
    /// Vikailmoitusten tietokantajoukko.
    /// </summary>
    public DbSet<IssueReport> IssueReports => Set<IssueReport>();

    /// <summary>
    /// Transactional Outbox -viestien tietokantajoukko.
    /// </summary>
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    /// <summary>
    /// Konfiguroi tietokantamallin, PostgreSQL-laajennukset sekä hakee kaikki entiteettikohtaiset
    /// <see cref="IEntityTypeConfiguration{TEntity}"/>-määritykset tästä kokoonpanosta.
    /// </summary>
    /// <param name="modelBuilder">EF Coren mallinrakentaja.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // PostgreSQL btree_gist -laajennus aikavälilukituksille ja indekseille
        if (Database.IsNpgsql())
        {
            modelBuilder.HasPostgresExtension("btree_gist");
        }

        // Ladataan kaikki entiteettikonfiguraatiot automaattisesti Infrastructure-kokoonpanosta
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
