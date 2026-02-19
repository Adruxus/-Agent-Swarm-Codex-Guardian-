/**
 * SCIENTIST GUARDIAN SPAWNER INTEGRATION TESTS
 *
 * Tests: full cohort spawning, file persistence, audit trail generation,
 * validation errors, edge cases.
 *
 * SOURCE: Microsoft AutoGen (github.com/microsoft/autogen)
 * NIST SP 800-53 CA-7 (Continuous Monitoring)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { ScientistGuardianSpawner } from '../../src/agents/scientist-guardian-spawner';
import { AgentFactory } from '../../src/agents/agent-factory';
import { ValidationError } from '../../src/errors/CodexError';
import { CohortSpecification } from '../../src/lib/types';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-spawner-test-'));
}

const DEFAULT_SPECIFICATION: CohortSpecification = {
  agentFocusAreas: [
    'React/NextJS Frontend Architecture',
    'Python FastAPI Backend Services',
    'DevOps, Infrastructure, Docker/Kubernetes',
    'PostgreSQL Data Architecture & Security',
  ],
  optimizationGoals: ['reduce-hallucination', 'token-efficiency', 'bug-detection', 'security'],
};

describe('ScientistGuardianSpawner', () => {
  let tempDir: string;
  let spawner: ScientistGuardianSpawner;

  beforeEach(() => {
    tempDir = makeTempDir();
    spawner = new ScientistGuardianSpawner(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('creates system directory if it does not exist', () => {
      const newDir = path.join(tempDir, 'new-system-dir');
      expect(fs.existsSync(newDir)).toBe(false);

      new ScientistGuardianSpawner(newDir);
      expect(fs.existsSync(newDir)).toBe(true);

      fs.rmSync(newDir, { recursive: true, force: true });
    });

    it('initializes audit log file on construction', () => {
      const logPath = path.join(tempDir, 'audit-log.jsonl');
      expect(fs.existsSync(logPath)).toBe(true);
    });

    it('generates unique scientist ID', () => {
      const spawner2 = new ScientistGuardianSpawner(makeTempDir());
      expect(spawner.scientistId).not.toBe(spawner2.scientistId);
      expect(spawner.scientistId).toMatch(/^scientist-[0-9a-f-]+$/);
    });
  });

  describe('spawnCohort', () => {
    it('returns exactly 4 agents', async () => {
      const agents = await spawner.spawnCohort(DEFAULT_SPECIFICATION);
      expect(agents).toHaveLength(4);
    });

    it('assigns correct alignments in order', async () => {
      const agents = await spawner.spawnCohort(DEFAULT_SPECIFICATION);
      expect(agents[0].alignment.name).toBe('LAWFUL_GOOD');
      expect(agents[1].alignment.name).toBe('NEUTRAL_GOOD');
      expect(agents[2].alignment.name).toBe('CHAOTIC_GOOD');
      expect(agents[3].alignment.name).toBe('CHAOTIC_NEUTRAL');
    });

    it('assigns correct experimental rule counts (3, 6, 9, 12)', async () => {
      const agents = await spawner.spawnCohort(DEFAULT_SPECIFICATION);
      expect(agents[0].experimentalRules).toHaveLength(3);
      expect(agents[1].experimentalRules).toHaveLength(6);
      expect(agents[2].experimentalRules).toHaveLength(9);
      expect(agents[3].experimentalRules).toHaveLength(12);
    });

    it('assigns 6 baseline rules to each agent', async () => {
      const agents = await spawner.spawnCohort(DEFAULT_SPECIFICATION);
      agents.forEach((agent) => {
        expect(agent.baselineRules).toHaveLength(6);
      });
    });

    it('assigns correct focus areas', async () => {
      const agents = await spawner.spawnCohort(DEFAULT_SPECIFICATION);
      expect(agents[0].focusArea).toBe('React/NextJS Frontend Architecture');
      expect(agents[1].focusArea).toBe('Python FastAPI Backend Services');
      expect(agents[2].focusArea).toBe('DevOps, Infrastructure, Docker/Kubernetes');
      expect(agents[3].focusArea).toBe('PostgreSQL Data Architecture & Security');
    });

    it('all agents pass validation', async () => {
      const agents = await spawner.spawnCohort(DEFAULT_SPECIFICATION);
      agents.forEach((agent) => {
        const errors = AgentFactory.validateAgentConfiguration(agent);
        expect(errors).toHaveLength(0);
      });
    });

    it('persists agents to JSON file on disk', async () => {
      await spawner.spawnCohort(DEFAULT_SPECIFICATION);

      const configPath = path.join(tempDir, 'agents-config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveLength(4);
    });

    it('creates generation file with timestamp', async () => {
      await spawner.spawnCohort(DEFAULT_SPECIFICATION);

      const files = fs.readdirSync(tempDir);
      const generationFile = files.find((f) => f.startsWith('agent-pool-generation-'));
      expect(generationFile).toBeDefined();
    });

    it('logs AGENT_COHORT_SPAWNED to audit trail', async () => {
      await spawner.spawnCohort(DEFAULT_SPECIFICATION);

      const auditSystem = spawner.getAuditSystem();
      const entries = await auditSystem.queryEntries({ action: 'AGENT_COHORT_SPAWNED' });
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });

    it('logs AGENT_CREATED for each of the 4 agents', async () => {
      await spawner.spawnCohort(DEFAULT_SPECIFICATION);

      const auditSystem = spawner.getAuditSystem();
      const entries = await auditSystem.queryEntries({ action: 'AGENT_CREATED' });
      expect(entries.length).toBeGreaterThanOrEqual(4);
    });

    it('throws ValidationError for fewer than 4 focus areas', async () => {
      const badSpec = {
        agentFocusAreas: ['Only one'] as any,
      };

      await expect(spawner.spawnCohort(badSpec)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for more than 4 focus areas', async () => {
      const badSpec = {
        agentFocusAreas: ['a', 'b', 'c', 'd', 'e'] as any,
      };

      await expect(spawner.spawnCohort(badSpec)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for null focus areas', async () => {
      const badSpec = {
        agentFocusAreas: null as any,
      };

      await expect(spawner.spawnCohort(badSpec)).rejects.toThrow(ValidationError);
    });

    it('generates unique agent IDs across all agents', async () => {
      const agents = await spawner.spawnCohort(DEFAULT_SPECIFICATION);
      const ids = agents.map((a) => a.agentId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(4);
    });

    it('works without optimizationGoals (uses alignment defaults)', async () => {
      const spec: CohortSpecification = {
        agentFocusAreas: [
          'Frontend',
          'Backend',
          'DevOps',
          'Database',
        ],
      };

      const agents = await spawner.spawnCohort(spec);
      expect(agents).toHaveLength(4);
    });

    it('includes user-defined custom rules when provided', async () => {
      const spec: CohortSpecification = {
        agentFocusAreas: [
          'Frontend',
          'Backend',
          'DevOps',
          'Database',
        ],
        customRules: {
          1: ['CUSTOM RULE: Always use TypeScript strict mode'],
        },
      };

      const agents = await spawner.spawnCohort(spec);
      const agent1 = agents[0];

      const hasCustomRule = agent1.experimentalRules.some(
        (r) => r.rule === 'CUSTOM RULE: Always use TypeScript strict mode',
      );
      expect(hasCustomRule).toBe(true);
    });
  });

  describe('audit trail', () => {
    it('audit log has valid chain integrity after spawning', async () => {
      await spawner.spawnCohort(DEFAULT_SPECIFICATION);

      const auditSystem = spawner.getAuditSystem();
      const result = await auditSystem.verifyChainIntegrity();
      expect(result.valid).toBe(true);
    });

    it('audit entries contain correct scientist ID', async () => {
      await spawner.spawnCohort(DEFAULT_SPECIFICATION);

      const auditSystem = spawner.getAuditSystem();
      const entries = await auditSystem.readAllEntries();
      entries.forEach((entry) => {
        expect(entry.scientistId).toBe(spawner.scientistId);
      });
    });
  });
});
