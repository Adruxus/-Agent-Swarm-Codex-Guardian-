/**
 * COMPLETE TYPE DEFINITIONS
 * 
 * All TypeScript interfaces used throughout the system.
 * Immutable and fully documented.
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
// AUDIT LOG ENTRY
// ============================================================================

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  operator: string;
  justification: string;
  securityImplications: string;
  scientistId?: string;
}

// ============================================================================
// SPAWN SPECIFICATION
// ============================================================================

export interface SpawnSpecification {
  agentFocusAreas: string[];
  optimizationGoals?: string[];
  customRules?: { [agentNum: number]: string[] };
}

// ============================================================================
// RULE LIBRARY ENTRY
// ============================================================================

export interface RuleLibraryEntry {
  rule: string;
  source: string;
  threshold: number;
}

// ============================================================================
// RULE LIBRARY
// ============================================================================

export interface RuleLibrary {
  'reduce-hallucination': RuleLibraryEntry[];
  'token-efficiency': RuleLibraryEntry[];
  'bug-detection': RuleLibraryEntry[];
  security: RuleLibraryEntry[];
  architecture: RuleLibraryEntry[];
}

// ============================================================================
// METRICS
// ============================================================================

export interface AgentMetrics {
  agentId: string;
  hallucinationRate: number;
  logicalConsistency: number;
  tokenEfficiency: number;
  bugDensity: number;
  securityScore: number;
  testCoverage: number;
  alignmentAdherence: number;
  measuredAt: Date;
}

// ============================================================================
// AGENT COHORT RESULT
// ============================================================================

export interface AgentCohortResult {
  cohortId: string;
  agents: AgentConfiguration[];
  createdAt: Date;
  specification: SpawnSpecification;
}
