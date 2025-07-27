# CLAUDE.md - AIProxy Project Documentation

## 🎯 Project Overview
AIProxy is an open-source secure AI gateway that sits between enterprise users and AI services (OpenAI, Claude, Gemini, etc.) to automatically detect, anonymize, and protect sensitive data before it leaves the corporate network.

### Core Mission
Enable enterprises to safely use AI tools without risking data breaches, compliance violations, or intellectual property exposure.

### Key Value Propositions
- 2-minute setup with Docker (vs 2 days for Apache APISIX)
- 100% open source (vs $500/month for Portkey Pro)
- Local data processing (vs cloud-based solutions)
- Simple configuration (vs complex YAML files)

## 🏗️ Technical Architecture

### Stack Overview
- **Frontend:**  React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:**   Node.js + TypeScript + Express + Prisma
- **Database:**  SQLite (dev) → PostgreSQL (production)
- **Security:**  Microsoft Presidio integration + Custom Rule Engine
- **Deploy:**    Docker + Docker Compose
- **Testing:**   Jest + Playwright + Supertest
- **Docs:**      Storybook (components) + API docs

### Project Structure
```
aiproxy/
├── packages/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   ├── middleware/   # Authentication, logging, etc.
│   │   │   ├── models/       # Database models (Prisma)
│   │   │   ├── utils/        # Helper functions
│   │   │   └── types/        # TypeScript type definitions
│   │   ├── tests/            # API tests
│   │   └── prisma/           # Database schema & migrations
│   ├── frontend/             # React admin interface
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   │   └── ui/       # Modern design system components
│   │   │   ├── pages/        # Main application pages
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── services/     # API client functions
│   │   │   ├── contexts/     # React contexts (Theme, etc.)
│   │   │   ├── lib/          # Utility functions
│   │   │   └── types/        # TypeScript interfaces
│   │   ├── postcss.config.js # PostCSS configuration for Tailwind
│   │   ├── tailwind.config.js # Tailwind CSS configuration
│   │   └── tests/            # Frontend tests
│   ├── proxy/                # AI proxy service
│   │   ├── src/
│   │   │   ├── providers/    # AI service integrations
│   │   │   ├── security/     # PII detection & anonymization
│   │   │   ├── rules/        # Security rule engine
│   │   │   └── middleware/   # Request/response processing
│   │   └── tests/
│   └── shared/               # Shared types and utilities
│       ├── types/            # Common TypeScript definitions
│       └── utils/            # Cross-package utilities
├── docker/                   # Docker configurations
├── docs/                     # Documentation
├── scripts/                  # Build and deployment scripts
└── examples/                 # Usage examples and demos
```

## 🎨 Modern UI Design System

### Component Architecture
The frontend uses a modular design system with reusable components:

```typescript
// Core UI Components
import { 
  Card, CardHeader, CardContent, CardFooter,
  Button, Badge, MetricCard, ThemeToggle,
  LineChart, BarChart, PieChart
} from './components/ui'

// Example usage
<MetricCard
  title="Total Requests"
  value={stats.totalRequests}
  icon={<Activity className="h-6 w-6" />}
  color="blue"
  trend={{ value: 12.5, direction: "up", label: "vs last week" }}
/>
```

### Theme System
- **Dark/Light Mode:** Full support with system preference detection
- **Color Palette:** Consistent primary/secondary colors across all components
- **Animations:** Smooth transitions and micro-interactions
- **Responsive:** Mobile-first design with Tailwind breakpoints

### Configuration Files
**Critical:** These files are required for proper styling:

```javascript
// postcss.config.js - REQUIRED for Tailwind CSS processing
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// tailwind.config.js - Theme configuration
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { /* custom color palette */ },
      animations: { /* custom animations */ }
    }
  }
}
```

## 🛠️ Development Standards

### TypeScript Standards
- **Strict mode enabled** - No `any` types allowed except for legacy fixes
- **Explicit return types** for all functions
- **Interface over type** for object definitions
- **Enum for constants** with string values
- **Generic types** for reusable components
- **Utility types** (Pick, Omit, Partial) when appropriate

```typescript
// ✅ Good
interface UserConfig {
  readonly id: string;
  name: string;
  rules: SecurityRule[];
}

function processRequest(config: UserConfig): Promise<ProcessedResult> {
  // implementation
}

// ❌ Bad
function processRequest(config: any): any {
  // implementation
}
```

