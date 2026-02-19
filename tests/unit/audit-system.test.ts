/**
 * AUDIT SYSTEM UNIT TESTS
 *
 * Tests: JSONL writing, hash chaining, integrity verification,
 * query filters, statistics, cryptographic checksums.
 *
 * SOURCE: NIST SP 800-53 AU-3, AU-9, AU-12
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { AuditSystem } from '../../src/agents/audit-system';
import { SecurityError } from '../../src/errors/CodexError';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-audit-test-'));
}

describe('AuditSystem', () => {
  let tempDir: string;
  let auditSystem: AuditSystem;
  const scientistId = 'scientist-test-001';

  beforeEach(() => {
    tempDir = makeTempDir();
    auditSystem = new AuditSystem(tempDir, scientistId);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('logEntry', () => {
    it('writes a JSONL entry to the audit log', async () => {
      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'test-operator',
        justification: 'Test agent creation',
        securityImplications: 'None',
      });

      const logPath = path.join(tempDir, 'audit-log.jsonl');
      expect(fs.existsSync(logPath)).toBe(true);

      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });

    it('returns AuditEntry with all required fields', async () => {
      const entry = await auditSystem.logEntry({
        action: 'BENCHMARK_RUN',
        operator: 'scientist-001',
        agentId: 'agent-1-abc',
        agentNumber: 1,
        justification: 'Benchmark completed',
        performanceImpact: 0.05,
        securityImplications: 'No security impact',
        metadata: { generation: 2 },
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.action).toBe('BENCHMARK_RUN');
      expect(entry.operator).toBe('scientist-001');
      expect(entry.agentId).toBe('agent-1-abc');
      expect(entry.agentNumber).toBe(1);
      expect(entry.checksum).toBeDefined();
      expect(entry.scientistId).toBe(scientistId);
    });

    it('generates unique IDs for each entry', async () => {
      const entry1 = await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'j1',
        securityImplications: 'none',
      });

      const entry2 = await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'j2',
        securityImplications: 'none',
      });

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('chains entries via previousChecksum', async () => {
      const entry1 = await auditSystem.logEntry({
        action: 'SYSTEM_INITIALIZED',
        operator: 'system',
        justification: 'Init',
        securityImplications: 'none',
      });

      const entry2 = await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'system',
        justification: 'Agent created',
        securityImplications: 'none',
      });

      expect(entry2.previousChecksum).toBe(entry1.checksum);
    });

    it('uses RFC 3339 timestamp format', async () => {
      const entry = await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'test',
        securityImplications: 'none',
      });

      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('logEntrySync', () => {
    it('writes entry synchronously and returns AuditEntry', () => {
      const entry = auditSystem.logEntrySync({
        action: 'SYSTEM_INITIALIZED',
        operator: 'system',
        justification: 'Sync init',
        securityImplications: 'none',
      });

      expect(entry).not.toBeNull();
      expect(entry?.action).toBe('SYSTEM_INITIALIZED');
    });

    it('returns null on write failure without throwing', () => {
      const badSystem = new AuditSystem('/nonexistent/path/that/fails', 'test');
      const result = badSystem.logEntrySync({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'test',
        securityImplications: 'none',
      });

      expect(result).toBeNull();
    });
  });

  describe('readAllEntries', () => {
    it('returns empty array when no log file exists', async () => {
      const newDir = makeTempDir();
      const newSystem = new AuditSystem(newDir, 'test');
      const logPath = path.join(newDir, 'audit-log.jsonl');

      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
      }

      const entries = await newSystem.readAllEntries();
      expect(entries).toEqual([]);

      fs.rmSync(newDir, { recursive: true, force: true });
    });

    it('returns all logged entries in order', async () => {
      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'j1',
        securityImplications: 'none',
      });

      await auditSystem.logEntry({
        action: 'BENCHMARK_RUN',
        operator: 'op',
        justification: 'j2',
        securityImplications: 'none',
      });

      const entries = await auditSystem.readAllEntries();
      const actions = entries.map((e) => e.action);
      expect(actions).toContain('AGENT_CREATED');
      expect(actions).toContain('BENCHMARK_RUN');
    });
  });

  describe('verifyChainIntegrity', () => {
    it('verifies clean chain as valid', async () => {
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

      const result = await auditSystem.verifyChainIntegrity();
      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBeGreaterThanOrEqual(2);
      expect(result.invalidEntries).toHaveLength(0);
    });

    it('returns valid=true and empty results for empty log', async () => {
      const newDir = makeTempDir();
      const newSystem = new AuditSystem(newDir, 'test');
      const logPath = path.join(newDir, 'audit-log.jsonl');

      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
      }

      const result = await newSystem.verifyChainIntegrity();
      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBe(0);

      fs.rmSync(newDir, { recursive: true, force: true });
    });

    it('throws SecurityError for tampered entry', async () => {
      await auditSystem.logEntry({
        action: 'SYSTEM_INITIALIZED',
        operator: 'system',
        justification: 'Init',
        securityImplications: 'none',
      });

      const logPath = path.join(tempDir, 'audit-log.jsonl');
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n');
      const lastLine = JSON.parse(lines[lines.length - 1]);
      lastLine.justification = 'TAMPERED ENTRY';
      lines[lines.length - 1] = JSON.stringify(lastLine);
      fs.writeFileSync(logPath, lines.join('\n') + '\n');

      await expect(auditSystem.verifyChainIntegrity()).rejects.toThrow(SecurityError);
    });
  });

  describe('queryEntries', () => {
    beforeEach(async () => {
      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op1',
        agentId: 'agent-1',
        justification: 'j1',
        securityImplications: 'none',
      });

      await auditSystem.logEntry({
        action: 'BENCHMARK_RUN',
        operator: 'op2',
        agentId: 'agent-2',
        justification: 'j2',
        securityImplications: 'none',
      });

      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op3',
        agentId: 'agent-3',
        justification: 'j3',
        securityImplications: 'none',
      });
    });

    it('filters by action type', async () => {
      const entries = await auditSystem.queryEntries({ action: 'AGENT_CREATED' });
      expect(entries.every((e) => e.action === 'AGENT_CREATED')).toBe(true);
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it('filters by agentId', async () => {
      const entries = await auditSystem.queryEntries({ agentId: 'agent-2' });
      expect(entries.every((e) => e.agentId === 'agent-2')).toBe(true);
    });

    it('returns all entries when no filter specified', async () => {
      const entries = await auditSystem.queryEntries({});
      expect(entries.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getStatistics', () => {
    it('returns correct entry count', async () => {
      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'j',
        securityImplications: 'none',
      });

      const stats = await auditSystem.getStatistics();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(1);
    });

    it('counts actions correctly', async () => {
      await auditSystem.logEntry({
        action: 'BENCHMARK_RUN',
        operator: 'op',
        justification: 'j',
        securityImplications: 'none',
      });

      const stats = await auditSystem.getStatistics();
      expect(stats.actionCounts['BENCHMARK_RUN']).toBeGreaterThanOrEqual(1);
    });

    it('includes firstEntry and lastEntry timestamps', async () => {
      await auditSystem.logEntry({
        action: 'AGENT_CREATED',
        operator: 'op',
        justification: 'j',
        securityImplications: 'none',
      });

      const stats = await auditSystem.getStatistics();
      expect(stats.firstEntry).toBeDefined();
      expect(stats.lastEntry).toBeDefined();
    });
  });
});
