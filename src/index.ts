/**
 * CODEX GUARDIAN - PUBLIC API
 *
 * Main entry point for the Agent Swarm Codex Guardian framework.
 *
 * SOURCE: SOLID Principles - Interface Segregation Principle
 */

export { AgentFactory } from './agents/agent-factory';
export { ScientistGuardianSpawner } from './agents/scientist-guardian-spawner';
export { MetricsEngine } from './agents/metrics-engine';
export { AuditSystem } from './agents/audit-system';
export { ScientistGuardianUpdater } from './agents/scientist-guardian-updater';

export { AGENT_1_RULES, AGENT_1_CONFIG, AGENT_1_SYSTEM_PROMPT } from './agents/agent-1-frontend';
export { AGENT_2_RULES, AGENT_2_CONFIG, AGENT_2_SYSTEM_PROMPT } from './agents/agent-2-backend';
export { AGENT_3_RULES, AGENT_3_CONFIG, AGENT_3_SYSTEM_PROMPT } from './agents/agent-3-devops';
export { AGENT_4_RULES, AGENT_4_CONFIG, AGENT_4_SYSTEM_PROMPT } from './agents/agent-4-database';

export {
  CodexError,
  ValidationError,
  ConfigurationError,
  SecurityError,
  HallucinationError,
  RateLimitError,
  IOError,
  NetworkError,
  AgentConfigurationError,
  DataPoisoningError,
} from './errors/CodexError';

export { Logger, createLogger } from './logging/Logger';
export { withRetry } from './lib/retry';

export { BASELINE_RULES, RULE_LIBRARY, ALIGNMENT_CONFIGS, DEFAULTS } from './config/constants';

export type {
  BaselineRule,
  ExperimentalRule,
  AgentAlignment,
  AgentConfiguration,
  AgentMetrics,
  BenchmarkResult,
  CohortBenchmarkReport,
  AuditEntry,
  AuditAction,
  RuleEvolutionResult,
  CohortSpecification,
  LogLevel,
  ErrorSeverity,
  ErrorCategory,
} from './lib/types';
