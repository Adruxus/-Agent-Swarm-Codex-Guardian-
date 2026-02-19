/**
 * COMPLETE TYPE DEFINITIONS
 *
 * All TypeScript interfaces used throughout the system.
 * Immutable and fully documented.
 *
 * SOURCE: IEEE Software Architecture Standard (ISO/IEC/IEEE 42010:2011)
 */

// ============================================================================
// BASELINE RULES
// ============================================================================

export interface BaselineRule {
  id: string;
  rule: string;
  immutable: boolean;
  createdAt: Date;
  hash: string;
  source: string;
  rfcCompliance: boolean;
  performanceThreshold?: number;
}

// ============================================================================
// EXPERIMENTAL RULES
// ============================================================================

export interface ExperimentalRule {
  id: string;
  rule: string;
  generation: number;
  agentNumber: number;
  measurementMetrics: string[];
  status: 'active' | 'archived' | 'deprecated';
  createdAt: Date;
  justification: string;
  performanceThreshold: number;
}

// ============================================================================
// AGENT ALIGNMENT
// ============================================================================

export interface AgentAlignment {
  name: 'LAWFUL_GOOD' | 'NEUTRAL_GOOD' | 'CHAOTIC_GOOD' | 'CHAOTIC_NEUTRAL';
  strictness: number;
  flexibility: number;
  description: string;
  temperatureMultiplier: number;
  outputCharacteristics: string[];
}

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface AgentConfiguration {
  agentId: string;
  generation: number;
  agentNumber: number;
  focusArea: string;
  alignment: AgentAlignment;
  baselineRules: BaselineRule[];
  experimentalRules: ExperimentalRule[];
  systemPrompt: string;
  createdAt: Date;
  version: string;
  modelConfig: ModelConfig;
}

// ============================================================================
// METRICS & KPI TYPES
// ============================================================================

export interface AgentMetrics {
  agentId: string;
  agentNumber: number;
  timestamp: Date;
  hallucinationRate: number;
  bugDensity: number;
  tokenEfficiency: number;
  securityScore: number;
  logicalConsistency: number;
  testCoverage: number;
  timeToCompletionMs: number;
  productivityScore: number;
  cycomaticComplexity: number;
  architectureScore: number;
}

export interface MetricsWeights {
  hallucinations: number;
  bugDensity: number;
  tokenEfficiency: number;
  securityScore: number;
  logicalConsistency: number;
  testCoverage: number;
}

export interface BenchmarkResult {
  agentId: string;
  agentNumber: number;
  alignment: string;
  focusArea: string;
  metrics: AgentMetrics;
  rank: number;
  passed: boolean;
  failureReasons: string[];
  timestamp: Date;
}

export interface CohortBenchmarkReport {
  cohortId: string;
  timestamp: Date;
  agents: BenchmarkResult[];
  winner: BenchmarkResult | null;
  recommendations: string[];
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

// ============================================================================
// AUDIT TYPES (NIST SP 800-53 AU-12 COMPLIANT)
// ============================================================================

export type AuditAction =
  | 'SYSTEM_INITIALIZED'
  | 'AGENT_COHORT_SPAWNED'
  | 'AGENT_CREATED'
  | 'AGENT_UPDATED'
  | 'AGENT_DEACTIVATED'
  | 'RULE_MODIFIED'
  | 'RULE_ARCHIVED'
  | 'RULE_ADDED'
  | 'BENCHMARK_RUN'
  | 'METRICS_RECORDED'
  | 'VALIDATION_FAILED'
  | 'SECURITY_ALERT'
  | 'HALLUCINATION_DETECTED'
  | 'DATA_POISONING_ALERT'
  | 'HUMAN_ESCALATION'
  | 'COHORT_EVOLUTION'
  | 'RULE_EVOLUTION';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  operator: string;
  agentId?: string;
  agentNumber?: number;
  justification: string;
  performanceImpact?: number;
  securityImplications: string;
  checksum: string;
  scientistId: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ERROR TYPES (NIST SP 800-53 SI-11 COMPLIANT)
// ============================================================================

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ErrorCategory =
  | 'VALIDATION'
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'IO'
  | 'SECURITY'
  | 'HALLUCINATION'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

export interface StructuredError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: string;
  context?: Record<string, unknown>;
  retryable: boolean;
  nistControl?: string;
}

// ============================================================================
// RULE EVOLUTION TYPES
// ============================================================================

export interface RuleEvolutionResult {
  agentId: string;
  generation: number;
  rulesAdded: ExperimentalRule[];
  rulesArchived: string[];
  rulesModified: ExperimentalRule[];
  justification: string;
  expectedImprovement: number;
  timestamp: Date;
}

export interface EvolutionCriteria {
  minPerformanceThreshold: number;
  maxHallucinationRate: number;
  minSecurityScore: number;
  minTestCoverage: number;
}

// ============================================================================
// COHORT SPECIFICATION
// ============================================================================

export interface CohortSpecification {
  agentFocusAreas: [string, string, string, string];
  optimizationGoals?: string[];
  customRules?: { [agentNum: number]: string[] };
}

// ============================================================================
// LOG LEVELS
// ============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  component: string;
  message: string;
  context?: Record<string, unknown>;
  correlationId?: string;
}
