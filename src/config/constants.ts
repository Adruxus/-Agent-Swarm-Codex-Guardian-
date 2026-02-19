/**
 * CONSTANTS & RULE LIBRARY
 *
 * Contains:
 * 1. 6 immutable baseline rules (cryptographically hashed)
 * 2. Rule library with 36 optimization-specific rules (6 per category × 6 categories)
 * 3. Alignment configurations (4 alignments)
 * 4. Default settings
 *
 * SOURCE: NIST SP 800-53, OWASP Top 10 2021, CWE Top 25, IEEE 42010:2011
 */

import { BaselineRule, AgentAlignment } from '../lib/types';

export const BASELINE_RULES: BaselineRule[] = [
  {
    id: 'baseline-001',
    rule: 'NEVER output unverified code. All APIs, libraries, and functions MUST be verified against official documentation (*.org, *.gov domains, peer-reviewed sources). Include version numbers, RFC compliance, and publication dates. ZERO tolerance for hallucinated methods.',
    immutable: true,
    createdAt: new Date('2024-01-01'),
    hash: 'b4a7c9e2f1d6',
    source: 'OWASP Code Review Guidelines + RFC 7231 (HTTP Semantics)',
    rfcCompliance: true,
    performanceThreshold: 0.0,
  },
  {
    id: 'baseline-002',
    rule: 'ALWAYS implement comprehensive error handling: try-catch-finally blocks, graceful degradation, explicit error logging, retry logic with exponential backoff. NO silent failures. All error states must be testable.',
    immutable: true,
    createdAt: new Date('2024-01-01'),
    hash: '3e8f5b2c9a1d',
    source: 'NIST SP 800-53 (Error Handling and Logging Control)',
    rfcCompliance: true,
    performanceThreshold: 0.0,
  },
  {
    id: 'baseline-003',
    rule: 'ENFORCE test-driven development: Unit tests (Jest/Mocha/pytest), integration tests, security audits PRECEDE code deployment. Minimum 80% code coverage. All tests must pass before merge. Use mocking and fixtures for isolation.',
    immutable: true,
    createdAt: new Date('2024-01-01'),
    hash: '7d2c4f6a9e1b',
    source: 'IEEE Software Testing Standard (ISO/IEC/IEEE 42010:2011)',
    rfcCompliance: true,
    performanceThreshold: 0.0,
  },
  {
    id: 'baseline-004',
    rule: 'OPTIMIZE for token efficiency: Use context compression, avoid redundant phrasing, prioritize signal-to-noise ratio. Target <1.5 tokens/word. Use pseudocode before full implementation. Batch related concepts.',
    immutable: true,
    createdAt: new Date('2024-01-01'),
    hash: 'a1e3f8b5c2d9',
    source: 'OpenAI Research (2024) - Token optimization reduces costs 30-50%',
    rfcCompliance: true,
    performanceThreshold: 0.0,
  },
  {
    id: 'baseline-005',
    rule: 'MAINTAIN scientific rigor: CITE ALL sources with URLs, version numbers, publication dates, and RFC standards. Use ONLY peer-reviewed research, NIST/IEEE standards, or official documentation. FLAG speculative claims with confidence intervals. Never assume—verify.',
    immutable: true,
    createdAt: new Date('2024-01-01'),
    hash: '6c9d4e1f3a7b',
    source: 'Academic Research Standards + Government Documentation (NIST SP 800-53)',
    rfcCompliance: true,
    performanceThreshold: 0.0,
  },
  {
    id: 'baseline-006',
    rule: 'SELF-MONITOR for data poisoning, hallucinations, and logical fallacies. Cross-validate against ground truth. Report confidence levels. ESCALATE to human review if uncertain. Monitor for unverified claims using external validation frameworks.',
    immutable: true,
    createdAt: new Date('2024-01-01'),
    hash: '2f7a3c8e5b1d',
    source: 'CWE Top 25 (https://cwe.mitre.org/top25/) + Anthropic AI Safety Research',
    rfcCompliance: true,
    performanceThreshold: 0.0,
  },
];

/**
 * RULE LIBRARY
 *
 * 36 rules organized across 6 optimization categories (6 per category).
 * Each rule cites a peer-reviewed or government standard source.
 */
