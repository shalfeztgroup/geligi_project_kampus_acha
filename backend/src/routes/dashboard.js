const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview
router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get integration counts
    const integrationStats = await prisma.integration.groupBy({
      by: ['type', 'status'],
      where: { userId },
      _count: true
    });

    // Get recent sync logs
    const recentSyncs = await prisma.syncLog.findMany({
      where: {
        integration: { userId }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        integration: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    // Get webhook stats
    const webhookStats = await prisma.webhook.groupBy({
      by: ['platform', 'processed'],
      where: { userId },
      _count: true
    });

    // Get recent webhooks
    const recentWebhooks = await prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        integration: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    // Calculate success rates
    const totalSyncs = await prisma.syncLog.count({
      where: { integration: { userId } }
    });

    const successfulSyncs = await prisma.syncLog.count({
      where: {
        integration: { userId },
        status: 'SUCCESS'
      }
    });

    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

    res.json({
      integrations: integrationStats,
      recentSyncs,
      webhooks: webhookStats,
      recentWebhooks,
      metrics: {
        totalIntegrations: await prisma.integration.count({ where: { userId } }),
        activeIntegrations: await prisma.integration.count({ 
          where: { userId, status: 'ACTIVE' } 
        }),
        totalSyncs,
        successfulSyncs,
        successRate: Math.round(successRate * 100) / 100,
        totalWebhooks: await prisma.webhook.count({ where: { userId } }),
        processedWebhooks: await prisma.webhook.count({ 
          where: { userId, processed: true } 
        })
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get sync logs
router.get('/sync-logs', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, integrationId } = req.query;

    const where = {
      integration: { userId }
    };

    if (status) {
      where.status = status;
    }

    if (integrationId) {
      where.integrationId = integrationId;
    }

    const syncLogs = await prisma.syncLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      include: {
        integration: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    const total = await prisma.syncLog.count({ where });

    res.json({
      data: syncLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get webhook logs
router.get('/webhook-logs', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, platform, processed } = req.query;

    const where = { userId };

    if (platform) {
      where.platform = platform;
    }

    if (processed !== undefined) {
      where.processed = processed === 'true';
    }

    const webhooks = await prisma.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      include: {
        integration: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    const total = await prisma.webhook.count({ where });

    res.json({
      data: webhooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get activity timeline
router.get('/activity', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get sync activities
    const syncActivities = await prisma.syncLog.findMany({
      where: {
        integration: { userId },
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        integration: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    // Get webhook activities
    const webhookActivities = await prisma.webhook.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        integration: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    // Combine and sort activities
    const activities = [
      ...syncActivities.map(activity => ({
        type: 'sync',
        id: activity.id,
        timestamp: activity.createdAt,
        status: activity.status,
        integration: activity.integration,
        direction: activity.direction,
        duration: activity.duration,
        error: activity.error
      })),
      ...webhookActivities.map(activity => ({
        type: 'webhook',
        id: activity.id,
        timestamp: activity.createdAt,
        platform: activity.platform,
        eventType: activity.eventType,
        processed: activity.processed,
        integration: activity.integration
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// Get performance metrics
router.get('/metrics', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get daily sync counts
    const dailySyncs = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        status,
        COUNT(*) as count
      FROM sync_logs 
      WHERE integration_id IN (
        SELECT id FROM integrations WHERE user_id = ${userId}
      )
      AND created_at >= ${startDate}
      GROUP BY DATE(created_at), status
      ORDER BY date DESC
    `;

    // Get daily webhook counts
    const dailyWebhooks = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        platform,
        processed,
        COUNT(*) as count
      FROM webhooks 
      WHERE user_id = ${userId}
      AND created_at >= ${startDate}
      GROUP BY DATE(created_at), platform, processed
      ORDER BY date DESC
    `;

    // Get average sync duration
    const avgDuration = await prisma.syncLog.aggregate({
      where: {
        integration: { userId },
        createdAt: { gte: startDate },
        duration: { not: null }
      },
      _avg: {
        duration: true
      }
    });

    res.json({
      dailySyncs,
      dailyWebhooks,
      averageSyncDuration: avgDuration._avg.duration || 0
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
