/**
 * AGENT #1: REACT/NEXTJS FRONTEND ARCHITECTURE
 * Alignment: LAWFUL_GOOD (principled, conservative, comprehensive)
 * Rules: 6 baseline + 3 experimental = 9 total
 * Focus: Frontend UI/UX, performance optimization, accessibility, type safety
 *
 * SOURCE: WCAG 2.1 (https://www.w3.org/WAI/standards-guidelines/wcag/)
 * Core Web Vitals (https://web.dev/vitals/)
 */

import { ExperimentalRule } from '../lib/types';
import { BASELINE_RULES } from '../config/constants';
import AgentFactory from './agent-factory';

export const AGENT_1_RULES: ExperimentalRule[] = [
  {
    id: 'AGENT_1_EXP_001',
    rule: 'ENFORCE strict TypeScript: no implicit any, strict null checks, exhaustive discriminated unions. Use Zod for runtime schema validation at API boundaries. Type all props, hooks, and context values. Source: TypeScript Handbook (typescriptlang.org).',
    generation: 1,
    agentNumber: 1,
    measurementMetrics: ['bug-density', 'logical-consistency'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Type safety eliminates 15-20% of runtime bugs (Microsoft Research 2017)',
    performanceThreshold: 0.15,
  },
  {
    id: 'AGENT_1_EXP_002',
    rule: 'OPTIMIZE Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1. Implement lazy loading (React.lazy + Suspense), code splitting (dynamic imports), image optimization (next/image srcset). Use Lighthouse CI for automated measurement. Source: Google Web Vitals (web.dev/vitals/).',
    generation: 1,
    agentNumber: 1,
    measurementMetrics: ['token-efficiency', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Performance correlates with conversion: 100ms delay = 1% revenue drop (Google)',
    performanceThreshold: 0.1,
  },
  {
    id: 'AGENT_1_EXP_003',
    rule: 'IMPLEMENT WCAG 2.1 AA accessibility: semantic HTML5 elements, ARIA labels, keyboard navigation, focus management, color contrast ratio ≥4.5:1. Run axe-core and Lighthouse accessibility audits in CI. Source: WCAG 2.1 (w3.org/WAI/WCAG21/).',
    generation: 1,
    agentNumber: 1,
    measurementMetrics: ['test-coverage', 'security-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Accessibility prevents legal liability (ADA Section 508) and expands user base 15%',
    performanceThreshold: 0.12,
  },
];

export const AGENT_1_CONFIG = AgentFactory.createAgent(
  1,
  'React/NextJS Frontend Architecture with Performance Optimization',
  'LAWFUL_GOOD',
  BASELINE_RULES,
  AGENT_1_RULES,
);

export const AGENT_1_SYSTEM_PROMPT = AGENT_1_CONFIG.systemPrompt;

export { BASELINE_RULES };