### Error Handling
- Always use Result pattern for operations that can fail
- Custom error classes with proper inheritance
- Structured logging with correlation IDs
- Graceful degradation for non-critical features

```typescript
// ✅ Good
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function detectPII(text: string): Promise<Result<PIIMatch[]>> {
  try {
    const matches = await presidioAnalyzer.analyze(text);
    return { success: true, data: matches };
  } catch (error) {
    logger.error('PII detection failed', { error, text: text.substring(0, 100) });
    return { success: false, error: new PIIDetectionError('Failed to analyze text') };
  }
}
```

### Security Best Practices
- Input validation on all external data
- Rate limiting on all endpoints
- CORS configuration properly set
- No sensitive data in logs (use redaction)
- Environment-based configuration only

## 📡 API Design Principles

### RESTful Conventions
```
GET    /api/v1/proxy/models           # List available AI models
POST   /api/v1/proxy/chat             # Send chat request through proxy
GET    /api/v1/rules                  # Get security rules
POST   /api/v1/rules                  # Create security rule
PUT    /api/v1/rules/:id              # Update security rule
DELETE /api/v1/rules/:id              # Delete security rule
GET    /api/v1/audit/logs             # Get audit logs (with pagination fix)
GET    /api/v1/audit/usage            # Get usage analytics
GET    /api/v1/audit/analytics/summary # Get dashboard summary
```

### Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

## 🎯 Frontend Development Rules

### Component Architecture
- **Function components** with hooks only
- **Custom hooks** for reusable logic
- **Compound component pattern** for complex UI
- **Error boundaries** for error handling
- **Modern design system** with consistent styling

```tsx
// ✅ Good - Modern component with design system
function SecurityRuleBuilder({ onSave }: SecurityRuleBuilderProps) {
  const { rule, updateRule, validate } = useRuleBuilder();
  
  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <h3 className="text-lg font-semibold">Create Security Rule</h3>
      </CardHeader>
      <CardContent>
        <RuleForm 
          rule={rule} 
          onUpdate={updateRule}
          onSave={onSave}
        />
      </CardContent>
    </Card>
  );
}
```

### State Management
- **React Context** for global state (Theme, Auth)
- **useReducer** for complex state logic
- **React Query** for server state
- **Local state** for component-specific data

```typescript
// ✅ Good - Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
```

## 🗄️ Database Design Principles

### Schema Design
```prisma
// ✅ Good - Clear relationships and constraints
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  rules     SecurityRule[]
  sessions  UserSession[]
  
  @@map("users")
}

model SecurityRule {
  id          String     @id @default(cuid())
  name        String
  description String?
  pattern     String
  action      RuleAction
  enabled     Boolean    @default(true)
  priority    Int        @default(0)
  userId      String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  user        User       @relation(fields: [userId], references: [id])
  
  @@map("security_rules")
  @@index([userId, enabled])
  @@index([priority])
}
```

## 🔒 Security Implementation Guidelines

### PII Detection & Anonymization
```typescript
interface PIIProcessor {
  detect(text: string): Promise<PIIMatch[]>;
  anonymize(text: string, matches: PIIMatch[]): Promise<string>;
  restore(anonymizedText: string, tokenMap: TokenMap): Promise<string>;
}

// Implementation should:
// 1. Use Microsoft Presidio for base detection
// 2. Support custom regex patterns
// 3. Maintain token mapping for restoration
// 4. Handle context preservation
// 5. Provide confidence scores
```

### Request Processing Pipeline
```typescript
// 1. Authentication & Authorization
// 2. Request validation & sanitization
// 3. PII detection & anonymization
// 4. Rule engine evaluation (NOW WORKING)
// 5. AI service routing
// 6. Response processing & restoration
// 7. Audit logging
// 8. Response delivery

interface ProcessingPipeline {
  authenticate(request: Request): Promise<User>;
  validateRequest(request: ProxyRequest): Promise<ValidatedRequest>;
  detectAndAnonymize(request: ValidatedRequest): Promise<AnonymizedRequest>;
  evaluateRules(request: AnonymizedRequest): Promise<RuleEvaluation>;
  routeToAI(request: AnonymizedRequest): Promise<AIResponse>;
  processResponse(response: AIResponse, tokenMap: TokenMap): Promise<ProcessedResponse>;
  logAuditTrail(request: ProxyRequest, response: ProcessedResponse): Promise<void>;
}
```

