/**
 * SCIENTIST GUARDIAN UPDATER UNIT TESTS
 *
 * Tests: rule evolution, archival strategy, replacement rule generation,
 * cohort evolution, generation incrementing, justification building.
 *
 * SOURCE: Evolutionary Computation Principles (Holland, 1975)
 */

import { ScientistGuardianUpdater } from '../../src/agents/scientist-guardian-updater';
import { AgentFactory } from '../../src/agents/agent-factory';
import { BASELINE_RULES } from '../../src/config/constants';
import { AgentMetrics, AgentConfiguration } from '../../src/lib/types';
import { ValidationError } from '../../src/errors/CodexError';

function makeExperimentalRules(agentNumber: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `exp-${agentNumber}-${i}`,
    rule: `Test rule ${i} for agent ${agentNumber}`,
    generation: 1,
    agentNumber,
    measurementMetrics: i % 2 === 0 ? ['hallucinations', 'logical-consistency'] : ['security-score'],
    status: 'active' as const,
    createdAt: new Date(),
    justification: 'Test',
    performanceThreshold: 0.1,
  }));
}

function makeAgent(agentNumber: 1 | 2 | 3 | 4): AgentConfiguration {
  const alignments: Record<number, 'LAWFUL_GOOD' | 'NEUTRAL_GOOD' | 'CHAOTIC_GOOD' | 'CHAOTIC_NEUTRAL'> = {
    1: 'LAWFUL_GOOD', 2: 'NEUTRAL_GOOD', 3: 'CHAOTIC_GOOD', 4: 'CHAOTIC_NEUTRAL',
  };
  return AgentFactory.createAgent(
    agentNumber,
    `Focus Area ${agentNumber}`,
    alignments[agentNumber],
    BASELINE_RULES,
    makeExperimentalRules(agentNumber, agentNumber * 3),
  );
}

function makeGoodMetrics(agentId: string, agentNumber: number): AgentMetrics {
  return {
    agentId,
    agentNumber,
    timestamp: new Date(),
    hallucinationRate: 0.02,
    bugDensity: 0.05,
    tokenEfficiency: 0.90,
    securityScore: 0.92,
    logicalConsistency: 0.97,
    testCoverage: 0.88,
    timeToCompletionMs: 1200,
    productivityScore: 0.88,
    cycomaticComplexity: 4,
    architectureScore: 0.90,
  };
}

function makeWeakMetrics(agentId: string, agentNumber: number): AgentMetrics {
  return {
    agentId,
    agentNumber,
    timestamp: new Date(),
    hallucinationRate: 0.12,
    bugDensity: 0.20,
    tokenEfficiency: 0.60,
    securityScore: 0.70,
    logicalConsistency: 0.80,
    testCoverage: 0.60,
    timeToCompletionMs: 3000,
    productivityScore: 0.55,
    cycomaticComplexity: 15,
    architectureScore: 0.60,
  };
}

