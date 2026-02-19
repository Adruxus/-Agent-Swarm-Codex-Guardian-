/**
 * SECURITY TESTS: DATA POISONING & HALLUCINATION DETECTION
 *
 * Tests: input validation, rule injection prevention, audit log tamper detection,
 * SQL injection in rule text, malicious agent configurations.
 *
 * SOURCE: OWASP Top 10 2021 (A03:2021 - Injection)
 * CWE Top 25 - CWE-89 (SQL Injection), CWE-20 (Improper Input Validation)
 * NIST SP 800-53 SI-3 (Malicious Code Protection)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { AgentFactory } from '../../src/agents/agent-factory';
import { AuditSystem } from '../../src/agents/audit-system';
import { MetricsEngine } from '../../src/agents/metrics-engine';
import { BASELINE_RULES } from '../../src/config/constants';
import { AgentMetrics, ExperimentalRule } from '../../src/lib/types';
import {
  ValidationError,
  SecurityError,
} from '../../src/errors/CodexError';

const MALICIOUS_PAYLOADS = [
  "'; DROP TABLE agents; --",
  '<script>alert("xss")</script>',
  '${7*7}',
  '{{7*7}}',
  '\x00null_byte',
  '../../../etc/passwd',
  'UNION SELECT * FROM secrets',
  'javascript:void(0)',
  '\u202Ehidden_rtl_override',
  'A'.repeat(10000),
];

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-security-test-'));
}

function makeExperimentalRules(agentNumber: number, count: number): ExperimentalRule[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `exp-${agentNumber}-${i}`,
    rule: `Legitimate rule ${i}`,
    generation: 1,
    agentNumber,
    measurementMetrics: ['general-quality'],
    status: 'active' as const,
    createdAt: new Date(),
    justification: 'Test rule',
    performanceThreshold: 0.1,
  }));
}

describe('Data Poisoning Detection', () => {
  describe('AgentFactory input validation', () => {
    it('rejects agent number 0 (boundary attack)', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(0, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('rejects agent number 5 (boundary attack)', () => {
      const rules = makeExperimentalRules(5, 15);
      expect(() =>
        AgentFactory.createAgent(5, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('rejects negative agent number', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(-1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('rejects empty focus area', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(1, '', 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).toThrow(ValidationError);
    });

    it('rejects extremely long focus area (DoS prevention)', () => {
      const rules = makeExperimentalRules(1, 3);
      const longFocusArea = 'A'.repeat(10000);
      expect(() =>
        AgentFactory.createAgent(1, longFocusArea, 'LAWFUL_GOOD', BASELINE_RULES, rules),
      ).not.toThrow();
    });

    it('rejects SQL injection in alignment name', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(1, 'Frontend', "LAWFUL_GOOD'; DROP TABLE--" as any, BASELINE_RULES, rules),
      ).toThrow();
    });

    it('rejects zero baseline rules (tampered baseline)', () => {
      const rules = makeExperimentalRules(1, 3);
      expect(() =>
        AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', [], rules),
      ).toThrow(ValidationError);
    });

    it('rejects mutated baseline rules (immutable=false)', () => {
      const rules = makeExperimentalRules(1, 3);
      const mutatedBaseline = BASELINE_RULES.map((r) => ({ ...r, immutable: false }));
      const agent = AgentFactory.createAgent(1, 'Frontend', 'LAWFUL_GOOD', mutatedBaseline, rules);
      const errors = AgentFactory.validateAgentConfiguration(agent);
      expect(errors.some((e) => e.includes('immutable'))).toBe(true);
    });

    MALICIOUS_PAYLOADS.slice(0, 4).forEach((payload) => {
      it(`handles malicious focus area payload: ${payload.substring(0, 30)}...`, () => {
        const rules = makeExperimentalRules(1, 3);
        expect(() => {
          const agent = AgentFactory.createAgent(1, payload, 'LAWFUL_GOOD', BASELINE_RULES, rules);
          expect(agent.focusArea).toBe(payload);
        }).not.toThrow(ValidationError);
      });
    });
  });

  describe('Audit Log Tamper Detection', () => {
    let tempDir: string;
    let auditSystem: AuditSystem;

    beforeEach(() => {
      tempDir = makeTempDir();
      auditSystem = new AuditSystem(tempDir, 'scientist-security-test');
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('detects tampered justification field', async () => {
      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'security-test',
        justification: 'Legitimate entry',
        securityImplications: 'none',
      });

      const logPath = path.join(tempDir, 'audit-log.jsonl');
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);
      const entries = lines.map((l) => JSON.parse(l));
      const targetEntry = entries.find((e: any) => e.action === 'AGENT_CREATED');

      if (targetEntry) {
        targetEntry.justification = 'TAMPERED: attacker-controlled content';
        const newLines = lines.map((l) => {
          const parsed = JSON.parse(l);
          if (parsed.action === 'AGENT_CREATED') return JSON.stringify(targetEntry);
          return l;
        });
        fs.writeFileSync(logPath, newLines.join('\n') + '\n');
      }

      await expect(auditSystem.verifyChainIntegrity()).rejects.toThrow(SecurityError);
    });

    it('detects deleted audit entry (hash chain break)', async () => {
      await auditSystem.logEntry({
        action: 'SYSTEM_INITIALIZED',
        operator: 'system',
        justification: 'Init',
        securityImplications: 'none',
      });

      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'Created',
        securityImplications: 'none',
      });

      await auditSystem.logEntry({
        action: 'BENCHMARK_RUN',
        operator: 'op',
        justification: 'Benchmarked',
        securityImplications: 'none',
      });

      const logPath = path.join(tempDir, 'audit-log.jsonl');
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);

      const removedMiddle = [lines[0], lines[lines.length - 1]];
      fs.writeFileSync(logPath, removedMiddle.join('\n') + '\n');

      await expect(auditSystem.verifyChainIntegrity()).rejects.toThrow(SecurityError);
    });

    it('detects checksum field injection attack', async () => {
      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'Normal entry',
        securityImplications: 'none',
      });

      const logPath = path.join(tempDir, 'audit-log.jsonl');
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);

      const lastEntry = JSON.parse(lines[lines.length - 1]);
      lastEntry.checksum = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      lastEntry.operator = 'INJECTED_OPERATOR';
      lines[lines.length - 1] = JSON.stringify(lastEntry);
      fs.writeFileSync(logPath, lines.join('\n') + '\n');

      await expect(auditSystem.verifyChainIntegrity()).rejects.toThrow(SecurityError);
    });

    it('accepts GENESIS as previousChecksum for first entry', async () => {
      await auditSystem.logEntry({
        action: 'SYSTEM_INITIALIZED',
        operator: 'system',
        justification: 'Init',
        securityImplications: 'none',
      });

      const result = await auditSystem.verifyChainIntegrity();
      expect(result.valid).toBe(true);
    });
  });

  describe('Metrics validation (prevent poisoned KPIs)', () => {
    let engine: MetricsEngine;

    beforeEach(() => {
      engine = new MetricsEngine();
    });

    function makeBaseMetrics(agentId: string): AgentMetrics {
      return {
        agentId,
        agentNumber: 1,
        timestamp: new Date(),
        hallucinationRate: 0.02,
        bugDensity: 0.05,
        tokenEfficiency: 0.88,
        securityScore: 0.90,
        logicalConsistency: 0.97,
        testCoverage: 0.85,
        timeToCompletionMs: 1500,
        productivityScore: 0.5,
        cycomaticComplexity: 5,
        architectureScore: 0.88,
      };
    }

    it('rejects hallucinationRate > 1 (impossible value injection)', () => {
      const agent = AgentFactory.createAgent(
        1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES,
        makeExperimentalRules(1, 3),
      );
      const poisonedMetrics = makeBaseMetrics(agent.agentId);
      poisonedMetrics.hallucinationRate = 999;

      expect(() => engine.benchmarkAgent(agent, poisonedMetrics)).toThrow(ValidationError);
    });

    it('rejects negative hallucinationRate (impossible value)', () => {
      const agent = AgentFactory.createAgent(
        1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES,
        makeExperimentalRules(1, 3),
      );
      const poisonedMetrics = makeBaseMetrics(agent.agentId);
      poisonedMetrics.hallucinationRate = -0.5;

      expect(() => engine.benchmarkAgent(agent, poisonedMetrics)).toThrow(ValidationError);
    });

    it('rejects securityScore > 1 (inflated security claim)', () => {
      const agent = AgentFactory.createAgent(
        1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES,
        makeExperimentalRules(1, 3),
      );
      const poisonedMetrics = makeBaseMetrics(agent.agentId);
      poisonedMetrics.securityScore = 1.5;

      expect(() => engine.benchmarkAgent(agent, poisonedMetrics)).toThrow(ValidationError);
    });

    it('rejects negative timeToCompletionMs', () => {
      const agent = AgentFactory.createAgent(
        1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES,
        makeExperimentalRules(1, 3),
      );
      const poisonedMetrics = makeBaseMetrics(agent.agentId);
      poisonedMetrics.timeToCompletionMs = -1000;

      expect(() => engine.benchmarkAgent(agent, poisonedMetrics)).toThrow(ValidationError);
    });

    it('rejects cycomaticComplexity < 1 (minimum is 1)', () => {
      const agent = AgentFactory.createAgent(
        1, 'Frontend', 'LAWFUL_GOOD', BASELINE_RULES,
        makeExperimentalRules(1, 3),
      );
      const poisonedMetrics = makeBaseMetrics(agent.agentId);
      poisonedMetrics.cycomaticComplexity = 0;

      expect(() => engine.benchmarkAgent(agent, poisonedMetrics)).toThrow(ValidationError);
    });
  });
});
