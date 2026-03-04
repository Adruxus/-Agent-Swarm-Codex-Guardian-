# Contributing to Agent Swarm Codex Guardian

Thank you for your interest in contributing! This document covers code style,
testing requirements, documentation standards, and the pull request process.

---

## Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

```bash
npm install
```

---

## Development Workflow

```bash
# Type-check without emitting files
npm run typecheck

# Lint source files
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Build distributable files
npm run build
```

---

## Code Style

- **Language:** TypeScript (strict mode enabled — no `any`, no implicit returns)
- **Formatter:** Prettier (`npm run format`) — enforced in CI
- **Linter:** ESLint with `@typescript-eslint` rules
- **Comments:** JSDoc on every exported function, class, and interface
- **Imports:** Absolute module paths (`../types`, not relative shortcuts)

---

## Testing Requirements

- All new code **must** include unit tests in `tests/`.
- Minimum coverage thresholds (enforced by Jest): **50% branches, functions, lines, statements** (target ≥ 80%).
- Tests must pass locally before opening a PR: `npm test`
- Test file naming: `<module-name>.test.ts`

---

## Documentation Standards

- Every public API method must have a JSDoc block describing:
  - Purpose
  - Parameters (`@param`)
  - Return value (`@returns`)
  - Thrown errors (`@throws`)
  - At least one peer-reviewed or official source (`@see`)
- Update `README.md` when adding new features or changing the public API.

---

## New Rules

When adding a rule to `RULE_LIBRARY` or `BASELINE_RULES`:

1. Cite a peer-reviewed source, government standard (NIST/IEEE), or official documentation.
2. Include a URL, version number, and publication date where available.
3. Set a realistic `threshold` (0.0–1.0 representing minimum required improvement).
4. Add a unit test that verifies the rule is selectable for relevant agents.

---

## Commit Messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

[optional body]
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

Examples:
- `feat(rules): add CHAOTIC_GOOD architecture rule for microservices`
- `fix(spawner): ensure CHAOTIC_NEUTRAL has enough default rules for Agent #4`
- `docs(readme): correct class name in Quick Start example`

---

## Pull Request Process

1. Fork the repository and create a feature branch: `git checkout -b feat/my-change`
2. Make your changes following the standards above.
3. Run `npm run typecheck && npm run lint && npm test` — all must pass.
4. Open a PR with a clear description of **what** changed and **why**.
5. PRs require at least one review before merge.
6. All CI checks must pass (lint, typecheck, tests).

---

## Security Issues

Report security vulnerabilities privately to
[security@codexguardian.dev](mailto:security@codexguardian.dev) —
**do not** open a public GitHub issue for security bugs.

---

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](./LICENSE).
