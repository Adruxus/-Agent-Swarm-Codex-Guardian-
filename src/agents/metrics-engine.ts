/**
 * METRICS ENGINE - KPI TRACKING & SCORING ALGORITHMS
 *
 * PURPOSE: Measures and scores agent performance across all KPIs.
 *
 * KPIs TRACKED:
 * - Hallucination Rate: Unverified claims (target <5%)
 * - Bug Density: Bugs per code block (target <0.1)
 * - Token Efficiency: Signal-to-noise ratio (target >0.85)
 * - Security Score: OWASP/CWE compliance (target >0.85)
 * - Logical Consistency: Internal contradictions (target >0.95)
 * - Test Coverage: Code coverage percentage (target >0.80)
 * - Cyclomatic Complexity: Code complexity (target <10)
 *
 * SCORING ALGORITHM:
 * productivity = Σ(metric_i × weight_i) per alignment
 *
 * SOURCE: IEEE Software Metrics Standard (42010:2011)
 * NIST SP 800-53 CA-7 (Continuous Monitoring)
 */

import {
  AgentConfiguration,
  AgentMetrics,
  BenchmarkResult,
  CohortBenchmarkReport,
  MetricsWeights,
} from '../lib/types';
import { DEFAULTS } from '../config/constants';
import { ValidationError } from '../errors/CodexError';
import { createLogger } from '../logging/Logger';

const logger = createLogger('MetricsEngine');

const ALIGNMENT_WEIGHTS: Record<string, MetricsWeights> = {
  LAWFUL_GOOD: {
    hallucinations: 0.25,
    bugDensity: 0.25,
    tokenEfficiency: 0.10,
    securityScore: 0.20,
    logicalConsistency: 0.10,
    testCoverage: 0.10,
  },
  NEUTRAL_GOOD: {
    hallucinations: 0.20,
    bugDensity: 0.20,
    tokenEfficiency: 0.20,
    securityScore: 0.15,
    logicalConsistency: 0.15,
    testCoverage: 0.10,
  },
  CHAOTIC_GOOD: {
    hallucinations: 0.15,
    bugDensity: 0.15,
    tokenEfficiency: 0.30,
    securityScore: 0.10,
    logicalConsistency: 0.15,
    testCoverage: 0.15,
  },
  CHAOTIC_NEUTRAL: {
    hallucinations: 0.10,
    bugDensity: 0.20,
    tokenEfficiency: 0.40,
    securityScore: 0.10,
    logicalConsistency: 0.10,
    testCoverage: 0.10,
  },
};

