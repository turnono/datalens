# Development Guide

This guide covers the development workflow, architecture decisions, and best practices for the DataLens project.

## 🏗️ Architecture Overview

DataLens is built as a monorepo using pnpm workspaces with the following architecture:

### Frontend (Angular 20)

- **Framework**: Angular 20 with standalone components
- **State Management**: Angular Signals for reactive state
- **UI Library**: Angular Material for consistent design
- **Charts**: Chart.js via ng2-charts
- **Authentication**: Firebase Auth
- **Build Tool**: Angular CLI with Vite

### Backend (Fastify Proxy)

- **Framework**: Fastify for high-performance HTTP server
- **Authentication**: Firebase Admin SDK
- **Caching**: In-memory cache with 24h TTL
- **Rate Limiting**: Firestore-based rate limiting
- **MCP Client**: Custom adapter for Data Commons MCP server
- **Build Tool**: TypeScript with tsx for development

### Shared Package

- **Validation**: Zod schemas for type-safe data validation
- **Types**: Shared TypeScript types across frontend and backend
- **Utilities**: Common helper functions

## 🚀 Development Workflow

### 1. Environment Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MCP server (required)
export DC_API_KEY="your-api-key"
datacommons-mcp serve http --host 0.0.0.0 --port 8077
```

### 2. Development Commands

```bash
# Start all services
pnpm dev

# Start individual services
pnpm dev:proxy    # Backend only (port 8787)
pnpm dev:web      # Frontend only (port 4200)

# Build for production
pnpm build

# Run tests
pnpm test
pnpm test:proxy
pnpm test:web
pnpm test:golden

# Lint code
pnpm lint
```

### 3. Code Organization

#### Frontend Structure

```
apps/web/src/
├── app/
│   ├── components/          # Reusable UI components
│   │   └── save-button.component.ts
│   ├── pages/              # Route-level components
│   │   ├── query-page.component.ts
│   │   ├── login-page.component.ts
│   │   └── saved-page.component.ts
│   └── services/           # Business logic
│       ├── api.service.ts
│       ├── auth.service.ts
│       └── history.service.ts
├── assets/                 # Static assets
│   └── env.js             # Environment configuration
└── main.ts                # Application bootstrap
```

#### Backend Structure

```
apps/mcp-proxy/src/
├── index.ts               # Main server setup
├── mcpAdapter.ts          # MCP server communication
├── cache.ts              # Response caching logic
└── rateLimit.ts          # Rate limiting implementation
```

#### Shared Package

```
packages/shared/src/
└── index.ts              # Zod schemas and shared types
```

## 🔧 Key Components

### MCP Adapter (`mcpAdapter.ts`)

Handles communication with the Data Commons MCP server:

```typescript
// Key features:
- JSON-RPC protocol support
- Server-Sent Events (SSE) parsing
- Retry logic with exponential backoff
- Response normalization
- Error handling and fallbacks
```

### Caching System (`cache.ts`)

Implements in-memory caching with single-flight deduplication:

```typescript
// Features:
- 24-hour TTL for query results
- Single-flight deduplication
- Memory-efficient storage
- Automatic cleanup
```

### Rate Limiting (`rateLimit.ts`)

Firestore-based rate limiting system:

```typescript
// Features:
- Per-user and per-IP limits
- Monthly quota tracking
- Firebase integration
- Emulator support
```

### Authentication Service (`auth.service.ts`)

Firebase Authentication integration:

```typescript
// Features:
- Email/password authentication
- Reactive user state with signals
- Environment-based configuration
- Browser compatibility
```

## 🧪 Testing Strategy

### Unit Tests

- **Backend**: Vitest for proxy server tests
- **Frontend**: Angular Testing Utilities
- **Shared**: Vitest for utility functions

### Integration Tests

- **Golden Tests**: End-to-end API testing
- **MCP Integration**: Real MCP server communication
- **Firebase Integration**: Emulator-based testing

### Test Commands

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:proxy    # Backend tests
pnpm test:web      # Frontend tests
pnpm test:golden   # Integration tests

# Watch mode
pnpm test:watch
```

