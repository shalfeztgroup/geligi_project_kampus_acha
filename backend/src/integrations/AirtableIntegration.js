const axios = require('axios');
const winston = require('winston');

class AirtableIntegration {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseId = config.baseId;
    this.baseURL = `https://api.airtable.com/v0/${this.baseId}`;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/airtable-integration.log' })
      ]
    });
  }

  async getTables() {
    try {
      const response = await axios.get(`${this.baseURL}/meta/bases/${this.baseId}/tables`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Retrieved ${response.data.tables.length} tables`);
      return response.data.tables;
    } catch (error) {
      this.logger.error('Failed to get Airtable tables:', error.response?.data || error.message);
      throw error;
    }
  }

  async getRecords(tableName, options = {}) {
    try {
      const params = {
        pageSize: options.pageSize || 100,
        maxRecords: options.maxRecords || 1000,
        view: options.view || null,
        filterByFormula: options.filterByFormula || null,
        sort: options.sort || null
      };

      // Remove null values
      Object.keys(params).forEach(key => {
        if (params[key] === null) {
          delete params[key];
        }
      });

      const response = await axios.get(`${this.baseURL}/${tableName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: params
      });

      this.logger.info(`Retrieved ${response.data.records.length} records from ${tableName}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get records from ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getRecord(tableName, recordId) {
    try {
      const response = await axios.get(`${this.baseURL}/${tableName}/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Retrieved record ${recordId} from ${tableName}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get record ${recordId} from ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async createRecord(tableName, fields) {
    try {
      const response = await axios.post(`${this.baseURL}/${tableName}`, {
        fields: fields
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Record created in ${tableName}: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create record in ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async updateRecord(tableName, recordId, fields) {
    try {
      const response = await axios.patch(`${this.baseURL}/${tableName}/${recordId}`, {
        fields: fields
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Record updated in ${tableName}: ${recordId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update record ${recordId} in ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async deleteRecord(tableName, recordId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${tableName}/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Record deleted from ${tableName}: ${recordId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to delete record ${recordId} from ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async batchCreateRecords(tableName, records) {
    try {
      const response = await axios.post(`${this.baseURL}/${tableName}`, {
        records: records.map(record => ({ fields: record }))
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Batch created ${response.data.records.length} records in ${tableName}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to batch create records in ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async batchUpdateRecords(tableName, records) {
    try {
      const response = await axios.patch(`${this.baseURL}/${tableName}`, {
        records: records
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Batch updated ${response.data.records.length} records in ${tableName}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to batch update records in ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getTableSchema(tableName) {
    try {
      const response = await axios.get(`${this.baseURL}/meta/bases/${this.baseId}/tables/${tableName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Retrieved schema for table ${tableName}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get schema for table ${tableName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Data transformation methods
  transformToLarkDocument(airtableData) {
    const { tableName, records } = airtableData;
    
    const content = {
      title: `Airtable Table: ${tableName}`,
      content: records.map(record => ({
        type: 'heading',
        level: 3,
        children: [{
          type: 'text',
          text: `Record ${record.id}`
        }]
      })).concat(records.map(record => ({
        type: 'paragraph',
        children: [{
          type: 'text',
          text: JSON.stringify(record.fields, null, 2)
        }]
      })))
    };

    return content;
  }

  transformToLarkSpreadsheet(airtableData) {
    const { tableName, records } = airtableData;
    
    if (records.length === 0) {
      return {
        title: `Airtable Table: ${tableName}`,
        sheets: [{
          title: tableName,
          data: [['No data available']]
        }]
      };
    }

    // Get all unique field names
    const allFields = new Set();
    records.forEach(record => {
      Object.keys(record.fields).forEach(field => allFields.add(field));
    });

    const headers = ['ID', ...Array.from(allFields)];
    const rows = records.map(record => [
      record.id,
      ...Array.from(allFields).map(field => {
        const value = record.fields[field];
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      })
    ]);

    return {
      title: `Airtable Table: ${tableName}`,
      sheets: [{
        title: tableName,
        data: [headers, ...rows]
      }]
    };
  }

  transformToLarkCalendar(airtableData) {
    const { records } = airtableData;
    
    return records
      .filter(record => record.fields.date || record.fields.start_date)
      .map(record => {
        const dateField = record.fields.date || record.fields.start_date;
        const endDateField = record.fields.end_date || record.fields.date;
        
        return {
          title: record.fields.title || record.fields.name || `Record ${record.id}`,
          description: record.fields.description || record.fields.notes || '',
          startTime: new Date(dateField).toISOString(),
          endTime: new Date(endDateField).toISOString(),
          attendees: record.fields.attendees || record.fields.people || []
        };
      });
  }

  // Process incoming webhook
  processWebhook(payload) {
    try {
      const event = payload.webhook;
      
      switch (event.type) {
        case 'created':
          return this.processRecordCreated(payload);
        case 'updated':
          return this.processRecordUpdated(payload);
        case 'deleted':
          return this.processRecordDeleted(payload);
        default:
          this.logger.info(`Unhandled Airtable event: ${event.type}`);
          return null;
      }
    } catch (error) {
      this.logger.error('Failed to process Airtable webhook:', error);
      throw error;
    }
  }

  processRecordCreated(payload) {
    return {
      type: 'record_created',
      record: payload.record,
      table: payload.table,
      timestamp: payload.timestamp
    };
  }

  processRecordUpdated(payload) {
    return {
      type: 'record_updated',
      record: payload.record,
      table: payload.table,
      changedFields: payload.changedFields,
      timestamp: payload.timestamp
    };
  }

  processRecordDeleted(payload) {
    return {
      type: 'record_deleted',
      record: payload.record,
      table: payload.table,
      timestamp: payload.timestamp
    };
  }

  // Utility methods
  formatFieldValue(field, value) {
    if (!value) return '';
    
    switch (field.type) {
      case 'multipleSelects':
      case 'multipleRecordLinks':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'dateTime':
        return new Date(value).toLocaleString();
      case 'attachment':
        return Array.isArray(value) ? value.map(att => att.name).join(', ') : value.name;
      default:
        return String(value);
    }
  }

  extractFieldNames(records) {
    const fieldNames = new Set();
    records.forEach(record => {
      Object.keys(record.fields).forEach(field => fieldNames.add(field));
    });
    return Array.from(fieldNames);
  }
}

module.exports = AirtableIntegration;
