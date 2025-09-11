# 🚀 Lark Integration Platform

Platform integrasi komprehensif yang menghubungkan berbagai tools bisnis (Slack, Jira, Airtable, dll.) ke Lark dengan sinkronisasi real-time dan pemetaan data yang cerdas.

## ✨ Fitur Utama

- **🔄 Sinkronisasi Real-time**: Sinkronisasi data dua arah antar platform
- **🧠 Smart Mapping**: Pemetaan field otomatis dengan AI
- **⚡ Workflow Automation**: Aturan otomasi kustom
- **🔄 Data Transformation**: Konversi format dan validasi data
- **🛡️ Error Handling**: Mekanisme retry yang robust dan logging
- **🔐 Security**: OAuth 2.0, JWT tokens, enkripsi storage
- **📊 Monitoring**: Dashboard real-time dan alerting

## 🏗️ Arsitektur Sistem

### Backend (Node.js + Express)
- **API Gateway**: Routing terpusat dan autentikasi
- **Integration Engine**: Transformasi data dan sinkronisasi
- **Webhook Manager**: Proses event masuk dari berbagai platform
- **Database Layer**: PostgreSQL dengan Redis untuk caching
- **Message Queue**: Bull/Redis untuk pemrosesan async

### Frontend (React + TypeScript)
- **Dashboard**: Monitoring real-time dan konfigurasi
- **Integration Builder**: Designer workflow visual
- **Analytics**: Metrik alur data dan performa
- **Settings**: Konfigurasi platform dan manajemen API

## 🔌 Platform yang Didukung

### Input Platforms
- **Slack**: Messages, channels, users, files
- **Jira**: Issues, projects, workflows, comments
- **Airtable**: Records, tables, attachments
- **GitHub**: Issues, PRs, commits, releases
- **Trello**: Cards, boards, lists, members
- **Notion**: Pages, databases, blocks

### Output Platform
- **Lark**: Documents, sheets, calendars, chats, workflows

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL + Redis
- **ORM**: Prisma
- **Queue**: Bull (Redis-based)
- **Authentication**: JWT + OAuth 2.0
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **UI Library**: Ant Design + Tailwind CSS
- **Charts**: Chart.js + React-Chartjs-2
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack
- **Deployment**: AWS/GCP + Kubernetes

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (untuk development)
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd lark-integration-platform
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit konfigurasi sesuai kebutuhan
nano .env
```

### 3. Start Development Environment
```bash
# Menggunakan script otomatis
./start.sh

# Atau manual
docker-compose up -d
```

### 4. Akses Aplikasi
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

## 📋 Konfigurasi Environment

Edit file `.env` dengan konfigurasi yang sesuai:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lark_integration"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Lark Configuration
LARK_APP_ID="your-lark-app-id"
LARK_APP_SECRET="your-lark-app-secret"

# Slack Configuration
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
SLACK_APP_TOKEN="xapp-your-slack-app-token"
SLACK_SIGNING_SECRET="your-slack-signing-secret"

# Jira Configuration
JIRA_BASE_URL="https://your-domain.atlassian.net"
JIRA_USERNAME="your-email@domain.com"
JIRA_API_TOKEN="your-jira-api-token"

# Airtable Configuration
AIRTABLE_API_KEY="your-airtable-api-key"
AIRTABLE_BASE_ID="your-airtable-base-id"
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Integrations
- `GET /api/integrations` - List integrations
- `POST /api/integrations` - Create integration
- `GET /api/integrations/:id` - Get integration
- `PUT /api/integrations/:id` - Update integration
- `DELETE /api/integrations/:id` - Delete integration
- `POST /api/integrations/:id/test` - Test integration
- `POST /api/integrations/:id/sync` - Sync data

### Webhooks
- `POST /api/webhooks/slack` - Slack webhook
- `POST /api/webhooks/jira` - Jira webhook
- `POST /api/webhooks/airtable` - Airtable webhook
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks/retry` - Retry failed webhooks

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/sync-logs` - Sync logs
- `GET /api/dashboard/webhook-logs` - Webhook logs
- `GET /api/dashboard/activity` - Activity timeline
- `GET /api/dashboard/metrics` - Performance metrics

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose up -d --build

# Clean up
docker-compose down -v
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📈 Monitoring

### Health Checks
- Backend: `GET /health`
- Database: Connection status
- Redis: Connection status

### Metrics
- Integration success rates
- Webhook processing times
- Error rates and types
- System resource usage

## 🔒 Security

- **Authentication**: JWT tokens dengan refresh mechanism
- **Authorization**: Role-based access control
- **Data Encryption**: Sensitive data dienkripsi
- **Rate Limiting**: API rate limiting
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Data validation dan sanitization

## 🚀 Deployment

### Production Environment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
Pastikan semua environment variables production sudah dikonfigurasi dengan benar.

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🎯 Roadmap

- [x] ✅ Project setup dan arsitektur
- [x] ✅ Backend API foundation
- [x] ✅ Lark integration implementation
- [x] ✅ Slack integration
- [x] ✅ Jira integration
- [x] ✅ Airtable integration
- [x] ✅ Frontend dashboard
- [ ] 🔄 Real-time sync engine
- [ ] 🔄 Authentication system
- [ ] 🔄 Monitoring dan analytics
- [ ] 🔄 Production deployment
- [ ] 🔄 Mobile app
- [ ] 🔄 Advanced AI features

---

**Dibuat dengan ❤️ oleh Tim Lark Integration**
