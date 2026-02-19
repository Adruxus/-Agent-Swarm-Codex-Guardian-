/**
 * CONSTANTS & RULE LIBRARY UNIT TESTS
 *
 * Tests: baseline rule count, rule library completeness (30+ rules),
 * alignment configurations, defaults validation.
 *
 * SOURCE: NIST SP 800-53, OWASP Top 10 2021
 */

import {
  BASELINE_RULES,
  RULE_LIBRARY,
  ALIGNMENT_CONFIGS,
  DEFAULTS,
  AGENT_ALIGNMENT_MAP,
} from '../../src/config/constants';

describe('BASELINE_RULES', () => {
  it('contains exactly 6 baseline rules', () => {
    expect(BASELINE_RULES).toHaveLength(6);
  });

  it('all baseline rules are marked immutable', () => {
    expect(BASELINE_RULES.every((r) => r.immutable)).toBe(true);
  });

  it('all baseline rules have RFC compliance', () => {
    expect(BASELINE_RULES.every((r) => r.rfcCompliance)).toBe(true);
  });

  it('all baseline rules have unique IDs', () => {
    const ids = BASELINE_RULES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6);
  });

  it('all baseline rules have unique hashes', () => {
    const hashes = BASELINE_RULES.map((r) => r.hash);
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(6);
  });

  it('all baseline rules have non-empty rule text', () => {
    expect(BASELINE_RULES.every((r) => r.rule.length > 0)).toBe(true);
  });

  it('all baseline rules have source citations', () => {
    expect(BASELINE_RULES.every((r) => r.source.length > 0)).toBe(true);
  });

  it('baseline-001 addresses API verification (OWASP)', () => {
    const rule1 = BASELINE_RULES.find((r) => r.id === 'baseline-001');
    expect(rule1).toBeDefined();
    expect(rule1!.rule.toLowerCase()).toContain('verified');
  });

  it('baseline-002 addresses error handling (NIST)', () => {
    const rule2 = BASELINE_RULES.find((r) => r.id === 'baseline-002');
    expect(rule2).toBeDefined();
    expect(rule2!.source).toContain('NIST');
  });

  it('baseline-003 addresses TDD (IEEE)', () => {
    const rule3 = BASELINE_RULES.find((r) => r.id === 'baseline-003');
    expect(rule3).toBeDefined();
    expect(rule3!.source).toContain('IEEE');
  });

  it('all baseline rules have zero performanceThreshold (immutable)', () => {
    expect(BASELINE_RULES.every((r) => r.performanceThreshold === 0.0)).toBe(true);
  });
});

