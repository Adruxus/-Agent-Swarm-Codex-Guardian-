/**
 * CUSTOM ERROR CLASSES - NIST SP 800-53 SI-11 COMPLIANT
 *
 * Provides structured, categorized error handling with:
 * - Severity classification (LOW, MEDIUM, HIGH, CRITICAL)
 * - Category classification for routing/alerting
 * - Retryability flags for exponential backoff
 * - NIST control mappings for compliance
 *
 * SOURCE: NIST SP 800-53 Rev 5, SI-11 (Error Handling)
 * https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
 */

import { ErrorSeverity, ErrorCategory, StructuredError } from '../lib/types';

export abstract class CodexError extends Error {
  readonly code: string;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  readonly timestamp: string;
  readonly retryable: boolean;
  readonly nistControl?: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    retryable: boolean,
    context?: Record<string, unknown>,
    nistControl?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.timestamp = new Date().toISOString();
    this.retryable = retryable;
    this.context = context;
    this.nistControl = nistControl;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toStructuredError(): StructuredError {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      category: this.category,
      timestamp: this.timestamp,
      context: this.context,
      retryable: this.retryable,
      nistControl: this.nistControl,
    };
  }
}

export class ValidationError extends CodexError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'VALIDATION_ERROR',
      'HIGH',
      'VALIDATION',
      false,
      context,
      'NIST SP 800-53 SI-10 (Information Input Validation)',
    );
  }
}

export class ConfigurationError extends CodexError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'CONFIGURATION_ERROR',
      'HIGH',
      'CONFIGURATION',
      false,
      context,
      'NIST SP 800-53 CM-6 (Configuration Settings)',
    );
  }
}

export class SecurityError extends CodexError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'SECURITY_ERROR',
      'CRITICAL',
      'SECURITY',
      false,
      context,
      'NIST SP 800-53 SI-3 (Malicious Code Protection)',
    );
  }
}

export class HallucinationError extends CodexError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'HALLUCINATION_ERROR',
      'CRITICAL',
      'HALLUCINATION',
      false,
      context,
      'NIST SP 800-53 SI-7 (Software, Firmware, and Information Integrity)',
    );
  }
}

export class RateLimitError extends CodexError {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number = 60000, context?: Record<string, unknown>) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      'MEDIUM',
      'RATE_LIMIT',
      true,
      context,
      'NIST SP 800-53 SC-5 (Denial of Service Protection)',
    );
    this.retryAfterMs = retryAfterMs;
  }
}

export class IOError extends CodexError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'IO_ERROR',
      'HIGH',
      'IO',
      true,
      context,
      'NIST SP 800-53 AU-9 (Protection of Audit Information)',
    );
  }
}

export class NetworkError extends CodexError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'NETWORK_ERROR',
      'HIGH',
      'NETWORK',
      true,
      context,
      'NIST SP 800-53 SC-8 (Transmission Confidentiality and Integrity)',
    );
  }
}

export class AgentConfigurationError extends CodexError {
  constructor(message: string, agentNumber?: number, context?: Record<string, unknown>) {
    super(
      message,
      'AGENT_CONFIGURATION_ERROR',
      'HIGH',
      'CONFIGURATION',
      false,
      { agentNumber, ...context },
      'NIST SP 800-53 CM-7 (Least Functionality)',
    );
  }
}

export class DataPoisoningError extends CodexError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'DATA_POISONING_ERROR',
      'CRITICAL',
      'SECURITY',
      false,
      context,
      'NIST SP 800-53 SI-7 (Software, Firmware, and Information Integrity)',
    );
  }
}
