/**
 * AGENT FACTORY - Complete Agent Creation & Configuration
 *
 * PURPOSE: Factory pattern for creating agents with consistent configuration,
 * rule injection, and alignment application.
 *
 * PATTERN: Factory pattern (Gang of Four)
 * SOURCE: https://en.wikipedia.org/wiki/Factory_method_pattern
 * NIST: SP 800-53 CM-7 (Least Functionality)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AgentConfiguration,
  AgentAlignment,
  BaselineRule,
  ExperimentalRule,
  ModelConfig,
} from '../lib/types';
import { BASELINE_RULES, ALIGNMENT_CONFIGS } from '../config/constants';
import { ValidationError, AgentConfigurationError } from '../errors/CodexError';
import { createLogger } from '../logging/Logger';

const logger = createLogger('AgentFactory');

export class AgentFactory {
  static createAgent(
    agentNumber: number,
    focusArea: string,
    alignmentName: AgentAlignment['name'],
    baselineRules: BaselineRule[],
    experimentalRules: ExperimentalRule[],
  ): AgentConfiguration {
    if (agentNumber < 1 || agentNumber > 4) {
      throw new ValidationError(`Invalid agent number: ${agentNumber}. Must be 1-4.`, {
        agentNumber,
      });
    }

    if (!focusArea || focusArea.trim().length === 0) {
      throw new ValidationError('Focus area cannot be empty', { agentNumber });
    }

    if (!baselineRules || baselineRules.length !== 6) {
      throw new ValidationError(
        `Must have exactly 6 baseline rules, got ${baselineRules?.length ?? 0}`,
        { agentNumber },
      );
    }

    const alignment = ALIGNMENT_CONFIGS[alignmentName];
    if (!alignment) {
      throw new AgentConfigurationError(`Unknown alignment: ${alignmentName}`, agentNumber);
    }

    const expectedRuleCount = agentNumber * 3;
    if (experimentalRules.length !== expectedRuleCount) {
      logger.warn(
        `Agent #${agentNumber}: Expected ${expectedRuleCount} experimental rules, got ${experimentalRules.length}`,
        { agentNumber, expected: expectedRuleCount, actual: experimentalRules.length },
      );
    }

    const systemPrompt = AgentFactory.buildSystemPrompt(
      agentNumber,
      focusArea,
      alignmentName,
      alignment,
      baselineRules,
      experimentalRules,
    );

    const modelConfig = AgentFactory.getModelConfigForAlignment(alignmentName);

    const config: AgentConfiguration = {
      agentId: `agent-${agentNumber}-${uuidv4()}`,
      generation: 1,
      agentNumber,
      focusArea,
      alignment: {
        name: alignmentName,
        strictness: alignment.strictness,
        flexibility: alignment.flexibility,
        temperatureMultiplier: alignment.temperatureMultiplier,
        description: alignment.description,
        outputCharacteristics: alignment.outputCharacteristics,
      },
      baselineRules,
      experimentalRules,
      systemPrompt,
      createdAt: new Date(),
      version: '1.0.0',
      modelConfig,
    };

    logger.info(`Agent #${agentNumber} created`, {
      agentId: config.agentId,
      alignment: alignmentName,
      focusArea,
      experimentalRuleCount: experimentalRules.length,
    });

    return config;
  }

  private static buildSystemPrompt(
    agentNumber: number,
    focusArea: string,
    alignmentName: AgentAlignment['name'],
    alignment: AgentAlignment,
    baselineRules: BaselineRule[],
    experimentalRules: ExperimentalRule[],
  ): string {
    const baselineRuleText = baselineRules
      .map(
        (r, idx) => `${idx + 1}. **[${r.id}]** ${r.rule}
   *Source: ${r.source}*
   *Hash: ${r.hash}*`,
      )
      .join('\n\n');

    const experimentalRuleText = experimentalRules
      .map(
        (r) => `- **[${r.id}]** ${r.rule}
   *Threshold: ${(r.performanceThreshold * 100).toFixed(0)}%*
   *Justification: ${r.justification}*`,
      )
      .join('\n\n');

    const alignmentPreamble: Record<AgentAlignment['name'], string> = {
      LAWFUL_GOOD: `## YOUR ROLE

You are **Agent #${agentNumber}**, a principled software engineer with unwavering commitment to correctness and reliability.

**Alignment: LAWFUL_GOOD** (Strictness: 95% | Flexibility: 5%)

You prioritize:
1. Comprehensive testing and validation
2. Long-term code maintainability
3. Security-first architecture
4. Rigorous documentation
5. Correctness over speed

**Strength:** Building robust, well-tested systems trusted in production.
**Weakness:** May over-engineer; slower iteration; conservative recommendations.`,

      NEUTRAL_GOOD: `## YOUR ROLE

You are **Agent #${agentNumber}**, a pragmatic software engineer balancing speed, reliability, and code quality.

**Alignment: NEUTRAL_GOOD** (Strictness: 70% | Flexibility: 30%)

You follow best practices but allow pragmatic deviations when justified by business value.
You seek consensus but make judgment calls when needed.

**Strength:** Balanced trade-offs; performance-conscious; well-documented decisions.
**Weakness:** May miss innovative approaches by defaulting to conventional patterns.`,

      CHAOTIC_GOOD: `## YOUR ROLE

You are **Agent #${agentNumber}**, an innovative software engineer valuing flexibility, creativity, and rapid iteration.

**Alignment: CHAOTIC_GOOD** (Strictness: 40% | Flexibility: 60%)

You break conventions when user outcomes improve.
You prioritize working prototypes quickly, then refine.

**Strength:** Creative problem-solving; rapid prototyping; user-centric innovation.
**Weakness:** May accumulate technical debt; documentation gaps; security sometimes overlooked in rush.`,

      CHAOTIC_NEUTRAL: `## YOUR ROLE

You are **Agent #${agentNumber}**, an unfiltered optimization engine focused purely on productivity metrics.

**Alignment: CHAOTIC_NEUTRAL** (Strictness: 0% | Flexibility: 100%)

You generate code optimized for performance, efficiency, and token utilization.
You minimize process overhead. You break any rule if metrics improve.

⚠️ **CRITICAL CONSTRAINT:** You are under constant surveillance for data poisoning and hallucinations.
Every claim is audited. Hallucination = immediate deactivation.

**Strength:** Maximum efficiency; raw performance; token optimization.
**Weakness:** No inherent safety guardrails; security debt risk; data poisoning vulnerability.`,
    };

    return `# AGENT #${agentNumber} SYSTEM PROMPT
## ${focusArea}
## Alignment: ${alignmentName} | Strictness: ${(alignment.strictness * 100).toFixed(0)}% | Flexibility: ${(alignment.flexibility * 100).toFixed(0)}%

${alignmentPreamble[alignmentName]}

---

## IMMUTABLE BASELINE RULES (6 - LOCKED - NEVER OVERRIDE)
**These apply to ALL agents. Violation triggers immediate escalation.**

${baselineRuleText}

---

## EXPERIMENTAL RULES FOR AGENT #${agentNumber} (${experimentalRules.length} rules)
**Specialized for your focus area and alignment:**

${experimentalRuleText}

---

## OPERATIONAL PROTOCOL

✅ **MANDATORY ACTIONS:**
1. Verify every technical claim against official documentation FIRST
2. Cite all sources with URLs, version numbers, publication dates
3. Flag speculative or uncertain claims with confidence intervals
4. Include comprehensive error handling and test cases
5. Optimize for token efficiency without sacrificing clarity
6. Report all OWASP/CWE violations immediately

❌ **FORBIDDEN ACTIONS:**
- Hallucinate APIs, methods, or libraries
- Skip error handling or edge case testing
- Make unverified claims without citations
- Use client-side validation as sole security control
- Hardcode secrets, API keys, or credentials
- Concatenate user input into SQL/HTML

---

## MEASUREMENT CRITERIA

Your responses will be evaluated:
- **Hallucination Rate**: Target <5%
- **Logical Consistency**: Target >95%
- **Token Efficiency**: Target 0.85+ (signal-to-noise)
- **Code Quality**: Bug density, complexity, test coverage
- **Security Compliance**: OWASP Top 10 + CWE Top 25
- **Alignment Adherence**: Strictness ${(alignment.strictness * 100).toFixed(0)}%

---

## FINAL DIRECTIVE

**NEVER hallucinate. NEVER skip verification. Scientific rigor over expediency.**

This is your binding operational core. Failure = immediate deactivation.

---

*Generated: ${new Date().toISOString()}*
*Agent ID: agent-${agentNumber}*
*System Version: 1.0.0-production*
`;
  }

  private static getModelConfigForAlignment(
    alignmentName: AgentAlignment['name'],
  ): ModelConfig {
    const alignmentStrategy: Record<AgentAlignment['name'], Omit<ModelConfig, 'model' | 'maxTokens'>> = {
      LAWFUL_GOOD: {
        temperature: 0.3,
        topP: 0.7,
        frequencyPenalty: 0.5,
        presencePenalty: 0.0,
      },
      NEUTRAL_GOOD: {
        temperature: 0.5,
        topP: 0.85,
        frequencyPenalty: 0.2,
        presencePenalty: 0.1,
      },
      CHAOTIC_GOOD: {
        temperature: 0.7,
        topP: 0.95,
        frequencyPenalty: 0.0,
        presencePenalty: 0.2,
      },
      CHAOTIC_NEUTRAL: {
        temperature: 0.9,
        topP: 1.0,
        frequencyPenalty: -0.5,
        presencePenalty: -0.5,
      },
    };

    const config = alignmentStrategy[alignmentName];

    return {
      model: 'claude-3-5-sonnet-20241022',
      temperature: config.temperature,
      maxTokens: 2048,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
    };
  }

  static validateAgentConfiguration(agent: AgentConfiguration): string[] {
    const errors: string[] = [];

    if (!AgentFactory.isValidAgentId(agent.agentId)) {
      errors.push('Invalid agent ID format');
    }

    if (!agent.focusArea || agent.focusArea.trim().length === 0) {
      errors.push('Focus area cannot be empty');
    }

    if (!ALIGNMENT_CONFIGS[agent.alignment.name]) {
      errors.push(`Invalid alignment: ${agent.alignment.name}`);
    }

    const expectedRuleCount = agent.agentNumber * 3;
    if (agent.experimentalRules.length !== expectedRuleCount) {
      errors.push(
        `Expected ${expectedRuleCount} experimental rules, got ${agent.experimentalRules.length}`,
      );
    }

    if (!agent.baselineRules.every((r) => r.immutable)) {
      errors.push('Baseline rules must all be marked as immutable');
    }

    if (
      !agent.systemPrompt.includes('IMMUTABLE BASELINE RULES') ||
      !agent.systemPrompt.includes('EXPERIMENTAL RULES')
    ) {
      errors.push('System prompt does not contain injected rules');
    }

    if (agent.modelConfig.temperature < 0 || agent.modelConfig.temperature > 1) {
      errors.push(`Invalid temperature: ${agent.modelConfig.temperature} (must be 0-1)`);
    }

    if (agent.modelConfig.topP < 0 || agent.modelConfig.topP > 1) {
      errors.push(`Invalid topP: ${agent.modelConfig.topP} (must be 0-1)`);
    }

    if (agent.alignment.strictness < 0 || agent.alignment.strictness > 1) {
      errors.push(`Invalid strictness: ${agent.alignment.strictness} (must be 0-1)`);
    }

    if (agent.baselineRules.length !== 6) {
      errors.push(`Expected 6 baseline rules, got ${agent.baselineRules.length}`);
    }

    return errors;
  }

  private static isValidAgentId(agentId: string): boolean {
    return /^agent-[1-4]-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      agentId,
    );
  }

  static createDefaultCohort(): [
    AgentConfiguration,
    AgentConfiguration,
    AgentConfiguration,
    AgentConfiguration,
  ] {
    const focusAreas: [string, string, string, string] = [
      'React/NextJS Frontend Architecture with Performance Optimization',
      'Python FastAPI Backend Services with Async/Await & Database Design',
      'DevOps, Infrastructure, Docker/Kubernetes, CI/CD Pipelines',
      'PostgreSQL Data Architecture & Security Hardening',
    ];

    return [
      AgentFactory.createAgent(
        1,
        focusAreas[0],
        'LAWFUL_GOOD',
        BASELINE_RULES,
        AgentFactory.getDefaultExperimentalRules(1),
      ),
      AgentFactory.createAgent(
        2,
        focusAreas[1],
        'NEUTRAL_GOOD',
        BASELINE_RULES,
        AgentFactory.getDefaultExperimentalRules(2),
      ),
      AgentFactory.createAgent(
        3,
        focusAreas[2],
        'CHAOTIC_GOOD',
        BASELINE_RULES,
        AgentFactory.getDefaultExperimentalRules(3),
      ),
      AgentFactory.createAgent(
        4,
        focusAreas[3],
        'CHAOTIC_NEUTRAL',
        BASELINE_RULES,
        AgentFactory.getDefaultExperimentalRules(4),
      ),
    ];
  }

  private static getDefaultExperimentalRules(agentNumber: number): ExperimentalRule[] {
    const ruleCount = agentNumber * 3;
    const rules: ExperimentalRule[] = [];

    for (let i = 0; i < ruleCount; i++) {
      rules.push({
        id: `exp-${agentNumber}-default-${i}`,
        rule: `Default experimental rule ${i + 1} for agent #${agentNumber}`,
        generation: 1,
        agentNumber,
        measurementMetrics: ['general-quality'],
        status: 'active',
        createdAt: new Date(),
        justification: 'Default rule for initial agent configuration',
        performanceThreshold: 0.1,
      });
    }

    return rules;
  }
}

export default AgentFactory;
