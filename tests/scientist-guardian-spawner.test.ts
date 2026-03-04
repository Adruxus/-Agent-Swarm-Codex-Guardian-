/**
 * Unit tests for ScientistGuardianSpawner
 *
 * Covers:
 * - spawnCohort: successful spawn, wrong number of focus areas, output shape
 * - Audit log is written on spawn
 *
 * SOURCE: IEEE Software Testing Standard (ISO/IEC/IEEE 42010:2011)
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { ScientistGuardianSpawner } from '../src/agents/scientist-guardian-spawner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a temporary directory per test and clean it up afterwards. */
function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-test-'));
}

const FOUR_FOCUS_AREAS = [
  'React/NextJS Frontend',
  'Python FastAPI Backend',
  'PostgreSQL Data Architecture',
  'DevOps/CI-CD',
];

// ---------------------------------------------------------------------------
// spawnCohort
// ---------------------------------------------------------------------------

describe('ScientistGuardianSpawner.spawnCohort', () => {
  let tmpDir: string;
  let spawner: ScientistGuardianSpawner;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    spawner = new ScientistGuardianSpawner(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates exactly 4 agents', () => {
    const agents = spawner.spawnCohort({ agentFocusAreas: FOUR_FOCUS_AREAS });
    expect(agents).toHaveLength(4);
  });

  it('assigns the correct alignments in order', () => {
    const agents = spawner.spawnCohort({ agentFocusAreas: FOUR_FOCUS_AREAS });
    expect(agents[0].alignment.name).toBe('LAWFUL_GOOD');
    expect(agents[1].alignment.name).toBe('NEUTRAL_GOOD');
    expect(agents[2].alignment.name).toBe('CHAOTIC_GOOD');
    expect(agents[3].alignment.name).toBe('CHAOTIC_NEUTRAL');
  });

  it('each agent has 6 baseline rules', () => {
    const agents = spawner.spawnCohort({ agentFocusAreas: FOUR_FOCUS_AREAS });
    agents.forEach((agent) => {
      expect(agent.baselineRules).toHaveLength(6);
    });
  });

  it('respects the rule progression (9, 12, 15, 18 experimental rules)', () => {
    const agents = spawner.spawnCohort({ agentFocusAreas: FOUR_FOCUS_AREAS });
    expect(agents[0].experimentalRules).toHaveLength(9);
    expect(agents[1].experimentalRules).toHaveLength(12);
    expect(agents[2].experimentalRules).toHaveLength(15);
    expect(agents[3].experimentalRules).toHaveLength(18);
  });

  it('assigns the user-supplied focus areas to agents', () => {
    const agents = spawner.spawnCohort({ agentFocusAreas: FOUR_FOCUS_AREAS });
    FOUR_FOCUS_AREAS.forEach((area, idx) => {
      expect(agents[idx].focusArea).toBe(area);
    });
  });

  it('writes a JSON agent-pool file to the system directory', () => {
    spawner.spawnCohort({ agentFocusAreas: FOUR_FOCUS_AREAS });
    const files = fs.readdirSync(tmpDir);
    const poolFile = files.find((f) => f.startsWith('agent-pool-generation-'));
    expect(poolFile).toBeDefined();
    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, poolFile!), 'utf-8'));
    expect(Array.isArray(content)).toBe(true);
    expect(content).toHaveLength(4);
  });

  it('writes an audit log entry on spawn', () => {
    spawner.spawnCohort({ agentFocusAreas: FOUR_FOCUS_AREAS });
    const auditPath = path.join(tmpDir, 'audit-log.jsonl');
    expect(fs.existsSync(auditPath)).toBe(true);
    const lines = fs.readFileSync(auditPath, 'utf-8').trim().split('\n');
    const entries = lines.map((l) => JSON.parse(l));
    const spawnEntry = entries.find((e) => e.action === 'AGENT_COHORT_SPAWNED');
    expect(spawnEntry).toBeDefined();
  });

  it('throws when given fewer than 4 focus areas', () => {
    expect(() =>
      spawner.spawnCohort({ agentFocusAreas: ['Only one area'] }),
    ).toThrow();
  });

  it('throws when given more than 4 focus areas', () => {
    expect(() =>
      spawner.spawnCohort({
        agentFocusAreas: [...FOUR_FOCUS_AREAS, 'Extra Area'],
      }),
    ).toThrow();
  });

  it('supports custom optimization goals', () => {
    // Provide 3 goal categories (18 total rules available) to satisfy the
    // rule progression for all 4 agents (max 18 rules for Agent #4).
    const agents = spawner.spawnCohort({
      agentFocusAreas: FOUR_FOCUS_AREAS,
      optimizationGoals: ['security', 'bug-detection', 'reduce-hallucination'],
    });
    expect(agents).toHaveLength(4);
    // All experimental rules should exist and be active
    agents.forEach((agent) => {
      agent.experimentalRules.forEach((r) => {
        expect(r.status).toBe('active');
      });
    });
  });
});
