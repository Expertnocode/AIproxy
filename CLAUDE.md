CLAUDE.md - AIProxy Project Documentation
🎯 Project Overview
AIProxy is an open-source secure AI gateway that sits between enterprise users and AI services (OpenAI, Claude, Gemini, etc.) to automatically detect, anonymize, and protect sensitive data before it leaves the corporate network.
Core Mission
Enable enterprises to safely use AI tools without risking data breaches, compliance violations, or intellectual property exposure.
Key Value Propositions

2-minute setup with Docker (vs 2 days for Apache APISIX)
100% open source (vs $500/month for Portkey Pro)
Local data processing (vs cloud-based solutions)
Simple configuration (vs complex YAML files)

🏗️ Technical Architecture
Stack Overview
Frontend:  React 18 + TypeScript + Tailwind CSS + Vite
Backend:   Node.js + TypeScript + Express + Prisma
Database:  SQLite (dev) → PostgreSQL (production)
Security:  Microsoft Presidio integration
Deploy:    Docker + Docker Compose
Testing:   Jest + Playwright + Supertest
Docs:      Storybook (components) + API docs
Project Structure
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
│   │   │   ├── pages/        # Main application pages
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── services/     # API client functions
│   │   │   ├── utils/        # Helper functions
│   │   │   └── types/        # TypeScript interfaces
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
🛠️ Development Standards
Code Quality Rules
TypeScript Standards

Strict mode enabled - No any types allowed
Explicit return types for all functions
Interface over type for object definitions
Enum for constants with string values
Generic types for reusable components
Utility types (Pick, Omit, Partial) when appropriate

typescript// ✅ Good
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
Error Handling

Always use Result pattern for operations that can fail
Custom error classes with proper inheritance
Structured logging with correlation IDs
Graceful degradation for non-critical features

typescript// ✅ Good
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
Security Best Practices

Input validation on all external data
Rate limiting on all endpoints
CORS configuration properly set
No sensitive data in logs (use redaction)
Environment-based configuration only

API Design Principles
RESTful Conventions
GET    /api/v1/proxy/models           # List available AI models
POST   /api/v1/proxy/chat             # Send chat request through proxy
GET    /api/v1/rules                  # Get security rules
POST   /api/v1/rules                  # Create security rule
PUT    /api/v1/rules/:id              # Update security rule
DELETE /api/v1/rules/:id              # Delete security rule
GET    /api/v1/audit/logs             # Get audit logs
GET    /api/v1/analytics/usage        # Get usage analytics
Response Format
typescriptinterface APIResponse<T> {
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
Frontend Development Rules
Component Architecture

Function components with hooks only
Custom hooks for reusable logic
Compound component pattern for complex UI
Render props for complex state sharing
Error boundaries for error handling

tsx// ✅ Good - Custom hook + compound component
interface SecurityRuleBuilderProps {
  onSave: (rule: SecurityRule) => void;
}

function SecurityRuleBuilder({ onSave }: SecurityRuleBuilderProps) {
  const { rule, updateRule, validate } = useRuleBuilder();
  
  return (
    <RuleBuilder.Container>
      <RuleBuilder.Trigger onUpdate={updateRule} />
      <RuleBuilder.Actions>
        <RuleBuilder.SaveButton onClick={() => onSave(rule)} />
      </RuleBuilder.Actions>
    </RuleBuilder.Container>
  );
}
State Management

React Context for global state
useReducer for complex state logic
React Query for server state
Local state for component-specific data

typescript// ✅ Good - Context + useReducer
interface AppState {
  user: User | null;
  configuration: ProxyConfig;
  activeRules: SecurityRule[];
}

type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_CONFIG'; payload: Partial<ProxyConfig> }
  | { type: 'ADD_RULE'; payload: SecurityRule };

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
} | null>(null);
Database Design Principles
Schema Design
prisma// ✅ Good - Clear relationships and constraints
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
🔒 Security Implementation Guidelines
PII Detection & Anonymization
typescriptinterface PIIProcessor {
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
Request Processing Pipeline
typescript// 1. Authentication & Authorization
// 2. Request validation & sanitization
// 3. PII detection & anonymization
// 4. Rule engine evaluation
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
🧪 Testing Strategy
Unit Testing

100% coverage for security-critical functions
Property-based testing for PII detection
Mock external services (OpenAI, Claude, etc.)
Test error conditions explicitly

Integration Testing

End-to-end proxy flows
Database operations
External API integrations
Docker container testing

Performance Testing

Load testing with realistic workloads
Memory leak detection
Response time monitoring
Concurrent request handling

📋 Development Workflow
Git Workflow

Feature branches from main
Conventional commits format
PR reviews required
Automated testing before merge

Commit Message Format
type(scope): description

feat(proxy): add support for Gemini AI model
fix(security): improve PII detection accuracy for phone numbers
docs(api): add examples for security rule configuration
test(frontend): add integration tests for rule builder
Code Review Checklist

 TypeScript strict compliance
 Security considerations addressed
 Tests added/updated
 Documentation updated
 Performance impact considered
 Error handling implemented
 Logging added where appropriate

🚀 Deployment & Operations
Environment Configuration
typescriptinterface AppConfig {
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
Docker Configuration

Multi-stage builds for optimization
Non-root user for security
Health checks implemented
Environment-based configs

🎯 MVP Feature Priorities
Phase 1

Basic proxy server (Express + TypeScript)
OpenAI integration with simple passthrough
Basic PII detection using Presidio
Simple web interface for configuration
Docker setup for easy deployment

Phase 2

Claude and Gemini support
Advanced PII anonymization
Security rule engine
Audit logging
Usage analytics

Phase 3

Advanced web interface
User management & authentication
API rate limiting
Export/import configurations
Documentation & examples

💡 Development Tips for Claude Code
When Creating Components

Start with TypeScript interfaces for props and state
Consider accessibility from the beginning
Make components testable with clear props
Follow compound component pattern for complex UI
Add error boundaries for robustness

When Building APIs

Define OpenAPI schemas first
Implement input validation with Zod
Add comprehensive error handling
Include request/response logging
Write integration tests

When Implementing Security Features

Security first, performance second
Default to secure configurations
Log security events with proper detail
Test edge cases thoroughly
Document security implications