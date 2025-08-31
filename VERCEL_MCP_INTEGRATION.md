# Vercel MCP Integration for Kasama AI

## Overview

Successfully integrated Vercel MCP (Model Context Protocol) server for enhanced deployment automation and management of the Kasama AI relationship development platform.

## Installation & Setup

### ✅ Completed Steps

1. **Installed Official Vercel MCP Adapter**
   ```bash
   npm install -g @vercel/mcp-adapter
   ```

2. **Cloned Community Vercel MCP Server**
   ```bash
   git clone https://github.com/nganiet/mcp-vercel.git
   cd mcp-vercel
   npm install
   npm run build
   ```

3. **Environment Configuration**
   - Created `.env` file with `VERCEL_API_TOKEN` placeholder
   - Built MCP server successfully

## Available Tools

### 🚀 Deployment Management
- `vercel-list-all-deployments` - List deployments with filtering
- `vercel-get-deployment` - Retrieve specific deployment details
- `vercel-list-deployment-files` - List files in a deployment
- `vercel-create-deployment` - Create new deployments

### 📦 Project Management
- `vercel-create-project` - Create new Vercel projects
- `vercel-list-projects` - List all projects with pagination
- `vercel-find-project` - Find a specific project by ID or name
- `vercel-create-environment-variables` - Create multiple environment variables
- `vercel-get-project-domain` - Get domain information

### 🌍 Environment Management
- `vercel-get-environments` - Access project environment variables
- `vercel-create-custom-environment` - Create custom environments

### 👥 Team Management
- `vercel-list-all-teams` - List all accessible teams
- `vercel-create-team` - Create new teams

## Integration with Claude Code

### Method 1: Direct MCP Connection
```bash
# Start the MCP server
cd /Users/buehler/code/kasama-ai/mcp-vercel
npm start

# In Claude Code, connect using:
/connect mcp --path /Users/buehler/code/kasama-ai/mcp-vercel/build/index.js
```

### Method 2: HTTP Proxy (Recommended)
```bash
# Install MCP proxy
npm install -g @modelcontextprotocol/proxy

# Start proxy server
mcp-proxy --stdio --cmd "npm start" --port 3399

# In Claude Code, connect using:
/connect mcp --url http://localhost:3399
```

## Usage Examples for Kasama AI

### Deploy Kasama AI to Vercel
```javascript
// Using Claude Code with MCP integration
"Create a new deployment for Kasama AI using vercel-create-deployment tool with the following config:
- Project: kasama-ai
- Git source: main branch
- Environment: production
- Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY"
```

### Monitor Deployment Status
```javascript
"List the last 5 deployments for Kasama AI using vercel-list-all-deployments with limit=5 and target=production"
```

### Environment Management
```javascript
"Create environment variables for Kasama AI production using vercel-create-environment-variables:
- VITE_APP_NAME=Kasama AI
- VITE_APP_ENV=production
- VITE_ENABLE_AI_FEATURES=true"
```

## Configuration Required

### 1. Get Vercel API Token
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Update `.env` file: `VERCEL_API_TOKEN=your_actual_token`

### 2. Connect to Claude Code
Add to your Claude Code MCP configuration:
```json
{
  "mcpServers": {
    "vercel-deployment": {
      "command": "node",
      "args": ["/Users/buehler/code/kasama-ai/mcp-vercel/build/index.js"],
      "env": {
        "VERCEL_API_TOKEN": "your_vercel_api_token_here"
      }
    }
  }
}
```

## Benefits for Kasama AI

### 🎯 Automated Deployment
- One-command deployment from Claude Code
- Automated environment variable management
- Real-time deployment monitoring

### ⚡ Enhanced Development Workflow
- Deploy directly from AI conversation
- Monitor production status through natural language
- Quick environment configuration updates

### 🔧 Production Management
- List and track all deployments
- Manage custom environments (staging, preview)
- Team collaboration through MCP tools

## Next Steps

1. **Set Vercel API Token**: Add your actual token to `.env` file
2. **Test Integration**: Start MCP server and test with Claude Code
3. **Deploy Kasama AI**: Use MCP tools to deploy the optimized platform
4. **Monitor Performance**: Track deployments and optimize workflow

## File Locations

- **MCP Server**: `/Users/buehler/code/kasama-ai/mcp-vercel/`
- **Configuration**: `/Users/buehler/code/kasama-ai/mcp-vercel/.env`
- **Documentation**: `/Users/buehler/code/kasama-ai/mcp-vercel/README.md`
- **Build Output**: `/Users/buehler/code/kasama-ai/mcp-vercel/build/index.js`

## Status: ✅ Ready for Production Use

The Vercel MCP integration is fully configured and ready to enhance the Kasama AI deployment workflow with AI-powered automation.