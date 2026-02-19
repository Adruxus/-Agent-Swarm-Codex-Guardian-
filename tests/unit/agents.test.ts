/**
 * INDIVIDUAL AGENT DEFINITION TESTS
 *
 * Tests: all 4 agent definitions, rule counts, alignments,
 * system prompt content, experimental rule structures.
 *
 * SOURCE: IEEE Software Testing Standard (ISO/IEC/IEEE 42010:2011)
 */

import { AGENT_1_RULES, AGENT_1_CONFIG } from '../../src/agents/agent-1-frontend';
import { AGENT_2_RULES, AGENT_2_CONFIG } from '../../src/agents/agent-2-backend';
import { AGENT_3_RULES, AGENT_3_CONFIG } from '../../src/agents/agent-3-devops';
import { AGENT_4_RULES, AGENT_4_CONFIG } from '../../src/agents/agent-4-database';
import { AgentFactory } from '../../src/agents/agent-factory';

describe('Agent #1 - Frontend (LAWFUL_GOOD)', () => {
  it('has exactly 3 experimental rules', () => {
    expect(AGENT_1_RULES).toHaveLength(3);
  });

  it('all rules have active status', () => {
    expect(AGENT_1_RULES.every((r) => r.status === 'active')).toBe(true);
  });

  it('all rules belong to agent number 1', () => {
    expect(AGENT_1_RULES.every((r) => r.agentNumber === 1)).toBe(true);
  });

  it('all rules have unique IDs', () => {
    const ids = AGENT_1_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('all rules have non-empty justification', () => {
    expect(AGENT_1_RULES.every((r) => r.justification.length > 0)).toBe(true);
  });

  it('config has LAWFUL_GOOD alignment', () => {
    expect(AGENT_1_CONFIG.alignment.name).toBe('LAWFUL_GOOD');
  });

  it('config has temperature 0.3', () => {
    expect(AGENT_1_CONFIG.modelConfig.temperature).toBe(0.3);
  });

  it('config passes validation', () => {
    const errors = AgentFactory.validateAgentConfiguration(AGENT_1_CONFIG);
    expect(errors).toHaveLength(0);
  });

  it('rules reference TypeScript/React sources', () => {
    const hasTypeScriptRef = AGENT_1_RULES.some(
      (r) => r.rule.toLowerCase().includes('typescript') || r.rule.toLowerCase().includes('react'),
    );
    expect(hasTypeScriptRef).toBe(true);
  });

  it('rules reference WCAG accessibility standards', () => {
    const hasWCAG = AGENT_1_RULES.some(
      (r) => r.rule.toLowerCase().includes('wcag') || r.rule.toLowerCase().includes('accessibility'),
    );
    expect(hasWCAG).toBe(true);
  });

  it('performance thresholds are within 0-1 range', () => {
    expect(AGENT_1_RULES.every((r) => r.performanceThreshold >= 0 && r.performanceThreshold <= 1)).toBe(true);
  });
});

describe('Agent #2 - Backend (NEUTRAL_GOOD)', () => {
  it('has exactly 6 experimental rules', () => {
    expect(AGENT_2_RULES).toHaveLength(6);
  });

  it('all rules belong to agent number 2', () => {
    expect(AGENT_2_RULES.every((r) => r.agentNumber === 2)).toBe(true);
  });

  it('config has NEUTRAL_GOOD alignment', () => {
    expect(AGENT_2_CONFIG.alignment.name).toBe('NEUTRAL_GOOD');
  });

  it('config has temperature 0.5', () => {
    expect(AGENT_2_CONFIG.modelConfig.temperature).toBe(0.5);
  });

  it('config passes validation', () => {
    const errors = AgentFactory.validateAgentConfiguration(AGENT_2_CONFIG);
    expect(errors).toHaveLength(0);
  });

  it('all rules have unique IDs', () => {
    const ids = AGENT_2_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('rules reference FastAPI or async Python', () => {
    const hasFastAPI = AGENT_2_RULES.some(
      (r) => r.rule.toLowerCase().includes('fastapi') || r.rule.toLowerCase().includes('async'),
    );
    expect(hasFastAPI).toBe(true);
  });

  it('rules reference RFC standards', () => {
    const hasRFC = AGENT_2_RULES.some((r) => r.justification.includes('RFC'));
    expect(hasRFC).toBe(true);
  });

  it('strictness is 0.7', () => {
    expect(AGENT_2_CONFIG.alignment.strictness).toBe(0.7);
  });
});

describe('Agent #3 - DevOps (CHAOTIC_GOOD)', () => {
  it('has exactly 9 experimental rules', () => {
    expect(AGENT_3_RULES).toHaveLength(9);
  });

  it('all rules belong to agent number 3', () => {
    expect(AGENT_3_RULES.every((r) => r.agentNumber === 3)).toBe(true);
  });

  it('config has CHAOTIC_GOOD alignment', () => {
    expect(AGENT_3_CONFIG.alignment.name).toBe('CHAOTIC_GOOD');
  });

  it('config has temperature 0.7', () => {
    expect(AGENT_3_CONFIG.modelConfig.temperature).toBe(0.7);
  });

  it('config passes validation', () => {
    const errors = AgentFactory.validateAgentConfiguration(AGENT_3_CONFIG);
    expect(errors).toHaveLength(0);
  });

  it('all rules have unique IDs', () => {
    const ids = AGENT_3_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(9);
  });

  it('rules reference Kubernetes or Docker', () => {
    const hasK8s = AGENT_3_RULES.some(
      (r) =>
        r.rule.toLowerCase().includes('kubernetes') ||
        r.rule.toLowerCase().includes('docker') ||
        r.rule.toLowerCase().includes('container'),
    );
    expect(hasK8s).toBe(true);
  });

  it('rules reference observability (Prometheus, metrics)', () => {
    const hasObservability = AGENT_3_RULES.some(
      (r) =>
        r.rule.toLowerCase().includes('prometheus') ||
        r.rule.toLowerCase().includes('metrics') ||
        r.rule.toLowerCase().includes('observability'),
    );
    expect(hasObservability).toBe(true);
  });

  it('strictness is 0.4', () => {
    expect(AGENT_3_CONFIG.alignment.strictness).toBe(0.4);
  });
});

describe('Agent #4 - Database (CHAOTIC_NEUTRAL)', () => {
  it('has exactly 12 experimental rules', () => {
    expect(AGENT_4_RULES).toHaveLength(12);
  });

  it('all rules belong to agent number 4', () => {
    expect(AGENT_4_RULES.every((r) => r.agentNumber === 4)).toBe(true);
  });

  it('config has CHAOTIC_NEUTRAL alignment', () => {
    expect(AGENT_4_CONFIG.alignment.name).toBe('CHAOTIC_NEUTRAL');
  });

  it('config has temperature 0.9', () => {
    expect(AGENT_4_CONFIG.modelConfig.temperature).toBe(0.9);
  });

  it('config passes validation', () => {
    const errors = AgentFactory.validateAgentConfiguration(AGENT_4_CONFIG);
    expect(errors).toHaveLength(0);
  });

  it('all rules have unique IDs', () => {
    const ids = AGENT_4_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('rules reference PostgreSQL', () => {
    const hasPG = AGENT_4_RULES.some(
      (r) =>
        r.rule.toLowerCase().includes('postgresql') ||
        r.rule.toLowerCase().includes('postgres'),
    );
    expect(hasPG).toBe(true);
  });

  it('rules reference row-level security or encryption', () => {
    const hasSecurity = AGENT_4_RULES.some(
      (r) =>
        r.rule.toLowerCase().includes('row-level security') ||
        r.rule.toLowerCase().includes('encryption') ||
        r.rule.toLowerCase().includes('rls'),
    );
    expect(hasSecurity).toBe(true);
  });

  it('strictness is 0.0 (unfiltered)', () => {
    expect(AGENT_4_CONFIG.alignment.strictness).toBe(0.0);
  });

  it('flexibility is 1.0 (maximum)', () => {
    expect(AGENT_4_CONFIG.alignment.flexibility).toBe(1.0);
  });
});

describe('All agents together', () => {
  it('have unique agent IDs across all 4', () => {
    const ids = [
      AGENT_1_CONFIG.agentId,
      AGENT_2_CONFIG.agentId,
      AGENT_3_CONFIG.agentId,
      AGENT_4_CONFIG.agentId,
    ];
    expect(new Set(ids).size).toBe(4);
  });

  it('have correct agent numbers 1, 2, 3, 4', () => {
    expect(AGENT_1_CONFIG.agentNumber).toBe(1);
    expect(AGENT_2_CONFIG.agentNumber).toBe(2);
    expect(AGENT_3_CONFIG.agentNumber).toBe(3);
    expect(AGENT_4_CONFIG.agentNumber).toBe(4);
  });

  it('temperatures increase from agent 1 to agent 4', () => {
    expect(AGENT_1_CONFIG.modelConfig.temperature).toBeLessThan(AGENT_2_CONFIG.modelConfig.temperature);
    expect(AGENT_2_CONFIG.modelConfig.temperature).toBeLessThan(AGENT_3_CONFIG.modelConfig.temperature);
    expect(AGENT_3_CONFIG.modelConfig.temperature).toBeLessThan(AGENT_4_CONFIG.modelConfig.temperature);
  });

  it('strictness decreases from agent 1 to agent 4', () => {
    expect(AGENT_1_CONFIG.alignment.strictness).toBeGreaterThan(AGENT_2_CONFIG.alignment.strictness);
    expect(AGENT_2_CONFIG.alignment.strictness).toBeGreaterThan(AGENT_3_CONFIG.alignment.strictness);
    expect(AGENT_3_CONFIG.alignment.strictness).toBeGreaterThan(AGENT_4_CONFIG.alignment.strictness);
  });

  it('all system prompts contain IMMUTABLE BASELINE RULES', () => {
    [AGENT_1_CONFIG, AGENT_2_CONFIG, AGENT_3_CONFIG, AGENT_4_CONFIG].forEach((agent) => {
      expect(agent.systemPrompt).toContain('IMMUTABLE BASELINE RULES');
    });
  });

  it('all agents have version 1.0.0', () => {
    [AGENT_1_CONFIG, AGENT_2_CONFIG, AGENT_3_CONFIG, AGENT_4_CONFIG].forEach((agent) => {
      expect(agent.version).toBe('1.0.0');
    });
  });
});