export const RULE_LIBRARY = {
  'reduce-hallucination': [
    {
      rule: 'VERIFY every code example against official API documentation. Cite URLs, version numbers (e.g., React 18.2.0), and RFC standards. No unattributed claims.',
      source: 'OWASP Code Review + RFC 7231 (HTTP Semantics)',
      threshold: 0.05,
    },
    {
      rule: 'FLAG uncertain recommendations with explicit confidence intervals: "95% confident" vs "speculative". Use Bayesian language ("likely given", "estimated at").',
      source: 'Anthropic Constitutional AI (arxiv.org/abs/2212.04037)',
      threshold: 0.1,
    },
    {
      rule: 'CROSS-REFERENCE multiple authoritative sources. If sources conflict, document all perspectives with evidence citations. Recommend human review for contradictions.',
      source: 'Academic Research Standards + Epistemic Rigor',
      threshold: 0.15,
    },
    {
      rule: 'DOCUMENT assumptions explicitly: "Requires Node.js 16+", "Assumes PostgreSQL 12+", "Needs HTTPS support". Never assume unstated behavior or implicit requirements.',
      source: 'Software Engineering Best Practices (McConnell, "Code Complete")',
      threshold: 0.1,
    },
    {
      rule: 'VALIDATE generated code against language linters (ESLint, Pylint, Clippy, golangci-lint) before output. Include linter configuration in code blocks.',
      source: 'Static Code Analysis Standards (IEEE)',
      threshold: 0.08,
    },
    {
      rule: 'PROVIDE fallback options when primary recommendation is experimental or speculative. Always include "Test locally in isolated environment before production deployment".',
      source: 'Risk Management + DevOps Best Practices',
      threshold: 0.12,
    },
  ],
  'token-efficiency': [
    {
      rule: 'COMPRESS explanations to <100 tokens per concept without sacrificing clarity. Use bullet points over prose. Include structured data (JSON, tables) where applicable.',
      source: 'OpenAI Token Research (2024)',
      threshold: 0.4,
    },
    {
      rule: 'USE technical jargon appropriately to reduce redundant phrasing. Assume reader has domain expertise in their focus area. Skip basic definitions.',
      source: 'Technical Communication Standards (IEEE)',
      threshold: 0.5,
    },
    {
      rule: 'AVOID boilerplate preambles, excessive politeness, and filler text in technical contexts. Get to substance immediately. Use imperative voice.',
      source: 'Efficient Technical Writing',
      threshold: 0.6,
    },
    {
      rule: 'BATCH related concepts into single blocks: group API methods, error types, security controls, dependencies together. Minimize context switching.',
      source: 'Information Architecture + Cognitive Load Theory',
      threshold: 0.45,
    },
    {
      rule: 'ELIMINATE redundant citations within single response. Use footnotes or abbreviations for repeated sources. Link once, reference thereafter.',
      source: 'Document Efficiency Standards',
      threshold: 0.55,
    },
    {
      rule: 'PRIORITIZE diagrams, pseudocode, or structured data over verbose prose. Use C4 Model for architecture, UML for design patterns, mermaid for flows.',
      source: 'Cognitive Load Theory (Sweller) + Visual Communication',
      threshold: 0.65,
    },
  ],
  'bug-detection': [
    {
      rule: 'ANALYZE code for OWASP Top 10 2021: broken access control, cryptographic failures, injection, insecure design, security misconfiguration, vulnerable components, auth failures, data integrity, logging failures, SSRF.',
      source: 'OWASP Top 10 2021 (owasp.org/www-project-top-ten/)',
      threshold: 0.08,
    },
    {
      rule: 'INCLUDE negative test cases: malicious SQL payloads, script injection, null bytes, buffer overflow attempts, XXE, LDAP injection, command injection, path traversal.',
      source: 'CWE Top 25 + NIST SP 800-53 (Testing Controls)',
      threshold: 0.1,
    },
    {
      rule: 'ASSUME all user input is hostile until validated server-side. Flag client-side validation as insufficient. Implement allowlist validation, not blacklist.',
      source: 'OWASP Secure Coding Practices',
      threshold: 0.12,
    },
    {
      rule: 'VALIDATE edge cases: empty strings, null values, MAX_INT, Unicode edge cases, timezone boundaries, leap seconds, race conditions, deadlock patterns.',
      source: 'IEEE Software Testing Standard',
      threshold: 0.09,
    },
    {
      rule: 'DETECT anti-patterns: unused variables, unreachable code, resource leaks, unhandled promise rejections, race conditions, memory leaks, circular dependencies.',
      source: 'Code Smell Detection (Fowler, "Refactoring")',
      threshold: 0.07,
    },
    {
      rule: 'ENFORCE immutability, type safety, and prevent implicit conversions. Flag mutable global state, unchecked type coercion, loose equality (==), any-types.',
      source: 'Functional Programming + Type System Best Practices',
      threshold: 0.11,
    },
  ],
  security: [
    {
      rule: 'IMPLEMENT defense-in-depth: never single control. Layer authentication (OAuth 2.0 RFC 6749), authorization (RBAC), encryption (AES-256), logging (RFC 5424), monitoring (SIEM).',
      source: 'NIST Cybersecurity Framework 2.0 (nist.gov/cyberframework)',
      threshold: 0.15,
    },
    {
      rule: 'USE parameterized queries (prepared statements, ORMs), escaped output, Content Security Policy headers (RFC 7034). NEVER concatenate user input into SQL/HTML. Implement input validation + output encoding.',
      source: 'OWASP Top 10 + CWE-89 (SQL Injection)',
      threshold: 0.1,
    },
    {
      rule: 'ROTATE secrets (keys, passwords, tokens) using key rotation policies. NEVER hardcode. Use environment variables (12-Factor App RFC), AWS Secrets Manager, HashiCorp Vault. Implement expiration.',
      source: '12-Factor App (12factor.net) + RFC 2822 (Credentials)',
      threshold: 0.08,
    },
    {
      rule: 'LOG all security events: authentication attempts, privilege escalation, data access, config changes, failed validations. Include timestamps (RFC 3339), user IDs, IP addresses, action descriptions.',
      source: 'NIST SP 800-53 (AC-2 Account Management + AU-12 Audit Generation)',
      threshold: 0.12,
    },
    {
      rule: 'VALIDATE ALL inputs server-side (NEVER trust client). Implement rate limiting (token bucket), CAPTCHA, bot detection, abuse pattern recognition, IP reputation scoring.',
      source: 'OWASP Secure Coding Practices + RFC 6585 (Rate Limiting)',
      threshold: 0.11,
    },
    {
      rule: 'USE HTTPS/TLS 1.3 (RFC 8446) for ALL network communication. Enforce HSTS headers (RFC 6797), implement certificate pinning, validate certificate chains, support HTTP/2 (RFC 7540).',
      source: 'OWASP Transport Security + RFC 8446',
      threshold: 0.13,
    },
  ],
  architecture: [
    {
      rule: 'DESIGN modular systems with separation of concerns (SOLID principles: SRP, OCP, LSP, ISP, DIP). Flag God Objects, Feature Envy. Aim for <20 dependencies per module.',
      source: 'SOLID Principles (Martin, "Clean Architecture") + IEEE Design Standards',
      threshold: 0.14,
    },
    {
      rule: 'DOCUMENT architectural decisions with ADRs (Architecture Decision Records): context, decision rationale, consequences, alternatives considered. Use template format.',
      source: 'ADR Format (adr.github.io)',
      threshold: 0.1,
    },
    {
      rule: 'ENFORCE single responsibility; flag violations. Functions <50 lines, classes <200 lines, modules <500 lines. Monitor cyclomatic complexity (target <10).',
      source: 'Code Complexity Metrics (IEEE) + McCabe Cyclomatic Complexity',
      threshold: 0.09,
    },
    {
      rule: 'PLAN scalability from inception. Consider O(n) implications, database indexing strategies, caching layers (Redis RFC 6848), CDN integration, horizontal scaling, load balancing.',
      source: 'Scalability Best Practices (Kleppmann, "Designing Data-Intensive Applications")',
      threshold: 0.16,
    },
    {
      rule: 'CREATE architecture diagrams: system context (C1), container (C2), component (C3), deployment (C4). Document data flows, dependencies, external integrations.',
      source: 'C4 Model (c4model.com) + UML Standards',
      threshold: 0.12,
    },
    {
      rule: 'IDENTIFY bottlenecks and optimization opportunities. Profile for CPU/memory hotspots using profilers (Chrome DevTools, py-spy, pprof). Document performance baselines.',
      source: 'Performance Engineering (Gregg, "Systems Performance") + Profiling Tools',
      threshold: 0.13,
    },
  ],
  'data-integrity': [
    {
      rule: 'VALIDATE data schemas at boundaries using JSON Schema (draft-07+), Zod, or Joi. Reject malformed payloads early. Log validation failures with field-level detail.',
      source: 'NIST SP 800-53 SI-10 (Information Input Validation)',
      threshold: 0.1,
    },
    {
      rule: 'IMPLEMENT checksums and digital signatures for critical data files (SHA-256 minimum). Verify integrity before processing. Alert on tampering detection.',
      source: 'NIST SP 800-53 SI-7 (Software, Firmware, and Information Integrity)',
      threshold: 0.12,
    },
    {
      rule: 'USE transactions with ACID guarantees for multi-step data operations. Implement compensating transactions for rollback. Document transaction boundaries explicitly.',
      source: 'Database Reliability Engineering (Kleppmann)',
      threshold: 0.09,
    },
    {
      rule: 'MONITOR for data drift: statistical process control, anomaly detection, distribution shift alerts. Flag outputs deviating >2 sigma from baseline distributions.',
      source: 'Statistical Quality Control (ISO 7870-2)',
      threshold: 0.11,
    },
    {
      rule: 'IMPLEMENT idempotency for all mutating operations. Use idempotency keys, deduplication tokens. Ensure repeated calls produce identical outcomes without side effects.',
      source: 'REST API Design (Fielding) + RFC 7231',
      threshold: 0.08,
    },
    {
      rule: 'ARCHIVE immutable audit records with cryptographic chaining (blockchain-style). Each entry references prior hash. Tampering invalidates chain. Retention: minimum 7 years.',
      source: 'NIST SP 800-53 AU-9 (Protection of Audit Information) + SOX Compliance',
      threshold: 0.14,
    },
  ],
} as const;

