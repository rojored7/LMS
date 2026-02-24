# Contributing to Executor Service

Thank you for your interest in contributing to the Executor Service! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

### Prerequisites

- Node.js 18+
- Docker
- Redis
- Git

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/executor.git
   cd executor
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

5. Build sandbox image:
   ```bash
   docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
   ```

6. Start development services:
   ```bash
   docker-compose up -d redis
   npm run dev
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Test API manually
./scripts/test-api.sh

# Check TypeScript compilation
npm run build
```

### 4. Commit Your Changes

Follow conventional commits format:

```bash
git commit -m "feat: add support for Go language"
git commit -m "fix: resolve memory leak in container cleanup"
git commit -m "docs: update API documentation"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub.

## Pull Request Guidelines

### PR Title

Use the same format as commit messages:
- `feat: add WebSocket support`
- `fix: handle timeout errors correctly`

### PR Description

Include:
1. **What**: What changes are you making?
2. **Why**: Why are these changes necessary?
3. **How**: How did you implement the changes?
4. **Testing**: How did you test the changes?

Example:
```markdown
## What
Add support for executing Go code in the sandbox.

## Why
Users requested Go language support for security challenges.

## How
- Added Go runtime to Dockerfile.sandbox
- Created language config for Go
- Updated documentation

## Testing
- Added unit tests for Go execution
- Tested with various Go code samples
- Verified resource limits work correctly
```

### Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No security vulnerabilities introduced
- [ ] Commits follow conventional commits format
- [ ] PR description is clear and complete

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over promises
- Add type annotations for function parameters and returns
- Use interfaces for object shapes

Example:
```typescript
// Good
async function executeCode(params: ExecuteRequest): Promise<ExecutionResult> {
  const result = await dockerExecutor.executeCode(params);
  return result;
}

// Avoid
function executeCode(params) {
  return dockerExecutor.executeCode(params).then(result => result);
}
```

### Error Handling

- Always handle errors explicitly
- Use try/catch/finally for cleanup
- Log errors with context
- Return meaningful error messages

Example:
```typescript
try {
  const container = await createContainer();
  try {
    const result = await executeInContainer(container);
    return result;
  } finally {
    // Always cleanup
    await cleanup(container);
  }
} catch (error) {
  logger.error('Execution failed', { error, context });
  throw new AppError(500, 'Execution failed');
}
```

### Logging

- Use logger for all output
- Include context in logs
- Use appropriate log levels:
  - `error`: Errors that need attention
  - `warn`: Warning conditions
  - `info`: Important information
  - `debug`: Detailed debugging information

Example:
```typescript
logger.info('Starting execution', {
  language: params.language,
  codeLength: params.code.length,
  timeout: params.timeout,
});
```

## Testing

### Writing Tests

- Test happy paths and edge cases
- Mock external dependencies
- Use descriptive test names
- Group related tests with `describe`

Example:
```typescript
describe('DockerExecutor', () => {
  describe('executeCode', () => {
    it('should execute Python code successfully', async () => {
      const result = await executor.executeCode({
        code: 'print("test")',
        language: 'python',
      });

      expect(result.passed).toBe(true);
      expect(result.stdout).toBe('test');
    });

    it('should timeout on long-running code', async () => {
      const result = await executor.executeCode({
        code: 'while True: pass',
        language: 'python',
        timeout: 1000,
      });

      expect(result.error).toContain('timeout');
    });
  });
});
```

## Security Considerations

### When Adding New Features

- Ensure user code remains isolated
- Validate all inputs
- Don't expose sensitive information
- Follow principle of least privilege
- Document security implications

### Security Checklist

- [ ] User input is validated
- [ ] No command injection possible
- [ ] Resource limits enforced
- [ ] Network access restricted
- [ ] No privilege escalation possible
- [ ] Secrets not exposed in logs
- [ ] Error messages don't leak sensitive info

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain "why" not just "what"

### README and Docs

- Update README.md if adding features
- Add examples for new functionality
- Update CHANGELOG.md
- Update API documentation

## Adding New Languages

To add support for a new language:

1. **Update Dockerfile.sandbox**:
   ```dockerfile
   RUN apk add --no-cache golang
   ```

2. **Add language config** in `src/config/index.ts`:
   ```typescript
   go: {
     image: config.SANDBOX_IMAGE,
     command: ['go', 'run'],
     fileExtension: 'go',
     fileName: 'main.go',
   }
   ```

3. **Add tests** in `src/services/__tests__/dockerExecutor.test.ts`

4. **Update documentation** in README.md

5. **Add example** in `examples/go_example.json`

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Join our community chat (if available)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
