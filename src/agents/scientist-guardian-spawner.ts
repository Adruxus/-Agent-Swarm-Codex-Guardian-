/**
 * SCIENTIST GUARDIAN SPAWNER - AGENT #7 COHORT ORCHESTRATOR
 *
 * PURPOSE: Creates and persists 4-agent cohorts with full audit trail.
 *
 * PATTERN: Orchestrator pattern
 * NIST: SP 800-53 CA-7 (Continuous Monitoring) + AU-12 (Audit Generation)
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import {
  AgentConfiguration,
  ExperimentalRule,
  AgentAlignment,
  CohortSpecification,
} from '../lib/types';
import { BASELINE_RULES, RULE_LIBRARY, DEFAULTS, AGENT_ALIGNMENT_MAP } from '../config/constants';
import AgentFactory from './agent-factory';
import { AuditSystem } from './audit-system';
import { ValidationError, IOError } from '../errors/CodexError';
import { createLogger } from '../logging/Logger';
import { withRetry } from '../lib/retry';

const logger = createLogger('ScientistGuardianSpawner');

export class ScientistGuardianSpawner {
  private readonly systemDirectory: string;
  readonly scientistId: string;
  private readonly auditSystem: AuditSystem;

  constructor(systemDirectory: string = DEFAULTS.SYSTEM_DIRECTORY) {
    this.systemDirectory = systemDirectory;
    this.scientistId = `scientist-${uuidv4()}`;

    try {
      if (!fs.existsSync(systemDirectory)) {
        fs.mkdirSync(systemDirectory, { recursive: true });
      }
    } catch (error) {
      throw new IOError('Failed to create system directory', {
        path: systemDirectory,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.auditSystem = new AuditSystem(systemDirectory, this.scientistId);

    this.auditSystem.logEntrySync({
      action: 'SYSTEM_INITIALIZED',
      operator: 'scientist-guardian',
      justification: `Scientist Guardian ${this.scientistId} initialized`,
      securityImplications: 'System ready for agent spawning. Audit trail active.',
    });

    logger.info('Scientist Guardian initialized', { scientistId: this.scientistId });
  }

  /**
   * Spawn a 4-agent cohort from user specification.
   *
   * REQUIRES: Exactly 4 focus areas.
   * PRODUCES: 4 fully-configured AgentConfiguration objects, persisted to disk.
   *
   * SOURCE: Microsoft AutoGen (github.com/microsoft/autogen)
   */
  async spawnCohort(specification: CohortSpecification): Promise<AgentConfiguration[]> {
    logger.info('Spawning 4-agent cohort', {
      focusAreas: specification.agentFocusAreas,
      optimizationGoals: specification.optimizationGoals,
    });

    if (
      !specification.agentFocusAreas ||
      specification.agentFocusAreas.length !== 4
    ) {
      throw new ValidationError(
        'Scientist Guardian requires exactly 4 agent focus areas',
        { provided: specification.agentFocusAreas?.length ?? 0 },
      );
    }

    const newAgents: AgentConfiguration[] = [];

    for (let i = 0; i < 4; i++) {
      const agentNum = i + 1;
      const alignmentName = AGENT_ALIGNMENT_MAP[i];
      const focusArea = specification.agentFocusAreas[i];

      const ruleCount = agentNum * 3;
      const experimentalRules = this.generateExperimentalRules(
        agentNum,
        ruleCount,
        alignmentName,
        specification.customRules?.[agentNum],
        specification.optimizationGoals,
      );

      const agentConfig = AgentFactory.createAgent(
        agentNum,
        focusArea,
        alignmentName,
        BASELINE_RULES,
        experimentalRules,
      );

      const validationErrors = AgentFactory.validateAgentConfiguration(agentConfig);
      if (validationErrors.length > 0) {
        throw new ValidationError(`Agent #${agentNum} configuration invalid`, {
          errors: validationErrors,
          agentNumber: agentNum,
        });
      }

      newAgents.push(agentConfig);

      await this.auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: this.scientistId,
        agentId: agentConfig.agentId,
        agentNumber: agentNum,
        justification: `Agent #${agentNum} (${alignmentName}) created for: ${focusArea}`,
        securityImplications: `Agent created with ${experimentalRules.length} experimental + 6 baseline rules`,
        metadata: {
          alignment: alignmentName,
          focusArea,
          experimentalRuleCount: experimentalRules.length,
        },
      });
    }

    await this.persistCohort(newAgents);

    await this.auditSystem.logEntry({
      action: 'AGENT_COHORT_SPAWNED',
      operator: this.scientistId,
      justification: `4-agent cohort spawned with goals: ${specification.optimizationGoals?.join(', ') ?? 'default'}`,
      securityImplications: 'All agents initialized with baseline rule compliance. Audit trail active.',
      metadata: {
        agentIds: newAgents.map((a) => a.agentId),
        optimizationGoals: specification.optimizationGoals,
      },
    });

    logger.info('4-agent cohort spawned successfully', {
      agentCount: newAgents.length,
      agentIds: newAgents.map((a) => a.agentId),
    });

    return newAgents;
  }

  private generateExperimentalRules(
    agentNumber: number,
    ruleCount: number,
    alignmentName: AgentAlignment['name'],
    userDefinedRules?: string[],
    optimizationGoals?: string[],
  ): ExperimentalRule[] {
    const rules: ExperimentalRule[] = [];

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
          performanceThreshold: 0.5,
        });
      });
    }

    const derivedRules = this.generateRuleSetByAlignment(
      agentNumber,
      alignmentName,
      ruleCount - rules.length,
      optimizationGoals,
    );

    rules.push(...derivedRules);

    return rules.slice(0, ruleCount);
  }

  private generateRuleSetByAlignment(
    agentNumber: number,
    alignmentName: AgentAlignment['name'],
    count: number,
    optimizationGoals?: string[],
  ): ExperimentalRule[] {
    const rules: ExperimentalRule[] = [];

    const alignmentGoalMap: Record<AgentAlignment['name'], string[]> = {
      LAWFUL_GOOD: ['reduce-hallucination', 'bug-detection', 'architecture', 'security'],
      NEUTRAL_GOOD: ['reduce-hallucination', 'token-efficiency', 'bug-detection', 'architecture'],
      CHAOTIC_GOOD: ['token-efficiency', 'architecture', 'bug-detection'],
      CHAOTIC_NEUTRAL: ['token-efficiency', 'bug-detection'],
    };

    const selectedGoals = optimizationGoals ?? alignmentGoalMap[alignmentName];

    let ruleIndex = 0;
    for (const goal of selectedGoals) {
      const goalRules = RULE_LIBRARY[goal as keyof typeof RULE_LIBRARY] ?? [];

      for (const ruleObj of goalRules) {
        if (ruleIndex >= count) break;
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

      if (ruleIndex >= count) break;
    }

    return rules;
  }

  private extractMetricsFromRule(rule: string): string[] {
    const metrics: string[] = [];
    const lowerRule = rule.toLowerCase();

    if (lowerRule.includes('verify') || lowerRule.includes('validate') || lowerRule.includes('check')) {
      metrics.push('hallucinations', 'logical-consistency');
    }

    if (lowerRule.includes('token') || lowerRule.includes('compress') || lowerRule.includes('efficient')) {
      metrics.push('token-efficiency');
    }

    if (lowerRule.includes('security') || lowerRule.includes('vulnerability') || lowerRule.includes('bug') || lowerRule.includes('owasp')) {
      metrics.push('bug-density', 'security-score');
    }

    if (lowerRule.includes('modular') || lowerRule.includes('architecture') || lowerRule.includes('design')) {
      metrics.push('cyclomatic-complexity', 'architecture-score');
    }

    if (lowerRule.includes('test') || lowerRule.includes('coverage')) {
      metrics.push('test-coverage');
    }

    return metrics.length > 0 ? metrics : ['general-quality'];
  }

  private async persistCohort(agents: AgentConfiguration[]): Promise<void> {
    const generationFile = `agent-pool-generation-${Date.now()}.json`;
    const generationPath = path.join(this.systemDirectory, generationFile);
    const configPath = path.join(this.systemDirectory, DEFAULTS.AGENTS_CONFIG_FILE);

    await withRetry(
      async () => {
        try {
          fs.writeFileSync(generationPath, JSON.stringify(agents, null, 2), 'utf8');
          fs.writeFileSync(configPath, JSON.stringify(agents, null, 2), 'utf8');
        } catch (error) {
          throw new IOError('Failed to persist cohort to disk', {
            generationPath,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
      { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 },
    );

    logger.info('Cohort persisted', { generationFile, configPath });
  }

  getAuditSystem(): AuditSystem {
    return this.auditSystem;
  }
}

export default ScientistGuardianSpawner;