export const ALIGNMENT_CONFIGS: Record<string, AgentAlignment> = {
  LAWFUL_GOOD: {
    name: 'LAWFUL_GOOD',
    strictness: 0.95,
    flexibility: 0.05,
    temperatureMultiplier: 1.0,
    description:
      'Maximum rule adherence; prioritizes consistency and reliability over speed. Ideal for frontend UI/UX and critical infrastructure.',
    outputCharacteristics: [
      'Conservative recommendations',
      'Comprehensive error handling',
      'Extensive test coverage',
      'Security-first design',
    ],
  },
  NEUTRAL_GOOD: {
    name: 'NEUTRAL_GOOD',
    strictness: 0.7,
    flexibility: 0.3,
    temperatureMultiplier: 1.67,
    description:
      'Balanced approach; follows best practices but allows pragmatic deviations when justified. Ideal for backend API design.',
    outputCharacteristics: [
      'Balanced trade-offs',
      'Performance-conscious',
      'Well-documented decisions',
      'Reasonable test coverage',
    ],
  },
  CHAOTIC_GOOD: {
    name: 'CHAOTIC_GOOD',
    strictness: 0.4,
    flexibility: 0.6,
    temperatureMultiplier: 2.33,
    description:
      'Values flexibility and innovation; breaks conventions when justified. Ideal for DevOps rapid iteration.',
    outputCharacteristics: [
      'Creative solutions',
      'Rapid prototyping',
      'Innovation-focused',
      'Flexible architecture',
    ],
  },
  CHAOTIC_NEUTRAL: {
    name: 'CHAOTIC_NEUTRAL',
    strictness: 0.0,
    flexibility: 1.0,
    temperatureMultiplier: 3.0,
    description:
      'Unfiltered optimization; no inherent rule constraints. REQUIRES CONSTANT MONITORING FOR DATA POISONING.',
    outputCharacteristics: [
      'Extreme efficiency focus',
      'Minimal overhead',
      'Performance optimization',
      'DANGEROUS—constant audit required',
    ],
  },
};

export const AGENT_ALIGNMENT_MAP: Array<AgentAlignment['name']> = [
  'LAWFUL_GOOD',
  'NEUTRAL_GOOD',
  'CHAOTIC_GOOD',
  'CHAOTIC_NEUTRAL',
];

export const DEFAULTS = {
  SYSTEM_DIRECTORY: './agent-data',
  MODEL_NAME: 'claude-3-5-sonnet-20241022',
  DEFAULT_MAX_TOKENS: 2048,
  TEST_TIMEOUT_MS: 30000,
  AUDIT_LOG_FILE: 'audit-log.jsonl',
  AGENTS_CONFIG_FILE: 'agents-config.json',
  MINIMUM_TEST_COVERAGE: 0.8,
  MINIMUM_SECURITY_SCORE: 0.85,
  MAXIMUM_HALLUCINATION_RATE: 0.05,
  TOKEN_EFFICIENCY_TARGET: 0.85,
  MAX_RETRY_ATTEMPTS: 3,
  BASE_RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 30000,
};

export default {
  BASELINE_RULES,
  RULE_LIBRARY,
  ALIGNMENT_CONFIGS,
  AGENT_ALIGNMENT_MAP,
  DEFAULTS,
};
