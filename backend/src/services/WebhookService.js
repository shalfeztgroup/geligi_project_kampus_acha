const { PrismaClient } = require('@prisma/client');
const winston = require('winston');

class WebhookService {
  constructor(prisma) {
    this.prisma = prisma;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/webhook-service.log' })
      ]
    });
  }

  async processWebhook(platform, eventType, payload, userId) {
    try {
      // Store webhook
      const webhook = await this.prisma.webhook.create({
        data: {
          platform,
          eventType,
          payload,
          userId,
          processed: false
        }
      });

      this.logger.info(`Webhook received: ${platform}/${eventType}`);

      // Process webhook based on platform
      let processedData;
      switch (platform.toLowerCase()) {
        case 'slack':
          processedData = await this.processSlackWebhook(eventType, payload);
          break;
        case 'jira':
          processedData = await this.processJiraWebhook(eventType, payload);
          break;
        case 'airtable':
          processedData = await this.processAirtableWebhook(eventType, payload);
          break;
        default:
          this.logger.warn(`Unsupported platform: ${platform}`);
          return webhook;
      }

      // Update webhook as processed
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          processed: true,
          processedAt: new Date()
        }
      });

      this.logger.info(`Webhook processed: ${webhook.id}`);
      return { webhook, processedData };
    } catch (error) {
      this.logger.error('Failed to process webhook:', error);
      throw error;
    }
  }

  async processSlackWebhook(eventType, payload) {
    try {
      const SlackIntegration = require('../integrations/SlackIntegration');
      const slackIntegration = new SlackIntegration({});
      
      const processedData = slackIntegration.processWebhook(payload);
      
      if (processedData) {
        this.logger.info(`Slack webhook processed: ${processedData.type}`);
      }
      
      return processedData;
    } catch (error) {
      this.logger.error('Failed to process Slack webhook:', error);
      throw error;
    }
  }

  async processJiraWebhook(eventType, payload) {
    try {
      const JiraIntegration = require('../integrations/JiraIntegration');
      const jiraIntegration = new JiraIntegration({});
      
      const processedData = jiraIntegration.processWebhook(payload);
      
      if (processedData) {
        this.logger.info(`Jira webhook processed: ${processedData.type}`);
      }
      
      return processedData;
    } catch (error) {
      this.logger.error('Failed to process Jira webhook:', error);
      throw error;
    }
  }

  async processAirtableWebhook(eventType, payload) {
    try {
      const AirtableIntegration = require('../integrations/AirtableIntegration');
      const airtableIntegration = new AirtableIntegration({});
      
      const processedData = airtableIntegration.processWebhook(payload);
      
      if (processedData) {
        this.logger.info(`Airtable webhook processed: ${processedData.type}`);
      }
      
      return processedData;
    } catch (error) {
      this.logger.error('Failed to process Airtable webhook:', error);
      throw error;
    }
  }

  async getWebhooks(userId, filters = {}) {
    try {
      const where = { userId };
      
      if (filters.platform) {
        where.platform = filters.platform;
      }
      
      if (filters.eventType) {
        where.eventType = filters.eventType;
      }
      
      if (filters.processed !== undefined) {
        where.processed = filters.processed;
      }

      const webhooks = await this.prisma.webhook.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      });

      return webhooks;
    } catch (error) {
      this.logger.error('Failed to get webhooks:', error);
      throw error;
    }
  }

  async getWebhookStats(userId) {
    try {
      const stats = await this.prisma.webhook.groupBy({
        by: ['platform', 'processed'],
        where: { userId },
        _count: true
      });

      const recentWebhooks = await this.prisma.webhook.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      return {
        byPlatform: stats,
        recentCount: recentWebhooks
      };
    } catch (error) {
      this.logger.error('Failed to get webhook stats:', error);
      throw error;
    }
  }

  async retryFailedWebhooks(userId) {
    try {
      const failedWebhooks = await this.prisma.webhook.findMany({
        where: {
          userId,
          processed: false,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        take: 10
      });

      const results = [];
      for (const webhook of failedWebhooks) {
        try {
          await this.processWebhook(
            webhook.platform,
            webhook.eventType,
            webhook.payload,
            webhook.userId
          );
          results.push({ id: webhook.id, status: 'success' });
        } catch (error) {
          results.push({ id: webhook.id, status: 'failed', error: error.message });
        }
      }

      this.logger.info(`Retried ${failedWebhooks.length} failed webhooks`);
      return results;
    } catch (error) {
      this.logger.error('Failed to retry webhooks:', error);
      throw error;
    }
  }

  async deleteOldWebhooks(userId, daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const result = await this.prisma.webhook.deleteMany({
        where: {
          userId,
          createdAt: {
            lt: cutoffDate
          },
          processed: true
        }
      });

      this.logger.info(`Deleted ${result.count} old webhooks`);
      return result;
    } catch (error) {
      this.logger.error('Failed to delete old webhooks:', error);
      throw error;
    }
  }
}

module.exports = WebhookService;
