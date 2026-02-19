/**
 * COMPLETE EXAMPLE: Spawn 4-Agent Cohort with Agent #7
 * 
 * This example demonstrates:
 * 1. Initialize Scientist Guardian (Agent #7)
 * 2. Define 4 focus areas + optimization goals
 * 3. Spawn 4-agent cohort
 * 4. Verify agents are correctly configured
 * 5. Persist agents to disk
 * 
 * RUNTIME:
 * npm run example:spawn-cohort
 */

import ScientistGuardianSpawner from '../agents/scientist-guardian-spawner';
import AgentFactory from '../agents/agent-factory';
import fs from 'fs';
import path from 'path';

/**
 * MAIN EXAMPLE FUNCTION
 */
function main() {
  console.log('🛡️ CODEX GUARDIAN - SPAWN 4-AGENT COHORT EXAMPLE\n');

  // STEP 1: Initialize Scientist Guardian
  const spawner = new ScientistGuardianSpawner('./agent-data');
  console.log('✅ Scientist Guardian initialized\n');

  // STEP 2: Define specifications
  const specification = {
    agentFocusAreas: [
      'React/NextJS Frontend Architecture with Performance Optimization',
      'Python FastAPI Backend Services with Async/Await & Database Design',
      'PostgreSQL Data Architecture & Security Hardening',
      'DevOps, Infrastructure, Docker/Kubernetes, CI/CD Pipelines',
    ],
    optimizationGoals: [
      'reduce-hallucination',
      'token-efficiency',
      'bug-detection',
      'security',
    ],
  };

  console.log('📋 SPECIFICATIONS:');
  console.log('   Focus Areas:');
  specification.agentFocusAreas.forEach((area, idx) => {
    console.log(`     ${idx + 1}. ${area}`);
  });
  console.log('\n   Optimization Goals:');
  specification.optimizationGoals.forEach((goal) => {
    console.log(`     - ${goal}`);
  });
  console.log('\n');

  // STEP 3: Spawn 4-agent cohort
  const agents = spawner.spawnCohort(specification);

  console.log(`\n✅ SPAWNED ${agents.length} AGENTS\n`);

  // STEP 4: Verify agents
  console.log('📊 AGENT CONFIGURATION VERIFICATION:\n');

  agents.forEach((agent, idx) => {
    console.log(`Agent #${idx + 1}: ${agent.focusArea}`);
    console.log(`  ID: ${agent.agentId}`);
    console.log(`  Alignment: ${agent.alignment.name}`);
    console.log(`    Strictness: ${(agent.alignment.strictness * 100).toFixed(0)}%`);
    console.log(`    Flexibility: ${(agent.alignment.flexibility * 100).toFixed(0)}%`);
    console.log(`  Rules: ${agent.experimentalRules.length} experimental + 6 baseline`);
    console.log(`  Model Config:`);
    console.log(`    Temperature: ${agent.modelConfig.temperature}`);
    console.log(`    TopP: ${agent.modelConfig.topP}`);
    console.log(`    Frequency Penalty: ${agent.modelConfig.frequencyPenalty}`);
    console.log(`  Baseline Rules:`);
    agent.baselineRules.forEach((rule) => {
      console.log(`    - [${rule.id}] (Hash: ${rule.hash})`);
    });
    console.log(`  Experimental Rules:`);
    agent.experimentalRules.slice(0, 3).forEach((rule) => {
      console.log(`    - [${rule.id}] ${rule.rule.substring(0, 60)}...`);
    });
    if (agent.experimentalRules.length > 3) {
      console.log(
        `    ... and ${agent.experimentalRules.length - 3} more experimental rules`,
      );
    }
    console.log('');
  });

  // STEP 5: Validate all agents
  console.log('🔍 VALIDATING AGENT CONFIGURATIONS:\n');

  let allValid = true;
  agents.forEach((agent) => {
    const errors = AgentFactory.validateAgentConfiguration(agent);
    if (errors.length === 0) {
      console.log(`✅ Agent #${agent.agentNumber} (${agent.focusArea}): VALID`);
    } else {
      console.error(`❌ Agent #${agent.agentNumber} (${agent.focusArea}): INVALID`);
      errors.forEach((error) => console.error(`   - ${error}`));
      allValid = false;
    }
  });

  // STEP 6: Save agents to file for later use
  const agentDataDir = './agent-data';
  if (!fs.existsSync(agentDataDir)) {
    fs.mkdirSync(agentDataDir, { recursive: true });
  }
  const configPath = path.join(agentDataDir, 'agents-config.json');
  fs.writeFileSync(configPath, JSON.stringify(agents, null, 2));
  console.log(`\n📁 Agent configurations saved to: ${configPath}`);

  // STEP 7: Print system prompt example (Agent #1)
  console.log('\n📄 EXAMPLE SYSTEM PROMPT (Agent #1):\n');
  console.log('━'.repeat(80));
  console.log(agents[0].systemPrompt.substring(0, 500) + '...\n[truncated]');
  console.log('━'.repeat(80));

  console.log('\n✅ EXAMPLE COMPLETE');

  if (!allValid) {
    process.exit(1);
  }
}

// Run example
try {
  main();
} catch (error) {
  console.error('❌ EXAMPLE FAILED:', error);
  process.exit(1);
}
