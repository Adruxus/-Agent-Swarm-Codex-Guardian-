/**
 * RETRY LOGIC WITH EXPONENTIAL BACKOFF
 *
 * Implements exponential backoff with jitter per NIST SP 800-53 baseline-002.
 * Handles transient failures in network/IO operations.
 *
 * ALGORITHM:
 * delay = min(baseDelay * 2^attempt + jitter, maxDelay)
 * jitter = random(0, baseDelay * 0.1)
 *
 * SOURCE: NIST SP 800-53 Rev 5, SI-17 (Fail-Safe Procedures)
 * AWS Exponential Backoff: https://docs.aws.amazon.com/general/latest/gr/api-retries.html
 */

import { RateLimitError, CodexError } from '../errors/CodexError';
import { createLogger } from '../logging/Logger';

const logger = createLogger('RetryUtil');

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors?: string[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoffDelay(attempt: number, options: RetryOptions): number {
  const exponential = options.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * options.baseDelayMs * 0.1;
  return Math.min(exponential + jitter, options.maxDelayMs);
}

function isRetryable(error: unknown): boolean {
  if (error instanceof CodexError) {
    return error.retryable;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('socket')
    );
  }
  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const shouldRetry = isRetryable(error);
      const isLastAttempt = attempt === config.maxAttempts - 1;

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      let delayMs: number;
      if (error instanceof RateLimitError) {
        delayMs = error.retryAfterMs;
      } else {
        delayMs = calculateBackoffDelay(attempt, config);
      }

      logger.warn(`Attempt ${attempt + 1}/${config.maxAttempts} failed, retrying in ${delayMs}ms`, {
        error: error instanceof Error ? error.message : String(error),
        attempt,
        delayMs,
      });

      await sleep(delayMs);
    }
  }

  throw lastError;
}
