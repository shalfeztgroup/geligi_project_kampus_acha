# 🚀 Deployment Guide - Lark Integration Platform

Panduan lengkap untuk deploy platform Lark Integration ke berbagai platform hosting.

## 🌐 Opsi Deployment

### 1. 🆓 **GitHub Pages (Frontend Only)**
**Cocok untuk:** Demo frontend, dokumentasi
**Keterbatasan:** Hanya static files, backend perlu hosting terpisah

#### Setup GitHub Pages:
1. Buka repository di GitHub
2. Pergi ke **Settings** → **Pages**
3. Pilih **Source**: "Deploy from a branch"
4. Pilih **Branch**: "main" / "root"
5. Klik **Save**
6. Tunggu deployment selesai
7. Akses di: `https://shalfeztgroup.github.io/geligi_project_kampus_acha`

#### Manual Deploy:
```bash
# Build frontend
cd frontend
npm run build

# Deploy ke gh-pages branch
npm install -g gh-pages
gh-pages -d dist
```

---

### 2. ⚡ **Vercel (Recommended)**
**Cocok untuk:** Full-stack deployment, mudah setup
**Keunggulan:** Auto-deploy, custom domain, serverless functions

#### Setup Vercel:
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Follow prompts untuk konfigurasi
5. Set environment variables di Vercel dashboard

#### Environment Variables di Vercel:
```
DATABASE_URL=your_postgres_url
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
LARK_APP_ID=your_lark_app_id
LARK_APP_SECRET=your_lark_app_secret
# ... dan lainnya
```

---

### 3. 🌊 **Netlify (Frontend + API Proxy)**
**Cocok untuk:** Frontend dengan API proxy
**Keunggulan:** CDN global, form handling, serverless functions

#### Setup Netlify:
1. Connect repository ke Netlify
2. Build command: `cd frontend && npm run build`
3. Publish directory: `frontend/dist`
4. Set environment variables
5. Deploy!

---

### 4. ☁️ **Railway (Full-Stack)**
**Cocok untuk:** Full-stack dengan database
**Keunggulan:** PostgreSQL included, auto-deploy

#### Setup Railway:
1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy!

---

### 5. 🐳 **Docker + Cloud (Production)**
**Cocok untuk:** Production deployment
**Platform:** AWS, GCP, DigitalOcean

#### AWS ECS:
```bash
# Build dan push Docker images
docker build -t lark-integration-frontend ./frontend
docker build -t lark-integration-backend ./backend

# Push ke ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag lark-integration-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/lark-integration-frontend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/lark-integration-frontend:latest
```

---

## 🔧 **Setup Environment Variables**

### Required Variables:
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_URL=redis://host:port

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-domain.com

# Lark
LARK_APP_ID=your-lark-app-id
LARK_APP_SECRET=your-lark-app-secret

# Slack
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_APP_TOKEN=xapp-your-slack-app-token
SLACK_SIGNING_SECRET=your-slack-signing-secret

# Jira
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@domain.com
JIRA_API_TOKEN=your-jira-api-token

# Airtable
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-airtable-base-id
```

---

## 🚀 **Quick Deploy Commands**

### Vercel:
```bash
npm i -g vercel
vercel
```

### Netlify:
```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Railway:
```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

---

## 📊 **Monitoring & Maintenance**

### Health Checks:
- Frontend: `https://your-domain.com`
- Backend: `https://your-domain.com/api/health`
- Database: Connection status
- Redis: Connection status

### Logs:
```bash
# Vercel
vercel logs

# Netlify
netlify logs

# Railway
railway logs
```

---

## 🔒 **Security Checklist**

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Database credentials secured
- [ ] API keys rotated regularly
- [ ] Monitoring alerts setup

---

## 🆘 **Troubleshooting**

### Common Issues:

1. **Build Fails:**
   - Check Node.js version (18+)
   - Verify all dependencies installed
   - Check environment variables

2. **Database Connection:**
   - Verify DATABASE_URL format
   - Check database accessibility
   - Ensure migrations run

3. **API Not Working:**
   - Check CORS settings
   - Verify API endpoints
   - Check authentication

4. **Frontend Not Loading:**
   - Check build output
   - Verify routing configuration
   - Check console errors

---

## 📞 **Support**

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/shalfeztgroup/geligi_project_kampus_acha/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shalfeztgroup/geligi_project_kampus_acha/discussions)

---

**Happy Deploying! 🚀**
