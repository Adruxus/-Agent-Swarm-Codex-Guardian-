/**
 * SCIENTIST GUARDIAN - AGENT #7 SPAWNER
 * ======================================
 * 
 * PURPOSE:
 * Agent #7 (Scientist Guardian) orchestrates the creation of 4-agent cohorts.
 * This file contains the complete spawning logic.
 * 
 * RESPONSIBILITY:
 * 1. Accept user specifications (4 focus areas + optimization goals)
 * 2. Generate experimental rule sets based on alignment + goals
 * 3. Create 4 agents using AgentFactory
 * 4. Apply metrics weighting by alignment
 * 5. Persist agents to disk
 * 6. Log all actions to audit trail
 * 
 * ALIGNMENT: CHAOTIC_NEUTRAL
 * - No rule constraints (unfiltered optimization)
 * - Temperature: 0.9 (high creativity)
 * - TopP: 1.0 (maximum diversity)
 * - ⚠️ DANGER: Constant monitoring required
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import AgentFactory from './agent-factory';
import {
  AgentConfiguration,
  ExperimentalRule,
  AgentAlignment,
  AuditLogEntry,
  SpawnSpecification,
} from '../types';
import { BASELINE_RULES, RULE_LIBRARY } from '../constants';

/**
 * ScientistGuardianSpawner creates 4-agent cohorts with full configuration.
 * 
 * PATTERN: Orchestrator pattern
 * - Coordinates agent creation, rule generation, and persistence
 * - Separates concerns: spawning vs measuring vs analyzing
 * - Allows testing each component independently
 * 
 * RATIONALE:
 * Spawning is distinct from measurement. This class:
 * 1. Creates agents (spawning)
 * 2. Persists agents (I/O)
 * 3. Logs actions (audit trail)
 * 
 * Measurement happens in metrics-engine.ts (separate concern).
 * Updating happens in scientist-guardian-updater.ts (separate concern).
 */
export class ScientistGuardianSpawner {
  private systemDirectory: string;
  private scientistId: string;
  private auditLogPath: string;

  /**
   * CONSTRUCTOR
   * 
   * PARAMETERS:
   * - systemDirectory: Where to persist agents and logs
   * 
   * INITIALIZATION:
   * 1. Create system directory if needed
   * 2. Generate unique scientist ID
   * 3. Initialize audit log file
   */
  constructor(systemDirectory: string = './agent-data') {
    this.systemDirectory = systemDirectory;
    this.scientistId = `scientist-${uuidv4()}`;
    this.auditLogPath = path.join(systemDirectory, 'audit-log.jsonl');

    // Create system directory if it doesn't exist
    if (!fs.existsSync(systemDirectory)) {
      fs.mkdirSync(systemDirectory, { recursive: true });
    }

    // Initialize audit log
    if (!fs.existsSync(this.auditLogPath)) {
      this.logAudit({
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_INITIALIZED',
        operator: 'scientist-guardian',
        justification: `Scientist Guardian ${this.scientistId} initialized`,
        securityImplications: 'System ready for agent spawning',
      });
    }
  }

