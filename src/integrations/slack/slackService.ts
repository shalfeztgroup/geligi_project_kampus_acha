import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

export interface SlackConfig {
  botToken: string;
  appToken?: string;
  signingSecret: string;
  webhookUrl?: string;
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  reply_broadcast?: boolean;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
  avatar?: string;
  is_bot: boolean;
  is_admin: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  topic?: string;
  purpose?: string;
  num_members?: number;
}

export class SlackService {
  private client: AxiosInstance;
  private prisma: PrismaClient;
  private config: SlackConfig;

  constructor(config: SlackConfig, prisma: PrismaClient) {
    this.config = config;
    this.prisma = prisma;
    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Authorization': `Bearer ${config.botToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Send message to channel
  async sendMessage(message: SlackMessage) {
    try {
      const response = await this.client.post('/chat.postMessage', message);
      
      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw error;
    }
  }

  // Send message to user via DM
  async sendDirectMessage(userId: string, text: string, blocks?: any[]) {
    try {
      // Open DM channel
      const dmResponse = await this.client.post('/conversations.open', {
        users: userId,
      });

      if (!dmResponse.data.ok) {
        throw new Error(`Failed to open DM: ${dmResponse.data.error}`);
      }

      const channelId = dmResponse.data.channel.id;

      // Send message
      return await this.sendMessage({
        channel: channelId,
        text,
        blocks,
      });
    } catch (error) {
      console.error('Error sending Slack DM:', error);
      throw error;
    }
  }

  // Get user information
  async getUserInfo(userId: string): Promise<SlackUser> {
    try {
      const response = await this.client.get(`/users.info?user=${userId}`);
      
      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      const user = response.data.user;
      return {
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        email: user.profile?.email,
        avatar: user.profile?.image_512,
        is_bot: user.is_bot,
        is_admin: user.is_admin,
      };
    } catch (error) {
      console.error('Error getting Slack user info:', error);
      throw error;
    }
  }

  // Get channel information
  async getChannelInfo(channelId: string): Promise<SlackChannel> {
    try {
      const response = await this.client.get(`/conversations.info?channel=${channelId}`);
      
      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      const channel = response.data.channel;
      return {
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_member: channel.is_member,
        topic: channel.topic?.value,
        purpose: channel.purpose?.value,
        num_members: channel.num_members,
      };
    } catch (error) {
      console.error('Error getting Slack channel info:', error);
      throw error;
    }
  }

  // List all channels
  async listChannels(types: string = 'public_channel,private_channel'): Promise<SlackChannel[]> {
    try {
      const response = await this.client.get(`/conversations.list?types=${types}&limit=1000`);
      
      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_member: channel.is_member,
        topic: channel.topic?.value,
        purpose: channel.purpose?.value,
        num_members: channel.num_members,
      }));
    } catch (error) {
      console.error('Error listing Slack channels:', error);
      throw error;
    }
  }

  // Create channel
  async createChannel(name: string, isPrivate: boolean = false) {
    try {
      const response = await this.client.post('/conversations.create', {
        name,
        is_private: isPrivate,
      });

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating Slack channel:', error);
      throw error;
    }
  }

  // Upload file
  async uploadFile(channel: string, file: Buffer, filename: string, title?: string) {
    try {
      const formData = new FormData();
      formData.append('channels', channel);
      formData.append('file', new Blob([file]), filename);
      if (title) formData.append('title', title);

      const response = await this.client.post('/files.upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error uploading file to Slack:', error);
      throw error;
    }
  }

  // Create interactive message blocks
  createMessageBlocks(title: string, content: string, actions?: Array<{ text: string; value: string; style?: string }>) {
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: content,
        },
      },
    ];

    if (actions && actions.length > 0) {
      blocks.push({
        type: 'actions',
        elements: actions.map(action => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text,
          },
          value: action.value,
          style: action.style || 'default',
        })),
      });
    }

    return blocks;
  }

  // Create notification card
  createNotificationCard(title: string, message: string, fields?: Array<{ title: string; value: string; short: boolean }>) {
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🔔 ${title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ];

    if (fields && fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map(field => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`,
        })),
      });
    }

    return blocks;
  }

  // Sync data from external source to Slack
  async syncDataToSlack(channelId: string, data: any[], title: string) {
    try {
      const blocks = this.createMessageBlocks(
        title,
        `Synced ${data.length} records from external source`,
        [
          { text: 'View Details', value: 'view_details', style: 'primary' },
          { text: 'Export Data', value: 'export_data' },
        ]
      );

      return await this.sendMessage({
        channel: channelId,
        blocks,
      });
    } catch (error) {
      console.error('Error syncing data to Slack:', error);
      throw error;
    }
  }

  // Get message history
  async getMessageHistory(channelId: string, limit: number = 100) {
    try {
      const response = await this.client.get(`/conversations.history?channel=${channelId}&limit=${limit}`);
      
      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data.messages;
    } catch (error) {
      console.error('Error getting Slack message history:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(channelId: string, timestamp: string, name: string) {
    try {
      const response = await this.client.post('/reactions.add', {
        channel: channelId,
        timestamp,
        name,
      });

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error adding Slack reaction:', error);
      throw error;
    }
  }
}

export default SlackService;
