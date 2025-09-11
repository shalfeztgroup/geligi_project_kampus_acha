const axios = require('axios');
const winston = require('winston');

class SlackIntegration {
  constructor(config) {
    this.botToken = config.botToken;
    this.appToken = config.appToken;
    this.signingSecret = config.signingSecret;
    this.baseURL = 'https://slack.com/api';
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/slack-integration.log' })
      ]
    });
  }

  async getChannels() {
    try {
      const response = await axios.get(`${this.baseURL}/conversations.list`, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`
        },
        params: {
          types: 'public_channel,private_channel',
          limit: 1000
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.logger.info(`Retrieved ${response.data.channels.length} channels`);
      return response.data.channels;
    } catch (error) {
      this.logger.error('Failed to get Slack channels:', error.response?.data || error.message);
      throw error;
    }
  }

  async getChannelMessages(channelId, limit = 100) {
    try {
      const response = await axios.get(`${this.baseURL}/conversations.history`, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`
        },
        params: {
          channel: channelId,
          limit: limit
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.logger.info(`Retrieved ${response.data.messages.length} messages from channel ${channelId}`);
      return response.data.messages;
    } catch (error) {
      this.logger.error('Failed to get channel messages:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUsers() {
    try {
      const response = await axios.get(`${this.baseURL}/users.list`, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`
        },
        params: {
          limit: 1000
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.logger.info(`Retrieved ${response.data.members.length} users`);
      return response.data.members;
    } catch (error) {
      this.logger.error('Failed to get Slack users:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendMessage(channelId, text, blocks = null) {
    try {
      const payload = {
        channel: channelId,
        text: text
      };

      if (blocks) {
        payload.blocks = blocks;
      }

      const response = await axios.post(`${this.baseURL}/chat.postMessage`, payload, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.logger.info(`Message sent to channel ${channelId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  }

  async uploadFile(channelId, file, title = null, comment = null) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('channels', channelId);
      form.append('file', file);
      if (title) form.append('title', title);
      if (comment) form.append('initial_comment', comment);

      const response = await axios.post(`${this.baseURL}/files.upload`, form, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          ...form.getHeaders()
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.logger.info(`File uploaded to channel ${channelId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to upload file:', error.response?.data || error.message);
      throw error;
    }
  }

  async createChannel(name, isPrivate = false) {
    try {
      const response = await axios.post(`${this.baseURL}/conversations.create`, {
        name: name,
        is_private: isPrivate
      }, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.logger.info(`Channel created: ${response.data.channel.name}`);
      return response.data.channel;
    } catch (error) {
      this.logger.error('Failed to create channel:', error.response?.data || error.message);
      throw error;
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await axios.get(`${this.baseURL}/files.info`, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`
        },
        params: {
          file: fileId
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      this.logger.info(`File info retrieved: ${fileId}`);
      return response.data.file;
    } catch (error) {
      this.logger.error('Failed to get file info:', error.response?.data || error.message);
      throw error;
    }
  }

  // Data transformation methods
  transformToLarkDocument(slackData) {
    const { channel, messages } = slackData;
    
    const content = {
      title: `Slack Channel: ${channel.name}`,
      content: messages.map(msg => ({
        type: 'paragraph',
        children: [{
          type: 'text',
          text: `[${msg.user}] ${msg.text}`
        }]
      }))
    };

    return content;
  }

  transformToLarkSpreadsheet(slackData) {
    const { users, channels } = slackData;
    
    const headers = ['ID', 'Name', 'Email', 'Status', 'Channels'];
    const rows = users.map(user => [
      user.id,
      user.real_name || user.name,
      user.profile?.email || '',
      user.deleted ? 'Deleted' : 'Active',
      user.is_member ? 'Yes' : 'No'
    ]);

    return {
      title: 'Slack Users Export',
      sheets: [{
        title: 'Users',
        data: [headers, ...rows]
      }]
    };
  }

  // Webhook verification
  verifyWebhook(payload, signature, timestamp) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.signingSecret);
    hmac.update(`v0:${timestamp}:${payload}`);
    const expectedSignature = `v0=${hmac.digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  }

  // Process incoming webhook
  processWebhook(payload) {
    try {
      const event = payload.event;
      
      switch (event.type) {
        case 'message':
          return this.processMessage(event);
        case 'channel_created':
          return this.processChannelCreated(event);
        case 'user_change':
          return this.processUserChange(event);
        default:
          this.logger.info(`Unhandled event type: ${event.type}`);
          return null;
      }
    } catch (error) {
      this.logger.error('Failed to process webhook:', error);
      throw error;
    }
  }

  processMessage(event) {
    return {
      type: 'message',
      channel: event.channel,
      user: event.user,
      text: event.text,
      timestamp: event.ts,
      thread_ts: event.thread_ts
    };
  }

  processChannelCreated(event) {
    return {
      type: 'channel_created',
      channel: event.channel,
      creator: event.creator
    };
  }

  processUserChange(event) {
    return {
      type: 'user_change',
      user: event.user
    };
  }
}

module.exports = SlackIntegration;
