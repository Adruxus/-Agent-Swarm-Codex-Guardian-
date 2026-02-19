/**
 * METRICS ENGINE UNIT TESTS
 *
 * Tests: productivity scoring, KPI validation, benchmark generation,
 * cohort reporting, statistical calculations.
 *
 * SOURCE: IEEE Software Metrics Standard (42010:2011)
 */

import { MetricsEngine } from '../../src/agents/metrics-engine';
import { AgentFactory } from '../../src/agents/agent-factory';
import { BASELINE_RULES } from '../../src/config/constants';
import { AgentMetrics, AgentConfiguration } from '../../src/lib/types';
import { ValidationError } from '../../src/errors/CodexError';

function makeExperimentalRules(agentNumber: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `exp-${agentNumber}-${i}`,
    rule: `Test rule ${i}`,
    generation: 1,
    agentNumber,
    measurementMetrics: ['general-quality'],
    status: 'active' as const,
    createdAt: new Date(),
    justification: 'Test',
    performanceThreshold: 0.1,
  }));
}

function makeAgent(agentNumber: 1 | 2 | 3 | 4): AgentConfiguration {
  const alignments: Record<number, 'LAWFUL_GOOD' | 'NEUTRAL_GOOD' | 'CHAOTIC_GOOD' | 'CHAOTIC_NEUTRAL'> = {
    1: 'LAWFUL_GOOD',
    2: 'NEUTRAL_GOOD',
    3: 'CHAOTIC_GOOD',
    4: 'CHAOTIC_NEUTRAL',
  };
  return AgentFactory.createAgent(
    agentNumber,
    `Focus Area ${agentNumber}`,
    alignments[agentNumber],
    BASELINE_RULES,
    makeExperimentalRules(agentNumber, agentNumber * 3),
  );
}

function makeMetrics(agentId: string, agentNumber: number, overrides: Partial<AgentMetrics> = {}): AgentMetrics {
  return {
    agentId,
    agentNumber,
    timestamp: new Date(),
    hallucinationRate: 0.02,
    bugDensity: 0.05,
    tokenEfficiency: 0.88,
    securityScore: 0.90,
    logicalConsistency: 0.97,
    testCoverage: 0.85,
    timeToCompletionMs: 1500,
    productivityScore: 0,
    cycomaticComplexity: 5,
    architectureScore: 0.88,
    ...overrides,
  };
}

