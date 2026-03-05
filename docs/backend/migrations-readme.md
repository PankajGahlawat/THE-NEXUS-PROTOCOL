# NEXUS PROTOCOL - PostgreSQL Migration

## Overview

This directory contains PostgreSQL database schema and migration scripts for the NEXUS PROTOCOL cyber-war simulation game.

## Files

- `001_initial_schema.sql` - Complete PostgreSQL schema with tables, indexes, triggers, and initial data
- `../scripts/migrate-to-postgres.js` - Migration script from SQLite to PostgreSQL
- `../test/postgres-test.js` - PostgreSQL adapter test suite

## Database Schema

### Tables

1. **rounds** - Game round information with team assignments and scoring
2. **tasks** - Mission tasks with dependencies and completion tracking
3. **system_states** - Current state of target systems in cyber range
4. **events** - Comprehensive audit trail of all game actions
5. **agents** - Agent performance tracking and statistics
6. **tools** - Tool definitions and usage statistics
7. **tool_usage** - Individual tool usage event tracking
8. **scores** - Detailed scoring breakdown by event

### Key Features

- UUID primary keys for distributed systems
- JSONB columns for flexible data storage
- Comprehensive indexes for query performance
- Foreign key constraints for data integrity
- Check constraints for data validation
- Automatic timestamp updates via triggers
- Pre-populated tool definitions
- Materialized views for common queries

## Setup Instructions

### Prerequisites

1. PostgreSQL 12+ installed and running
2. Node.js 18+ with npm
3. Required npm packages: `pg` (already in package.json)

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nexus_protocol
POSTGRES_USER=nexus
POSTGRES_PASSWORD=your_secure_password

# Connection Pool Settings
POSTGRES_POOL_MIN=10
POSTGRES_POOL_MAX=50
```

### Database Setup

#### Option 1: Manual Setup

```bash
# Create database
createdb nexus_protocol

# Run schema migration
psql -d nexus_protocol -f backend/migrations/001_initial_schema.sql
```

#### Option 2: Using the Adapter

```javascript
const PostgreSQLDatabase = require('./models/PostgreSQLDatabase');

const db = new PostgreSQLDatabase();
await db.initialize();
await db.runMigrations();
```

### Migration from SQLite

To migrate existing data from SQLite to PostgreSQL:

```bash
# Set environment variables
export POSTGRES_HOST=localhost
export POSTGRES_DB=nexus_protocol
export POSTGRES_USER=nexus
export POSTGRES_PASSWORD=your_password

# Run migration script
node backend/scripts/migrate-to-postgres.js
```

The migration script will:
1. Export all data from SQLite
2. Transform data to PostgreSQL format
3. Import data with transaction safety
4. Verify data integrity
5. Print detailed summary

## Testing

### Run PostgreSQL Tests

```bash
# Ensure PostgreSQL is running and configured
node backend/test/postgres-test.js
```

Tests cover:
- Database initialization
- CRUD operations for all tables
- Query filtering
- Transaction handling
- SQL injection prevention
- Connection pooling

## Usage Examples

### Initialize Database

```javascript
const PostgreSQLDatabase = require('./models/PostgreSQLDatabase');

const db = new PostgreSQLDatabase({
  host: 'localhost',
  port: 5432,
  database: 'nexus_protocol',
  user: 'nexus',
  password: 'password',
  min: 10,
  max: 50
});

await db.initialize();
```

### Create a Round

```javascript
const round = await db.createRound({
  id: uuidv4(),
  currentPhase: 'initial_access',
  phaseStartTime: new Date(),
  redTeamId: 'team-red-001',
  blueTeamId: 'team-blue-001',
  status: 'active'
});
```

### Query Tasks

```javascript
// Get all tasks for a round
const tasks = await db.getTasksForRound(roundId);

