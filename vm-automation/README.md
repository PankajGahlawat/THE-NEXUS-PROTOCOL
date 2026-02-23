# NEXUS PROTOCOL VM Automation Service

Automated VM provisioning, snapshot management, and health monitoring for the NEXUS PROTOCOL cyber range.

## Features

- **VM Provisioning**: Automatically provision vulnerable VMs for Tier I, II, and III systems
- **Snapshot Management**: Create and restore VM snapshots for consistent round resets
- **Health Monitoring**: Continuous health checks with automatic restart on failure
- **IP Management**: Automatic IP allocation in the 192.168.100.0/24 range
- **Vulnerability Configuration**: Pre-configured vulnerabilities for each tier

## Architecture

### VM Tiers

**Tier I (Web Services)** - 192.168.100.10-19
- Ubuntu + Apache web server
- Vulnerable PHP pages
- Weak server configuration
- Services: HTTP (80), SSH (22)

**Tier II (SSH/Database)** - 192.168.100.20-29
- Ubuntu + SSH + MySQL
- Weak credentials
- Permissive SSH configuration
- Services: SSH (22), MySQL (3306)

**Tier III (Core Systems)** - 192.168.100.30-39
- Ubuntu + Custom services
- Exploitable configurations
- Credential files with weak permissions
- Services: SSH (22), Custom (8080)

## API Endpoints

### Provision VM
```
POST /vms/provision
Body: { "tier": "tier1", "roundId": "round-123" }
Response: { "vmId": "nexus-tier1-round-123-1234567890", "ipAddress": "192.168.100.10", ... }
```

### Create Snapshot
```
POST /vms/:vmId/snapshots
Body: { "snapshotName": "baseline" }
Response: { "vmId": "...", "snapshotName": "baseline", "createdAt": "..." }
```

### Restore Snapshot
```
POST /vms/:vmId/restore
Body: { "snapshotName": "baseline" }
Response: { "vmId": "...", "snapshotName": "baseline", "restoredAt": "..." }
```

### Health Check
```
GET /vms/:vmId/health
Response: { "vmId": "...", "healthy": true, "services": [...] }
```

### Get VM State
```
GET /vms/:vmId
Response: { "vmId": "...", "tier": "tier1", "status": "running", ... }
```

### List VMs by Round
```
GET /rounds/:roundId/vms
Response: [{ "vmId": "...", "tier": "tier1", ... }, ...]
```

### Cleanup VM
```
DELETE /vms/:vmId
Response: { "message": "VM cleaned up successfully" }
```

### Cleanup Round
```
DELETE /rounds/:roundId/vms
Response: { "message": "Round VMs cleaned up successfully" }
```

## Configuration

Environment variables:

- `VM_MANAGER_PORT`: HTTP server port (default: 9000)
- `CYBER_RANGE_NETWORK`: Network range for VMs (default: 192.168.100.0/24)
- `HEALTH_CHECK_INTERVAL`: Health check interval in ms (default: 30000)
- `MAX_RESTART_ATTEMPTS`: Max restart attempts before marking unavailable (default: 3)

## Requirements

- libvirt/KVM installed and running
- Base VM images: `nexus-tier1-base`, `nexus-tier2-base`, `nexus-tier3-base`
- Network bridge configured for 192.168.100.0/24
- Sufficient resources (CPU, memory, disk) for multiple VMs

## Health Monitoring

The service performs continuous health checks every 30 seconds:

1. **Ping Check**: Verify VM is reachable
2. **Service Port Checks**: Verify all tier services are running
3. **Automatic Restart**: Restore to baseline snapshot on failure
4. **Operator Alerts**: Alert on unrecoverable failures

## Failure Handling

When a VM fails health checks:

1. Attempt to restore to baseline snapshot
2. Retry up to 3 times (configurable)
3. Mark VM as unavailable if recovery fails
4. Alert operator for manual intervention

## Integration with Game Engine

The game engine should:

1. Call `/vms/provision` at round start for each tier
2. Call `/vms/:vmId/snapshots` to create snapshots after significant events
3. Call `/vms/:vmId/restore` to reset VMs between rounds
4. Call `/rounds/:roundId/vms` to cleanup VMs at round end
5. Monitor VM health via `/vms/:vmId/health` endpoint

## Docker Deployment

The service runs in a Docker container with:

- Ubuntu 22.04 base image
- libvirt/KVM installed
- Node.js 18 runtime
- Health check endpoint
- Volume mounts for VM storage

See `Dockerfile` for details.

## Testing

Run tests:
```bash
npm test
```

Tests cover:
- VM provisioning for each tier
- Snapshot creation and restoration
- Health monitoring and failure handling
- IP allocation
- Service verification

## Security Considerations

- The service requires privileged access to libvirt
- VM network is isolated from the game network
- Operator alerts for security events
- All VMs reset to baseline between rounds
- No persistent state across rounds

## Troubleshooting

**VM fails to start:**
- Check libvirt service is running: `systemctl status libvirtd`
- Verify base images exist: `virsh list --all`
- Check available resources: `virsh nodeinfo`

**Health checks failing:**
- Verify network connectivity to 192.168.100.0/24
- Check firewall rules
- Verify services are configured correctly in base images

**Snapshot restore fails:**
- Check snapshot exists: `virsh snapshot-list <vmId>`
- Verify disk space: `df -h`
- Check libvirt logs: `journalctl -u libvirtd`

## License

MIT