export class MetricsEngine {
  /**
   * Calculate productivity score from raw metrics using alignment-weighted formula.
   *
   * FORMULA:
   * productivity = (1 - hallucinationRate) × w1
   *              + (1 - bugDensity)        × w2
   *              + tokenEfficiency          × w3
   *              + securityScore            × w4
   *              + logicalConsistency       × w5
   *              + testCoverage             × w6
   *
   * SOURCE: IEEE Software Metrics Standard (42010:2011)
   */
  calculateProductivityScore(
    metrics: Omit<AgentMetrics, 'productivityScore'>,
    alignment: string,
  ): number {
    const weights = ALIGNMENT_WEIGHTS[alignment] ?? ALIGNMENT_WEIGHTS['NEUTRAL_GOOD'];

    const score =
      (1 - Math.min(metrics.hallucinationRate, 1)) * weights.hallucinations +
      (1 - Math.min(metrics.bugDensity, 1)) * weights.bugDensity +
      Math.min(metrics.tokenEfficiency, 1) * weights.tokenEfficiency +
      Math.min(metrics.securityScore, 1) * weights.securityScore +
      Math.min(metrics.logicalConsistency, 1) * weights.logicalConsistency +
      Math.min(metrics.testCoverage, 1) * weights.testCoverage;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Create a baseline metrics snapshot for an agent.
   * Used as starting point before benchmarking.
   */
  createBaselineMetrics(agent: AgentConfiguration): AgentMetrics {
    return {
      agentId: agent.agentId,
      agentNumber: agent.agentNumber,
      timestamp: new Date(),
      hallucinationRate: 0,
      bugDensity: 0,
      tokenEfficiency: 0.85,
      securityScore: 0.85,
      logicalConsistency: 0.95,
      testCoverage: 0.80,
      timeToCompletionMs: 0,
      productivityScore: 0,
      cycomaticComplexity: 5,
      architectureScore: 0.85,
    };
  }

  /**
   * Validate that metrics are within expected ranges.
   * Rates and ratios must be 0-1. Counts must be non-negative.
   */
  validateMetrics(metrics: AgentMetrics): string[] {
    const errors: string[] = [];

    const ratioFields: Array<keyof AgentMetrics> = [
      'hallucinationRate',
      'tokenEfficiency',
      'securityScore',
      'logicalConsistency',
      'testCoverage',
      'productivityScore',
      'architectureScore',
    ];

    for (const field of ratioFields) {
      const value = metrics[field] as number;
      if (value < 0 || value > 1) {
        errors.push(`${field} must be between 0 and 1, got ${value}`);
      }
    }

    if (metrics.bugDensity < 0) {
      errors.push(`bugDensity must be non-negative, got ${metrics.bugDensity}`);
    }

    if (metrics.timeToCompletionMs < 0) {
      errors.push(`timeToCompletionMs must be non-negative, got ${metrics.timeToCompletionMs}`);
    }

    if (metrics.cycomaticComplexity < 1) {
      errors.push(`cycomaticComplexity must be >= 1, got ${metrics.cycomaticComplexity}`);
    }

    return errors;
  }

  /**
   * Benchmark a single agent against pass/fail thresholds.
   * Returns BenchmarkResult with rank placeholder (set during cohort ranking).
   *
   * PASS CRITERIA:
   * - Hallucination rate < MAXIMUM_HALLUCINATION_RATE (5%)
   * - Security score > MINIMUM_SECURITY_SCORE (85%)
   * - Test coverage > MINIMUM_TEST_COVERAGE (80%)
   *
   * SOURCE: NIST SP 800-53 CA-7 (Continuous Monitoring)
   */
  benchmarkAgent(agent: AgentConfiguration, metrics: AgentMetrics): BenchmarkResult {
    const validationErrors = this.validateMetrics(metrics);
    if (validationErrors.length > 0) {
      throw new ValidationError(`Invalid metrics for agent #${agent.agentNumber}`, {
        errors: validationErrors,
        agentId: agent.agentId,
      });
    }

    const productivityScore = this.calculateProductivityScore(metrics, agent.alignment.name);
    const fullMetrics: AgentMetrics = { ...metrics, productivityScore };

    const failureReasons: string[] = [];

    if (metrics.hallucinationRate > DEFAULTS.MAXIMUM_HALLUCINATION_RATE) {
      failureReasons.push(
        `Hallucination rate ${(metrics.hallucinationRate * 100).toFixed(1)}% exceeds threshold ${(DEFAULTS.MAXIMUM_HALLUCINATION_RATE * 100).toFixed(1)}%`,
      );
    }

    if (metrics.securityScore < DEFAULTS.MINIMUM_SECURITY_SCORE) {
      failureReasons.push(
        `Security score ${(metrics.securityScore * 100).toFixed(1)}% below threshold ${(DEFAULTS.MINIMUM_SECURITY_SCORE * 100).toFixed(1)}%`,
      );
    }

    if (metrics.testCoverage < DEFAULTS.MINIMUM_TEST_COVERAGE) {
      failureReasons.push(
        `Test coverage ${(metrics.testCoverage * 100).toFixed(1)}% below threshold ${(DEFAULTS.MINIMUM_TEST_COVERAGE * 100).toFixed(1)}%`,
      );
    }

    const passed = failureReasons.length === 0;

    logger.info(`Agent #${agent.agentNumber} benchmarked`, {
      agentId: agent.agentId,
      productivityScore: productivityScore.toFixed(4),
      passed,
      failureReasons,
    });

    return {
      agentId: agent.agentId,
      agentNumber: agent.agentNumber,
      alignment: agent.alignment.name,
      focusArea: agent.focusArea,
      metrics: fullMetrics,
      rank: 0,
      passed,
      failureReasons,
      timestamp: new Date(),
    };
  }

  /**
   * Generate cohort benchmark report by ranking all agents and identifying winner.
   * Agents ranked by productivityScore descending.
   *
   * WINNER: Highest productivity score among passing agents.
   * If no agents pass, winner is null and health is CRITICAL.
   */
  generateCohortReport(
    cohortId: string,
    agentConfigs: AgentConfiguration[],
    allMetrics: AgentMetrics[],
  ): CohortBenchmarkReport {
    if (agentConfigs.length !== 4) {
      throw new ValidationError(`Cohort must have exactly 4 agents, got ${agentConfigs.length}`);
    }

    if (allMetrics.length !== 4) {
      throw new ValidationError(`Must provide exactly 4 metric sets, got ${allMetrics.length}`);
    }

    const results = agentConfigs.map((agent, idx) => {
      const metrics = allMetrics.find((m) => m.agentId === agent.agentId) ?? allMetrics[idx];
      return this.benchmarkAgent(agent, metrics);
    });

    const sorted = [...results].sort(
      (a, b) => b.metrics.productivityScore - a.metrics.productivityScore,
    );

    sorted.forEach((result, idx) => {
      result.rank = idx + 1;
    });

    const ranked = results.map((r) => {
      const sortedEntry = sorted.find((s) => s.agentId === r.agentId);
      return sortedEntry ?? r;
    });

    const passingAgents = sorted.filter((r) => r.passed);
    const winner = passingAgents.length > 0 ? passingAgents[0] : null;

    const recommendations = this.generateRecommendations(ranked);

    const passingCount = passingAgents.length;
    let overallHealth: CohortBenchmarkReport['overallHealth'];
    if (passingCount === 4) {
      overallHealth = 'HEALTHY';
    } else if (passingCount >= 2) {
      overallHealth = 'WARNING';
    } else {
      overallHealth = 'CRITICAL';
    }

    logger.info(`Cohort report generated`, {
      cohortId,
      winner: winner?.agentId ?? 'none',
      overallHealth,
      passingCount,
    });

    return {
      cohortId,
      timestamp: new Date(),
      agents: ranked,
      winner,
      recommendations,
      overallHealth,
    };
  }

  /**
   * Generate improvement recommendations based on benchmark results.
   * SOURCE: IEEE Software Metrics Standard (42010:2011)
   */
  private generateRecommendations(results: BenchmarkResult[]): string[] {
    const recommendations: string[] = [];

    const avgHallucination =
      results.reduce((sum, r) => sum + r.metrics.hallucinationRate, 0) / results.length;
    if (avgHallucination > DEFAULTS.MAXIMUM_HALLUCINATION_RATE) {
      recommendations.push(
        `Cohort hallucination rate ${(avgHallucination * 100).toFixed(1)}% exceeds 5% threshold. Add reduce-hallucination rules to next generation.`,
      );
    }

    const avgSecurity =
      results.reduce((sum, r) => sum + r.metrics.securityScore, 0) / results.length;
    if (avgSecurity < DEFAULTS.MINIMUM_SECURITY_SCORE) {
      recommendations.push(
        `Cohort security score ${(avgSecurity * 100).toFixed(1)}% below 85% threshold. Inject security rules for next generation.`,
      );
    }

    const avgCoverage =
      results.reduce((sum, r) => sum + r.metrics.testCoverage, 0) / results.length;
    if (avgCoverage < DEFAULTS.MINIMUM_TEST_COVERAGE) {
      recommendations.push(
        `Cohort test coverage ${(avgCoverage * 100).toFixed(1)}% below 80% threshold. Add TDD rules to next generation.`,
      );
    }

    const highComplexity = results.filter((r) => r.metrics.cycomaticComplexity > 10);
    if (highComplexity.length > 0) {
      recommendations.push(
        `Agents ${highComplexity.map((r) => `#${r.agentNumber}`).join(', ')} have high cyclomatic complexity (>10). Add architecture rules.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All KPIs within acceptable thresholds. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Compare two sets of metrics and calculate improvement delta.
   * Positive delta means improvement.
   */
  calculateMetricsDelta(
    before: AgentMetrics,
    after: AgentMetrics,
  ): Record<string, number> {
    return {
      hallucinationRate: before.hallucinationRate - after.hallucinationRate,
      bugDensity: before.bugDensity - after.bugDensity,
      tokenEfficiency: after.tokenEfficiency - before.tokenEfficiency,
      securityScore: after.securityScore - before.securityScore,
      logicalConsistency: after.logicalConsistency - before.logicalConsistency,
      testCoverage: after.testCoverage - before.testCoverage,
      productivityScore: after.productivityScore - before.productivityScore,
    };
  }

  /**
   * Calculate statistical summary across a cohort's metrics.
   */
  calculateCohortStatistics(allMetrics: AgentMetrics[]): {
    mean: Partial<AgentMetrics>;
    min: Partial<AgentMetrics>;
    max: Partial<AgentMetrics>;
  } {
    if (allMetrics.length === 0) {
      throw new ValidationError('Cannot calculate statistics for empty metrics array');
    }

    const numericFields: Array<keyof AgentMetrics> = [
      'hallucinationRate',
      'bugDensity',
      'tokenEfficiency',
      'securityScore',
      'logicalConsistency',
      'testCoverage',
      'productivityScore',
      'cycomaticComplexity',
      'architectureScore',
      'timeToCompletionMs',
    ];

    const mean: Partial<AgentMetrics> = {};
    const min: Partial<AgentMetrics> = {};
    const max: Partial<AgentMetrics> = {};

    for (const field of numericFields) {
      const values = allMetrics.map((m) => m[field] as number);
      (mean as Record<string, number>)[field] =
        values.reduce((sum, v) => sum + v, 0) / values.length;
      (min as Record<string, number>)[field] = Math.min(...values);
      (max as Record<string, number>)[field] = Math.max(...values);
    }

    return { mean, min, max };
  }
}

export default MetricsEngine;