describe('RULE_LIBRARY', () => {
  it('contains at least 6 optimization categories', () => {
    const categories = Object.keys(RULE_LIBRARY);
    expect(categories.length).toBeGreaterThanOrEqual(6);
  });

  it('total rule count is 30 or more', () => {
    const totalRules = Object.values(RULE_LIBRARY).reduce(
      (sum, rules) => sum + rules.length,
      0,
    );
    expect(totalRules).toBeGreaterThanOrEqual(30);
  });

  it('contains reduce-hallucination category', () => {
    expect(RULE_LIBRARY['reduce-hallucination']).toBeDefined();
  });

  it('contains token-efficiency category', () => {
    expect(RULE_LIBRARY['token-efficiency']).toBeDefined();
  });

  it('contains bug-detection category', () => {
    expect(RULE_LIBRARY['bug-detection']).toBeDefined();
  });

  it('contains security category', () => {
    expect(RULE_LIBRARY['security']).toBeDefined();
  });

  it('contains architecture category', () => {
    expect(RULE_LIBRARY['architecture']).toBeDefined();
  });

  it('contains data-integrity category', () => {
    expect(RULE_LIBRARY['data-integrity']).toBeDefined();
  });

  it('each category has at least 6 rules', () => {
    for (const [category, rules] of Object.entries(RULE_LIBRARY)) {
      expect(rules.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('all rules have rule text, source, and threshold', () => {
    for (const [, rules] of Object.entries(RULE_LIBRARY)) {
      for (const rule of rules) {
        expect(rule.rule.length).toBeGreaterThan(0);
        expect(rule.source.length).toBeGreaterThan(0);
        expect(rule.threshold).toBeGreaterThan(0);
        expect(rule.threshold).toBeLessThanOrEqual(1);
      }
    }
  });

  it('reduce-hallucination rules reference authoritative sources', () => {
    const rules = RULE_LIBRARY['reduce-hallucination'];
    const hasCitation = rules.some((r) => r.source.includes('OWASP') || r.source.includes('RFC'));
    expect(hasCitation).toBe(true);
  });

  it('security rules reference NIST or OWASP', () => {
    const rules = RULE_LIBRARY['security'];
    const hasNistOrOwasp = rules.some(
      (r) => r.source.includes('NIST') || r.source.includes('OWASP'),
    );
    expect(hasNistOrOwasp).toBe(true);
  });
});

describe('ALIGNMENT_CONFIGS', () => {
  it('contains all 4 alignment types', () => {
    expect(ALIGNMENT_CONFIGS['LAWFUL_GOOD']).toBeDefined();
    expect(ALIGNMENT_CONFIGS['NEUTRAL_GOOD']).toBeDefined();
    expect(ALIGNMENT_CONFIGS['CHAOTIC_GOOD']).toBeDefined();
    expect(ALIGNMENT_CONFIGS['CHAOTIC_NEUTRAL']).toBeDefined();
  });

  it('LAWFUL_GOOD has highest strictness (0.95)', () => {
    expect(ALIGNMENT_CONFIGS['LAWFUL_GOOD'].strictness).toBe(0.95);
  });

  it('CHAOTIC_NEUTRAL has lowest strictness (0.0)', () => {
    expect(ALIGNMENT_CONFIGS['CHAOTIC_NEUTRAL'].strictness).toBe(0.0);
  });

  it('LAWFUL_GOOD has lowest flexibility (0.05)', () => {
    expect(ALIGNMENT_CONFIGS['LAWFUL_GOOD'].flexibility).toBe(0.05);
  });

  it('CHAOTIC_NEUTRAL has highest flexibility (1.0)', () => {
    expect(ALIGNMENT_CONFIGS['CHAOTIC_NEUTRAL'].flexibility).toBe(1.0);
  });

  it('strictness + flexibility equals 1.0 for all alignments', () => {
    for (const [, config] of Object.entries(ALIGNMENT_CONFIGS)) {
      expect(config.strictness + config.flexibility).toBeCloseTo(1.0);
    }
  });

  it('all alignments have output characteristics', () => {
    for (const [, config] of Object.entries(ALIGNMENT_CONFIGS)) {
      expect(config.outputCharacteristics.length).toBeGreaterThan(0);
    }
  });

  it('all alignments have descriptions', () => {
    for (const [, config] of Object.entries(ALIGNMENT_CONFIGS)) {
      expect(config.description.length).toBeGreaterThan(0);
    }
  });

  it('temperature multipliers increase from LAWFUL_GOOD to CHAOTIC_NEUTRAL', () => {
    const lawful = ALIGNMENT_CONFIGS['LAWFUL_GOOD'].temperatureMultiplier;
    const neutral = ALIGNMENT_CONFIGS['NEUTRAL_GOOD'].temperatureMultiplier;
    const chaoticGood = ALIGNMENT_CONFIGS['CHAOTIC_GOOD'].temperatureMultiplier;
    const chaoticNeutral = ALIGNMENT_CONFIGS['CHAOTIC_NEUTRAL'].temperatureMultiplier;

    expect(lawful).toBeLessThan(neutral);
    expect(neutral).toBeLessThan(chaoticGood);
    expect(chaoticGood).toBeLessThan(chaoticNeutral);
  });
});

describe('DEFAULTS', () => {
  it('contains all required default settings', () => {
    expect(DEFAULTS.SYSTEM_DIRECTORY).toBeDefined();
    expect(DEFAULTS.MODEL_NAME).toBeDefined();
    expect(DEFAULTS.DEFAULT_MAX_TOKENS).toBeDefined();
    expect(DEFAULTS.AUDIT_LOG_FILE).toBeDefined();
    expect(DEFAULTS.AGENTS_CONFIG_FILE).toBeDefined();
    expect(DEFAULTS.MINIMUM_TEST_COVERAGE).toBeDefined();
    expect(DEFAULTS.MINIMUM_SECURITY_SCORE).toBeDefined();
    expect(DEFAULTS.MAXIMUM_HALLUCINATION_RATE).toBeDefined();
    expect(DEFAULTS.TOKEN_EFFICIENCY_TARGET).toBeDefined();
  });

  it('MINIMUM_TEST_COVERAGE is 0.8 (80%)', () => {
    expect(DEFAULTS.MINIMUM_TEST_COVERAGE).toBe(0.8);
  });

  it('MINIMUM_SECURITY_SCORE is 0.85 (85%)', () => {
    expect(DEFAULTS.MINIMUM_SECURITY_SCORE).toBe(0.85);
  });

  it('MAXIMUM_HALLUCINATION_RATE is 0.05 (5%)', () => {
    expect(DEFAULTS.MAXIMUM_HALLUCINATION_RATE).toBe(0.05);
  });

  it('MODEL_NAME is a valid Claude model', () => {
    expect(DEFAULTS.MODEL_NAME).toContain('claude');
  });
});

describe('AGENT_ALIGNMENT_MAP', () => {
  it('contains exactly 4 alignments', () => {
    expect(AGENT_ALIGNMENT_MAP).toHaveLength(4);
  });

  it('maps agents 1-4 to correct alignments', () => {
    expect(AGENT_ALIGNMENT_MAP[0]).toBe('LAWFUL_GOOD');
    expect(AGENT_ALIGNMENT_MAP[1]).toBe('NEUTRAL_GOOD');
    expect(AGENT_ALIGNMENT_MAP[2]).toBe('CHAOTIC_GOOD');
    expect(AGENT_ALIGNMENT_MAP[3]).toBe('CHAOTIC_NEUTRAL');
  });
});
