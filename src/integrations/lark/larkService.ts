import { Client } from '@lark-base-open/node-sdk';
import { PrismaClient } from '@prisma/client';

export interface LarkConfig {
  appId: string;
  appSecret: string;
  tenantToken?: string;
}

export interface LarkMessage {
  type: 'text' | 'post' | 'image' | 'file' | 'card';
  content: any;
  receiveId?: string;
  receiveIdType?: 'open_id' | 'user_id' | 'union_id' | 'email' | 'chat_id';
}

export interface LarkCard {
  header: {
    title: {
      tag: 'plain_text';
      content: string;
    };
    template?: 'blue' | 'wathet' | 'turquoise' | 'green' | 'yellow' | 'orange' | 'red' | 'carmine' | 'violet' | 'purple' | 'indigo' | 'grey';
  };
  elements: Array<{
    tag: string;
    text?: {
      tag: 'plain_text' | 'lark_md';
      content: string;
    };
    fields?: Array<{
      is_short: boolean;
      text: {
        tag: 'plain_text';
        content: string;
      };
    }>;
  }>;
}

export class LarkService {
  private client: Client;
  private prisma: PrismaClient;

  constructor(config: LarkConfig, prisma: PrismaClient) {
    this.client = new Client({
      appId: config.appId,
      appSecret: config.appSecret,
      disableTokenCache: false,
    });
    this.prisma = prisma;
  }

  // Send text message
  async sendTextMessage(receiveId: string, content: string, receiveIdType: string = 'open_id') {
    try {
      const response = await this.client.im.message.create({
        params: {
          receive_id_type: receiveIdType,
        },
        data: {
          receive_id: receiveId,
          msg_type: 'text',
          content: JSON.stringify({ text: content }),
        },
      });
      return response;
    } catch (error) {
      console.error('Error sending Lark text message:', error);
      throw error;
    }
  }

  // Send rich text message (post)
  async sendPostMessage(receiveId: string, content: any, receiveIdType: string = 'open_id') {
    try {
      const response = await this.client.im.message.create({
        params: {
          receive_id_type: receiveIdType,
        },
        data: {
          receive_id: receiveId,
          msg_type: 'post',
          content: JSON.stringify(content),
        },
      });
      return response;
    } catch (error) {
      console.error('Error sending Lark post message:', error);
      throw error;
    }
  }

  // Send interactive card
  async sendCardMessage(receiveId: string, card: LarkCard, receiveIdType: string = 'open_id') {
    try {
      const response = await this.client.im.message.create({
        params: {
          receive_id_type: receiveIdType,
        },
        data: {
          receive_id: receiveId,
          msg_type: 'interactive',
          content: JSON.stringify({
            type: 'template',
            data: {
              template_id: 'ctp_AAAhgQ',
              template_variable: card,
            },
          }),
        },
      });
      return response;
    } catch (error) {
      console.error('Error sending Lark card message:', error);
      throw error;
    }
  }

  // Create Lark document
  async createDocument(title: string, content: string, folderToken?: string) {
    try {
      const response = await this.client.drive.file.create({
        data: {
          name: title,
          type: 'doc',
          folder_token: folderToken,
        },
      });

      // Add content to document
      if (response.data?.file_token) {
        await this.client.drive.file.update({
          path: { file_token: response.data.file_token },
          data: {
            content: content,
          },
        });
      }

      return response;
    } catch (error) {
      console.error('Error creating Lark document:', error);
      throw error;
    }
  }

  // Create Lark spreadsheet
  async createSpreadsheet(title: string, sheets: Array<{ name: string; properties: any }>) {
    try {
      const response = await this.client.sheets.spreadsheet.create({
        data: {
          title: title,
          sheets: sheets,
        },
      });
      return response;
    } catch (error) {
      console.error('Error creating Lark spreadsheet:', error);
      throw error;
    }
  }

  // Get user info
  async getUserInfo(userId: string, userIdType: string = 'open_id') {
    try {
      const response = await this.client.contact.user.get({
        path: { user_id: userId },
        params: {
          user_id_type: userIdType,
        },
      });
      return response;
    } catch (error) {
      console.error('Error getting Lark user info:', error);
      throw error;
    }
  }

  // Get chat info
  async getChatInfo(chatId: string) {
    try {
      const response = await this.client.im.chat.get({
        path: { chat_id: chatId },
      });
      return response;
    } catch (error) {
      console.error('Error getting Lark chat info:', error);
      throw error;
    }
  }

  // Create calendar event
  async createCalendarEvent(event: {
    summary: string;
    description?: string;
    startTime: number;
    endTime: number;
    attendees?: Array<{ type: string; id: string }>;
  }) {
    try {
      const response = await this.client.calendar.calendarEvent.create({
        data: {
          summary: event.summary,
          description: event.description,
          start_time: {
            timestamp: event.startTime,
            timezone: 'Asia/Jakarta',
          },
          end_time: {
            timestamp: event.endTime,
            timezone: 'Asia/Jakarta',
          },
          attendees: event.attendees,
        },
      });
      return response;
    } catch (error) {
      console.error('Error creating Lark calendar event:', error);
      throw error;
    }
  }

  // Send notification
  async sendNotification(userId: string, title: string, content: string) {
    try {
      const card: LarkCard = {
        header: {
          title: {
            tag: 'plain_text',
            content: title,
          },
          template: 'blue',
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'plain_text',
              content: content,
            },
          },
        ],
      };

      return await this.sendCardMessage(userId, card);
    } catch (error) {
      console.error('Error sending Lark notification:', error);
      throw error;
    }
  }

  // Sync data to Lark base
  async syncToBase(baseToken: string, tableId: string, records: any[]) {
    try {
      const response = await this.client.base.appTableRecord.batchCreate({
        path: {
          app_token: baseToken,
          table_id: tableId,
        },
        data: {
          records: records.map(record => ({
            fields: record,
          })),
        },
      });
      return response;
    } catch (error) {
      console.error('Error syncing to Lark base:', error);
      throw error;
    }
  }
}

export default LarkService;
