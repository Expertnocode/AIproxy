# 🛡️ AIProxy - Secure AI Gateway for Enterprises

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://hub.docker.com/r/aiproxy/server)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> The open-source AI proxy that keeps your sensitive data safe while unlocking the power of GPT-4, Claude, Gemini and other LLMs.

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🏗️ Architecture](#-architecture) • [🔒 Security](#-security)

## 🚨 The Problem

Companies want to use AI tools like ChatGPT, but can't risk exposing:
- Customer PII (emails, phone numbers, addresses)
- Financial data and contracts
- Proprietary code and trade secrets
- Internal documents and strategies

## ✅ The Solution

AIProxy sits between your team and AI services, automatically detecting and anonymizing sensitive data before it leaves your network.

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Git

### One-Command Setup

```bash
git clone https://github.com/Expertnocode/AIproxy.git
cd AIproxy
./scripts/setup.sh
```

### Start Development Environment

```bash
./scripts/dev.sh
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001  
- **Proxy Service**: http://localhost:3000

### Production Deployment

```bash
./scripts/docker-prod.sh
```

## 🏗️ Architecture

AIProxy is built as a modern monorepo with these packages:

```
aiproxy/
├── packages/
│   ├── backend/         # Express API server
│   ├── frontend/        # React admin interface  
│   ├── proxy/           # AI proxy service
│   └── shared/          # Shared types & utilities
├── docker/              # Docker configurations
└── scripts/             # Setup & deployment scripts
```

### Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite + Modern UI Design System
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Proxy**: Node.js + TypeScript + Provider SDKs
- **Security**: Microsoft Presidio + Custom Rule Engine
- **Infrastructure**: Docker + Docker Compose
- **UI/UX**: Dark/Light Mode + Responsive Design + Animations

## 🔒 Security Features

### PII Detection & Anonymization
- **Microsoft Presidio Integration**: Enterprise-grade PII detection
- **Pattern Recognition**: Emails, phones, SSNs, credit cards, etc.
- **Smart Anonymization**: Preserves context while protecting data
- **Token Mapping**: Restores original data in responses

### Security Rule Engine
- **Custom Rules**: Define regex patterns for sensitive data
- **Flexible Actions**: Block, Anonymize, Redact, Warn, or Allow
- **Priority System**: Control rule precedence
- **Real-time Processing**: Apply rules to all requests

### Audit & Compliance
- **Complete Audit Trail**: Log all requests and security events
- **Usage Analytics**: Token consumption and cost tracking
- **Compliance Reports**: GDPR, HIPAA, SOX ready
- **Real-time Monitoring**: Security dashboard and alerts

## 🎯 Supported AI Providers

| Provider | Models | Features |
|----------|--------|----------|
| **OpenAI** | GPT-4, GPT-3.5 Turbo | Chat, Streaming |
| **Anthropic** | Claude 3 (Opus, Sonnet, Haiku) | Chat, Vision, Streaming |
| **Google** | Gemini Pro, Gemini Pro Vision | Chat, Vision, Streaming |

## 📊 Features

### ✅ Currently Available
- Multi-provider AI integration (OpenAI, Claude, Gemini)
- Real-time PII detection and anonymization
- Custom security rule engine with working middleware
- Modern web-based admin interface with dark/light theme
- Interactive dashboard with charts and metrics
- Usage analytics and audit logs with pagination
- Docker deployment with health checks
- JWT authentication and role-based access
- Rate limiting and request validation
- Comprehensive audit trail and monitoring

### 🚧 Roadmap
- SAML/SSO integration
- Advanced analytics dashboard
- Webhook notifications
- API rate limiting per user
- Custom anonymization strategies
- Integration SDK for popular frameworks

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://aiproxy:password@localhost:5432/aiproxy"

# Authentication  
JWT_SECRET="your-secure-jwt-secret"

# AI Provider API Keys
OPENAI_API_KEY="sk-..."
CLAUDE_API_KEY="..."
GEMINI_API_KEY="..."

# Security Services
PRESIDIO_ANALYZER_URL="http://localhost:5001"
PRESIDIO_ANONYMIZER_URL="http://localhost:5002"
ENABLE_PII_DETECTION="true"
ENABLE_RULE_ENGINE="true"
```

### Admin Interface

1. Start the development environment
2. Visit http://localhost:5173
3. Create your admin account  
4. Configure security rules and AI providers
5. Access modern dashboard with dark/light mode toggle
6. View real-time metrics and interactive charts
7. Manage security rules with full CRUD operations

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific package
npm test -w backend
npm test -w frontend
npm test -w proxy

# Integration tests
npm run test:integration
```

## 📚 API Documentation

### Proxy Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/proxy/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "provider": "OPENAI",
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, my email is john@example.com"}
    ]
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-...",
    "choices": [{
      "message": {
        "role": "assistant", 
        "content": "Hello! I see you provided [EMAIL]. How can I help you?"
      }
    }],
    "usage": {
      "promptTokens": 15,
      "completionTokens": 12,
      "totalTokens": 27
    }
  }
}
```

## 🔍 Security Rule Examples

```javascript
// Block credit card numbers
{
  "name": "Block Credit Cards",
  "pattern": "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\\b",
  "action": "BLOCK",
  "priority": 100
}

// Anonymize email addresses  
{
  "name": "Anonymize Emails",
  "pattern": "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", 
  "action": "ANONYMIZE",
  "priority": 50
}
```

## 🚀 Deployment

### Development
```bash
./scripts/dev.sh
```

### Production (Docker)
```bash
./scripts/docker-prod.sh
```

### Production (Manual)
```bash
# Build all packages
npm run build

# Start database
docker-compose -f docker/docker-compose.yml up -d postgres

# Run migrations
cd packages/backend && npx prisma db push

# Start services
npm run start:backend &
npm run start:proxy &
npm run start:frontend
```

## 📄 License

AIProxy is licensed under the **GNU Affero General Public License v3.0** (AGPL v3).

### What this means:

✅ **You CAN:**
- Use AIProxy for internal business purposes (free)
- Modify and customize the software
- Distribute your modifications
- Use it commercially within your organization

❌ **You MUST:**
- Keep the source code open when distributing
- Share any modifications under AGPL v3
- Include license and copyright notices
- Provide source code to users of network services

### Commercial License

For commercial licensing without AGPL obligations, contact: **expertnocode@gmail.com**

See the [LICENSE](LICENSE) file for the complete license text.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🆘 Support

- 📖 [Documentation](./docs)
- 🐛 [Issue Tracker](https://github.com/Expertnocode/AIproxy/issues)
- 💬 [Discussions](https://github.com/Expertnocode/AIproxy/discussions)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Expertnocode/AIproxy&type=Date)](https://star-history.com/#Expertnocode/AIproxy&Date)