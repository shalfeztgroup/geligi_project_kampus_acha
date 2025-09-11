const axios = require('axios');
const winston = require('winston');

class LarkIntegration {
  constructor(config) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.baseURL = 'https://open.larksuite.com/open-apis';
    this.accessToken = null;
    this.tokenExpiresAt = null;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/lark-integration.log' })
      ]
    });
  }

  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      const response = await axios.post(`${this.baseURL}/auth/v3/tenant_access_token/internal`, {
        app_id: this.appId,
        app_secret: this.appSecret
      });

      this.accessToken = response.data.tenant_access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expire * 1000) - 60000; // 1 minute buffer

      this.logger.info('Lark access token refreshed');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get Lark access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Lark');
    }
  }

  async createDocument(title, content, folderToken = null) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/drive/v1/files`,
        {
          title,
          type: 'doc',
          folder_token: folderToken
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Add content to the document
      if (content) {
        await this.updateDocumentContent(response.data.data.file_token, content);
      }

      this.logger.info(`Document created: ${response.data.data.file_token}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to create Lark document:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateDocumentContent(fileToken, content) {
    try {
      const token = await this.getAccessToken();
      
      await axios.patch(
        `${this.baseURL}/docx/v1/documents/${fileToken}/content`,
        {
          content: content
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.info(`Document content updated: ${fileToken}`);
    } catch (error) {
      this.logger.error('Failed to update document content:', error.response?.data || error.message);
      throw error;
    }
  }

  async createSpreadsheet(title, sheets, folderToken = null) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/drive/v1/files`,
        {
          title,
          type: 'sheet',
          folder_token: folderToken
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Add sheets data
      if (sheets && sheets.length > 0) {
        await this.updateSpreadsheetData(response.data.data.file_token, sheets);
      }

      this.logger.info(`Spreadsheet created: ${response.data.data.file_token}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to create Lark spreadsheet:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateSpreadsheetData(fileToken, sheets) {
    try {
      const token = await this.getAccessToken();
      
      for (const sheet of sheets) {
        await axios.post(
          `${this.baseURL}/sheets/v2/spreadsheets/${fileToken}/sheets_batch_update`,
          {
            requests: [
              {
                add_sheet: {
                  properties: {
                    title: sheet.title,
                    grid_properties: {
                      row_count: sheet.rows || 1000,
                      column_count: sheet.columns || 26
                    }
                  }
                }
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Add data to the sheet
        if (sheet.data && sheet.data.length > 0) {
          await this.addSheetData(fileToken, sheet.title, sheet.data);
        }
      }

      this.logger.info(`Spreadsheet data updated: ${fileToken}`);
    } catch (error) {
      this.logger.error('Failed to update spreadsheet data:', error.response?.data || error.message);
      throw error;
    }
  }

  async addSheetData(fileToken, sheetTitle, data) {
    try {
      const token = await this.getAccessToken();
      
      // Convert data to Lark sheet format
      const values = data.map(row => 
        Array.isArray(row) ? row : Object.values(row)
      );

      await axios.post(
        `${this.baseURL}/sheets/v2/spreadsheets/${fileToken}/values_append`,
        {
          value_range: {
            range: `${sheetTitle}!A1`,
            values: values
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.info(`Sheet data added to ${sheetTitle}`);
    } catch (error) {
      this.logger.error('Failed to add sheet data:', error.response?.data || error.message);
      throw error;
    }
  }

  async createCalendarEvent(event) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/calendar/v4/calendars/${event.calendarId}/events`,
        {
          summary: event.title,
          description: event.description,
          start_time: {
            timestamp: Math.floor(new Date(event.startTime).getTime() / 1000)
          },
          end_time: {
            timestamp: Math.floor(new Date(event.endTime).getTime() / 1000)
          },
          attendees: event.attendees || []
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.info(`Calendar event created: ${response.data.data.event_id}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to create calendar event:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendMessage(chatId, message) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/im/v1/messages`,
        {
          receive_id: chatId,
          msg_type: message.type || 'text',
          content: JSON.stringify({
            text: message.text || message.content
          })
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.info(`Message sent to chat ${chatId}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  }

  async createWorkflow(workflow) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/workflow/v1/workflows`,
        {
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.info(`Workflow created: ${response.data.data.workflow_id}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to create workflow:', error.response?.data || error.message);
      throw error;
    }
  }

  // Data transformation methods
  transformSlackMessage(slackMessage) {
    return {
      type: 'text',
      content: {
        text: `[Slack] ${slackMessage.user}: ${slackMessage.text}`
      }
    };
  }

  transformJiraIssue(jiraIssue) {
    return {
      type: 'text',
      content: {
        text: `[Jira] ${jiraIssue.key}: ${jiraIssue.summary}\nStatus: ${jiraIssue.status}\nAssignee: ${jiraIssue.assignee}`
      }
    };
  }

  transformAirtableRecord(record) {
    return {
      type: 'text',
      content: {
        text: `[Airtable] Record: ${JSON.stringify(record.fields, null, 2)}`
      }
    };
  }
}

module.exports = LarkIntegration;
