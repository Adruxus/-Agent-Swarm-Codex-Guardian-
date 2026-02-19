/**
 * ERROR CLASSES UNIT TESTS
 *
 * Tests: custom error classes, severity levels, categories,
 * retryability flags, NIST control mappings, toStructuredError().
 *
 * SOURCE: NIST SP 800-53 SI-11 (Error Handling)
 */

import {
  ValidationError,
  ConfigurationError,
  SecurityError,
  HallucinationError,
  RateLimitError,
  IOError,
  NetworkError,
  AgentConfigurationError,
  DataPoisoningError,
} from '../../src/errors/CodexError';

describe('ValidationError', () => {
  it('has code VALIDATION_ERROR', () => {
    const error = new ValidationError('test message');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('has HIGH severity', () => {
    const error = new ValidationError('test');
    expect(error.severity).toBe('HIGH');
  });

  it('has VALIDATION category', () => {
    const error = new ValidationError('test');
    expect(error.category).toBe('VALIDATION');
  });

  it('is not retryable', () => {
    const error = new ValidationError('test');
    expect(error.retryable).toBe(false);
  });

  it('includes NIST control reference', () => {
    const error = new ValidationError('test');
    expect(error.nistControl).toContain('NIST');
  });

  it('includes context when provided', () => {
    const error = new ValidationError('test', { field: 'agentNumber' });
    expect(error.context?.['field']).toBe('agentNumber');
  });

  it('has correct error message', () => {
    const error = new ValidationError('Invalid agent number');
    expect(error.message).toBe('Invalid agent number');
  });

  it('has name ValidationError', () => {
    const error = new ValidationError('test');
    expect(error.name).toBe('ValidationError');
  });

  it('toStructuredError returns correct shape', () => {
    const error = new ValidationError('test', { key: 'value' });
    const structured = error.toStructuredError();

    expect(structured.code).toBe('VALIDATION_ERROR');
    expect(structured.message).toBe('test');
    expect(structured.severity).toBe('HIGH');
    expect(structured.category).toBe('VALIDATION');
    expect(structured.retryable).toBe(false);
    expect(structured.context?.['key']).toBe('value');
  });

  it('timestamp is valid ISO 8601', () => {
    const error = new ValidationError('test');
    expect(() => new Date(error.timestamp)).not.toThrow();
    expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
  });
});

describe('SecurityError', () => {
  it('has CRITICAL severity', () => {
    const error = new SecurityError('security breach');
    expect(error.severity).toBe('CRITICAL');
  });

  it('has SECURITY category', () => {
    const error = new SecurityError('test');
    expect(error.category).toBe('SECURITY');
  });

  it('is not retryable', () => {
    const error = new SecurityError('test');
    expect(error.retryable).toBe(false);
  });

  it('inherits from Error', () => {
    const error = new SecurityError('test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('HallucinationError', () => {
  it('has CRITICAL severity', () => {
    const error = new HallucinationError('hallucination detected');
    expect(error.severity).toBe('CRITICAL');
  });

  it('has HALLUCINATION category', () => {
    const error = new HallucinationError('test');
    expect(error.category).toBe('HALLUCINATION');
  });

  it('is not retryable', () => {
    const error = new HallucinationError('test');
    expect(error.retryable).toBe(false);
  });
});

describe('RateLimitError', () => {
  it('has MEDIUM severity', () => {
    const error = new RateLimitError('rate limited');
    expect(error.severity).toBe('MEDIUM');
  });

  it('is retryable', () => {
    const error = new RateLimitError('test');
    expect(error.retryable).toBe(true);
  });

  it('has default retryAfterMs of 60000', () => {
    const error = new RateLimitError('test');
    expect(error.retryAfterMs).toBe(60000);
  });

  it('accepts custom retryAfterMs', () => {
    const error = new RateLimitError('test', 5000);
    expect(error.retryAfterMs).toBe(5000);
  });

  it('has RATE_LIMIT category', () => {
    const error = new RateLimitError('test');
    expect(error.category).toBe('RATE_LIMIT');
  });
});

describe('IOError', () => {
  it('has HIGH severity', () => {
    const error = new IOError('file not found');
    expect(error.severity).toBe('HIGH');
  });

  it('is retryable', () => {
    const error = new IOError('test');
    expect(error.retryable).toBe(true);
  });

  it('has IO category', () => {
    const error = new IOError('test');
    expect(error.category).toBe('IO');
  });
});

describe('NetworkError', () => {
  it('has HIGH severity', () => {
    const error = new NetworkError('connection refused');
    expect(error.severity).toBe('HIGH');
  });

  it('is retryable', () => {
    const error = new NetworkError('test');
    expect(error.retryable).toBe(true);
  });

  it('has NETWORK category', () => {
    const error = new NetworkError('test');
    expect(error.category).toBe('NETWORK');
  });
});

describe('ConfigurationError', () => {
  it('has HIGH severity', () => {
    const error = new ConfigurationError('invalid config');
    expect(error.severity).toBe('HIGH');
  });

  it('is not retryable', () => {
    const error = new ConfigurationError('test');
    expect(error.retryable).toBe(false);
  });

  it('has CONFIGURATION category', () => {
    const error = new ConfigurationError('test');
    expect(error.category).toBe('CONFIGURATION');
  });
});

describe('AgentConfigurationError', () => {
  it('includes agentNumber in context', () => {
    const error = new AgentConfigurationError('bad config', 3);
    expect(error.context?.['agentNumber']).toBe(3);
  });

  it('has CONFIGURATION category', () => {
    const error = new AgentConfigurationError('test', 1);
    expect(error.category).toBe('CONFIGURATION');
  });

  it('is not retryable', () => {
    const error = new AgentConfigurationError('test', 2);
    expect(error.retryable).toBe(false);
  });
});

describe('DataPoisoningError', () => {
  it('has CRITICAL severity', () => {
    const error = new DataPoisoningError('poisoning detected');
    expect(error.severity).toBe('CRITICAL');
  });

  it('has SECURITY category', () => {
    const error = new DataPoisoningError('test');
    expect(error.category).toBe('SECURITY');
  });

  it('is not retryable', () => {
    const error = new DataPoisoningError('test');
    expect(error.retryable).toBe(false);
  });
});
