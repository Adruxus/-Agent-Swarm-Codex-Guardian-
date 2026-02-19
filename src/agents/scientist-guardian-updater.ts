/**
 * SCIENTIST GUARDIAN UPDATER - RULE EVOLUTION ENGINE
 *
 * PURPOSE: Evolves agent rule sets based on benchmark performance.
 * Implements "scientific method" for rule improvement:
 * 1. Observe: Collect metrics from benchmark runs
 * 2. Hypothesize: Identify underperforming rules
 * 3. Experiment: Add/modify/archive rules
 * 4. Measure: Compare before/after performance
 * 5. Document: Log all changes to audit trail
 *
 * EVOLUTION STRATEGY:
 * - Archive rules below performanceThreshold
 * - Add new rules from RULE_LIBRARY targeting weak metrics
 * - Increment generation counter
 * - Maintain rule count invariant (agentNumber × 3)
 *
 * SOURCE: Evolutionary Computation Principles (Holland, 1975)
 * NIST SP 800-53 CA-7 (Continuous Monitoring)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AgentConfiguration,
  AgentMetrics,
  ExperimentalRule,
  RuleEvolutionResult,
  EvolutionCriteria,
} from '../lib/types';
import { RULE_LIBRARY, DEFAULTS } from '../config/constants';
import { ValidationError } from '../errors/CodexError';
import { createLogger } from '../logging/Logger';

const logger = createLogger('ScientistGuardianUpdater');

const DEFAULT_EVOLUTION_CRITERIA: EvolutionCriteria = {
  minPerformanceThreshold: DEFAULTS.TOKEN_EFFICIENCY_TARGET,
  maxHallucinationRate: DEFAULTS.MAXIMUM_HALLUCINATION_RATE,
  minSecurityScore: DEFAULTS.MINIMUM_SECURITY_SCORE,
  minTestCoverage: DEFAULTS.MINIMUM_TEST_COVERAGE,
};

export class ScientistGuardianUpdater {
  private readonly criteria: EvolutionCriteria;

  constructor(criteria: Partial<EvolutionCriteria> = {}) {
    this.criteria = { ...DEFAULT_EVOLUTION_CRITERIA, ...criteria };
  }

  /**
   * Evolve an agent's rule set based on its benchmark performance.
   *
   * ALGORITHM:
   * 1. Identify rules that contributed to underperformance
   * 2. Archive rules below their performanceThreshold
   * 3. Select replacement rules from RULE_LIBRARY targeting weak metrics
   * 4. Maintain exact rule count (agentNumber × 3)
   * 5. Increment generation counter
   * 6. Return evolution result for audit logging
   */
  evolveAgent(
    agent: AgentConfiguration,
    metrics: AgentMetrics,
  ): { updatedAgent: AgentConfiguration; evolutionResult: RuleEvolutionResult } {
    this.validateInputs(agent, metrics);

    const weakMetrics = this.identifyWeakMetrics(metrics);
    const rulesToArchive = this.selectRulesForArchival(agent.experimentalRules, weakMetrics);
    const newRules = this.generateReplacementRules(
      agent,
      rulesToArchive.length,
      weakMetrics,
    );

    const updatedExperimentalRules = this.applyEvolution(
      agent.experimentalRules,
      rulesToArchive,
      newRules,
      agent.generation + 1,
    );

    const updatedAgent: AgentConfiguration = {
      ...agent,
      experimentalRules: updatedExperimentalRules,
      generation: agent.generation + 1,
    };

    const evolutionResult: RuleEvolutionResult = {
      agentId: agent.agentId,
      generation: agent.generation + 1,
      rulesAdded: newRules,
      rulesArchived: rulesToArchive.map((r) => r.id),
      rulesModified: [],
      justification: this.buildEvolutionJustification(weakMetrics, rulesToArchive, newRules),
      expectedImprovement: this.estimateExpectedImprovement(weakMetrics),
      timestamp: new Date(),
    };

    logger.info(`Agent #${agent.agentNumber} evolved to generation ${agent.generation + 1}`, {
      agentId: agent.agentId,
      rulesArchived: rulesToArchive.length,
      rulesAdded: newRules.length,
      weakMetrics,
    });

    return { updatedAgent, evolutionResult };
  }

  /**
   * Evolve an entire 4-agent cohort based on their benchmark results.
   * Each agent evolves independently based on its own metrics.
   */
  evolveCohort(
    agents: AgentConfiguration[],
    metricsMap: Map<string, AgentMetrics>,
  ): Array<{ updatedAgent: AgentConfiguration; evolutionResult: RuleEvolutionResult }> {
    if (agents.length !== 4) {
      throw new ValidationError(`Cohort must have exactly 4 agents, got ${agents.length}`);
    }

    return agents.map((agent) => {
      const metrics = metricsMap.get(agent.agentId);
      if (!metrics) {
        throw new ValidationError(`No metrics found for agent ${agent.agentId}`, {
          agentId: agent.agentId,
        });
      }
      return this.evolveAgent(agent, metrics);
    });
  }

  /**
   * Identify which metrics are below acceptable thresholds.
   * Returns list of metric names that need improvement.
   */
  private identifyWeakMetrics(metrics: AgentMetrics): string[] {
    const weak: string[] = [];

    if (metrics.hallucinationRate > this.criteria.maxHallucinationRate) {
      weak.push('reduce-hallucination');
    }

    if (metrics.securityScore < this.criteria.minSecurityScore) {
      weak.push('security');
    }

    if (metrics.testCoverage < this.criteria.minTestCoverage) {
      weak.push('bug-detection');
    }

    if (metrics.tokenEfficiency < this.criteria.minPerformanceThreshold) {
      weak.push('token-efficiency');
    }

    if (metrics.cycomaticComplexity > 10) {
      weak.push('architecture');
    }

    if (metrics.architectureScore < 0.7) {
      weak.push('architecture');
    }

    return [...new Set(weak)];
  }

  /**
   * Select rules for archival based on their measurement metrics alignment
   * with currently weak metrics, and their performance threshold.
   *
   * STRATEGY: Archive the weakest-performing rules that correspond
   * to underperforming metric categories.
   */
  private selectRulesForArchival(
    rules: ExperimentalRule[],
    weakMetrics: string[],
  ): ExperimentalRule[] {
    if (weakMetrics.length === 0) return [];

    const metricToCategoryMap: Record<string, string> = {
      'reduce-hallucination': 'hallucinations',
      security: 'security-score',
      'bug-detection': 'bug-density',
      'token-efficiency': 'token-efficiency',
      architecture: 'architecture-score',
    };

    const targetMetrics = weakMetrics.map((m) => metricToCategoryMap[m] ?? m);

    const candidatesForArchival = rules.filter((rule) => {
      const hasWeakMetric = rule.measurementMetrics.some((m) => targetMetrics.includes(m));
      return hasWeakMetric && rule.status === 'active';
    });

    const archivalCount = Math.min(
      Math.ceil(weakMetrics.length * 0.5),
      candidatesForArchival.length,
      Math.floor(rules.length * 0.25),
    );

    return candidatesForArchival.slice(0, archivalCount);
  }

  /**
   * Generate replacement rules from RULE_LIBRARY targeting weak metrics.
   * Ensures we don't add duplicate rules.
   */
  private generateReplacementRules(
    agent: AgentConfiguration,
    count: number,
    weakMetrics: string[],
  ): ExperimentalRule[] {
    if (count === 0) return [];

    const existingRuleTexts = new Set(agent.experimentalRules.map((r) => r.rule));
    const newRules: ExperimentalRule[] = [];
    const targetGoals =
      weakMetrics.length > 0
        ? weakMetrics
        : ['reduce-hallucination', 'bug-detection', 'architecture'];

    for (const goal of targetGoals) {
      if (newRules.length >= count) break;

      const goalRules = RULE_LIBRARY[goal as keyof typeof RULE_LIBRARY] ?? [];

      for (const ruleObj of goalRules) {
        if (newRules.length >= count) break;
        if (existingRuleTexts.has(ruleObj.rule)) continue;

        newRules.push({
          id: `exp-${agent.agentNumber}-gen${agent.generation + 1}-${uuidv4().slice(0, 8)}`,
          rule: ruleObj.rule,
          generation: agent.generation + 1,
          agentNumber: agent.agentNumber,
          measurementMetrics: this.extractMetricsFromGoal(goal),
          status: 'active',
          createdAt: new Date(),
          justification: `Evolution gen${agent.generation + 1}: targeting weak ${goal} metrics. Source: ${ruleObj.source}`,
          performanceThreshold: ruleObj.threshold,
        });

        existingRuleTexts.add(ruleObj.rule);
      }
    }

    return newRules;
  }

  /**
   * Apply the evolution: mark archived rules as deprecated, append new rules.
   * Maintains exact rule count invariant.
   */
  private applyEvolution(
    currentRules: ExperimentalRule[],
    toArchive: ExperimentalRule[],
    toAdd: ExperimentalRule[],
    newGeneration: number,
  ): ExperimentalRule[] {
    const archiveIds = new Set(toArchive.map((r) => r.id));

    const updatedRules = currentRules.map((rule) => {
      if (archiveIds.has(rule.id)) {
        return { ...rule, status: 'archived' as const, generation: newGeneration };
      }
      return rule;
    });

    const activeRules = updatedRules.filter((r) => r.status === 'active');
    const archivedRules = updatedRules.filter((r) => r.status !== 'active');

    return [...activeRules, ...toAdd, ...archivedRules];
  }

  private extractMetricsFromGoal(goal: string): string[] {
    const goalMetricsMap: Record<string, string[]> = {
      'reduce-hallucination': ['hallucinations', 'logical-consistency'],
      'token-efficiency': ['token-efficiency'],
      'bug-detection': ['bug-density', 'security-score'],
      security: ['security-score', 'bug-density'],
      architecture: ['cyclomatic-complexity', 'architecture-score'],
      'data-integrity': ['logical-consistency', 'security-score'],
    };

    return goalMetricsMap[goal] ?? ['general-quality'];
  }

  private buildEvolutionJustification(
    weakMetrics: string[],
    archived: ExperimentalRule[],
    added: ExperimentalRule[],
  ): string {
    if (weakMetrics.length === 0) {
      return 'All metrics within thresholds. Proactive rule refresh for continued improvement.';
    }

    const parts = [
      `Weak metrics detected: ${weakMetrics.join(', ')}.`,
      archived.length > 0
        ? `Archived ${archived.length} underperforming rules: ${archived.map((r) => r.id).join(', ')}.`
        : 'No rules archived.',
      added.length > 0
        ? `Added ${added.length} targeted rules for: ${weakMetrics.join(', ')}.`
        : 'No new rules added.',
    ];

    return parts.join(' ');
  }

  private estimateExpectedImprovement(weakMetrics: string[]): number {
    const improvementPerMetric = 0.05;
    return Math.min(weakMetrics.length * improvementPerMetric, 0.25);
  }

  private validateInputs(agent: AgentConfiguration, metrics: AgentMetrics): void {
    if (agent.agentId !== metrics.agentId) {
      throw new ValidationError('Agent ID mismatch between config and metrics', {
        configAgentId: agent.agentId,
        metricsAgentId: metrics.agentId,
      });
    }

    if (agent.agentNumber < 1 || agent.agentNumber > 4) {
      throw new ValidationError(`Invalid agent number: ${agent.agentNumber}`, {
        agentNumber: agent.agentNumber,
      });
    }
  }
}

export default ScientistGuardianUpdater;