  /**
   * SPAWN 4-AGENT COHORT
   * 
   * USER INPUT:
   * {
   *   agentFocusAreas: [
   *     "React/NextJS Frontend",
   *     "Python FastAPI Backend",
   *     "DevOps/Infrastructure",
   *     "PostgreSQL Security"
   *   ],
   *   optimizationGoals: [
   *     "reduce-hallucination",
   *     "token-efficiency",
   *     "bug-detection",
   *     "security"
   *   ]
   * }
   * 
   * PROCESS:
   * 1. Validate user input (exactly 4 focus areas)
   * 2. Generate experimental rules for each agent based on:
   *    - Alignment (LAWFUL_GOOD, NEUTRAL_GOOD, CHAOTIC_GOOD, CHAOTIC_NEUTRAL)
   *    - Optimization goals (reduce-hallucination, token-efficiency, etc.)
   * 3. Create 4 agents using AgentFactory
   * 4. Persist agents to JSON files
   * 5. Log spawning action to audit trail
   * 
   * RETURNS:
   * Array of 4 complete AgentConfiguration objects.
   * 
   * THROWS:
   * - Error if not exactly 4 focus areas
   * - Error if invalid optimization goals
   */
  spawnCohort(specification: SpawnSpecification): AgentConfiguration[] {
    console.log('\n⚔️ [SCIENTIST #7] SPAWNING 4-AGENT COHORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // STEP 1: Validate user input
    if (!specification.agentFocusAreas || specification.agentFocusAreas.length !== 4) {
      throw new Error(
        '❌ SCIENTIST GUARDIAN REQUIRES EXACTLY 4 AGENT SPECIFICATIONS. User input is mandatory.',
      );
    }

    console.log('📋 Agent Focus Areas:');
    specification.agentFocusAreas.forEach((area, idx) => {
      console.log(`   Agent #${idx + 1}: ${area}`);
    });

    if (specification.optimizationGoals) {
      console.log('🎯 Optimization Goals:', specification.optimizationGoals.join(', '));
    }

    // STEP 2: Create agents
    const newAgents: AgentConfiguration[] = [];
    const alignments: AgentAlignment['name'][] = [
      'LAWFUL_GOOD',
      'NEUTRAL_GOOD',
      'CHAOTIC_GOOD',
      'CHAOTIC_NEUTRAL',
    ];

    for (let i = 0; i < 4; i++) {
      const agentNum = i + 1;
      const alignmentName = alignments[i];
      const focusArea = specification.agentFocusAreas[i];

      console.log(`\n⚙️  Creating Agent #${agentNum}...`);

      // Generate experimental rules for this agent
      // Rule count = 6 baseline + (3 * agentNumber)
      // Agent 1: 9, Agent 2: 12, Agent 3: 15, Agent 4: 18
      const ruleCount = 6 + agentNum * 3;
      const experimentalRules = this.generateExperimentalRules(
        agentNum,
        ruleCount,
        alignmentName,
        specification.customRules?.[agentNum],
        specification.optimizationGoals,
      );

      // Create agent using AgentFactory
      const agentConfig = AgentFactory.createAgent(
        agentNum,
        focusArea,
        alignmentName,
        BASELINE_RULES,
        experimentalRules,
      );

      newAgents.push(agentConfig);

      // Validate agent configuration
      const validationErrors = AgentFactory.validateAgentConfiguration(agentConfig);
      if (validationErrors.length > 0) {
        console.error(`❌ Agent #${agentNum} validation errors:`, validationErrors);
        throw new Error(`Failed to create Agent #${agentNum}: ${validationErrors.join('; ')}`);
      }

      console.log(`   ✅ Agent #${agentNum} created`);
      console.log(`      Alignment: ${alignmentName}`);
      console.log(`      Rules: ${experimentalRules.length} experimental + 6 baseline`);
      console.log(`      Temperature: ${agentConfig.modelConfig.temperature}`);
      console.log(`      Agent ID: ${agentConfig.agentId}`);
    }

    // STEP 3: Persist agents to disk
    const generationFile = `agent-pool-generation-${Date.now()}.json`;
    const generationPath = path.join(this.systemDirectory, generationFile);

    fs.writeFileSync(generationPath, JSON.stringify(newAgents, null, 2));

    console.log(`\n📁 Agent pool persisted: ${generationFile}`);
    console.log(`   Location: ${generationPath}`);

    // STEP 4: Log to audit trail
    this.logAudit({
      timestamp: new Date().toISOString(),
      action: 'AGENT_COHORT_SPAWNED',
      operator: 'system',
      justification: `Created 4-agent cohort with optimizations: ${specification.optimizationGoals?.join(', ') || 'default'}`,
      securityImplications: 'All agents created with full baseline rule compliance',
    });

    return newAgents;
  }

  /**
   * GENERATE EXPERIMENTAL RULES
   * 
   * RATIONALE:
   * Experimental rules are tailored to each agent based on:
   * 1. Alignment (affects which goals are prioritized)
   * 2. Optimization goals (reduce-hallucination, token-efficiency, etc.)
   * 3. Agent number (higher agents get more rules)
   * 
   * ALIGNMENT-SPECIFIC RULE SELECTION:
   * - LAWFUL_GOOD: Emphasizes reduce-hallucination, bug-detection, security, architecture
   * - NEUTRAL_GOOD: Balanced across all goals
   * - CHAOTIC_GOOD: Prioritizes token-efficiency, architecture, rapid iteration
   * - CHAOTIC_NEUTRAL: Pure performance (token-efficiency, bug-detection)
   * 
   * FLOW:
   * 1. If user provided custom rules, use those first
   * 2. Otherwise, select rules from RULE_LIBRARY based on alignment + goals
   * 3. Slice to match expected rule count
   * 4. Tag each rule with metrics it affects
   * 5. Return complete rule set
   */
  private generateExperimentalRules(
    agentNumber: number,
    ruleCount: number,
    alignmentName: AgentAlignment['name'],
    userDefinedRules?: string[],
    optimizationGoals?: string[],
  ): ExperimentalRule[] {
    const rules: ExperimentalRule[] = [];

    // STEP 1: Include user-defined rules if provided
    if (userDefinedRules && userDefinedRules.length > 0) {
      userDefinedRules.forEach((rule, idx) => {
        rules.push({
          id: `exp-${agentNumber}-user-${idx}`,
          rule,
          generation: 1,
          agentNumber,
          measurementMetrics: this.extractMetricsFromRule(rule),
          status: 'active',
          createdAt: new Date(),
          justification: 'User-specified custom rule',
          performanceThreshold: 0.5, // Must show 50% improvement
        });
      });
    }

    // STEP 2: Generate derived rules from RULE_LIBRARY based on alignment + goals
    const derivedRules = this.generateRuleSetByAlignment(
      agentNumber,
      alignmentName,
      ruleCount - rules.length,
      optimizationGoals,
    );

    rules.push(...derivedRules);

    // STEP 3: Slice to match expected rule count
    return rules.slice(0, ruleCount);
  }

  /**
   * GENERATE RULE SET BY ALIGNMENT & OPTIMIZATION GOALS
   * 
   * PROCESS:
   * 1. Determine which optimization goals are appropriate for this alignment
   * 2. For each goal, select rules from RULE_LIBRARY
   * 3. Assign metrics to each rule (which KPIs it affects)
   * 4. Tag with source and performance threshold
   * 5. Return complete rule set
   * 
   * ALIGNMENT-GOAL MAPPING:
   * - LAWFUL_GOOD: [reduce-hallucination, bug-detection, architecture, security]
   * - NEUTRAL_GOOD: [reduce-hallucination, token-efficiency, bug-detection, architecture]
   * - CHAOTIC_GOOD: [token-efficiency, architecture, bug-detection]
   * - CHAOTIC_NEUTRAL: [token-efficiency, bug-detection] (minimal overhead)
   * 
   * SOURCES:
   * [1] OWASP Top 10: https://owasp.org/www-project-top-ten/
   * [2] CWE Top 25: https://cwe.mitre.org/top25/
   * [3] NIST SP 800-53: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
   * [4] IEEE SOLID: https://www.iso.org/standard/74835.html
   * [5] OpenAI Token Research: https://openai.com
   */
  private generateRuleSetByAlignment(
    agentNumber: number,
    alignmentName: AgentAlignment['name'],
    count: number,
    optimizationGoals?: string[],
  ): ExperimentalRule[] {
    const rules: ExperimentalRule[] = [];

    // Select optimization goals based on alignment
    let selectedGoals = optimizationGoals || [
      'reduce-hallucination',
      'token-efficiency',
      'bug-detection',
    ];

    // Override with alignment-specific defaults if not provided
    if (!optimizationGoals) {
      if (alignmentName === 'LAWFUL_GOOD') {
        selectedGoals = ['reduce-hallucination', 'bug-detection', 'architecture', 'security'];
      } else if (alignmentName === 'NEUTRAL_GOOD') {
        selectedGoals = [
          'reduce-hallucination',
          'token-efficiency',
          'bug-detection',
          'architecture',
        ];
      } else if (alignmentName === 'CHAOTIC_GOOD') {
        selectedGoals = ['token-efficiency', 'architecture', 'bug-detection'];
      } else if (alignmentName === 'CHAOTIC_NEUTRAL') {
        // Needs 18 experimental rules for Agent #4 (6 baseline + 18 experimental = 24 total).
        // Include all five goal categories (30 pool entries) so the
        // rule-count requirement is always satisfiable.
        selectedGoals = [
          'token-efficiency',
          'bug-detection',
          'reduce-hallucination',
          'security',
          'architecture',
        ];
      }
    }

    // For each goal, add rules from RULE_LIBRARY
    let ruleIndex = 0;
    for (const goal of selectedGoals) {
      const goalRules = RULE_LIBRARY[goal as keyof typeof RULE_LIBRARY] || [];

      for (const ruleObj of goalRules) {
        if (ruleIndex < count) {
          rules.push({
            id: `exp-${agentNumber}-${ruleIndex}`,
            rule: ruleObj.rule,
            generation: 1,
            agentNumber,
            measurementMetrics: this.extractMetricsFromRule(ruleObj.rule),
            status: 'active',
            createdAt: new Date(),
            justification: `${goal} optimization. Source: ${ruleObj.source}`,
            performanceThreshold: ruleObj.threshold,
          });
          ruleIndex++;
        }
      }
    }

    return rules;
  }

  /**
   * EXTRACT METRICS FROM RULE
   * 
   * RATIONALE:
   * Each rule affects specific metrics. By tagging rules with metrics,
   * we can measure which rules are working and which aren't.
   * 
   * MAPPING:
   * - "verify", "validate", "check" → hallucinations, logical-consistency
   * - "token", "compress", "efficient" → token-efficiency
   * - "security", "vulnerability", "bug", "owasp" → bug-density, security-score
   * - "modular", "architecture", "design" → cyclomatic-complexity
   * - "test", "coverage" → test-coverage
   * 
   * This allows us to measure rule effectiveness by comparing
   * metrics before and after rule application.
   */
  private extractMetricsFromRule(rule: string): string[] {
    const metrics: string[] = [];
    const lowerRule = rule.toLowerCase();

    if (
      lowerRule.includes('verify') ||
      lowerRule.includes('validate') ||
      lowerRule.includes('check')
    ) {
      metrics.push('hallucinations', 'logical-consistency');
    }

    if (
      lowerRule.includes('token') ||
      lowerRule.includes('compress') ||
      lowerRule.includes('efficient')
    ) {
      metrics.push('token-efficiency');
    }

    if (
      lowerRule.includes('security') ||
      lowerRule.includes('vulnerability') ||
      lowerRule.includes('bug') ||
      lowerRule.includes('owasp')
    ) {
      metrics.push('bug-density', 'security-score');
    }

    if (
      lowerRule.includes('modular') ||
      lowerRule.includes('architecture') ||
      lowerRule.includes('design')
    ) {
      metrics.push('cyclomatic-complexity', 'architecture-score');
    }

    if (lowerRule.includes('test') || lowerRule.includes('coverage')) {
      metrics.push('test-coverage');
    }

    return metrics.length > 0 ? metrics : ['general-quality'];
  }

  /**
   * LOG AUDIT ENTRY
   * 
   * RATIONALE:
   * Every action must be logged for:
   * 1. Compliance (NIST SP 800-53 AU-12)
   * 2. Forensic analysis (what changed and why)
   * 3. Rollback capability
   * 4. Human review/approval
   * 
   * FORMAT: JSONL (JSON Lines)
   * - One entry per line
   * - Searchable with grep/awk
   * - Can be analyzed programmatically
   */
  private logAudit(entry: Omit<AuditLogEntry, 'scientistId'>): void {
    const auditEntry: AuditLogEntry = {
      ...entry,
      scientistId: this.scientistId,
    };

    fs.appendFileSync(this.auditLogPath, JSON.stringify(auditEntry) + '\n');
  }
}

export default ScientistGuardianSpawner;
