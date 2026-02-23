/**
 * Health Check Endpoint
 * 
 * Provides health status for Docker health checks and monitoring.
 * Requirements: 7.9
 */

const express = require('express');
const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(health);
});

/**
 * Detailed health check with dependencies
 */
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      websocket: 'unknown',
      filesystem: 'unknown'
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
    },
    cpu: {
      usage: process.cpuUsage()
    }
  };

  // Check database connection
  try {
    if (req.app.locals.database) {
      await req.app.locals.database.get('SELECT 1');
      health.services.database = 'healthy';
    }
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check WebSocket
  if (req.app.locals.io) {
    health.services.websocket = 'healthy';
    health.websocket = {
      connections: req.app.locals.io.engine.clientsCount || 0
    };
  }

  // Check filesystem
  try {
    const fs = require('fs');
    fs.accessSync('./logs', fs.constants.W_OK);
    health.services.filesystem = 'healthy';
  } catch (error) {
    health.services.filesystem = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Readiness check (for Kubernetes)
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    if (req.app.locals.database) {
      await req.app.locals.database.get('SELECT 1');
    }

    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: 'Database not ready',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness check (for Kubernetes)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