describe('MetricsEngine', () => {
  let engine: MetricsEngine;

  beforeEach(() => {
    engine = new MetricsEngine();
  });

  describe('calculateProductivityScore', () => {
    it('returns score between 0 and 1', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1);
      const score = engine.calculateProductivityScore(metrics, 'LAWFUL_GOOD');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('returns higher score for better metrics', () => {
      const agent = makeAgent(1);
      const goodMetrics = makeMetrics(agent.agentId, 1, {
        hallucinationRate: 0.01,
        bugDensity: 0.01,
        tokenEfficiency: 0.95,
        securityScore: 0.98,
        logicalConsistency: 0.99,
        testCoverage: 0.95,
      });

      const badMetrics = makeMetrics(agent.agentId, 1, {
        hallucinationRate: 0.15,
        bugDensity: 0.3,
        tokenEfficiency: 0.5,
        securityScore: 0.6,
        logicalConsistency: 0.7,
        testCoverage: 0.5,
      });

      const goodScore = engine.calculateProductivityScore(goodMetrics, 'LAWFUL_GOOD');
      const badScore = engine.calculateProductivityScore(badMetrics, 'LAWFUL_GOOD');

      expect(goodScore).toBeGreaterThan(badScore);
    });

    it('returns 0 for worst-case metrics', () => {
      const agent = makeAgent(1);
      const worstMetrics = makeMetrics(agent.agentId, 1, {
        hallucinationRate: 1,
        bugDensity: 1,
        tokenEfficiency: 0,
        securityScore: 0,
        logicalConsistency: 0,
        testCoverage: 0,
      });

      const score = engine.calculateProductivityScore(worstMetrics, 'LAWFUL_GOOD');
      expect(score).toBe(0);
    });

    it('applies different weights for CHAOTIC_NEUTRAL (token-efficiency heavily weighted)', () => {
      const agent = makeAgent(4);
      const highTokenMetrics = makeMetrics(agent.agentId, 4, {
        tokenEfficiency: 0.99,
        hallucinationRate: 0.1,
        securityScore: 0.7,
      });

      const lowTokenMetrics = makeMetrics(agent.agentId, 4, {
        tokenEfficiency: 0.5,
        hallucinationRate: 0.01,
        securityScore: 0.99,
      });

      const chaoticScore = engine.calculateProductivityScore(highTokenMetrics, 'CHAOTIC_NEUTRAL');
      const lawfulScore = engine.calculateProductivityScore(lowTokenMetrics, 'LAWFUL_GOOD');

      expect(chaoticScore).not.toBe(lawfulScore);
    });

    it('clamps hallucination rate > 1 to 1', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { hallucinationRate: 2.0 });
      const score = engine.calculateProductivityScore(metrics, 'LAWFUL_GOOD');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('uses NEUTRAL_GOOD weights as fallback for unknown alignment', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1);
      const unknownScore = engine.calculateProductivityScore(metrics, 'UNKNOWN');
      const neutralScore = engine.calculateProductivityScore(metrics, 'NEUTRAL_GOOD');

      expect(unknownScore).toBe(neutralScore);
    });
  });

  describe('validateMetrics', () => {
    it('returns no errors for valid metrics', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1);
      metrics.productivityScore = engine.calculateProductivityScore(metrics, 'LAWFUL_GOOD');

      const errors = engine.validateMetrics(metrics);
      expect(errors).toHaveLength(0);
    });

    it('returns error for hallucinationRate > 1', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { hallucinationRate: 1.5 });
      metrics.productivityScore = 0.5;

      const errors = engine.validateMetrics(metrics);
      expect(errors.some((e) => e.includes('hallucinationRate'))).toBe(true);
    });

    it('returns error for negative bugDensity', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { bugDensity: -0.1 });
      metrics.productivityScore = 0.5;

      const errors = engine.validateMetrics(metrics);
      expect(errors.some((e) => e.includes('bugDensity'))).toBe(true);
    });

    it('returns error for tokenEfficiency < 0', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { tokenEfficiency: -0.1 });
      metrics.productivityScore = 0.5;

      const errors = engine.validateMetrics(metrics);
      expect(errors.some((e) => e.includes('tokenEfficiency'))).toBe(true);
    });

    it('returns error for securityScore > 1', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { securityScore: 1.1 });
      metrics.productivityScore = 0.5;

      const errors = engine.validateMetrics(metrics);
      expect(errors.some((e) => e.includes('securityScore'))).toBe(true);
    });

    it('returns error for cycomaticComplexity < 1', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { cycomaticComplexity: 0 });
      metrics.productivityScore = 0.5;

      const errors = engine.validateMetrics(metrics);
      expect(errors.some((e) => e.includes('cycomaticComplexity'))).toBe(true);
    });

    it('returns error for negative timeToCompletionMs', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { timeToCompletionMs: -100 });
      metrics.productivityScore = 0.5;

      const errors = engine.validateMetrics(metrics);
      expect(errors.some((e) => e.includes('timeToCompletionMs'))).toBe(true);
    });
  });

  describe('benchmarkAgent', () => {
    it('marks agent as passed when all metrics above thresholds', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1);

      const result = engine.benchmarkAgent(agent, metrics);
      expect(result.passed).toBe(true);
      expect(result.failureReasons).toHaveLength(0);
    });

    it('marks agent as failed when hallucination rate too high', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { hallucinationRate: 0.10 });

      const result = engine.benchmarkAgent(agent, metrics);
      expect(result.passed).toBe(false);
      expect(result.failureReasons.some((r) => r.includes('Hallucination'))).toBe(true);
    });

    it('marks agent as failed when security score too low', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { securityScore: 0.70 });

      const result = engine.benchmarkAgent(agent, metrics);
      expect(result.passed).toBe(false);
      expect(result.failureReasons.some((r) => r.includes('Security'))).toBe(true);
    });

    it('marks agent as failed when test coverage too low', () => {
      const agent = makeAgent(1);
      const metrics = makeMetrics(agent.agentId, 1, { testCoverage: 0.60 });

      const result = engine.benchmarkAgent(agent, metrics);
      expect(result.passed).toBe(false);
      expect(result.failureReasons.some((r) => r.includes('coverage'))).toBe(true);
    });

    it('populates all BenchmarkResult fields', () => {
      const agent = makeAgent(2);
      const metrics = makeMetrics(agent.agentId, 2);

      const result = engine.benchmarkAgent(agent, metrics);
      expect(result.agentId).toBe(agent.agentId);
      expect(result.agentNumber).toBe(2);
      expect(result.alignment).toBe('NEUTRAL_GOOD');
      expect(result.focusArea).toBe('Focus Area 2');
      expect(result.metrics.productivityScore).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('throws ValidationError for invalid metrics', () => {
      const agent = makeAgent(1);
      const invalidMetrics = makeMetrics(agent.agentId, 1, { hallucinationRate: 2.0 });

      expect(() => engine.benchmarkAgent(agent, invalidMetrics)).toThrow(ValidationError);
    });
  });

  describe('generateCohortReport', () => {
    let agents: AgentConfiguration[];
    let allMetrics: AgentMetrics[];

    beforeEach(() => {
      agents = [makeAgent(1), makeAgent(2), makeAgent(3), makeAgent(4)];
      allMetrics = agents.map((a) => {
        const m = makeMetrics(a.agentId, a.agentNumber);
        m.productivityScore = engine.calculateProductivityScore(m, a.alignment.name);
        return m;
      });
    });

    it('generates report with 4 agents', () => {
      const report = engine.generateCohortReport('cohort-1', agents, allMetrics);
      expect(report.agents).toHaveLength(4);
    });

    it('assigns ranks 1-4 to agents', () => {
      const report = engine.generateCohortReport('cohort-1', agents, allMetrics);
      const ranks = report.agents.map((a) => a.rank).sort();
      expect(ranks).toEqual([1, 2, 3, 4]);
    });

    it('identifies a winner when agents pass', () => {
      const report = engine.generateCohortReport('cohort-1', agents, allMetrics);
      expect(report.winner).not.toBeNull();
    });

    it('sets overallHealth to HEALTHY when all agents pass', () => {
      const report = engine.generateCohortReport('cohort-1', agents, allMetrics);
      expect(report.overallHealth).toBe('HEALTHY');
    });

    it('sets overallHealth to CRITICAL when <2 agents pass', () => {
      const badMetrics = agents.map((a) =>
        makeMetrics(a.agentId, a.agentNumber, {
          hallucinationRate: 0.20,
          securityScore: 0.50,
          testCoverage: 0.40,
        }),
      );
      badMetrics.forEach((m) => {
        m.productivityScore = engine.calculateProductivityScore(m, 'LAWFUL_GOOD');
      });

      const report = engine.generateCohortReport('cohort-fail', agents, badMetrics);
      expect(report.overallHealth).toBe('CRITICAL');
      expect(report.winner).toBeNull();
    });

    it('includes recommendations', () => {
      const report = engine.generateCohortReport('cohort-1', agents, allMetrics);
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('throws ValidationError for wrong agent count', () => {
      expect(() =>
        engine.generateCohortReport('cohort-1', [makeAgent(1)], [allMetrics[0]]),
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for wrong metrics count', () => {
      expect(() =>
        engine.generateCohortReport('cohort-1', agents, [allMetrics[0]]),
      ).toThrow(ValidationError);
    });
  });

  describe('calculateMetricsDelta', () => {
    it('returns positive delta for improved hallucination rate', () => {
      const agent = makeAgent(1);
      const before = makeMetrics(agent.agentId, 1, { hallucinationRate: 0.10 });
      const after = makeMetrics(agent.agentId, 1, { hallucinationRate: 0.02 });
      before.productivityScore = 0.7;
      after.productivityScore = 0.85;

      const delta = engine.calculateMetricsDelta(before, after);
      expect(delta['hallucinationRate']).toBeCloseTo(0.08);
    });

    it('returns positive delta for improved security score', () => {
      const agent = makeAgent(1);
      const before = makeMetrics(agent.agentId, 1, { securityScore: 0.70 });
      const after = makeMetrics(agent.agentId, 1, { securityScore: 0.90 });
      before.productivityScore = 0.7;
      after.productivityScore = 0.85;

      const delta = engine.calculateMetricsDelta(before, after);
      expect(delta['securityScore']).toBeCloseTo(0.20);
    });
  });

  describe('calculateCohortStatistics', () => {
    it('calculates mean correctly', () => {
      const agents = [makeAgent(1), makeAgent(2)];
      const metrics = [
        makeMetrics(agents[0].agentId, 1, { hallucinationRate: 0.04 }),
        makeMetrics(agents[1].agentId, 2, { hallucinationRate: 0.06 }),
      ];
      metrics.forEach((m) => { m.productivityScore = 0.8; });

      const stats = engine.calculateCohortStatistics(metrics);
      expect(stats.mean['hallucinationRate']).toBeCloseTo(0.05);
    });

    it('calculates min correctly', () => {
      const agents = [makeAgent(1), makeAgent(2)];
      const metrics = [
        makeMetrics(agents[0].agentId, 1, { securityScore: 0.80 }),
        makeMetrics(agents[1].agentId, 2, { securityScore: 0.90 }),
      ];
      metrics.forEach((m) => { m.productivityScore = 0.8; });

      const stats = engine.calculateCohortStatistics(metrics);
      expect(stats.min['securityScore']).toBeCloseTo(0.80);
    });

    it('calculates max correctly', () => {
      const agents = [makeAgent(1), makeAgent(2)];
      const metrics = [
        makeMetrics(agents[0].agentId, 1, { testCoverage: 0.75 }),
        makeMetrics(agents[1].agentId, 2, { testCoverage: 0.95 }),
      ];
      metrics.forEach((m) => { m.productivityScore = 0.8; });

      const stats = engine.calculateCohortStatistics(metrics);
      expect(stats.max['testCoverage']).toBeCloseTo(0.95);
    });

    it('throws ValidationError for empty metrics array', () => {
      expect(() => engine.calculateCohortStatistics([])).toThrow(ValidationError);
    });
  });

  describe('createBaselineMetrics', () => {
    it('returns metrics with agentId and agentNumber matching agent', () => {
      const agent = makeAgent(1);
      const metrics = engine.createBaselineMetrics(agent);

      expect(metrics.agentId).toBe(agent.agentId);
      expect(metrics.agentNumber).toBe(1);
    });

    it('returns metrics with sensible default values', () => {
      const agent = makeAgent(1);
      const metrics = engine.createBaselineMetrics(agent);

      expect(metrics.hallucinationRate).toBe(0);
      expect(metrics.tokenEfficiency).toBeGreaterThan(0);
      expect(metrics.securityScore).toBeGreaterThan(0);
    });
  });
});
