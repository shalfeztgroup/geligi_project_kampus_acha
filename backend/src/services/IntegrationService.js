const { PrismaClient } = require('@prisma/client');
const LarkIntegration = require('../integrations/LarkIntegration');
const SlackIntegration = require('../integrations/SlackIntegration');
const JiraIntegration = require('../integrations/JiraIntegration');
const AirtableIntegration = require('../integrations/AirtableIntegration');
const winston = require('winston');

class IntegrationService {
  constructor(prisma) {
    this.prisma = prisma;
    this.integrations = new Map();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/integration-service.log' })
      ]
    });
  }

  async createIntegration(userId, integrationData) {
    try {
      const integration = await this.prisma.integration.create({
        data: {
          name: integrationData.name,
          type: integrationData.type,
          config: integrationData.config,
          mapping: integrationData.mapping || null,
          userId: userId
        }
      });

      // Initialize integration instance
      await this.initializeIntegration(integration);

      this.logger.info(`Integration created: ${integration.id}`);
      return integration;
    } catch (error) {
      this.logger.error('Failed to create integration:', error);
      throw error;
    }
  }

  async getIntegrations(userId) {
    try {
      const integrations = await this.prisma.integration.findMany({
        where: { userId },
        include: {
          syncLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      return integrations;
    } catch (error) {
      this.logger.error('Failed to get integrations:', error);
      throw error;
    }
  }

  async getIntegration(integrationId, userId) {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { 
          id: integrationId,
          userId 
        },
        include: {
          syncLogs: {
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      return integration;
    } catch (error) {
      this.logger.error('Failed to get integration:', error);
      throw error;
    }
  }

  async updateIntegration(integrationId, userId, updateData) {
    try {
      const integration = await this.prisma.integration.updateMany({
        where: { 
          id: integrationId,
          userId 
        },
        data: {
          name: updateData.name,
          config: updateData.config,
          mapping: updateData.mapping,
          status: updateData.status || 'INACTIVE'
        }
      });

      // Reinitialize integration if config changed
      if (updateData.config) {
        const updatedIntegration = await this.getIntegration(integrationId, userId);
        await this.initializeIntegration(updatedIntegration);
      }

      this.logger.info(`Integration updated: ${integrationId}`);
      return integration;
    } catch (error) {
      this.logger.error('Failed to update integration:', error);
      throw error;
    }
  }

  async deleteIntegration(integrationId, userId) {
    try {
      await this.prisma.integration.deleteMany({
        where: { 
          id: integrationId,
          userId 
        }
      });

      // Remove from memory
      this.integrations.delete(integrationId);

      this.logger.info(`Integration deleted: ${integrationId}`);
    } catch (error) {
      this.logger.error('Failed to delete integration:', error);
      throw error;
    }
  }

  async initializeIntegration(integration) {
    try {
      let integrationInstance;

      switch (integration.type) {
        case 'LARK':
          integrationInstance = new LarkIntegration(integration.config);
          break;
        case 'SLACK':
          integrationInstance = new SlackIntegration(integration.config);
          break;
        case 'JIRA':
          integrationInstance = new JiraIntegration(integration.config);
          break;
        case 'AIRTABLE':
          integrationInstance = new AirtableIntegration(integration.config);
          break;
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }

      this.integrations.set(integration.id, integrationInstance);
      this.logger.info(`Integration initialized: ${integration.id}`);
    } catch (error) {
      this.logger.error('Failed to initialize integration:', error);
      throw error;
    }
  }

  async syncData(integrationId, userId, direction = 'INBOUND') {
    try {
      const integration = await this.getIntegration(integrationId, userId);
      const integrationInstance = this.integrations.get(integrationId);

      if (!integrationInstance) {
        throw new Error('Integration not initialized');
      }

      const startTime = Date.now();
      let syncLog;

      try {
        // Create sync log
        syncLog = await this.prisma.syncLog.create({
          data: {
            integrationId,
            direction,
            status: 'PENDING'
          }
        });

        // Perform sync based on integration type
        let result;
        switch (integration.type) {
          case 'SLACK':
            result = await this.syncSlackData(integrationInstance, integration);
            break;
          case 'JIRA':
            result = await this.syncJiraData(integrationInstance, integration);
            break;
          case 'AIRTABLE':
            result = await this.syncAirtableData(integrationInstance, integration);
            break;
          default:
            throw new Error(`Sync not supported for type: ${integration.type}`);
        }

        // Update sync log with success
        await this.prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'SUCCESS',
            sourceData: result.sourceData,
            targetData: result.targetData,
            duration: Date.now() - startTime
          }
        });

        this.logger.info(`Sync completed successfully: ${integrationId}`);
        return result;
      } catch (error) {
        // Update sync log with error
        await this.prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'FAILED',
            error: error.message,
            duration: Date.now() - startTime
          }
        });

        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to sync data:', error);
      throw error;
    }
  }

  async syncSlackData(slackIntegration, integration) {
    try {
      // Get Slack data
      const channels = await slackIntegration.getChannels();
      const users = await slackIntegration.getUsers();
      
      // Transform to Lark format
      const larkDocument = slackIntegration.transformToLarkDocument({
        channels,
        users
      });

      // Get Lark integration
      const larkIntegration = this.integrations.get(integration.mapping?.larkIntegrationId);
      if (!larkIntegration) {
        throw new Error('Lark integration not found');
      }

      // Create Lark document
      const larkResult = await larkIntegration.createDocument(
        larkDocument.title,
        larkDocument.content
      );

      return {
        sourceData: { channels, users },
        targetData: larkResult
      };
    } catch (error) {
      this.logger.error('Failed to sync Slack data:', error);
      throw error;
    }
  }

  async syncJiraData(jiraIntegration, integration) {
    try {
      // Get Jira data
      const issues = await jiraIntegration.getIssues('', 0, 100);
      
      // Transform to Lark format
      const larkSpreadsheet = jiraIntegration.transformToLarkSpreadsheet(issues);

      // Get Lark integration
      const larkIntegration = this.integrations.get(integration.mapping?.larkIntegrationId);
      if (!larkIntegration) {
        throw new Error('Lark integration not found');
      }

      // Create Lark spreadsheet
      const larkResult = await larkIntegration.createSpreadsheet(
        larkSpreadsheet.title,
        larkSpreadsheet.sheets
      );

      return {
        sourceData: issues,
        targetData: larkResult
      };
    } catch (error) {
      this.logger.error('Failed to sync Jira data:', error);
      throw error;
    }
  }

  async syncAirtableData(airtableIntegration, integration) {
    try {
      // Get Airtable data
      const tables = await airtableIntegration.getTables();
      const tableData = await airtableIntegration.getRecords(tables[0].name);
      
      // Transform to Lark format
      const larkSpreadsheet = airtableIntegration.transformToLarkSpreadsheet({
        tableName: tables[0].name,
        records: tableData.records
      });

      // Get Lark integration
      const larkIntegration = this.integrations.get(integration.mapping?.larkIntegrationId);
      if (!larkIntegration) {
        throw new Error('Lark integration not found');
      }

      // Create Lark spreadsheet
      const larkResult = await larkIntegration.createSpreadsheet(
        larkSpreadsheet.title,
        larkSpreadsheet.sheets
      );

      return {
        sourceData: tableData,
        targetData: larkResult
      };
    } catch (error) {
      this.logger.error('Failed to sync Airtable data:', error);
      throw error;
    }
  }

  async testIntegration(integrationId, userId) {
    try {
      const integration = await this.getIntegration(integrationId, userId);
      const integrationInstance = this.integrations.get(integrationId);

      if (!integrationInstance) {
        await this.initializeIntegration(integration);
        const newInstance = this.integrations.get(integrationId);
        if (!newInstance) {
          throw new Error('Failed to initialize integration');
        }
      }

      // Test connection based on type
      switch (integration.type) {
        case 'LARK':
          await integrationInstance.getAccessToken();
          break;
        case 'SLACK':
          await integrationInstance.getChannels();
          break;
        case 'JIRA':
          await integrationInstance.getProjects();
          break;
        case 'AIRTABLE':
          await integrationInstance.getTables();
          break;
        default:
          throw new Error(`Test not supported for type: ${integration.type}`);
      }

      // Update status to active
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: { status: 'ACTIVE' }
      });

      this.logger.info(`Integration test successful: ${integrationId}`);
      return { success: true };
    } catch (error) {
      // Update status to error
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: { status: 'ERROR' }
      });

      this.logger.error('Integration test failed:', error);
      throw error;
    }
  }

  async getIntegrationStats(userId) {
    try {
      const stats = await this.prisma.integration.groupBy({
        by: ['type', 'status'],
        where: { userId },
        _count: true
      });

      const syncStats = await this.prisma.syncLog.groupBy({
        by: ['status'],
        where: {
          integration: { userId }
        },
        _count: true
      });

      return {
        integrations: stats,
        syncs: syncStats
      };
    } catch (error) {
      this.logger.error('Failed to get integration stats:', error);
      throw error;
    }
  }
}

module.exports = IntegrationService;
