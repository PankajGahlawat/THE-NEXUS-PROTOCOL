# NEXUS PROTOCOL Operator Guide

## Table of Contents
1. [Overview](#overview)
2. [Round Management](#round-management)
3. [Monitoring and Logging](#monitoring-and-logging)
4. [Emergency Procedures](#emergency-procedures)
5. [Troubleshooting](#troubleshooting)
6. [Maintenance](#maintenance)

---

## Overview

This guide is for operators managing NEXUS PROTOCOL game sessions. It covers round management, monitoring, emergency procedures, and troubleshooting.

### Operator Responsibilities

- Start and manage game rounds
- Monitor system health and performance
- Respond to alerts and incidents
- Execute emergency procedures when needed
- Maintain logs and audit trails
- Troubleshoot issues during gameplay

### System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL │
│  (Port 3000)│     │  (Port 3001)│     │  (Port 5432)│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ VM Manager  │
                    │ (Port 9000) │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Cyber Range │
                    │ 192.168.100 │
                    └─────────────┘
```

---

## Round Management

### Starting a New Round

#### 1. Pre-Round Checklist

```bash
# Check system health
docker-compose ps
curl http://localhost:3001/health/detailed

# Check database connection
docker-compose exec backend node -e "require('./models/database').testConnection()"

# Check VM manager (if using)
curl http://localhost:9000/health

# Verify disk space
df -h

# Check logs for errors
docker-compose logs --tail=50 backend
```

#### 2. Initialize Round

**Via API:**
```bash
curl -X POST http://localhost:3001/api/rounds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "duration": 3600,
    "redTeam": "team-red-1",
    "blueTeam": "team-blue-1"
  }'
```

**Expected Response:**
```json
{
  "roundId": "round-abc123",
  "status": "active",
  "startTime": "2026-02-19T10:00:00Z",
  "endTime": "2026-02-19T11:00:00Z",
  "phase": "initial_access"
}
```

#### 3. Provision VMs (Optional)

If using VM automation:

```bash
# Provision Tier I VM
curl -X POST http://localhost:9000/vms/provision \
  -H "Content-Type: application/json" \
  -d '{"tier": "tier1", "roundId": "round-abc123"}'

# Provision Tier II VM
curl -X POST http://localhost:9000/vms/provision \
  -H "Content-Type: application/json" \
  -d '{"tier": "tier2", "roundId": "round-abc123"}'

# Provision Tier III VM
curl -X POST http://localhost:9000/vms/provision \
  -H "Content-Type: application/json" \
  -d '{"tier": "tier3", "roundId": "round-abc123"}'
```

#### 4. Monitor Round Start

```bash
# Watch backend logs
docker-compose logs -f backend

# Monitor WebSocket connections
curl http://localhost:3001/api/rounds/round-abc123/connections
```

### During Round Operations

#### Monitor Round Status

```bash
# Get round details
curl http://localhost:3001/api/rounds/round-abc123

# Get current scores
curl http://localhost:3001/api/rounds/round-abc123/scores

# Get task completion status
curl http://localhost:3001/api/rounds/round-abc123/tasks

# Get system state
curl http://localhost:3001/api/rounds/round-abc123/state
```

#### Monitor Player Activity

```bash
# View recent events
curl http://localhost:3001/api/rounds/round-abc123/events?limit=20

# View tool usage
curl http://localhost:3001/api/rounds/round-abc123/tools

# View detection alerts
curl http://localhost:3001/api/rounds/round-abc123/detections
```

#### Phase Transitions

Rounds automatically transition through phases:
- **Initial Access** (0-20 min): Red Team gains initial foothold
- **Escalation** (20-40 min): Red Team escalates privileges
- **Impact/Recovery** (40-60 min): Red Team causes impact, Blue Team recovers

Monitor phase transitions:
```bash
# Watch for phase_transition events
docker-compose logs -f backend | grep "phase_transition"
```

### Ending a Round

#### 1. Natural Round End

Rounds end automatically after the duration expires. Monitor:

```bash
# Watch for round_end event
docker-compose logs -f backend | grep "round_end"

# Get final scores
curl http://localhost:3001/api/rounds/round-abc123/scores
```

#### 2. Manual Round End

To end a round early:

```bash
curl -X POST http://localhost:3001/api/rounds/round-abc123/end \
  -H "Authorization: Bearer <admin-token>"
```

#### 3. Post-Round Cleanup

```bash
# Snapshot VM states (if using VMs)
curl -X POST http://localhost:9000/vms/<vm-id>/snapshots \
  -H "Content-Type: application/json" \
  -d '{"snapshotName": "round-abc123-final"}'

# Export round data
curl http://localhost:3001/api/rounds/round-abc123/export > round-abc123.json

# Cleanup VMs
curl -X DELETE http://localhost:9000/rounds/round-abc123/vms
```

---

## Monitoring and Logging

### Health Checks

#### System Health

```bash
# Overall health
curl http://localhost:3001/health

# Detailed health (includes database, VM manager)
curl http://localhost:3001/health/detailed

# Readiness check
curl http://localhost:3001/ready

# Liveness check
curl http://localhost:3001/live
```

#### Service-Specific Health

```bash
# Backend
docker-compose exec backend node -e "console.log('Backend OK')"

# PostgreSQL
docker-compose exec postgres pg_isready -U nexus

# Frontend
curl http://localhost:3000/

# VM Manager
curl http://localhost:9000/health
```

### Log Monitoring

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f vm_manager

# Last N lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since="2026-02-19T10:00:00" backend
```

#### Log Locations

- **Backend logs:** `backend/logs/`
  - `combined.log` - All logs
  - `error.log` - Error logs only
  - `audit.log` - Security audit trail

- **Container logs:** `docker-compose logs`

- **PostgreSQL logs:** Inside postgres container at `/var/log/postgresql/`

#### Important Log Patterns

**Errors:**
```bash
docker-compose logs backend | grep -i error
```

**Security events:**
```bash
docker-compose logs backend | grep -i "security\|auth\|unauthorized"
```

**Performance issues:**
```bash
docker-compose logs backend | grep -i "slow\|timeout\|performance"
```

**VM failures:**
```bash
docker-compose logs vm_manager | grep -i "failed\|error\|unavailable"
```

### Performance Monitoring

#### Database Performance

```bash
# Active connections
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Database size
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "SELECT pg_size_pretty(pg_database_size('nexus_protocol'));"
```

#### WebSocket Connections

```bash
# Active connections
curl http://localhost:3001/api/stats/websocket

# Connection rate
docker-compose logs backend | grep "WebSocket connection" | tail -20
```

#### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Volume usage
docker volume ls
du -sh /var/lib/docker/volumes/*
```

### Alerts and Notifications

#### Critical Alerts

Monitor for these critical events:

1. **Database connection failures**
   ```bash
   docker-compose logs backend | grep "Database connection failed"
   ```

2. **VM failures**
   ```bash
   docker-compose logs vm_manager | grep "OPERATOR ALERT"
   ```

3. **Emergency kill switch activation**
   ```bash
   docker-compose logs backend | grep "EMERGENCY KILL SWITCH"
   ```

4. **High error rates**
   ```bash
   docker-compose logs backend | grep -c "ERROR" | awk '{if($1>100) print "High error rate: "$1" errors"}'
   ```

---

## Emergency Procedures

### Emergency Kill Switch

The kill switch immediately terminates all active rounds and disconnects all clients.

#### When to Use

- Security breach detected
- System instability
- Data corruption
- Unrecoverable errors
- Emergency maintenance required

#### Activation

**Via API:**
```bash
curl -X POST http://localhost:3001/api/emergency/kill-switch \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Security breach detected", "operator": "admin-name"}'
```

**Via Backend Console:**
```bash
docker-compose exec backend node -e "
const KillSwitch = require('./emergency/KillSwitch');
const killSwitch = new KillSwitch();
killSwitch.activate('Emergency maintenance', 'admin-name');
"
```

#### Post-Activation Steps

1. **Verify all rounds terminated:**
   ```bash
   curl http://localhost:3001/api/rounds?status=active
   # Should return empty array
   ```

2. **Check logs for issues:**
   ```bash
   docker-compose logs --tail=200 backend > emergency-logs.txt
   ```

3. **Backup database:**
   ```bash
   docker-compose exec postgres pg_dump -U nexus nexus_protocol > emergency-backup.sql
   ```

4. **Investigate root cause**

5. **Communicate with players**

6. **Restore service when safe**

### Service Restart

#### Restart Individual Service

```bash
# Backend only
docker-compose restart backend

# Frontend only
docker-compose restart frontend

# PostgreSQL (WARNING: causes downtime)
docker-compose restart postgres

# VM Manager
docker-compose restart vm_manager
```

#### Full System Restart

```bash
# Graceful restart
docker-compose restart

# Hard restart (stops then starts)
docker-compose down
docker-compose up -d
```

### Database Recovery

#### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U nexus nexus_protocol > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
head -20 backup-*.sql
```

#### Restore Database

```bash
# Stop backend
docker-compose stop backend

# Restore from backup
cat backup-20260219-100000.sql | docker-compose exec -T postgres psql -U nexus nexus_protocol

# Start backend
docker-compose start backend
```

### VM Recovery

#### Restart Failed VM

```bash
# Get VM ID
curl http://localhost:9000/rounds/<round-id>/vms

# Restore to baseline
curl -X POST http://localhost:9000/vms/<vm-id>/restore \
  -H "Content-Type: application/json" \
  -d '{"snapshotName": "baseline"}'
```

#### Replace Failed VM

```bash
# Cleanup failed VM
curl -X DELETE http://localhost:9000/vms/<vm-id>

# Provision new VM
curl -X POST http://localhost:9000/vms/provision \
  -H "Content-Type: application/json" \
  -d '{"tier": "tier1", "roundId": "<round-id>"}'
```

---

## Troubleshooting

### Common Issues

#### Issue: Backend won't start

**Symptoms:**
- Backend container exits immediately
- "Connection refused" errors

**Diagnosis:**
```bash
docker-compose logs backend
docker-compose ps
```

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Verify database credentials in `.env`

3. Check port conflicts:
   ```bash
   netstat -an | grep 3001
   ```

4. Review backend logs for specific errors

#### Issue: Frontend shows "API connection failed"

**Symptoms:**
- Frontend loads but can't connect to backend
- Network errors in browser console

**Diagnosis:**
```bash
# Check backend is running
curl http://localhost:3001/health

# Check CORS configuration
curl -H "Origin: http://localhost:3000" -I http://localhost:3001/health
```

**Solutions:**
1. Verify `VITE_API_URL` in frontend `.env.local`
2. Check `CORS_ORIGIN` in backend `.env`
3. Restart frontend: `docker-compose restart frontend`

#### Issue: WebSocket connections failing

**Symptoms:**
- Real-time updates not working
- "WebSocket connection failed" in logs

**Diagnosis:**
```bash
# Check WebSocket endpoint
wscat -c ws://localhost:3001

# Check backend logs
docker-compose logs backend | grep -i websocket
```

**Solutions:**
1. Verify `VITE_WS_URL` in frontend configuration
2. Check firewall rules for WebSocket traffic
3. Verify WebSocket authentication tokens

#### Issue: High database load

**Symptoms:**
- Slow API responses
- High CPU usage on postgres container
- Query timeouts

**Diagnosis:**
```bash
# Check active queries
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "SELECT pid, query, state, query_start FROM pg_stat_activity WHERE state != 'idle';"

# Check connection count
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "SELECT count(*) FROM pg_stat_activity;"
```

**Solutions:**
1. Increase connection pool size in `.env`:
   ```
   POSTGRES_POOL_MAX=100
   ```

2. Add database indexes (see Performance Optimization)

3. Restart PostgreSQL:
   ```bash
   docker-compose restart postgres
   ```

#### Issue: VM health checks failing

**Symptoms:**
- VMs marked as unavailable
- "Health check failed" in VM manager logs

**Diagnosis:**
```bash
# Check VM status
curl http://localhost:9000/vms/<vm-id>/health

# Check VM manager logs
docker-compose logs vm_manager

# Ping VM directly
ping 192.168.100.10
```

**Solutions:**
1. Verify libvirt is running:
   ```bash
   systemctl status libvirtd
   ```

2. Check VM is running:
   ```bash
   virsh list --all
   ```

3. Restart VM:
   ```bash
   curl -X POST http://localhost:9000/vms/<vm-id>/restore
   ```

### Debug Mode

Enable debug logging:

```bash
# Edit .env
LOG_LEVEL=debug
DEBUG=true

# Restart backend
docker-compose restart backend

# View debug logs
docker-compose logs -f backend
```

### Performance Profiling

```bash
# Enable Node.js profiling
docker-compose exec backend node --prof server.js

# Generate profile report
docker-compose exec backend node --prof-process isolate-*.log > profile.txt
```

---

## Maintenance

### Regular Maintenance Tasks

#### Daily

- [ ] Check system health
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Verify backups completed

#### Weekly

- [ ] Backup database
- [ ] Review audit logs
- [ ] Check for security updates
- [ ] Clean old logs
- [ ] Review performance metrics

#### Monthly

- [ ] Update dependencies
- [ ] Review and optimize database
- [ ] Test disaster recovery procedures
- [ ] Review and update documentation

### Database Maintenance

#### Vacuum Database

```bash
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "VACUUM ANALYZE;"
```

#### Reindex Database

```bash
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "REINDEX DATABASE nexus_protocol;"
```

#### Clean Old Data

```bash
# Delete rounds older than 30 days
docker-compose exec postgres psql -U nexus -d nexus_protocol -c "DELETE FROM rounds WHERE created_at < NOW() - INTERVAL '30 days';"
```

### Log Rotation

Logs are automatically rotated by the audit logger (10MB max, 10 files). Manual cleanup:

```bash
# Clean old logs
find backend/logs -name "*.log.*" -mtime +30 -delete

# Compress old logs
find backend/logs -name "*.log.*" -mtime +7 -exec gzip {} \;
```

### Docker Maintenance

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (WARNING: removes everything not in use)
docker system prune -a --volumes
```

### Security Updates

```bash
# Update base images
docker-compose pull

# Rebuild containers
docker-compose build --no-cache

# Restart with new images
docker-compose up -d
```

---

## Contact and Support

### Emergency Contacts

- **System Administrator:** [admin@nexus-protocol.local]
- **Security Team:** [security@nexus-protocol.local]
- **On-Call Engineer:** [Check internal wiki]

### Escalation Procedures

1. **Level 1:** Operator attempts resolution using this guide
2. **Level 2:** Contact system administrator
3. **Level 3:** Activate emergency kill switch and contact security team

### Documentation

- **Technical Architecture:** `documentation/TECHNICAL_ARCHITECTURE.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **User Guide:** `documentation/USER_GUIDE.md`
- **API Documentation:** `documentation/API.md`

---

## Appendix

### Useful Commands Reference

```bash
# Quick health check
curl http://localhost:3001/health && echo "✓ Backend OK"

# View active rounds
curl http://localhost:3001/api/rounds?status=active | jq

# Emergency stop all rounds
curl -X POST http://localhost:3001/api/emergency/kill-switch \
  -H "Authorization: Bearer <token>"

# Backup database
docker-compose exec postgres pg_dump -U nexus nexus_protocol > backup.sql

# View real-time logs
docker-compose logs -f --tail=50

# Check resource usage
docker stats --no-stream

# Restart everything
docker-compose restart
```

### Environment Variables Reference

See `.env.example` for complete list. Critical variables:

- `NODE_ENV` - Environment (production/development)
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - Authentication secret
- `CORS_ORIGIN` - Allowed frontend origins
- `LOG_LEVEL` - Logging verbosity

---

**Document Version:** 1.0  
**Last Updated:** February 19, 2026  
**Maintained By:** NEXUS PROTOCOL Team
