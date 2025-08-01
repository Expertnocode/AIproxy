# Contributing to AIProxy

Thank you for your interest in contributing to AIProxy! We welcome contributions from the community and are pleased to have you join us.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [License Agreement](#license-agreement)
- [Questions and Support](#questions-and-support)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all communications.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- Docker and Docker Compose
- Git configured with your name and email
- A GitHub account

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AIproxy.git
   cd AIproxy
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/Expertnocode/AIproxy.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
6. **Start development environment**:
   ```bash
   npm run dev
   ```

## 🔄 Contributing Process

### 1. Create an Issue (Optional but Recommended)

For significant changes, please create an issue first to discuss:
- New features
- Major refactoring
- Breaking changes
- Architecture changes

### 2. Create a Feature Branch

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Follow our [coding standards](#coding-standards)
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Test specific packages
npm test -w backend
npm test -w frontend
npm test -w proxy

# Run integration tests
npm run test:integration

# Check TypeScript compilation
npm run build
```

### 5. Commit Your Changes

We use conventional commits. Format your commit messages as:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(proxy): add support for Gemini Pro model`
- `fix(security): resolve PII detection for phone numbers`
- `docs(readme): update installation instructions`

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Reference to related issues
- Screenshots/demos for UI changes
- Test plan description

## 🎯 Coding Standards

### TypeScript Guidelines

- **Strict mode enabled** - No `any` types
- **Explicit return types** for functions
- **Interface over type** for object definitions
- **Proper error handling** with Result pattern

### Code Style

- Use **ESLint** and **Prettier** configurations
- Follow existing patterns in the codebase
- Write **meaningful variable and function names**
- Add **JSDoc comments** for public APIs

### Testing

- Write **unit tests** for new functions
- Add **integration tests** for API endpoints
- Ensure **100% coverage** for security-critical code
- Use **descriptive test names**

### Security

- Never commit **API keys or secrets**
- Follow **input validation** practices
- Implement **proper error handling**
- Consider **security implications** of changes

## 📜 License Agreement

### Contributor License Agreement (CLA)

By contributing to AIProxy, you agree that:

1. **License Grant**: You grant Expertnocode and the AIProxy project a perpetual, worldwide, non-exclusive, royalty-free license to use, reproduce, modify, display, perform, sublicense, and distribute your contributions.

2. **Original Work**: You represent that your contributions are your original work or you have the right to submit them under the AGPL v3 license.

3. **AGPL v3 Compliance**: All contributions will be licensed under the GNU Affero General Public License v3.0 (AGPL v3), the same license as the project.

4. **Patent Rights**: If your contribution includes patentable subject matter, you grant the same license to any patent claims you may have.

### Understanding AGPL v3

When you contribute to AIProxy:
- Your code will be licensed under **AGPL v3**
- Users can use your code **freely for internal purposes**
- If they distribute the software, they **must share source code**
- **Network use** (like SaaS) requires sharing source code
- Commercial licenses are available from Expertnocode

## 🏗️ Development Areas

We welcome contributions in these areas:

### 🔒 Security & Privacy
- PII detection improvements
- New anonymization strategies  
- Security rule enhancements
- Compliance features

### 🎨 User Interface
- Dashboard improvements
- Mobile responsiveness
- Accessibility enhancements
- New visualizations

### 🔌 Integrations
- New AI provider support
- Authentication methods (SAML, OAuth)
- Monitoring and alerting
- External system integrations

### 📊 Analytics & Monitoring
- Advanced metrics
- Performance monitoring
- Usage analytics
- Cost tracking

### 🛠️ Infrastructure
- Deployment improvements
- Docker optimizations
- Kubernetes support
- CI/CD enhancements

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details** (OS, Node.js version, etc.)
5. **Error messages** and logs
6. **Screenshots** if applicable

Use our bug report template when creating issues.

## 💡 Feature Requests

For feature requests, please provide:

1. **Use case description** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternatives considered** - What other approaches did you consider?
4. **Additional context** - Screenshots, mockups, examples

## 🚦 Review Process

### Pull Request Review

1. **Automated checks** must pass (tests, linting, build)
2. **Security review** for security-related changes
3. **Code review** by maintainers
4. **Documentation review** if docs are updated
5. **Final approval** from core maintainers

### Review Criteria

We evaluate contributions based on:
- **Code quality** and maintainability
- **Test coverage** and quality
- **Security implications**
- **Performance impact**
- **Documentation completeness**
- **Alignment with project goals**

## 🏷️ Release Process

AIProxy follows semantic versioning (SemVer):
- **Major versions** (x.0.0) - Breaking changes
- **Minor versions** (x.y.0) - New features, backward compatible
- **Patch versions** (x.y.z) - Bug fixes, backward compatible

## ❓ Questions and Support

### Getting Help

- 📖 **Documentation**: Check our [docs](./docs) directory
- 💬 **Discussions**: Use [GitHub Discussions](https://github.com/Expertnocode/AIproxy/discussions)
- 🐛 **Issues**: For bugs, use [GitHub Issues](https://github.com/Expertnocode/AIproxy/issues)
- 📧 **Email**: For private inquiries, contact: contribute@aiproxy.dev

### Community

- Join our community discussions
- Follow project updates
- Share your use cases and feedback

## 🎉 Recognition

Contributors will be:
- **Listed** in our CONTRIBUTORS.md file
- **Mentioned** in release notes for significant contributions
- **Invited** to join our contributor community
- **Featured** on our website (with permission)

Thank you for contributing to AIProxy and helping make AI safer for everyone! 🚀

---

**License**: By contributing, you agree that your contributions will be licensed under the AGPL v3 license.
**Copyright**: Contributions become part of the AIProxy project, copyright Expertnocode.