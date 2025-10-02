# Deployment Guide

This guide covers deploying DataLens to various platforms and environments.

## 🚀 Quick Deployment

### Firebase Hosting + Cloud Functions (Recommended)

```bash
# Build the application
pnpm build

# Deploy to Firebase
cd infra/firebase
firebase deploy
```

### Docker (Alternative)

```bash
# Build and run with Docker
docker build -f infra/docker/Dockerfile -t datalens-proxy .
docker run -p 8787:8787 --env-file .env datalens-proxy
```

## 📋 Prerequisites

### Required Services

- **Firebase Project**: For authentication and hosting
- **Data Commons API Key**: For MCP server access
- **Domain**: For production deployment (optional)

### Required Tools

- Node.js 20+
- pnpm 8+
- Firebase CLI
- Docker (for containerized deployment)

## 🔧 Environment Setup

### 1. Firebase Configuration

Create a Firebase project at https://console.firebase.google.com:

1. **Enable Authentication**:

   - Go to Authentication > Sign-in method
   - Enable Email/Password provider

2. **Create Firestore Database**:

   - Go to Firestore Database
   - Create database in production mode
   - Deploy security rules

3. **Configure Hosting**:
   - Go to Hosting
   - Add your domain (optional)

### 2. Environment Variables

Create production environment variables:

```bash
# Data Commons API
DC_API_KEY=your-production-api-key

# MCP Server (if self-hosted)
MCP_SERVER_URL=https://your-mcp-server.com

# Web Configuration
WEB_ORIGIN=https://your-domain.com
PROXY_PORT=8787

# Firebase Configuration
FIREBASE_PROJECT_ID=your-production-project
FIREBASE_WEB_API_KEY=your-web-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_APP_ID=your-app-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## 🏗️ Build Process

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Applications

```bash
# Build all applications
pnpm build

# Or build individually
pnpm build:shared    # Shared package
pnpm build:proxy     # Backend proxy
pnpm build:web       # Angular frontend
```

### 3. Verify Build

```bash
# Check build outputs
ls -la apps/web/dist/web/
ls -la apps/mcp-proxy/dist/
ls -la packages/shared/dist/
```

## 🚀 Deployment Options

### Option 1: Firebase Hosting + Cloud Functions

**Pros**: Serverless, auto-scaling, integrated with Firebase
**Cons**: Vendor lock-in, cold starts

#### Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not already done)
cd infra/firebase
firebase init
```

#### Deploy

```bash
# Build applications
pnpm build

# Deploy to Firebase
cd infra/firebase
firebase deploy
```

#### Configuration

Update `infra/firebase/firebase.json`:

```json
{
  "hosting": {
    "public": "apps/web/dist/web",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

### Option 2: Docker + Cloud Run

**Pros**: Portable, scalable, cost-effective
**Cons**: More complex setup

#### Build Docker Image

```bash
# Build image
docker build -f infra/docker/Dockerfile -t datalens-proxy .

# Tag for registry
docker tag datalens-proxy gcr.io/your-project/datalens-proxy
```

#### Deploy to Cloud Run

```bash
# Push to registry
docker push gcr.io/your-project/datalens-proxy

# Deploy to Cloud Run
gcloud run deploy datalens-proxy \
  --image gcr.io/your-project/datalens-proxy \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DC_API_KEY=your-key,FIREBASE_PROJECT_ID=your-project"
```

### Option 3: Vercel + Railway

**Pros**: Easy deployment, good developer experience
**Cons**: Multiple services, potential latency

#### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd apps/web
vercel --prod
```

#### Backend (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd apps/mcp-proxy
railway login
railway deploy
```

### Option 4: Self-Hosted VPS

**Pros**: Full control, cost-effective for high traffic
**Cons**: Manual setup, maintenance required

#### Setup

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Clone repository
git clone <repository-url>
cd datalens

# Install dependencies
pnpm install

# Build applications
pnpm build

# Install PM2 for process management
npm install -g pm2
```

#### Deploy

