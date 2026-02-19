/**
 * AGENT SWARM CODEX GUARDIAN
 * 
 * A production-grade, TypeScript-based multi-agent AI framework
 * that creates, measures, and evolves AI coding agents through
 * scientific methodology.
 * 
 * @packageDocumentation
 */

// Core types
export {
  BaselineRule,
  ExperimentalRule,
  AgentAlignment,
  ModelConfig,
  AgentConfiguration,
  AuditLogEntry,
  SpawnSpecification,
  RuleLibraryEntry,
  RuleLibrary,
  AgentMetrics,
  AgentCohortResult,
} from './types';

// Constants
export { BASELINE_RULES, RULE_LIBRARY, ALIGNMENT_CONFIGS, DEFAULTS } from './constants';

// Core classes
export { AgentFactory } from './agents/agent-factory';
export { ScientistGuardianSpawner } from './agents/scientist-guardian-spawner';

// Agent-specific exports
export { AGENT_4_RULES, AGENT_4_SYSTEM_PROMPT } from './agents/agent-4-database';
