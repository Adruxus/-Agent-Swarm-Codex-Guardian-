/**
 * Unit tests for AgentFactory
 *
 * Covers:
 * - createAgent: valid inputs, invalid agent numbers, empty focus area, wrong rule count
 * - validateAgentConfiguration: passes on valid agent, fails with correct errors
 *
 * SOURCE: IEEE Software Testing Standard (ISO/IEC/IEEE 42010:2011)
 */

import { AgentFactory } from '../src/agents/agent-factory';
import { BASELINE_RULES, RULE_LIBRARY } from '../src/constants';
import { ExperimentalRule } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the minimal experimental-rule set for a given agent number. */
function makeExperimentalRules(agentNumber: number): ExperimentalRule[] {
  const count = 6 + agentNumber * 3;
  const allRules = [
    ...RULE_LIBRARY['reduce-hallucination'],
    ...RULE_LIBRARY['token-efficiency'],
    ...RULE_LIBRARY['bug-detection'],
    ...RULE_LIBRARY['security'],
    ...RULE_LIBRARY['architecture'],
  ];

  return allRules.slice(0, count).map((r, idx) => ({
    id: `test-exp-${agentNumber}-${idx}`,
    rule: r.rule,
    generation: 1,
    agentNumber,
    measurementMetrics: ['test-metric'],
    status: 'active' as const,
    createdAt: new Date(),
    justification: 'Test rule',
    performanceThreshold: r.threshold,
  }));
}

// ---------------------------------------------------------------------------
// createAgent
// ---------------------------------------------------------------------------

describe('AgentFactory.createAgent', () => {
  it('creates a valid agent for each agent number (1-4)', () => {
    for (let n = 1; n <= 4; n++) {
      const agent = AgentFactory.createAgent(
        n,
        `Focus Area ${n}`,
        ['LAWFUL_GOOD', 'NEUTRAL_GOOD', 'CHAOTIC_GOOD', 'CHAOTIC_NEUTRAL'][n - 1] as never,
        BASELINE_RULES,
        makeExperimentalRules(n),
      );

      expect(agent.agentNumber).toBe(n);
      expect(agent.baselineRules).toHaveLength(6);
      expect(agent.experimentalRules).toHaveLength(6 + n * 3);
      expect(agent.systemPrompt).toContain('IMMUTABLE BASELINE RULES');
      expect(agent.systemPrompt).toContain('EXPERIMENTAL RULES');
    }
  });

  it('throws on invalid agent number 0', () => {
    expect(() =>
      AgentFactory.createAgent(0, 'Focus', 'LAWFUL_GOOD', BASELINE_RULES, makeExperimentalRules(1)),
    ).toThrow('Invalid agent number');
  });

  it('throws on invalid agent number 5', () => {
    expect(() =>
      AgentFactory.createAgent(5, 'Focus', 'LAWFUL_GOOD', BASELINE_RULES, makeExperimentalRules(1)),
    ).toThrow('Invalid agent number');
  });

  it('throws when focus area is empty', () => {
    expect(() =>
      AgentFactory.createAgent(1, '   ', 'LAWFUL_GOOD', BASELINE_RULES, makeExperimentalRules(1)),
    ).toThrow('Focus area cannot be empty');
  });

  it('throws when baseline rule count is not exactly 6', () => {
    expect(() =>
      AgentFactory.createAgent(1, 'Focus', 'LAWFUL_GOOD', BASELINE_RULES.slice(0, 5), makeExperimentalRules(1)),
    ).toThrow('exactly 6 baseline rules');
  });

  it('assigns correct model temperatures per alignment', () => {
    const alignments: Array<[number, 'LAWFUL_GOOD' | 'NEUTRAL_GOOD' | 'CHAOTIC_GOOD' | 'CHAOTIC_NEUTRAL', number]> = [
      [1, 'LAWFUL_GOOD', 0.3],
      [2, 'NEUTRAL_GOOD', 0.5],
      [3, 'CHAOTIC_GOOD', 0.7],
      [4, 'CHAOTIC_NEUTRAL', 0.9],
    ];

    for (const [n, alignment, expectedTemp] of alignments) {
      const agent = AgentFactory.createAgent(n, 'Focus', alignment, BASELINE_RULES, makeExperimentalRules(n));
      expect(agent.modelConfig.temperature).toBe(expectedTemp);
    }
  });
});

// ---------------------------------------------------------------------------
// validateAgentConfiguration
// ---------------------------------------------------------------------------

describe('AgentFactory.validateAgentConfiguration', () => {
  it('returns no errors for a valid agent', () => {
    const agent = AgentFactory.createAgent(
      1,
      'React Frontend',
      'LAWFUL_GOOD',
      BASELINE_RULES,
      makeExperimentalRules(1),
    );
    const errors = AgentFactory.validateAgentConfiguration(agent);
    expect(errors).toHaveLength(0);
  });

  it('returns an error when agentId is malformed', () => {
    const agent = AgentFactory.createAgent(
      1,
      'React Frontend',
      'LAWFUL_GOOD',
      BASELINE_RULES,
      makeExperimentalRules(1),
    );
    const tampered = { ...agent, agentId: 'not-a-uuid' };
    const errors = AgentFactory.validateAgentConfiguration(tampered);
    expect(errors.some((e) => e.toLowerCase().includes('uuid'))).toBe(true);
  });

  it('returns an error when a baseline rule is not immutable', () => {
    const agent = AgentFactory.createAgent(
      1,
      'React Frontend',
      'LAWFUL_GOOD',
      BASELINE_RULES,
      makeExperimentalRules(1),
    );
    const mutableBaseline = agent.baselineRules.map((r) => ({ ...r, immutable: false }));
    const tampered = { ...agent, baselineRules: mutableBaseline };
    const errors = AgentFactory.validateAgentConfiguration(tampered);
    expect(errors.some((e) => e.toLowerCase().includes('immutable'))).toBe(true);
  });

  it('returns an error when model temperature is out of range', () => {
    const agent = AgentFactory.createAgent(
      1,
      'React Frontend',
      'LAWFUL_GOOD',
      BASELINE_RULES,
      makeExperimentalRules(1),
    );
    const tampered = { ...agent, modelConfig: { ...agent.modelConfig, temperature: 1.5 } };
    const errors = AgentFactory.validateAgentConfiguration(tampered);
    expect(errors.some((e) => e.toLowerCase().includes('temperature'))).toBe(true);
  });
});
