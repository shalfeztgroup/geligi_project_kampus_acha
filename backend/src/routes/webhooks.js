const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const WebhookService = require('../services/WebhookService');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();
const webhookService = new WebhookService(prisma);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Slack webhook endpoint
router.post('/slack', async (req, res, next) => {
  try {
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature (implement based on your Slack app config)
    // const isValid = verifySlackSignature(signature, timestamp, body);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Handle Slack challenge
    if (req.body.challenge) {
      return res.json({ challenge: req.body.challenge });
    }

    // Process webhook
    const result = await webhookService.processWebhook(
      'slack',
      req.body.event?.type || 'unknown',
      req.body,
      req.body.authed_users?.[0] || 'system'
    );

    res.json({ success: true, webhookId: result.webhook.id });
  } catch (error) {
    next(error);
  }
});

// Jira webhook endpoint
router.post('/jira', async (req, res, next) => {
  try {
    // Verify Jira webhook (implement based on your Jira webhook config)
    // const isValid = verifyJiraWebhook(req);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid webhook' });
    // }

    const result = await webhookService.processWebhook(
      'jira',
      req.body.webhookEvent || 'unknown',
      req.body,
      req.body.user?.accountId || 'system'
    );

    res.json({ success: true, webhookId: result.webhook.id });
  } catch (error) {
    next(error);
  }
});

// Airtable webhook endpoint
router.post('/airtable', async (req, res, next) => {
  try {
    // Verify Airtable webhook (implement based on your Airtable webhook config)
    // const isValid = verifyAirtableWebhook(req);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid webhook' });
    // }

    const result = await webhookService.processWebhook(
      'airtable',
      req.body.webhook?.type || 'unknown',
      req.body,
      req.body.webhook?.baseId || 'system'
    );

    res.json({ success: true, webhookId: result.webhook.id });
  } catch (error) {
    next(error);
  }
});

// Generic webhook endpoint
router.post('/:platform',
  [
    param('platform').isIn(['slack', 'jira', 'airtable', 'github', 'trello', 'notion']),
    body().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const result = await webhookService.processWebhook(
        req.params.platform,
        req.body.event?.type || req.body.webhookEvent || 'unknown',
        req.body,
        req.user?.id || 'system'
      );

      res.json({ success: true, webhookId: result.webhook.id });
    } catch (error) {
      next(error);
    }
  }
);

// Get webhooks for user (requires auth)
router.get('/',
  [
    query('platform').optional().isString(),
    query('eventType').optional().isString(),
    query('processed').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const webhooks = await webhookService.getWebhooks(req.user.id, {
        platform: req.query.platform,
        eventType: req.query.eventType,
        processed: req.query.processed,
        limit: req.query.limit,
        offset: req.query.offset
      });

      res.json(webhooks);
    } catch (error) {
      next(error);
    }
  }
);

// Get webhook statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await webhookService.getWebhookStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Retry failed webhooks
router.post('/retry', async (req, res, next) => {
  try {
    const results = await webhookService.retryFailedWebhooks(req.user.id);
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Delete old webhooks
router.delete('/cleanup',
  [
    body('daysOld').optional().isInt({ min: 1, max: 365 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const result = await webhookService.deleteOldWebhooks(
        req.user.id,
        req.body.daysOld || 30
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Webhook signature verification helpers
function verifySlackSignature(signature, timestamp, body) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return true; // Skip verification if not configured

  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(`v0:${timestamp}:${body}`);
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
}

function verifyJiraWebhook(req) {
  // Implement Jira webhook verification
  // This depends on your Jira webhook configuration
  return true; // Placeholder
}

function verifyAirtableWebhook(req) {
  // Implement Airtable webhook verification
  // This depends on your Airtable webhook configuration
  return true; // Placeholder
}

module.exports = router;