```bash
# Start with PM2
pm2 start apps/mcp-proxy/dist/index.js --name datalens-proxy

# Serve frontend with nginx
sudo cp nginx.conf /etc/nginx/sites-available/datalens
sudo ln -s /etc/nginx/sites-available/datalens /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Security Configuration

### 1. Firebase Security Rules

Deploy Firestore security rules:

```bash
cd infra/firebase
firebase deploy --only firestore:rules
```

### 2. CORS Configuration

Update CORS settings in `apps/mcp-proxy/src/index.ts`:

```typescript
await app.register(cors, {
  origin: ["https://your-domain.com", "https://your-project.firebaseapp.com"],
  credentials: true,
});
```

### 3. Environment Variables

Never commit sensitive environment variables:

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
```

### 4. HTTPS Configuration

Ensure HTTPS is enabled for production:

```bash
# Firebase Hosting (automatic)
firebase deploy --only hosting

# Custom domain with SSL
# Configure in Firebase Console > Hosting > Custom domains
```

## 📊 Monitoring and Logging

### 1. Firebase Analytics

Enable Firebase Analytics in your Angular app:

```typescript
// apps/web/src/main.ts
import { getAnalytics } from "firebase/analytics";

const analytics = getAnalytics(app);
```

### 2. Error Tracking

Add error tracking with Sentry:

```bash
# Install Sentry
pnpm add @sentry/angular @sentry/node

# Configure in main.ts and index.ts
```

### 3. Performance Monitoring

Monitor performance with Firebase Performance:

```typescript
// apps/web/src/main.ts
import { getPerformance } from "firebase/performance";

const perf = getPerformance(app);
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build applications
        run: pnpm build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          projectId: your-project-id
```

### Environment Secrets

Configure secrets in GitHub:

- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
- `DC_API_KEY`: Data Commons API key
- `FIREBASE_PROJECT_ID`: Firebase project ID

## 🧪 Testing in Production

### 1. Health Checks

```bash
# Check API health
curl https://your-domain.com/api/health

# Check frontend
curl https://your-domain.com/
```

### 2. Smoke Tests

```bash
# Test query endpoint
curl -X POST https://your-domain.com/api/query \
  -H "Content-Type: application/json" \
  -d '{"q": "test query"}'
```

### 3. Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 5 https://your-domain.com/api/health
```

## 🔧 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clean and rebuild
rm -rf node_modules apps/*/dist packages/*/dist
pnpm install
pnpm build
```

#### Firebase Deployment Issues

```bash
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools@latest

# Check project configuration
firebase projects:list
firebase use your-project-id
```

#### Docker Issues

```bash
# Check Docker build
docker build -f infra/docker/Dockerfile -t datalens-proxy .

# Check container logs
docker logs <container-id>

# Test container locally
docker run -p 8787:8787 --env-file .env datalens-proxy
```

### Performance Issues

#### Slow Response Times

- Check MCP server connectivity
- Verify caching is working
- Monitor Firebase quotas

#### High Memory Usage

- Check for memory leaks
- Optimize caching strategy
- Scale horizontally

## 📈 Scaling

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer**: Distribute traffic across multiple instances
2. **CDN**: Use CloudFlare or AWS CloudFront for static assets
3. **Database**: Use Firebase Firestore with proper indexing
4. **Caching**: Implement Redis for distributed caching

### Vertical Scaling

For single-instance scaling:

1. **Memory**: Increase container memory limits
2. **CPU**: Use multi-core instances
3. **Storage**: Use SSD storage for better I/O

## 🔄 Rollback Strategy

### Firebase Rollback

```bash
# List deployments
firebase hosting:releases

# Rollback to previous version
firebase hosting:rollback
```

### Docker Rollback

```bash
# List images
docker images

# Rollback to previous image
docker run -p 8787:8787 gcr.io/your-project/datalens-proxy:previous-tag
```

## 📞 Support

For deployment issues:

- **Documentation**: This guide and inline comments
- **Issues**: GitHub Issues for bugs
- **Email**: deploy-support@datalens.com
- **Status Page**: https://status.datalens.com
