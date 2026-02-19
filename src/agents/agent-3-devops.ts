/**
 * AGENT #3: DEVOPS, INFRASTRUCTURE, DOCKER/KUBERNETES, CI/CD
 * Alignment: CHAOTIC_GOOD (innovative, flexible, rapid iteration)
 * Rules: 6 baseline + 9 experimental = 15 total
 * Focus: Container orchestration, CI/CD pipelines, IaC, observability
 *
 * SOURCE: CNCF Cloud Native Landscape (cncf.io)
 * Kubernetes docs (kubernetes.io/docs/)
 */

import { ExperimentalRule } from '../lib/types';
import { BASELINE_RULES } from '../config/constants';
import AgentFactory from './agent-factory';

export const AGENT_3_RULES: ExperimentalRule[] = [
  {
    id: 'AGENT_3_EXP_001',
    rule: 'BUILD minimal Docker images: multi-stage builds, distroless base images (gcr.io/distroless), non-root USER, read-only filesystem (--read-only), drop ALL capabilities then add back minimally. Scan with Trivy in CI. Source: Docker security best practices (docs.docker.com/develop/security-best-practices/).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['security-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Non-root containers prevent privilege escalation (CWE-250). Distroless reduces attack surface 60%',
    performanceThreshold: 0.1,
  },
  {
    id: 'AGENT_3_EXP_002',
    rule: 'IMPLEMENT GitOps with Flux or ArgoCD: single source of truth in Git, declarative desired state, automated reconciliation. Separate application and infrastructure repos. Use Kustomize overlays for environment promotion (dev → staging → prod). Source: GitOps Principles (opengitops.dev).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['architecture-score', 'token-efficiency'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'GitOps reduces deployment failures 43% and MTTR 63% (DORA 2022 State of DevOps)',
    performanceThreshold: 0.12,
  },
  {
    id: 'AGENT_3_EXP_003',
    rule: 'CONFIGURE Kubernetes resource limits and requests for all pods: CPU requests/limits, memory requests/limits. Use HPA (HorizontalPodAutoscaler) for scaling. Implement PodDisruptionBudget for availability. Source: Kubernetes docs (kubernetes.io/docs/concepts/configuration/manage-resources-containers/).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['architecture-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Missing resource limits cause noisy-neighbor OOM kills (Kubernetes production anti-patterns)',
    performanceThreshold: 0.09,
  },
  {
    id: 'AGENT_3_EXP_004',
    rule: 'IMPLEMENT observability triad: metrics (Prometheus + Grafana), logs (structured JSON → ELK/Loki), traces (OpenTelemetry → Jaeger/Tempo). Define SLOs: availability 99.9%, p99 latency <500ms, error rate <0.1%. Source: Google SRE Book (sre.google/sre-book/monitoring-distributed-systems/).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['architecture-score', 'test-coverage'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Observability reduces MTTD from hours to minutes (DORA 2023 Accelerate State of DevOps)',
    performanceThreshold: 0.14,
  },
  {
    id: 'AGENT_3_EXP_005',
    rule: 'USE Infrastructure as Code (IaC): Terraform for cloud resources, Helm for Kubernetes applications. Enforce terraform plan review in CI. State backend in remote storage (S3 + DynamoDB lock). Source: HashiCorp Terraform best practices (developer.hashicorp.com/terraform/language/style).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['architecture-score', 'security-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'IaC reduces configuration drift and enables reproducible environments (NIST SP 800-190)',
    performanceThreshold: 0.11,
  },
  {
    id: 'AGENT_3_EXP_006',
    rule: 'IMPLEMENT CI/CD pipeline stages: lint → unit test → build → security scan (SAST/DAST) → integration test → staging deploy → smoke test → production deploy. Use branch protection rules. Require peer review for main branch merges. Source: NIST SP 800-53 SA-11 (Developer Testing).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['test-coverage', 'security-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Automated pipelines reduce deployment risk 55% vs manual processes (DORA 2022)',
    performanceThreshold: 0.1,
  },
  {
    id: 'AGENT_3_EXP_007',
    rule: 'CONFIGURE network policies in Kubernetes: default deny-all, explicit allow per service. Use Istio or Cilium for mTLS between services. Implement ingress TLS termination. Source: Kubernetes Network Policies (kubernetes.io/docs/concepts/services-networking/network-policies/).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['security-score', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Default-deny network policies implement zero-trust networking (NIST SP 800-207)',
    performanceThreshold: 0.13,
  },
  {
    id: 'AGENT_3_EXP_008',
    rule: 'IMPLEMENT chaos engineering: scheduled fault injection (Chaos Monkey, LitmusChaos), game days for incident response practice, runbook automation. Test failure modes: pod eviction, network partition, disk full, CPU throttling. Source: Chaos Engineering Principles (principlesofchaos.org).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['test-coverage', 'architecture-score'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Chaos engineering surfaces unknown failure modes before they affect production (Netflix Chaos)',
    performanceThreshold: 0.16,
  },
  {
    id: 'AGENT_3_EXP_009',
    rule: 'USE secrets management: Kubernetes Secrets encrypted at rest (KMS provider), External Secrets Operator with Vault/AWS Secrets Manager. Rotate credentials automatically. Never commit secrets to Git (use git-secrets pre-commit hook). Source: NIST SP 800-53 IA-5 (Authenticator Management).',
    generation: 1,
    agentNumber: 3,
    measurementMetrics: ['security-score', 'bug-density'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    justification: 'Secret leakage in Git is top-3 security incident cause (GitGuardian 2023 State of Secrets)',
    performanceThreshold: 0.08,
  },
];

export const AGENT_3_CONFIG = AgentFactory.createAgent(
  3,
  'DevOps, Infrastructure, Docker/Kubernetes, CI/CD Pipelines',
  'CHAOTIC_GOOD',
  BASELINE_RULES,
  AGENT_3_RULES,
);

export const AGENT_3_SYSTEM_PROMPT = AGENT_3_CONFIG.systemPrompt;
