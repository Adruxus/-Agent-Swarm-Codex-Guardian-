/**
 * RETRY UTILITY UNIT TESTS
 *
 * Tests: exponential backoff, retryable errors, non-retryable errors,
 * max attempts, RateLimitError handling.
 *
 * SOURCE: AWS Exponential Backoff Docs
 * NIST SP 800-53 SI-17 (Fail-Safe Procedures)
 */

import { withRetry } from '../../src/lib/retry';
import { RateLimitError, ValidationError, NetworkError, IOError } from '../../src/errors/CodexError';

describe('withRetry', () => {
  jest.setTimeout(15000);

  it('returns result on first successful attempt', async () => {
    const result = await withRetry(async () => 'success', {
      maxAttempts: 3,
      baseDelayMs: 10,
      maxDelayMs: 100,
    });
    expect(result).toBe('success');
  });

  it('retries on retryable error and succeeds eventually', async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) throw new NetworkError('connection failed');
        return 'success-after-retry';
      },
      { maxAttempts: 5, baseDelayMs: 10, maxDelayMs: 100 },
    );

    expect(result).toBe('success-after-retry');
    expect(attempts).toBe(3);
  });

  it('throws after maxAttempts exhausted for retryable error', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new NetworkError('always fails');
        },
        { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 },
      ),
    ).rejects.toThrow(NetworkError);

    expect(attempts).toBe(3);
  });

  it('does not retry non-retryable ValidationError', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new ValidationError('invalid input');
        },
        { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 },
      ),
    ).rejects.toThrow(ValidationError);

    expect(attempts).toBe(1);
  });

  it('retries IOError (retryable)', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new IOError('disk error');
        },
        { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 50 },
      ),
    ).rejects.toThrow(IOError);

    expect(attempts).toBe(2);
  });

  it('uses RateLimitError.retryAfterMs delay', async () => {
    let attempts = 0;
    const start = Date.now();

    await expect(
      withRetry(
        async () => {
          attempts++;
          if (attempts === 1) throw new RateLimitError('rate limited', 50);
          return 'ok';
        },
        { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 1000 },
      ),
    ).resolves.toBe('ok');

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('handles plain Error with timeout message as retryable', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new Error('socket timeout');
        },
        { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 50 },
      ),
    ).rejects.toThrow('socket timeout');

    expect(attempts).toBe(2);
  });

  it('does not retry non-retryable plain Error', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new Error('something broke');
        },
        { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 },
      ),
    ).rejects.toThrow('something broke');

    expect(attempts).toBe(1);
  });

  it('uses default retry options when not specified', async () => {
    const result = await withRetry(async () => 42);
    expect(result).toBe(42);
  });

  it('propagates original error on final retry failure', async () => {
    const originalError = new NetworkError('final failure', { attempt: 3 });

    await expect(
      withRetry(async () => { throw originalError; }, {
        maxAttempts: 2,
        baseDelayMs: 10,
        maxDelayMs: 50,
      }),
    ).rejects.toThrow(NetworkError);
  });
});
