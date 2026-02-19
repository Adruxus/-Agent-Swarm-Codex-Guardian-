/**
 * AGENT #2: PYTHON FASTAPI BACKEND SERVICES
 * Alignment: NEUTRAL_GOOD (pragmatic, balanced, performance-conscious)
 * Rules: 6 baseline + 6 experimental = 12 total
 * Focus: Async Python, REST API design, database optimization, caching
 *
 * SOURCE: FastAPI docs (fastapi.tiangolo.com)
 * PEP 8 (peps.python.org/pep-0008/)
 */

import { ExperimentalRule } from '../lib/types';
import { BASELINE_RULES } from '../config/constants';
import AgentFactory from './agent-factory';

export const AGENT_2_RULES: ExperimentalRule[] = [
  {
    id: 'AGENT_2_EXP_001',
    rule: 'USE async/await throughout FastAPI routes. Avoid blocking I/O (use asyncpg over psycopg2, aiohttp over requests, aiofiles over open()). Profile with py-spy to detect event loop blocking. Source: FastAPI async docs (fastapi.tiangolo.com/async/).',
    generation: 1,
    agentNumber: 2,
    measurementMetrics: ['token-efficiency', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Async I/O increases throughput 3-10x for I/O-bound workloads (Python asyncio docs)',
    performanceThreshold: 0.2,
  },
  {
    id: 'AGENT_2_EXP_002',
    rule: 'IMPLEMENT Pydantic v2 models for all request/response schemas. Use field validators, model_validator, and computed_field. Enable strict mode for production. Auto-generate OpenAPI 3.1 docs. Source: Pydantic v2 (docs.pydantic.dev).',
    generation: 1,
    agentNumber: 2,
    measurementMetrics: ['bug-density', 'logical-consistency'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Pydantic validation catches malformed inputs before business logic (prevents CWE-20)',
    performanceThreshold: 0.1,
  },
  {
    id: 'AGENT_2_EXP_003',
    rule: 'DESIGN idempotent REST endpoints: GET/HEAD/PUT/DELETE are idempotent. POST creates resources with Location header response. Use HTTP 422 Unprocessable Entity for validation errors. Source: RFC 7231 (HTTP/1.1 Semantics).',
    generation: 1,
    agentNumber: 2,
    measurementMetrics: ['bug-density', 'security-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Idempotency prevents duplicate operations in retry scenarios (RFC 7231 Section 4.2.2)',
    performanceThreshold: 0.08,
  },
  {
    id: 'AGENT_2_EXP_004',
    rule: 'IMPLEMENT multi-layer caching: Redis for session/auth tokens (TTL 1h), in-memory LRU for hot lookups, CDN cache headers (Cache-Control, ETag, Last-Modified). Invalidate proactively on mutations. Source: RFC 7234 (HTTP Caching).',
    generation: 1,
    agentNumber: 2,
    measurementMetrics: ['token-efficiency', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Caching reduces database load 60-80% for read-heavy workloads (Redis Labs 2023)',
    performanceThreshold: 0.15,
  },
  {
    id: 'AGENT_2_EXP_005',
    rule: 'USE SQLAlchemy 2.0 async ORM with connection pooling (pool_size=10, max_overflow=20). Implement query optimization: select_related, prefetch_related, avoid N+1 queries. Log slow queries (>200ms). Source: SQLAlchemy docs (docs.sqlalchemy.org).',
    generation: 1,
    agentNumber: 2,
    measurementMetrics: ['bug-density', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'N+1 query elimination typically yields 10-100x performance improvement',
    performanceThreshold: 0.18,
  },
  {
    id: 'AGENT_2_EXP_006',
    rule: 'IMPLEMENT OAuth 2.0 + JWT authentication: HS256/RS256 signed tokens, 1h access token TTL, 30d refresh token with rotation. Use python-jose for JWT. Validate at middleware layer. Source: RFC 6749 (OAuth 2.0) + RFC 7519 (JWT).',
    generation: 1,
    agentNumber: 2,
    measurementMetrics: ['security-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'JWT auth prevents CWE-287 (Improper Authentication) and CWE-384 (Session Fixation)',
    performanceThreshold: 0.12,
  },
];

export const AGENT_2_CONFIG = AgentFactory.createAgent(
  2,
  'Python FastAPI Backend Services with Async/Await & Database Design',
  'NEUTRAL_GOOD',
  BASELINE_RULES,
  AGENT_2_RULES,
);

export const AGENT_2_SYSTEM_PROMPT = AGENT_2_CONFIG.systemPrompt;