## 🔒 Security Considerations

### Authentication

- Firebase ID token verification
- Secure token handling
- User session management

### Rate Limiting

- Per-user monthly quotas
- IP-based fallback limits
- Firestore-based tracking

### Input Validation

- Zod schema validation
- Type-safe request/response handling
- SQL injection prevention

### CORS Configuration

- Origin whitelist
- Credential handling
- Preflight request support

## 📊 Performance Optimization

### Caching Strategy

- **Response Caching**: 24-hour TTL for query results
- **Single-flight**: Prevents duplicate concurrent requests
- **Memory Management**: Automatic cleanup of expired entries

### Frontend Optimization

- **Lazy Loading**: Route-based code splitting
- **Tree Shaking**: Dead code elimination
- **Bundle Analysis**: Optimized chunk sizes

### Backend Optimization

- **Fastify**: High-performance HTTP server
- **Connection Pooling**: Efficient database connections
- **Response Compression**: Gzip compression

## 🚀 Deployment

### Firebase Hosting

```bash
# Build and deploy
pnpm build
cd infra/firebase
firebase deploy
```

### Docker Deployment

```bash
# Build image
docker build -f infra/docker/Dockerfile -t datalens-proxy .

# Run container
docker run -p 8787:8787 --env-file .env datalens-proxy
```

### Environment Configuration

- **Development**: Local Firebase emulators
- **Staging**: Firebase project with test data
- **Production**: Firebase project with live data

## 🐛 Debugging

### Common Issues

#### MCP Server Connection

```bash
# Check if MCP server is running
curl http://127.0.0.1:8077/

# Check API key
echo $DC_API_KEY

# Restart MCP server
datacommons-mcp serve http --host 0.0.0.0 --port 8077
```

#### Firebase Authentication

```bash
# Check Firebase configuration
cat apps/web/src/assets/env.js

# Verify Firebase project
firebase projects:list
```

#### Build Issues

```bash
# Clean build artifacts
rm -rf apps/*/dist
rm -rf packages/*/dist

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Debug Tools

- **Browser DevTools**: Network, Console, Application tabs
- **Firebase Emulator UI**: http://localhost:4000
- **Proxy Logs**: Structured JSON logging with Fastify
- **Angular DevTools**: Component inspection

## 📝 Code Style

### TypeScript

- **Strict Mode**: Enabled across all packages
- **ESM**: Use ES modules by default
- **Type Safety**: Prefer explicit types over `any`
- **Interfaces**: Use interfaces for object shapes

### Angular

- **Standalone Components**: Use standalone components
- **Signals**: Use signals for reactive state
- **Services**: Injectable services for business logic
- **Lazy Loading**: Route-based lazy loading

### Backend

- **Fastify**: Use Fastify plugins and decorators
- **Error Handling**: Structured error responses
- **Logging**: Use Fastify's built-in logger
- **Validation**: Zod schemas for request validation

## 🔄 CI/CD Pipeline

### GitHub Actions

- **Node.js 20**: Latest LTS version
- **pnpm**: Fast, disk space efficient package manager
- **Matrix Testing**: Multiple Node.js versions
- **Security Scanning**: Dependency vulnerability checks

### Build Process

1. **Install Dependencies**: `pnpm install`
2. **Lint Code**: `pnpm lint`
3. **Run Tests**: `pnpm test`
4. **Build Applications**: `pnpm build`
5. **Deploy**: Firebase deployment

## 📚 Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Data Commons API](https://docs.datacommons.org/)
- [Zod Documentation](https://zod.dev/)
- [pnpm Documentation](https://pnpm.io/)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Write** tests for new features
4. **Ensure** all tests pass
5. **Submit** a pull request

### Pull Request Checklist

- [ ] Tests pass
- [ ] Code is linted
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed
