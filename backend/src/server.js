const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { createServer } = require('http');
const { Server } = require('ws');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const integrationRoutes = require('./routes/integrations');
const webhookRoutes = require('./routes/webhooks');
const dashboardRoutes = require('./routes/dashboard');

// Import services
const WebhookService = require('./services/WebhookService');
const IntegrationService = require('./services/IntegrationService');
const NotificationService = require('./services/NotificationService');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const server = createServer(app);
const wss = new Server({ server });
const prisma = new PrismaClient();

// Initialize services
const webhookService = new WebhookService(prisma);
const integrationService = new IntegrationService(prisma);
const notificationService = new NotificationService(wss);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/integrations', authMiddleware, integrationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          // Handle subscription to specific integration updates
          ws.integrationId = data.integrationId;
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready`);
});

module.exports = { app, server, wss };
