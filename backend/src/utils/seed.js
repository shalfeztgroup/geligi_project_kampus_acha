const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lark-integration.com' },
    update: {},
    create: {
      email: 'admin@lark-integration.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample integrations
  const sampleIntegrations = [
    {
      name: 'Slack Workspace',
      type: 'SLACK',
      status: 'INACTIVE',
      config: {
        botToken: 'xoxb-sample-token',
        appToken: 'xapp-sample-token',
        signingSecret: 'sample-secret'
      },
      userId: adminUser.id,
    },
    {
      name: 'Jira Project',
      type: 'JIRA',
      status: 'INACTIVE',
      config: {
        baseURL: 'https://sample.atlassian.net',
        username: 'admin@example.com',
        apiToken: 'sample-api-token'
      },
      userId: adminUser.id,
    },
    {
      name: 'Airtable Base',
      type: 'AIRTABLE',
      status: 'INACTIVE',
      config: {
        apiKey: 'sample-api-key',
        baseId: 'sample-base-id'
      },
      userId: adminUser.id,
    },
    {
      name: 'Lark Workspace',
      type: 'LARK',
      status: 'INACTIVE',
      config: {
        appId: 'sample-app-id',
        appSecret: 'sample-app-secret'
      },
      userId: adminUser.id,
    },
  ];

  for (const integration of sampleIntegrations) {
    await prisma.integration.upsert({
      where: { 
        name_userId: {
          name: integration.name,
          userId: integration.userId
        }
      },
      update: {},
      create: integration,
    });
  }

  console.log('✅ Sample integrations created');

  // Create sample logs
  const sampleLogs = [
    {
      level: 'INFO',
      message: 'Application started successfully',
      userId: adminUser.id,
    },
    {
      level: 'INFO',
      message: 'Database connection established',
      userId: adminUser.id,
    },
    {
      level: 'WARN',
      message: 'No integrations configured yet',
      userId: adminUser.id,
    },
  ];

  for (const log of sampleLogs) {
    await prisma.log.create({
      data: log,
    });
  }

  console.log('✅ Sample logs created');
  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
