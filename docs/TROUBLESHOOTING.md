# Troubleshooting Guide

This guide helps you diagnose and fix common issues with DataLens.

## 🚨 Quick Diagnostics

### Check System Status

```bash
# Check if all services are running
curl http://localhost:8787/api/health  # Proxy
curl http://localhost:4200             # Frontend
curl http://127.0.0.1:8077/           # MCP Server

# Check processes
ps aux | grep -E "(tsx|ng|datacommons-mcp)"
```

### Check Logs

```bash
# Proxy logs (if running in terminal)
# Look for error messages in the terminal where you ran `pnpm dev:proxy`

# Angular logs (if running in terminal)
# Look for error messages in the terminal where you ran `pnpm dev:web`

# MCP server logs
# Look for error messages in the terminal where you ran `datacommons-mcp`
```

## 🔧 Common Issues

### 1. MCP Server Issues

#### Problem: "MCP server not responding"

```
Error: fetch failed
Error: ECONNREFUSED
```

**Solutions:**

```bash
# Check if MCP server is running
ps aux | grep datacommons-mcp

# Check if port 8077 is in use
lsof -i :8077

# Restart MCP server
export DC_API_KEY="your-api-key"
datacommons-mcp serve http --host 0.0.0.0 --port 8077
```

#### Problem: "Authentication failed"

```
Error calling tool 'search_indicators': Authentication failed. Please check your API key.
Status Code: 401
```

**Solutions:**

```bash
# Check API key is set
echo $DC_API_KEY

# Set API key if missing
export DC_API_KEY="your-datacommons-api-key"

# Restart MCP server with API key
datacommons-mcp serve http --host 0.0.0.0 --port 8077
```

#### Problem: "Command not found: datacommons-mcp"

```bash
# Install datacommons-mcp
pip install datacommons-mcp

# Or if using conda
conda install -c conda-forge datacommons-mcp
```

### 2. Proxy Server Issues

#### Problem: "Port 8787 already in use"

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:8787
```

**Solutions:**

```bash
# Kill process using port 8787
lsof -ti:8787 | xargs kill -9

# Or find and kill manually
ps aux | grep "tsx src/index.ts"
kill <process-id>
```

#### Problem: "Firebase initialization error"

```
Unable to detect a Project Id in the current environment.
```

**Solutions:**

```bash
# Check .env file
cat .env | grep FIREBASE_PROJECT_ID

# Ensure .env file exists and has correct values
cp .env.example .env
# Edit .env with your Firebase configuration
```

#### Problem: "Module not found errors"

```
Cannot find module '@datalens/shared'
```

**Solutions:**

```bash
# Rebuild shared package
pnpm --filter @datalens/shared build

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### 3. Angular Frontend Issues

#### Problem: "Build failed"

```
ERROR: TS1470: The 'import.meta' meta-property is not allowed
```

**Solutions:**

```bash
# Check for import.meta usage in browser code
grep -r "import.meta" apps/web/src/

# Remove or replace with browser-compatible alternatives
```

#### Problem: "Firebase configuration error"

```
Firebase: No Firebase App '[DEFAULT]' has been created
```

**Solutions:**

```bash
# Check environment file
cat apps/web/src/assets/env.js

# Regenerate environment file
pnpm --filter @datalens/web run gen:env
```

#### Problem: "Process is not defined"

```
ReferenceError: process is not defined
```

**Solutions:**

```bash
# Check if process polyfill is in index.html
grep -A 5 "process" apps/web/src/index.html

# Add process polyfill if missing
```

### 4. Build Issues

#### Problem: "TypeScript compilation errors"

```
TS2322: Type 'Chart<"bar" | "line", ...>' is not assignable
```

**Solutions:**

```bash
# Check TypeScript configuration
cat tsconfig.base.json

# Add type assertions for Chart.js
# Example: (chart as any)
```

#### Problem: "Angular build schema errors"

```
Data path "" must have required property 'tsConfig'
```

**Solutions:**

```bash
# Check angular.json configuration
cat apps/web/angular.json

# Ensure tsConfig is properly set
```

### 5. Network Issues

#### Problem: "CORS errors"

```
Access to fetch at 'http://localhost:8787/api/query' from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Solutions:**

```bash
# Check CORS configuration in proxy
grep -A 10 "cors" apps/mcp-proxy/src/index.ts

# Ensure WEB_ORIGIN is set correctly in .env
echo $WEB_ORIGIN
```

#### Problem: "Proxy not forwarding requests"

```
404 Not Found
```

**Solutions:**

```bash
# Check proxy configuration
cat apps/web/proxy.conf.json

# Ensure proxy is running on correct port
curl http://localhost:8787/api/health
```

## 🔍 Debugging Steps

### 1. Isolate the Problem

```bash
# Test each component individually

# Test MCP server
curl -X POST http://127.0.0.1:8077/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_indicators","arguments":{"query":"population","places":["South Africa"],"include_topics":false}},"id":"test"}'

# Test proxy
curl -X POST http://localhost:8787/api/query \
  -H "Content-Type: application/json" \
  -d '{"q":"test query"}'

