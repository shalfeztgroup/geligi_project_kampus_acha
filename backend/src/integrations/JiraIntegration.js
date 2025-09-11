const axios = require('axios');
const winston = require('winston');

class JiraIntegration {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.username = config.username;
    this.apiToken = config.apiToken;
    this.auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/jira-integration.log' })
      ]
    });
  }

  async getProjects() {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/project`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      this.logger.info(`Retrieved ${response.data.length} projects`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira projects:', error.response?.data || error.message);
      throw error;
    }
  }

  async getIssues(jql = '', startAt = 0, maxResults = 50) {
    try {
      const response = await axios.post(`${this.baseURL}/rest/api/3/search`, {
        jql: jql || 'ORDER BY created DESC',
        startAt: startAt,
        maxResults: maxResults,
        fields: [
          'summary',
          'status',
          'assignee',
          'reporter',
          'created',
          'updated',
          'priority',
          'issuetype',
          'project',
          'description',
          'comment'
        ]
      }, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Retrieved ${response.data.issues.length} issues`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira issues:', error.response?.data || error.message);
      throw error;
    }
  }

  async getIssue(issueKey) {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/issue/${issueKey}`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        },
        params: {
          fields: '*all'
        }
      });

      this.logger.info(`Retrieved issue: ${issueKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get issue ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async createIssue(issue) {
    try {
      const response = await axios.post(`${this.baseURL}/rest/api/3/issue`, {
        fields: {
          project: { key: issue.projectKey },
          summary: issue.summary,
          description: issue.description,
          issuetype: { name: issue.issueType || 'Task' },
          assignee: issue.assignee ? { accountId: issue.assignee } : null,
          priority: issue.priority ? { name: issue.priority } : null,
          labels: issue.labels || []
        }
      }, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Issue created: ${response.data.key}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create issue:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateIssue(issueKey, update) {
    try {
      const response = await axios.put(`${this.baseURL}/rest/api/3/issue/${issueKey}`, {
        fields: update
      }, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Issue updated: ${issueKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update issue ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async addComment(issueKey, comment) {
    try {
      const response = await axios.post(`${this.baseURL}/rest/api/3/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment
                }
              ]
            }
          ]
        }
      }, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Comment added to issue: ${issueKey}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to add comment to issue ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getWorkflows() {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/workflow`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      this.logger.info(`Retrieved ${response.data.length} workflows`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira workflows:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUsers() {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/users/search`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        },
        params: {
          maxResults: 1000
        }
      });

      this.logger.info(`Retrieved ${response.data.length} users`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira users:', error.response?.data || error.message);
      throw error;
    }
  }

  async getIssueTypes() {
    try {
      const response = await axios.get(`${this.baseURL}/rest/api/3/issuetype`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      this.logger.info(`Retrieved ${response.data.length} issue types`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira issue types:', error.response?.data || error.message);
      throw error;
    }
  }

  // Data transformation methods
  transformToLarkDocument(jiraData) {
    const { issues } = jiraData;
    
    const content = {
      title: 'Jira Issues Report',
      content: issues.map(issue => ({
        type: 'heading',
        level: 2,
        children: [{
          type: 'text',
          text: `${issue.key}: ${issue.fields.summary}`
        }]
      })).concat(issues.map(issue => ({
        type: 'paragraph',
        children: [{
          type: 'text',
          text: `Status: ${issue.fields.status.name}\nAssignee: ${issue.fields.assignee?.displayName || 'Unassigned'}\nPriority: ${issue.fields.priority?.name || 'None'}\nDescription: ${issue.fields.description || 'No description'}`
        }]
      })))
    };

    return content;
  }

  transformToLarkSpreadsheet(jiraData) {
    const { issues } = jiraData;
    
    const headers = ['Key', 'Summary', 'Status', 'Assignee', 'Priority', 'Type', 'Created', 'Updated'];
    const rows = issues.map(issue => [
      issue.key,
      issue.fields.summary,
      issue.fields.status?.name || '',
      issue.fields.assignee?.displayName || 'Unassigned',
      issue.fields.priority?.name || '',
      issue.fields.issuetype?.name || '',
      new Date(issue.fields.created).toLocaleDateString(),
      new Date(issue.fields.updated).toLocaleDateString()
    ]);

    return {
      title: 'Jira Issues Export',
      sheets: [{
        title: 'Issues',
        data: [headers, ...rows]
      }]
    };
  }

  transformToLarkCalendar(jiraData) {
    const { issues } = jiraData;
    
    return issues
      .filter(issue => issue.fields.duedate)
      .map(issue => ({
        title: `${issue.key}: ${issue.fields.summary}`,
        description: issue.fields.description || '',
        startTime: new Date(issue.fields.duedate).toISOString(),
        endTime: new Date(new Date(issue.fields.duedate).getTime() + 3600000).toISOString(), // 1 hour duration
        attendees: issue.fields.assignee ? [issue.fields.assignee.emailAddress] : []
      }));
  }

  // Process incoming webhook
  processWebhook(payload) {
    try {
      const event = payload.webhookEvent;
      
      switch (event) {
        case 'jira:issue_created':
          return this.processIssueCreated(payload);
        case 'jira:issue_updated':
          return this.processIssueUpdated(payload);
        case 'jira:issue_deleted':
          return this.processIssueDeleted(payload);
        case 'comment_created':
          return this.processCommentCreated(payload);
        default:
          this.logger.info(`Unhandled Jira event: ${event}`);
          return null;
      }
    } catch (error) {
      this.logger.error('Failed to process Jira webhook:', error);
      throw error;
    }
  }

  processIssueCreated(payload) {
    return {
      type: 'issue_created',
      issue: payload.issue,
      user: payload.user,
      timestamp: payload.timestamp
    };
  }

  processIssueUpdated(payload) {
    return {
      type: 'issue_updated',
      issue: payload.issue,
      user: payload.user,
      changelog: payload.changelog,
      timestamp: payload.timestamp
    };
  }

  processIssueDeleted(payload) {
    return {
      type: 'issue_deleted',
      issue: payload.issue,
      user: payload.user,
      timestamp: payload.timestamp
    };
  }

  processCommentCreated(payload) {
    return {
      type: 'comment_created',
      issue: payload.issue,
      comment: payload.comment,
      user: payload.user,
      timestamp: payload.timestamp
    };
  }
}

module.exports = JiraIntegration;