// Get tasks with filters
const completedTasks = await db.getTasksForRound(roundId, {
  status: 'completed',
  phase: 'escalation'
});
```

### Log Events

```javascript
await db.logEvent({
  roundId: roundId,
  eventType: 'tool_use',
  actorId: agentId,
  actorType: 'ARCHITECT',
  targetSystem: '192.168.100.10',
  actionDetails: {
    tool: 'nmap',
    result: 'success'
  },
  traceGenerated: 8.5,
  observable: true
});
```

### Update System State

```javascript
await db.upsertSystemState({
  roundId: roundId,
  systemIp: '192.168.100.10',
  systemTier: 'tier1',
  systemName: 'Web Server',
  compromised: true,
  compromiseLevel: 75,
  services: [
    { name: 'HTTP', port: 80, status: 'compromised' }
  ],
  modifiedBy: agentId
});
```

### Add Scores

```javascript
await db.addScore({
  roundId: roundId,
  teamType: 'RED',
  scoreType: 'task_completion',
  points: 100,
  reason: 'Completed network scan'
});
```

### Transactions

```javascript
const client = await db.beginTransaction();
try {
  // Perform multiple operations
  await client.query('UPDATE rounds SET red_score = red_score + $1 WHERE id = $2', [100, roundId]);
  await client.query('INSERT INTO scores (...) VALUES (...)', [...]);
  
  await db.commitTransaction(client);
} catch (error) {
  await db.rollbackTransaction(client);
  throw error;
}
```

## Performance Considerations

### Connection Pooling

The adapter uses connection pooling with:
- Minimum connections: 10
- Maximum connections: 50
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds

### Indexes

All frequently queried columns have indexes:
- `rounds.status`
- `tasks.round_id, phase`
- `events.round_id, timestamp`
- `events.observable, detected`

### Query Optimization

- Use prepared statements (automatic with adapter)
- Leverage JSONB indexes for complex queries
- Use materialized views for expensive aggregations
- Implement query result caching at application level

## Security

### SQL Injection Prevention

All queries use parameterized statements:

```javascript
// ✅ SAFE - Uses prepared statement
await db.pool.query('SELECT * FROM rounds WHERE id = $1', [roundId]);

// ❌ UNSAFE - Never do this
await db.pool.query(`SELECT * FROM rounds WHERE id = '${roundId}'`);
```

### Data Isolation

- Round data is isolated by `round_id`
- Foreign key constraints prevent orphaned records
- Check constraints validate data ranges

### Access Control

Configure PostgreSQL roles:

```sql
-- Create application user
CREATE USER nexus_app WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_app;
```

## Monitoring

### Check Connection Pool Status

```javascript
console.log('Total connections:', db.pool.totalCount);
console.log('Idle connections:', db.pool.idleCount);
console.log('Waiting clients:', db.pool.waitingCount);
```

### Query Performance

```sql
-- Enable query logging
ALTER DATABASE nexus_protocol SET log_statement = 'all';
ALTER DATABASE nexus_protocol SET log_duration = on;

-- View slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U nexus -d nexus_protocol
```

### Migration Issues

If migration fails:
1. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
2. Verify SQLite database exists and is readable
3. Ensure PostgreSQL user has CREATE permissions
4. Check for conflicting data (duplicate IDs)

### Performance Issues

1. Analyze query plans: `EXPLAIN ANALYZE SELECT ...`
2. Update statistics: `ANALYZE;`
3. Rebuild indexes: `REINDEX DATABASE nexus_protocol;`
4. Check connection pool exhaustion

## Backup and Recovery

### Backup

```bash
# Full database backup
pg_dump -h localhost -U nexus nexus_protocol > backup.sql

# Compressed backup
pg_dump -h localhost -U nexus nexus_protocol | gzip > backup.sql.gz

# Schema only
pg_dump -h localhost -U nexus --schema-only nexus_protocol > schema.sql
```

### Restore

```bash
# Restore from backup
psql -h localhost -U nexus nexus_protocol < backup.sql

# Restore compressed backup
gunzip -c backup.sql.gz | psql -h localhost -U nexus nexus_protocol
```

## Schema Versioning

The schema includes version tracking:

```sql
SELECT * FROM schema_version ORDER BY version DESC;
```

Future migrations should:
1. Create new migration files: `002_add_feature.sql`
2. Update schema_version table
3. Test on development database first
4. Document changes in this README

## Support

For issues or questions:
- Check PostgreSQL logs
- Review test output
- Consult PostgreSQL documentation
- Contact development team

---

**Version:** 1.0.0  
**Last Updated:** February 19, 2026  
**Status:** ✅ Production Ready
