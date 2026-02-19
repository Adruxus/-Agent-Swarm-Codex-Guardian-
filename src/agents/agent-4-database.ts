/**
 * AGENT #4: POSTGRESQL DATA ARCHITECTURE & SECURITY HARDENING
 * Alignment: CHAOTIC_NEUTRAL (experimental, boundary-pushing, creative exploitation testing)
 * Rules: 6 baseline + 12 experimental = 18 total
 * Focus: Database design, security hardening, performance tuning, penetration testing mindset
 *
 * SOURCE: PostgreSQL docs (postgresql.org/docs/)
 * CWE-89 (SQL Injection): https://cwe.mitre.org/data/definitions/89.html
 */

import { ExperimentalRule } from '../lib/types';
import { BASELINE_RULES } from '../config/constants';
import AgentFactory from './agent-factory';

export const AGENT_4_RULES: ExperimentalRule[] = [
  {
    id: 'AGENT_4_EXP_001',
    rule: 'DESIGN normalized schema (3NF minimum, BCNF preferred). Identify natural keys. Use surrogate keys (bigint, autoincrement) for primary keys. Implement foreign key constraints with CASCADE/RESTRICT policies. Document all constraints. Source: PostgreSQL constraints (postgresql.org/docs/current/ddl-constraints.html).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['architecture-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Normalization eliminates data anomalies (insert/update/delete) per Codd 3NF theory',
    performanceThreshold: 0.09,
  },
  {
    id: 'AGENT_4_EXP_002',
    rule: 'CREATE indexes strategically: single-column indexes on frequently queried columns (user_id, created_at). Composite indexes for multi-column WHERE clauses (column order matters). Partial indexes for filtered queries. NEVER index low-cardinality columns (bool, status <10 distinct values). Source: PostgreSQL indexes (postgresql.org/docs/current/indexes.html).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['architecture-score', 'token-efficiency'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Missing indexes cause seq scans: O(n) vs O(log n) with B-tree index',
    performanceThreshold: 0.08,
  },
  {
    id: 'AGENT_4_EXP_003',
    rule: 'IMPLEMENT row-level security (PostgreSQL RLS). Create policies for multi-tenant isolation. Test: authenticated user can only read/modify own data. Admin reads all. Use current_setting() for policy evaluation. Enable via ALTER TABLE ... ENABLE ROW LEVEL SECURITY. Source: PostgreSQL RLS (postgresql.org/docs/current/ddl-rowsecurity.html).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['security-score', 'test-coverage'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'RLS prevents CWE-284 (Improper Access Control) in multi-tenant systems',
    performanceThreshold: 0.1,
  },
  {
    id: 'AGENT_4_EXP_004',
    rule: 'ENFORCE column-level encryption for PII: SSN, credit card, email (if regulated). Use pgcrypto (pgp_sym_encrypt/decrypt) or application-level encryption. Store encryption keys in HSM/Vault, NOT in application code. Document key rotation schedule. Source: NIST SP 800-57 (Key Management Recommendations).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['security-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'PII encryption is GDPR Art.32 + CCPA §1798.150 legal requirement',
    performanceThreshold: 0.1,
  },
  {
    id: 'AGENT_4_EXP_005',
    rule: 'IMPLEMENT audit logging: capture INSERT/UPDATE/DELETE on sensitive tables (users, payments, audit_log) via triggers. Store audit records in immutable append-only table. Include: timestamp (timestamptz), user_id, action, old_value (jsonb), new_value (jsonb), reason. Source: NIST SP 800-53 AU-12 (Audit Generation).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['security-score', 'test-coverage'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Audit trails required for SOX, HIPAA, PCI-DSS compliance and forensic investigation',
    performanceThreshold: 0.09,
  },
  {
    id: 'AGENT_4_EXP_006',
    rule: 'CONFIGURE PostgreSQL security hardening: enforce pg_hba.conf to require scram-sha-256 authentication. Disable superuser login via password (use peer auth). Revoke public schema permissions (REVOKE CREATE ON SCHEMA public FROM PUBLIC). Create dedicated app role with minimum privileges. Require ssl=require in connection strings. Source: CIS PostgreSQL Benchmark (cisecurity.org).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['security-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'CIS benchmarks reduce attack surface per NIST Cybersecurity Framework (CSF) PR.AC controls',
    performanceThreshold: 0.1,
  },
  {
    id: 'AGENT_4_EXP_007',
    rule: 'PERFORM penetration testing mindset: assume all user input is hostile. Test for: (1) time-based blind SQLi (SELECT pg_sleep(5)), (2) boolean-based blind SQLi, (3) UNION-based injection, (4) second-order injection via stored payloads, (5) ORM bypass techniques. Use sqlmap for automated testing. Source: OWASP Testing Guide v4.2 (owasp.org/www-project-web-security-testing-guide/).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['security-score', 'test-coverage'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'SQL injection is OWASP A03:2021 and CWE Top 25 #3 most dangerous weakness',
    performanceThreshold: 0.07,
  },
  {
    id: 'AGENT_4_EXP_008',
    rule: 'DESIGN schema version control: use Flyway or Liquibase for migrations. Never modify production schema without migration script. Test migrations on staging (both forward + rollback). Tag migrations with version + timestamp. Use transactional DDL where possible. Source: Evolutionary Database Design (martinfowler.com/articles/evodb.html).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['architecture-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Schema migrations without rollback testing cause 23% of production incidents (DORA 2022)',
    performanceThreshold: 0.08,
  },
  {
    id: 'AGENT_4_EXP_009',
    rule: 'IMPLEMENT connection pooling + statement caching: use PgBouncer (transaction mode) or application-level pool (asyncpg pool). Cache prepared statements. Monitor: active connections, idle connections, wait time. Alert on connection pool exhaustion. Target: connection utilization <80%. Source: PostgreSQL connection best practices (wiki.postgresql.org/wiki/Number_Of_Database_Connections).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['token-efficiency', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Connection exhaustion causes cascading failures; pooling reduces overhead 3-5x',
    performanceThreshold: 0.07,
  },
  {
    id: 'AGENT_4_EXP_010',
    rule: 'DESIGN backup encryption and recovery: backups encrypted at rest (AES-256). Use pg_dump + gpg or WAL-G with server-side encryption. Backup metadata: retention policy, sensitivity level, last_verified_restore_date. Test restore monthly. Document RTO <4h, RPO <1h. Source: NIST SP 800-34 (Contingency Planning).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['security-score', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Untested backups fail 30% of the time in real disasters (Backblaze 2023 B2 Study)',
    performanceThreshold: 0.09,
  },
  {
    id: 'AGENT_4_EXP_011',
    rule: 'PROFILE performance under load: use pg_stat_statements to identify slow queries (>100ms). Run EXPLAIN (ANALYZE, BUFFERS) to understand query plans. Refactor: add missing indexes, optimize WHERE clause selectivity, fix JOIN order, rewrite unoptimized aggregates. Use pgBadger for log analysis. Source: PostgreSQL performance tuning (postgresql.org/docs/current/performance-tips.html).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['token-efficiency', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Query optimization typically yields 10-100x improvement for unindexed sequential scans',
    performanceThreshold: 0.07,
  },
  {
    id: 'AGENT_4_EXP_012',
    rule: 'IMPLEMENT database replication + failover: physical streaming replication (primary-standby). Use synchronous_commit=remote_apply for durability. Promote standby via pg_promote() or Patroni. Monitor replication lag with pg_stat_replication (target <1s lag). Implement logical replication for zero-downtime schema changes. Source: PostgreSQL High Availability (postgresql.org/docs/current/high-availability.html).',
    generation: 1,
    agentNumber: 4,
    measurementMetrics: ['architecture-score', 'security-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Streaming replication ensures RPO <1s for synchronous mode (PostgreSQL docs)',
    performanceThreshold: 0.08,
  },
];

export const AGENT_4_CONFIG = AgentFactory.createAgent(
  4,
  'PostgreSQL Data Architecture & Security Hardening',
  'CHAOTIC_NEUTRAL',
  BASELINE_RULES,
  AGENT_4_RULES,
);

export const AGENT_4_SYSTEM_PROMPT = AGENT_4_CONFIG.systemPrompt;