## ✅ Current Implementation Status

### ✅ Completed Features
- **Full-stack application** with React frontend, Express backend, and proxy service
- **Modern UI design system** with dark/light mode and animations
- **Security rule engine** that actually works and applies rules to requests
- **PII detection** with Microsoft Presidio integration
- **User authentication** and authorization
- **Dashboard** with real-time metrics and charts
- **Rule management** with full CRUD operations
- **Audit logging** with pagination support
- **Multi-provider AI support** (OpenAI, Claude, Gemini)
- **Docker containerization** for easy deployment

### 🔧 Recently Fixed Issues
- **PostCSS configuration** - Added missing `postcss.config.js` for Tailwind CSS processing
- **Security middleware** - Fixed rule fetching from database with JWT parsing
- **TypeScript errors** - Resolved enum import issues and type mismatches
- **Pagination validation** - Fixed query parameter type conversion in audit endpoints
- **Component styling** - Implemented modern design system with proper CSS classes

### 🎨 UI/UX Improvements
- **Responsive design** with mobile-first approach
- **Consistent color palette** across all components
- **Smooth animations** and micro-interactions
- **Loading states** and error handling
- **Accessibility** considerations in component design

## 🧪 Testing Strategy

### Unit Testing
- **100% coverage** for security-critical functions
- **Property-based testing** for PII detection
- **Mock external services** (OpenAI, Claude, etc.)
- **Test error conditions** explicitly

### Integration Testing
- **End-to-end proxy flows**
- **Database operations**
- **External API integrations**
- **Docker container testing**

### Performance Testing
- **Load testing** with realistic workloads
- **Memory leak detection**
- **Response time monitoring**
- **Concurrent request handling**

## 🚀 Deployment & Operations

### Environment Configuration
```typescript
interface AppConfig {
  server: {
    port: number;
    host: string;
    cors: CorsOptions;
  };
  database: {
    url: string;
    maxConnections: number;
  };
  ai: {
    openai: { apiKey: string; baseUrl?: string; };
    claude: { apiKey: string; baseUrl?: string; };
    gemini: { apiKey: string; baseUrl?: string; };
  };
  security: {
    jwtSecret: string;
    rateLimiting: RateLimitConfig;
    presidio: PresidioConfig;
  };
  logging: {
    level: LogLevel;
    format: LogFormat;
  };
}
```

### Docker Configuration
- **Multi-stage builds** for optimization
- **Non-root user** for security
- **Health checks** implemented
- **Environment-based configs**

## 🎯 Development Commands

### Quick Start
```bash
# Setup and run all services
npm run setup       # Install deps and setup environment
npm run dev         # Start all services in development mode
npm run build       # Build all packages
npm run test        # Run test suites
```

### Individual Services
```bash
# Frontend (React app on port 5173)
cd packages/frontend
npm run dev

# Backend (API server on port 3001)
cd packages/backend
npm run dev

# Proxy (AI gateway on port 3000)
cd packages/proxy
npm run dev
```

### Testing Security Features
```bash
# Test authentication
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test proxy with security rules
curl -X POST http://localhost:3000/api/v1/proxy/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"My email is test@example.com"}],"provider":"OPENAI"}'
```

## 💡 Development Tips for Claude Code

### When Creating Components
- Start with TypeScript interfaces for props and state
- Use the modern design system components (`Card`, `Button`, `Badge`, etc.)
- Consider accessibility from the beginning
- Make components testable with clear props
- Add error boundaries for robustness
- Include dark mode support

### When Building APIs
- Define OpenAPI schemas first
- Implement input validation with Zod
- Add comprehensive error handling
- Include request/response logging
- Write integration tests
- Support pagination for list endpoints

### When Implementing Security Features
- Security first, performance second
- Default to secure configurations
- Log security events with proper detail
- Test edge cases thoroughly
- Document security implications

