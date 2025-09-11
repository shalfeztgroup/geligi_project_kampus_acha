const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const IntegrationService = require('../services/IntegrationService');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const integrationService = new IntegrationService(prisma);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all integrations for user
router.get('/', async (req, res, next) => {
  try {
    const integrations = await integrationService.getIntegrations(req.user.id);
    res.json(integrations);
  } catch (error) {
    next(error);
  }
});

// Get integration by ID
router.get('/:id', 
  param('id').isUUID(),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const integration = await integrationService.getIntegration(req.params.id, req.user.id);
      res.json(integration);
    } catch (error) {
      next(error);
    }
  }
);

// Create new integration
router.post('/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn(['SLACK', 'JIRA', 'AIRTABLE', 'GITHUB', 'TRELLO', 'NOTION', 'LARK'])
      .withMessage('Invalid integration type'),
    body('config').isObject().withMessage('Config is required'),
    body('mapping').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const integration = await integrationService.createIntegration(req.user.id, req.body);
      res.status(201).json(integration);
    } catch (error) {
      next(error);
    }
  }
);

// Update integration
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().notEmpty(),
    body('config').optional().isObject(),
    body('mapping').optional().isObject(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'ERROR', 'PENDING'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const integration = await integrationService.updateIntegration(
        req.params.id,
        req.user.id,
        req.body
      );
      res.json(integration);
    } catch (error) {
      next(error);
    }
  }
);

// Delete integration
router.delete('/:id',
  param('id').isUUID(),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      await integrationService.deleteIntegration(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Test integration connection
router.post('/:id/test',
  param('id').isUUID(),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const result = await integrationService.testIntegration(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Sync data from integration
router.post('/:id/sync',
  [
    param('id').isUUID(),
    body('direction').optional().isIn(['INBOUND', 'OUTBOUND', 'BIDIRECTIONAL'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const result = await integrationService.syncData(
        req.params.id,
        req.user.id,
        req.body.direction || 'INBOUND'
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get integration statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const stats = await integrationService.getIntegrationStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get available integration types
router.get('/types/available', (req, res) => {
  const types = [
    {
      type: 'SLACK',
      name: 'Slack',
      description: 'Connect with Slack workspaces',
      icon: 'slack',
      capabilities: ['messages', 'channels', 'users', 'files']
    },
    {
      type: 'JIRA',
      name: 'Jira',
      description: 'Connect with Jira projects',
      icon: 'jira',
      capabilities: ['issues', 'projects', 'workflows', 'comments']
    },
    {
      type: 'AIRTABLE',
      name: 'Airtable',
      description: 'Connect with Airtable bases',
      icon: 'airtable',
      capabilities: ['records', 'tables', 'attachments']
    },
    {
      type: 'GITHUB',
      name: 'GitHub',
      description: 'Connect with GitHub repositories',
      icon: 'github',
      capabilities: ['issues', 'prs', 'commits', 'releases']
    },
    {
      type: 'TRELLO',
      name: 'Trello',
      description: 'Connect with Trello boards',
      icon: 'trello',
      capabilities: ['cards', 'boards', 'lists', 'members']
    },
    {
      type: 'NOTION',
      name: 'Notion',
      description: 'Connect with Notion workspaces',
      icon: 'notion',
      capabilities: ['pages', 'databases', 'blocks']
    },
    {
      type: 'LARK',
      name: 'Lark',
      description: 'Connect with Lark workspaces',
      icon: 'lark',
      capabilities: ['documents', 'sheets', 'calendars', 'chats', 'workflows']
    }
  ];

  res.json(types);
});

module.exports = router;
