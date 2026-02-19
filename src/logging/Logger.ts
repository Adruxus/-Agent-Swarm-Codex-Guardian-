/**
 * STRUCTURED LOGGER
 *
 * Provides structured logging throughout the system with:
 * - Log levels: DEBUG, INFO, WARN, ERROR, CRITICAL
 * - RFC 3339 timestamps
 * - Correlation IDs for request tracing
 * - Component-based namespacing
 * - NIST SP 800-53 AU-3 (Content of Audit Records) compliant
 *
 * SOURCE: NIST SP 800-53 AU-3, AU-12 (Audit Generation)
 * RFC 5424 (The Syslog Protocol)
 */

import { LogLevel, LogEntry } from '../lib/types';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

export class Logger {
  private readonly component: string;
  private readonly minLevel: LogLevel;
  private correlationId?: string;

  constructor(component: string, minLevel: LogLevel = 'INFO') {
    this.component = component;
    this.minLevel = minLevel;
  }

  withCorrelationId(correlationId: string): Logger {
    const child = new Logger(this.component, this.minLevel);
    child.correlationId = correlationId;
    return child;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('WARN', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('ERROR', message, context);
  }

  critical(message: string, context?: Record<string, unknown>): void {
    this.log('CRITICAL', message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      component: this.component,
      message,
      context,
      correlationId: this.correlationId,
    };

    const formatted = JSON.stringify(entry);

    if (level === 'ERROR' || level === 'CRITICAL') {
      process.stderr.write(formatted + '\n');
    } else {
      process.stdout.write(formatted + '\n');
    }
  }
}

export function createLogger(component: string, minLevel?: LogLevel): Logger {
  const envLevel = process.env['LOG_LEVEL'] as LogLevel | undefined;
  return new Logger(component, minLevel ?? envLevel ?? 'INFO');
}
