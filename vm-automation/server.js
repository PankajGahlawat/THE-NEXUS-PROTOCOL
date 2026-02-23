/**
 * VM Automation HTTP Server
 * 
 * Provides REST API for VM management operations
 */

const express = require('express');
const VMManager = require('./VMManager');

const app = express();
const PORT = process.env.VM_MANAGER_PORT || 9000;

// Initialize VM Manager
const vmManager = new VMManager({
  networkRange: process.env.CYBER_RANGE_NETWORK || '192.168.100.0/24',
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  maxRestartAttempts: parseInt(process.env.MAX_RESTART_ATTEMPTS) || 3
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'vm-automation' });
});

// Provision a new VM
app.post('/vms/provision', async (req, res) => {
  try {
    const { tier, roundId } = req.body;
    
    if (!tier || !roundId) {
      return res.status(400).json({ error: 'tier and roundId are required' });
    }

    const vm = await vmManager.provisionVM(tier, roundId);
    res.status(201).json(vm);
  } catch (error) {
    console.error('Provision error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create snapshot
app.post('/vms/:vmId/snapshots', async (req, res) => {
  try {
    const { vmId } = req.params;
    const { snapshotName } = req.body;
    
    if (!snapshotName) {
      return res.status(400).json({ error: 'snapshotName is required' });
    }

    const snapshot = await vmManager.createSnapshot(vmId, snapshotName);
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Snapshot creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Restore snapshot
app.post('/vms/:vmId/restore', async (req, res) => {
  try {
    const { vmId } = req.params;
    const { snapshotName } = req.body;
    
    const result = await vmManager.restoreSnapshot(vmId, snapshotName || 'baseline');
    res.json(result);
  } catch (error) {
    console.error('Snapshot restore error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check for specific VM
app.get('/vms/:vmId/health', async (req, res) => {
  try {
    const { vmId } = req.params;
    const health = await vmManager.healthCheck(vmId);
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get VM state
app.get('/vms/:vmId', (req, res) => {
  const { vmId } = req.params;
  const vm = vmManager.getVMState(vmId);
  
  if (!vm) {
    return res.status(404).json({ error: 'VM not found' });
  }
  
  res.json(vm);
});

// List VMs for a round
app.get('/rounds/:roundId/vms', (req, res) => {
  const { roundId } = req.params;
  const vms = vmManager.listVMsByRound(roundId);
  res.json(vms);
});

// Cleanup VM
app.delete('/vms/:vmId', async (req, res) => {
  try {
    const { vmId } = req.params;
    await vmManager.cleanupVM(vmId);
    res.json({ message: 'VM cleaned up successfully' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup all VMs for a round
app.delete('/rounds/:roundId/vms', async (req, res) => {
  try {
    const { roundId } = req.params;
    await vmManager.cleanupRound(roundId);
    res.json({ message: 'Round VMs cleaned up successfully' });
  } catch (error) {
    console.error('Round cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`VM Automation service listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
