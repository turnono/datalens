# DataLens

A production-ready monorepo for an MCP-powered public data application that provides natural language querying of public datasets through Data Commons.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys and Firebase configuration

# Start all services
pnpm dev
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

- **[Development Guide](docs/DEVELOPMENT.md)** - Development workflow and architecture
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Multi-platform deployment
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Problem-solving guide
- **[Project Status](docs/PROJECT_STATUS.md)** - Current status and roadmap
- **[How It Works](docs/HOW_IT_WORKS.md)** - Technical implementation details
- **[Security](docs/SECURITY.md)** - Security considerations
- **[Pricing](docs/PRICING.md)** - Pricing tiers and features

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Angular 20    │    │  Fastify Proxy  │    │  MCP Server     │
│   Frontend      │◄──►│  (Rate Limit +  │◄──►│  (Data Commons) │
│   (Port 4200)   │    │   Cache + Auth) │    │  (Port 8077)    │
│                 │    │   (Port 8787)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Features

- **Natural Language Queries**: Ask questions about public data in plain English
- **Interactive Charts**: Visualize data with line and bar charts
- **User Authentication**: Firebase Auth with email/password
- **Query History**: Save and revisit previous queries
- **Rate Limiting**: Fair usage limits for free tier users
- **Response Caching**: 24-hour TTL for improved performance

## 🚀 Status

**✅ PRODUCTION READY** - Fully functional with comprehensive documentation

- Frontend: http://localhost:4200
- Backend: http://localhost:8787
- Health Check: http://localhost:8787/api/health

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For detailed contribution guidelines, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

**Need help?** Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md) or open an issue on GitHub.