### Troubleshooting Common Issues
1. **Page shows unstyled content**: Check if `postcss.config.js` exists in frontend directory
2. **TypeScript errors with enums**: Use string literals instead of importing enums from shared package
3. **Rules not applying**: Verify security middleware is fetching user rules from database with correct JWT parsing
4. **Console errors**: Check browser DevTools for missing dependencies or API errors
5. **White page on navigation**: Look for component import errors or missing dependencies

## 🔄 Recent Development Session Summary

### Issues Resolved
- **Tailwind CSS not loading**: Missing `postcss.config.js` configuration file
- **Security rules not working**: Fixed middleware to actually fetch and apply user rules from database
- **TypeScript compilation errors**: Resolved enum import issues in RulesPage and RuleForm components
- **Page routing issues**: Fixed component exports and import paths

### Files Modified
- `packages/frontend/postcss.config.js` - **CREATED** (critical for Tailwind CSS)
- `packages/frontend/src/pages/DashboardPage.tsx` - Modernized with new UI components
- `packages/frontend/src/pages/RulesPage.tsx` - Fixed TypeScript errors and modernized UI
- `packages/frontend/src/components/RuleForm.tsx` - Fixed enum references
- `packages/proxy/src/middleware/security.ts` - Added user rule fetching from database
- `packages/backend/src/routes/rules.ts` - Added User-ID header support for proxy
- `packages/backend/src/routes/audit.ts` - Fixed pagination parameter validation

### New Components Created
```typescript
// UI Design System Components
- Card, CardHeader, CardContent, CardFooter
- Button (5 variants + loading states)
- Badge (6 color variants)
- MetricCard (with trends and animations)
- ThemeToggle (light/dark/system modes)
- LineChart, BarChart, PieChart (with theme support)
```

### Working Features Confirmed
- ✅ **Dashboard**: Modern interface with metrics, charts, and animations
- ✅ **Rules Management**: Full CRUD operations with proper UI
- ✅ **Security Engine**: Rules are now properly applied to AI requests
- ✅ **Theme System**: Dark/light mode toggle working across all pages
- ✅ **Authentication**: Login/logout flow functional
- ✅ **API Integration**: All endpoints responding correctly

## 🎯 Next Development Priorities

### Immediate (Next Session)
1. **Audit Page Modernization**: Update with new UI components
2. **Config Page Enhancement**: Add modern interface for proxy settings
3. **Error Handling**: Improve error states and loading indicators
4. **Real Charts Integration**: Replace mock data with actual metrics

### Short Term
1. **Performance Optimization**: Bundle analysis and code splitting
2. **Accessibility Improvements**: ARIA labels and keyboard navigation
3. **Mobile Responsiveness**: Test and improve mobile experience
4. **Documentation**: Component storybook and API documentation

### Medium Term
1. **Advanced Analytics**: Detailed usage and security metrics
2. **Rule Templates**: Pre-built security rule templates
3. **Export/Import**: Configuration backup and restore
4. **Multi-tenancy**: Support for multiple organizations

## 📋 Development Checklist Template

When adding new features, ensure:

- [ ] TypeScript interfaces defined first
- [ ] Component uses design system (Card, Button, etc.)
- [ ] Dark mode support included
- [ ] Loading and error states handled
- [ ] Mobile responsiveness considered
- [ ] Accessibility attributes added
- [ ] Tests written (if applicable)
- [ ] Documentation updated
- [ ] Security implications reviewed
- [ ] Performance impact assessed

## 🚨 Critical Notes for Future Development

### Required Files for Styling
```bash
# These files MUST exist for proper UI rendering:
packages/frontend/postcss.config.js      # PostCSS configuration
packages/frontend/tailwind.config.js     # Tailwind theme config
packages/frontend/src/index.css          # Global styles with Tailwind directives
```

### Environment Variables
```bash
# Required for full functionality:
OPENAI_API_KEY=sk-...                    # OpenAI API access
JWT_SECRET=...                           # Authentication secret
DATABASE_URL=postgresql://...            # Database connection
BACKEND_URL=http://localhost:3001        # Backend API URL (for proxy)
```

### Port Configuration
```bash
Frontend:  http://localhost:5173         # React development server
Backend:   http://localhost:3001         # Express API server  
Proxy:     http://localhost:3000         # AI gateway service
```

This documentation reflects the current state after successful implementation of the modern UI design system and resolution of all major technical issues.