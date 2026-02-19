/**
 * AGENT FACTORY UNIT TESTS
 *
 * Tests: agent creation, validation, system prompt generation,
 * model config, alignment mapping, edge cases.
 *
 * SOURCE: IEEE Software Testing Standard (ISO/IEC/IEEE 42010:2011)
 * MINIMUM COVERAGE: 80%
 */

import { AgentFactory } from '../../src/agents/agent-factory';
import { BASELINE_RULES, ALIGNMENT_CONFIGS } from '../../src/config/constants';
import { ExperimentalRule, BaselineRule } from '../../src/lib/types';
import { ValidationError, AgentConfigurationError } from '../../src/errors/CodexError';

function makeExperimentalRules(agentNumber: number, count: number): ExperimentalRule[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `exp-${agentNumber}-${i}`,
    rule: `Test rule ${i} for agent ${agentNumber}`,
    generation: 1,
    agentNumber,
    measurementMetrics: ['general-quality'],
    status: 'active' as const,
    createdAt: new Date(),
    justification: 'Test justification',
    performanceThreshold: 0.1,
  }));
}

describe('AgentFactory', () => {
  describe('createAgent', () => {
    it('creates agent #1 with LAWFUL_GOOD alignment and 3 experimental rules', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);

      expect(agent.agentNumber).toBe(1);
      expect(agent.alignment.name).toBe('LAWFUL_GOOD');
      expect(agent.alignment.strictness).toBe(0.95);
      expect(agent.alignment.flexibility).toBe(0.05);
      expect(agent.experimentalRules).toHaveLength(3);
      expect(agent.baselineRules).toHaveLength(6);
      expect(agent.version).toBe('1.0.0');
      expect(agent.generation).toBe(1);
    });

    it('creates agent #2 with NEUTRAL_GOOD alignment and 6 experimental rules', () => {
      const rules = makeExperimentalRules(2, 6);
      const agent = AgentFactory.createAgent(2, 'Backend', 'NEUTRAL_GOOD', BASELINE_RULES, rules);

      expect(agent.agentNumber).toBe(2);
      expect(agent.alignment.name).toBe('NEUTRAL_GOOD');
      expect(agent.alignment.strictness).toBe(0.7);
      expect(agent.experimentalRules).toHaveLength(6);
    });

    it('creates agent #3 with CHAOTIC_GOOD alignment and 9 experimental rules', () => {
      const rules = makeExperimentalRules(3, 9);
      const agent = AgentFactory.createAgent(3, 'DevOps', 'CHAOTIC_GOOD', BASELINE_RULES, rules);

      expect(agent.agentNumber).toBe(3);
      expect(agent.alignment.name).toBe('CHAOTIC_GOOD');
      expect(agent.alignment.strictness).toBe(0.4);
      expect(agent.experimentalRules).toHaveLength(9);
    });

    it('creates agent #4 with CHAOTIC_NEUTRAL alignment and 12 experimental rules', () => {
      const rules = makeExperimentalRules(4, 12);
      const agent = AgentFactory.createAgent(4, 'Database', 'CHAOTIC_NEUTRAL', BASELINE_RULES, rules);

      expect(agent.agentNumber).toBe(4);
      expect(agent.alignment.name).toBe('CHAOTIC_NEUTRAL');
      expect(agent.alignment.strictness).toBe(0.0);
      expect(agent.experimentalRules).toHaveLength(12);
    });

    it('generates a valid agent ID with UUID format', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);

      expect(agent.agentId).toMatch(
        /^agent-1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('embeds baseline rules in system prompt', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);

      expect(agent.systemPrompt).toContain('IMMUTABLE BASELINE RULES');
      expect(agent.systemPrompt).toContain('baseline-001');
      expect(agent.systemPrompt).toContain('EXPERIMENTAL RULES');
    });

    it('includes alignment preamble in system prompt', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);

      expect(agent.systemPrompt).toContain('LAWFUL_GOOD');
      expect(agent.systemPrompt).toContain('Frontend');
    });

    it('includes CHAOTIC_NEUTRAL warning in system prompt', () => {
      const rules = makeExperimentalRules(4, 12);
      const agent = AgentFactory.createAgent(4, 'Database', 'CHAOTIC_NEUTRAL', BASELINE_RULES, rules);

      expect(agent.systemPrompt).toContain('CRITICAL CONSTRAINT');
    });

    it('sets correct temperature for LAWFUL_GOOD (0.3)', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);

      expect(agent.modelConfig.temperature).toBe(0.3);
      expect(agent.modelConfig.topP).toBe(0.7);
    });

    it('sets correct temperature for CHAOTIC_NEUTRAL (0.9)', () => {
      const rules = makeExperimentalRules(4, 12);
      const agent = AgentFactory.createAgent(4, 'Database', 'CHAOTIC_NEUTRAL', BASELINE_RULES, rules);

      expect(agent.modelConfig.temperature).toBe(0.9);
      expect(agent.modelConfig.topP).toBe(1.0);
    });

    it('sets correct temperature for NEUTRAL_GOOD (0.5)', () => {
      const rules = makeExperimentalRules(2, 6);
      const agent = AgentFactory.createAgent(2, 'Backend', 'NEUTRAL_GOOD', BASELINE_RULES, rules);

      expect(agent.modelConfig.temperature).toBe(0.5);
    });

    it('sets correct temperature for CHAOTIC_GOOD (0.7)', () => {
      const rules = makeExperimentalRules(3, 9);
      const agent = AgentFactory.createAgent(3, 'DevOps', 'CHAOTIC_GOOD', BASELINE_RULES, rules);

      expect(agent.modelConfig.temperature).toBe(0.7);
    });

    it('throws ValidationError for agent number 0', () => {
      const rules = makeExperimentalRules(0, 0);
      expect(() =>
        AgentFactory.createAgent(0, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for agent number 5', () => {
      const rules = makeExperimentalRules(5, 15);
      expect(() =>
        AgentFactory.createAgent(5, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for empty focus area', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(1, '', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for whitespace-only focus area', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(1, '   ', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for wrong baseline rule count (5 rules)', () => {
      const rules = makeExperimentalRules(1, 3);
      const fiveBaselineRules = BASELINE_RULES.slice(0, 5);
      expect(() =>
        AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', fiveBaselineRules, rules),
      ).toThrow(ValidationError);
    });

    it('throws AgentConfigurationError for unknown alignment', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(
          1,
          'Frontend',
          'UNKNOWN_ALIGNMENT' as any,
          BASELINE_RULES,
          rules,
        ),
      ).toThrow(AgentConfigurationError);
    });

    it('includes createdAt timestamp', () => {
      const before = new Date();
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const after = new Date();

      expect(agent.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(agent.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('validateAgentConfiguration', () => {
    it('returns no errors for valid agent #1', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const errors = AgentFactory.validateAgentConfiguration(agent);

      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid agent #4', () => {
      const rules = makeExperimentalRules(4, 12);
      const agent = AgentFactory.createAgent(4, 'Database', 'CHAOTIC_NEUTRAL', BASELINE_RULES, rules);
      const errors = AgentFactory.validateAgentConfiguration(agent);

      expect(errors).toHaveLength(0);
    });

    it('returns error for invalid agent ID format', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const invalidAgent = { ...agent, agentId: 'not-a-valid-id' };
      const errors = AgentFactory.validateAgentConfiguration(invalidAgent);

      expect(errors.some((e) => e.includes('Invalid agent ID'))).toBe(true);
    });

    it('returns error for wrong experimental rule count', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const wrongRuleCount = { ...agent, experimentalRules: makeExperimentalRules(1, 5) };
      const errors = AgentFactory.validateAgentConfiguration(wrongRuleCount);

      expect(errors.some((e) => e.includes('experimental rules'))).toBe(true);
    });

    it('returns error for mutable baseline rules', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const mutableBaseline = agent.baselineRules.map((r) => ({ ...r, immutable: false }));
      const invalidAgent = { ...agent, baselineRules: mutableBaseline };
      const errors = AgentFactory.validateAgentConfiguration(invalidAgent);

      expect(errors.some((e) => e.includes('immutable'))).toBe(true);
    });

    it('returns error for temperature out of range', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const invalidAgent = {
        ...agent,
        modelConfig: { ...agent.modelConfig, temperature: 1.5 },
      };
      const errors = AgentFactory.validateAgentConfiguration(invalidAgent);

      expect(errors.some((e) => e.includes('temperature'))).toBe(true);
    });

    it('returns error for topP out of range', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const invalidAgent = {
        ...agent,
        modelConfig: { ...agent.modelConfig, topP: -0.1 },
      };
      const errors = AgentFactory.validateAgentConfiguration(invalidAgent);

      expect(errors.some((e) => e.includes('topP'))).toBe(true);
    });

    it('returns error for strictness out of range', () => {
      const rules = makeExperimentalRules(1, 3);
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules);
      const invalidAgent = {
        ...agent,
        alignment: { ...agent.alignment, strictness: 1.5 },
      };
      const errors = AgentFactory.validateAgentConfiguration(invalidAgent);

      expect(errors.some((e) => e.includes('strictness'))).toBe(true);
    });
  });

  describe('createDefaultCohort', () => {
    it('creates exactly 4 agents', () => {
      const cohort = AgentFactory.createDefaultCohort();
      expect(cohort).toHaveLength(4);
    });

    it('assigns correct alignments to each agent', () => {
      const [agent1, agent2, agent3, agent4] = AgentFactory.createDefaultCohort();
      expect(agent1.alignment.name).toBe('LAWFUL_GOOD');
      expect(agent2.alignment.name).toBe('NEUTRAL_GOOD');
      expect(agent3.alignment.name).toBe('CHAOTIC_GOOD');
      expect(agent4.alignment.name).toBe('CHAOTIC_NEUTRAL');
    });

    it('assigns correct rule counts to each agent', () => {
      const [agent1, agent2, agent3, agent4] = AgentFactory.createDefaultCohort();
      expect(agent1.experimentalRules).toHaveLength(3);
      expect(agent2.experimentalRules).toHaveLength(6);
      expect(agent3.experimentalRules).toHaveLength(9);
      expect(agent4.experimentalRules).toHaveLength(12);
    });

    it('all agents pass validation', () => {
      const cohort = AgentFactory.createDefaultCohort();
      cohort.forEach((agent) => {
        const errors = AgentFactory.validateAgentConfiguration(agent);
        expect(errors).toHaveLength(0);
      });
    });

    it('generates unique agent IDs for all agents', () => {
      const cohort = AgentFactory.createDefaultCohort();
      const ids = cohort.map((a) => a.agentId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(4);
    });
  });
});