# Test frontend
curl http://localhost:4200
```

### 2. Check Environment Variables

```bash
# Check all environment variables
cat .env

# Check if variables are loaded
node -e "require('dotenv').config(); console.log(process.env.DC_API_KEY)"
```

### 3. Check Dependencies

```bash
# Check if all dependencies are installed
pnpm list

# Check for version conflicts
pnpm list --depth=0
```

### 4. Check File Permissions

```bash
# Check if files are readable
ls -la apps/web/src/assets/env.js
ls -la .env

# Fix permissions if needed
chmod 644 .env
chmod 644 apps/web/src/assets/env.js
```

## 🛠️ Advanced Debugging

### 1. Enable Debug Logging

```bash
# Enable debug logging for proxy
DEBUG=* pnpm dev:proxy

# Enable debug logging for Angular
ng serve --verbose
```

### 2. Use Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check for failed requests
4. Look at Console tab for JavaScript errors
5. Check Application tab for Firebase configuration

### 3. Check Firebase Emulator

```bash
# Start Firebase emulator
cd infra/firebase
firebase emulators:start

# Check emulator UI
open http://localhost:4000
```

### 4. Test with Minimal Configuration

Create a minimal test to isolate issues:

```typescript
// test-minimal.ts
import { queryMcp } from "./mcpAdapter.js";

async function test() {
  try {
    const result = await queryMcp("test query", "auto");
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
```

## 📊 Performance Issues

### 1. Slow Response Times

**Check:**

- MCP server response time
- Network latency
- Cache hit rate
- Database query performance

**Solutions:**

```bash
# Check MCP server performance
time curl -X POST http://127.0.0.1:8077/mcp -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_indicators","arguments":{"query":"population","places":["South Africa"],"include_topics":false}},"id":"test"}'

# Check cache performance
# Look for "_cache": true in responses
```

### 2. High Memory Usage

**Check:**

- Node.js memory usage
- Cache size
- Memory leaks

**Solutions:**

```bash
# Check memory usage
ps aux | grep node

# Monitor memory with Node.js
node --inspect apps/mcp-proxy/src/index.ts
```

### 3. High CPU Usage

**Check:**

- TypeScript compilation
- Hot reloading
- Infinite loops

**Solutions:**

```bash
# Check CPU usage
top -p $(pgrep -f "tsx\|ng")

# Disable hot reloading temporarily
# Comment out watch mode in package.json
```

## 🔄 Recovery Procedures

### 1. Complete Reset

```bash
# Stop all processes
pkill -f "tsx\|ng\|datacommons-mcp"

# Clean build artifacts
rm -rf node_modules apps/*/dist packages/*/dist

# Reinstall dependencies
pnpm install

# Rebuild everything
pnpm build

# Restart services
pnpm dev
```

### 2. Partial Reset

```bash
# Reset specific service
pkill -f "tsx src/index.ts"  # Proxy
pkill -f "ng serve"          # Angular
pkill -f "datacommons-mcp"   # MCP server

# Restart specific service
pnpm dev:proxy
pnpm dev:web
```

### 3. Configuration Reset

```bash
# Reset environment
cp .env.example .env
# Edit .env with correct values

# Reset Firebase configuration
rm apps/web/src/assets/env.js
pnpm --filter @datalens/web run gen:env
```

## 📞 Getting Help

### 1. Check Documentation

- [README.md](README.md) - Quick start guide
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development workflow
- [API.md](API.md) - API documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

### 2. Search Issues

- Check GitHub Issues for similar problems
- Search error messages online
- Check Firebase documentation

### 3. Create Issue

When creating an issue, include:

```markdown
## Environment

- OS: macOS/Windows/Linux
- Node.js version: 20.x.x
- pnpm version: 8.x.x

## Error Message
```

Paste the exact error message here

```

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Additional Context
Any other relevant information
```

### 4. Contact Support

- **Email**: support@datalens.com
- **GitHub**: Create an issue
- **Discord**: Join our community server

## 🔧 Maintenance

### Daily Checks

```bash
# Check service health
curl http://localhost:8787/api/health

# Check logs for errors
tail -f /var/log/datalens/error.log
```

### Weekly Checks

```bash
# Update dependencies
pnpm update

# Check for security vulnerabilities
pnpm audit

# Clean up old build artifacts
rm -rf apps/*/dist packages/*/dist
```

### Monthly Checks

```bash
# Update Node.js and pnpm
nvm install 20
npm install -g pnpm@latest

# Review and update dependencies
pnpm outdated
```

## 📈 Monitoring

### Key Metrics to Monitor

1. **Response Time**: API response times
2. **Error Rate**: Percentage of failed requests
3. **Cache Hit Rate**: Percentage of cached responses
4. **Memory Usage**: Node.js memory consumption
5. **CPU Usage**: Server CPU utilization

### Alerting

Set up alerts for:

- Response time > 5 seconds
- Error rate > 5%
- Memory usage > 80%
- Service downtime

### Logging

Ensure proper logging for:

- All API requests
- Error conditions
- Performance metrics
- Security events