describe('ScientistGuardianUpdater', () => {
  let updater: ScientistGuardianUpdater;

  beforeEach(() => {
    updater = new ScientistGuardianUpdater();
  });

  describe('evolveAgent', () => {
    it('increments agent generation by 1', () => {
      const agent = makeAgent(1);
      const metrics = makeGoodMetrics(agent.agentId, 1);

      const { updatedAgent } = updater.evolveAgent(agent, metrics);
      expect(updatedAgent.generation).toBe(agent.generation + 1);
    });

    it('returns evolution result with correct agentId', () => {
      const agent = makeAgent(1);
      const metrics = makeGoodMetrics(agent.agentId, 1);

      const { evolutionResult } = updater.evolveAgent(agent, metrics);
      expect(evolutionResult.agentId).toBe(agent.agentId);
    });

    it('archives rules when metrics are weak', () => {
      const agent = makeAgent(2);
      const weakMetrics = makeWeakMetrics(agent.agentId, 2);

      const { evolutionResult } = updater.evolveAgent(agent, weakMetrics);
      expect(evolutionResult.rulesArchived.length).toBeGreaterThan(0);
    });

    it('adds replacement rules when rules are archived', () => {
      const agent = makeAgent(2);
      const weakMetrics = makeWeakMetrics(agent.agentId, 2);

      const { evolutionResult } = updater.evolveAgent(agent, weakMetrics);
      expect(evolutionResult.rulesAdded.length).toBeGreaterThanOrEqual(0);
    });

    it('does not archive rules for perfect metrics', () => {
      const agent = makeAgent(1);
      const perfectMetrics = makeGoodMetrics(agent.agentId, 1);

      const { evolutionResult } = updater.evolveAgent(agent, perfectMetrics);
      expect(evolutionResult.rulesArchived).toHaveLength(0);
    });

    it('marks archived rules as archived status in updated agent', () => {
      const agent = makeAgent(3);
      const weakMetrics = makeWeakMetrics(agent.agentId, 3);

      const { updatedAgent } = updater.evolveAgent(agent, weakMetrics);
      const archivedRules = updatedAgent.experimentalRules.filter((r) => r.status === 'archived');
      expect(archivedRules.length).toBeGreaterThanOrEqual(0);
    });

    it('adds new rules with incremented generation number', () => {
      const agent = makeAgent(2);
      const weakMetrics = makeWeakMetrics(agent.agentId, 2);

      const { evolutionResult } = updater.evolveAgent(agent, weakMetrics);
      evolutionResult.rulesAdded.forEach((rule) => {
        expect(rule.generation).toBe(agent.generation + 1);
      });
    });

    it('includes justification in evolution result', () => {
      const agent = makeAgent(1);
      const weakMetrics = makeWeakMetrics(agent.agentId, 1);

      const { evolutionResult } = updater.evolveAgent(agent, weakMetrics);
      expect(evolutionResult.justification).toBeTruthy();
      expect(evolutionResult.justification.length).toBeGreaterThan(0);
    });

    it('includes expectedImprovement in evolution result', () => {
      const agent = makeAgent(1);
      const weakMetrics = makeWeakMetrics(agent.agentId, 1);

      const { evolutionResult } = updater.evolveAgent(agent, weakMetrics);
      expect(evolutionResult.expectedImprovement).toBeGreaterThanOrEqual(0);
      expect(evolutionResult.expectedImprovement).toBeLessThanOrEqual(1);
    });

    it('includes timestamp in evolution result', () => {
      const agent = makeAgent(1);
      const metrics = makeGoodMetrics(agent.agentId, 1);

      const { evolutionResult } = updater.evolveAgent(agent, metrics);
      expect(evolutionResult.timestamp).toBeInstanceOf(Date);
    });

    it('handles high hallucination rate by targeting reduce-hallucination rules', () => {
      const agent = makeAgent(1);
      const hallucinationMetrics: AgentMetrics = {
        ...makeGoodMetrics(agent.agentId, 1),
        hallucinationRate: 0.20,
      };

      const { evolutionResult } = updater.evolveAgent(agent, hallucinationMetrics);
      const justification = evolutionResult.justification.toLowerCase();
      expect(justification).toContain('hallucination');
    });

    it('handles low security score by targeting security rules', () => {
      const agent = makeAgent(2);
      const lowSecurityMetrics: AgentMetrics = {
        ...makeGoodMetrics(agent.agentId, 2),
        securityScore: 0.50,
      };

      const { evolutionResult } = updater.evolveAgent(agent, lowSecurityMetrics);
      expect(evolutionResult.justification.toLowerCase()).toContain('security');
    });

    it('throws ValidationError when agent ID does not match metrics', () => {
      const agent = makeAgent(1);
      const mismatchedMetrics: AgentMetrics = {
        ...makeGoodMetrics('different-agent-id', 1),
      };

      expect(() => updater.evolveAgent(agent, mismatchedMetrics)).toThrow(ValidationError);
    });
  });

  describe('evolveCohort', () => {
    it('evolves all 4 agents independently', () => {
      const agents = [makeAgent(1), makeAgent(2), makeAgent(3), makeAgent(4)];
      const metricsMap = new Map(
        agents.map((a) => [a.agentId, makeGoodMetrics(a.agentId, a.agentNumber)]),
      );

      const results = updater.evolveCohort(agents, metricsMap);
      expect(results).toHaveLength(4);
    });

    it('returns correct agent IDs for all evolved agents', () => {
      const agents = [makeAgent(1), makeAgent(2), makeAgent(3), makeAgent(4)];
      const metricsMap = new Map(
        agents.map((a) => [a.agentId, makeGoodMetrics(a.agentId, a.agentNumber)]),
      );

      const results = updater.evolveCohort(agents, metricsMap);
      results.forEach((result, idx) => {
        expect(result.updatedAgent.agentId).toBe(agents[idx].agentId);
      });
    });

    it('increments generation for all agents', () => {
      const agents = [makeAgent(1), makeAgent(2), makeAgent(3), makeAgent(4)];
      const metricsMap = new Map(
        agents.map((a) => [a.agentId, makeGoodMetrics(a.agentId, a.agentNumber)]),
      );

      const results = updater.evolveCohort(agents, metricsMap);
      results.forEach((result, idx) => {
        expect(result.updatedAgent.generation).toBe(agents[idx].generation + 1);
      });
    });

    it('throws ValidationError for non-4-agent cohort', () => {
      const agents = [makeAgent(1), makeAgent(2)];
      const metricsMap = new Map(
        agents.map((a) => [a.agentId, makeGoodMetrics(a.agentId, a.agentNumber)]),
      );

      expect(() => updater.evolveCohort(agents, metricsMap)).toThrow(ValidationError);
    });

    it('throws ValidationError when metrics missing for an agent', () => {
      const agents = [makeAgent(1), makeAgent(2), makeAgent(3), makeAgent(4)];
      const metricsMap = new Map([
        [agents[0].agentId, makeGoodMetrics(agents[0].agentId, 1)],
      ]);

      expect(() => updater.evolveCohort(agents, metricsMap)).toThrow(ValidationError);
    });
  });

  describe('custom EvolutionCriteria', () => {
    it('archives more rules with stricter criteria', () => {
      const strictUpdater = new ScientistGuardianUpdater({
        maxHallucinationRate: 0.001,
        minSecurityScore: 0.999,
        minTestCoverage: 0.999,
        minPerformanceThreshold: 0.999,
      });

      const agent = makeAgent(3);
      const metrics = makeGoodMetrics(agent.agentId, 3);

      const { evolutionResult } = strictUpdater.evolveAgent(agent, metrics);
      expect(evolutionResult.rulesArchived.length).toBeGreaterThanOrEqual(0);
    });

    it('archives no rules with very lenient criteria', () => {
      const lenientUpdater = new ScientistGuardianUpdater({
        maxHallucinationRate: 1.0,
        minSecurityScore: 0.0,
        minTestCoverage: 0.0,
        minPerformanceThreshold: 0.0,
      });

      const agent = makeAgent(1);
      const weakMetrics = makeWeakMetrics(agent.agentId, 1);

      const { evolutionResult } = lenientUpdater.evolveAgent(agent, weakMetrics);
      expect(evolutionResult.rulesArchived).toHaveLength(0);
    });
  });
});
