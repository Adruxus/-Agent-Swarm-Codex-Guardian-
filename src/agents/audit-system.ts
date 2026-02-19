/**
 * AUDIT SYSTEM - CRYPTOGRAPHIC LOGGING (NIST SP 800-53 AU-12 COMPLIANT)
 *
 * PURPOSE: Immutable, cryptographically-chained audit log of all system actions.
 *
 * FEATURES:
 * - JSONL format (one JSON object per line, RFC 7464)
 * - SHA-256 checksum per entry (tamper detection)
 * - Hash chaining: each entry references previous entry's checksum
 * - RFC 3339 timestamps
 * - Human-readable operator and justification fields
 * - NIST SP 800-53 AU-3 content fields
 *
 * SOURCE: NIST SP 800-53 Rev 5, AU-3 (Content of Audit Records)
 * NIST SP 800-53 AU-9 (Protection of Audit Information)
 * RFC 7464 (JavaScript Object Notation Lines)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuditEntry, AuditAction } from '../lib/types';
import { IOError, SecurityError } from '../errors/CodexError';
import { createLogger } from '../logging/Logger';
import { withRetry } from '../lib/retry';

const logger = createLogger('AuditSystem');

export interface AuditEntryInput {
  action: AuditAction;
  operator: string;
  agentId?: string;
  agentNumber?: number;
  justification: string;
  performanceImpact?: number;
  securityImplications: string;
  metadata?: Record<string, unknown>;
}

export class AuditSystem {
  private readonly auditLogPath: string;
  private readonly scientistId: string;
  private lastChecksum: string;

  constructor(systemDirectory: string, scientistId: string) {
    this.auditLogPath = path.join(systemDirectory, 'audit-log.jsonl');
    this.scientistId = scientistId;
    this.lastChecksum = this.loadLastChecksum();
  }

  /**
   * Write a new audit entry to the JSONL log.
   * Each entry includes:
   * - Unique ID (UUID v4)
   * - RFC 3339 timestamp
   * - SHA-256 checksum of entry content
   * - Previous entry checksum (hash chaining for tamper detection)
   *
   * SOURCE: NIST SP 800-53 AU-3, AU-9
   */
  async logEntry(input: AuditEntryInput): Promise<AuditEntry> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const entryContent = {
      id,
      timestamp,
      action: input.action,
      operator: input.operator,
      agentId: input.agentId,
      agentNumber: input.agentNumber,
      justification: input.justification,
      performanceImpact: input.performanceImpact,
      securityImplications: input.securityImplications,
      scientistId: this.scientistId,
      metadata: input.metadata,
      previousChecksum: this.lastChecksum,
    };

    const checksum = this.computeChecksum(entryContent);

    const entry: AuditEntry = {
      ...entryContent,
      checksum,
    };

    await withRetry(() => this.writeEntry(entry), {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
    });

    this.lastChecksum = checksum;

    logger.debug(`Audit entry logged: ${input.action}`, {
      id,
      action: input.action,
      operator: input.operator,
      checksum,
    });

    return entry;
  }

  /**
   * Synchronously log an entry (for use in constructors and error handlers).
   * Uses try-catch to prevent audit failures from crashing the system.
   */
  logEntrySync(input: AuditEntryInput): AuditEntry | null {
    try {
      const id = uuidv4();
      const timestamp = new Date().toISOString();

      const entryContent = {
        id,
        timestamp,
        action: input.action,
        operator: input.operator,
        agentId: input.agentId,
        agentNumber: input.agentNumber,
        justification: input.justification,
        performanceImpact: input.performanceImpact,
        securityImplications: input.securityImplications,
        scientistId: this.scientistId,
        metadata: input.metadata,
        previousChecksum: this.lastChecksum,
      };

      const checksum = this.computeChecksum(entryContent);
      const entry: AuditEntry = { ...entryContent, checksum };

      fs.appendFileSync(this.auditLogPath, JSON.stringify(entry) + '\n', 'utf8');
      this.lastChecksum = checksum;

      return entry;
    } catch (error) {
      logger.error('Failed to write audit entry synchronously', {
        error: error instanceof Error ? error.message : String(error),
        action: input.action,
      });
      return null;
    }
  }

  /**
   * Read all audit entries from the log file.
   * Validates chain integrity on read.
   */
  async readAllEntries(): Promise<AuditEntry[]> {
    if (!fs.existsSync(this.auditLogPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.auditLogPath, 'utf8');
      const lines = content.trim().split('\n').filter((line) => line.trim().length > 0);

      return lines.map((line, idx) => {
        try {
          return JSON.parse(line) as AuditEntry;
        } catch {
          throw new IOError(`Failed to parse audit entry at line ${idx + 1}`, {
            line: idx + 1,
            content: line.substring(0, 100),
          });
        }
      });
    } catch (error) {
      if (error instanceof IOError) throw error;
      throw new IOError('Failed to read audit log', {
        path: this.auditLogPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Verify chain integrity of all audit entries.
   * Each entry's previousChecksum must match the prior entry's checksum.
   *
   * ALGORITHM: Blockchain-style hash chaining
   * SOURCE: NIST SP 800-53 AU-9 (Protection of Audit Information)
   */
  async verifyChainIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    invalidEntries: number[];
    errors: string[];
  }> {
    const entries = await this.readAllEntries();
    const errors: string[] = [];
    const invalidEntries: number[] = [];

    if (entries.length === 0) {
      return { valid: true, totalEntries: 0, invalidEntries: [], errors: [] };
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const { checksum: storedChecksum, ...entryWithoutChecksum } = entry;
      const computedChecksum = this.computeChecksum(entryWithoutChecksum);

      if (computedChecksum !== storedChecksum) {
        errors.push(`Entry ${i + 1} (${entry.id}): checksum mismatch. Possible tampering.`);
        invalidEntries.push(i + 1);
      }

      if (i > 0) {
        const prevEntry = entries[i - 1];
        if (entry.previousChecksum !== prevEntry.checksum) {
          errors.push(
            `Entry ${i + 1} (${entry.id}): hash chain broken. Previous checksum mismatch.`,
          );
          invalidEntries.push(i + 1);
        }
      }
    }

    const valid = errors.length === 0;

    if (!valid) {
      logger.critical('Audit chain integrity violation detected', {
        invalidEntries,
        errors,
        totalEntries: entries.length,
      });

      throw new SecurityError('Audit log chain integrity violation detected', {
        invalidEntries,
        errors,
        totalEntries: entries.length,
      });
    }

    logger.info(`Audit chain verified: ${entries.length} entries, all valid`);

    return { valid, totalEntries: entries.length, invalidEntries, errors };
  }

  /**
   * Query audit entries by action type and optional agent ID.
   */
  async queryEntries(filter: {
    action?: AuditAction;
    agentId?: string;
    fromTimestamp?: string;
    toTimestamp?: string;
  }): Promise<AuditEntry[]> {
    const entries = await this.readAllEntries();

    return entries.filter((entry) => {
      if (filter.action && entry.action !== filter.action) return false;
      if (filter.agentId && entry.agentId !== filter.agentId) return false;
      if (filter.fromTimestamp && entry.timestamp < filter.fromTimestamp) return false;
      if (filter.toTimestamp && entry.timestamp > filter.toTimestamp) return false;
      return true;
    });
  }

  /**
   * Compute SHA-256 checksum of an object.
   * Sorts keys for deterministic serialization.
   *
   * SOURCE: NIST FIPS 180-4 (Secure Hash Standard)
   */
  private computeChecksum(data: Record<string, unknown>): string {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  private async writeEntry(entry: AuditEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        fs.appendFileSync(this.auditLogPath, JSON.stringify(entry) + '\n', 'utf8');
        resolve();
      } catch (error) {
        reject(
          new IOError('Failed to write audit entry', {
            path: this.auditLogPath,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    });
  }

  private loadLastChecksum(): string {
    if (!fs.existsSync(this.auditLogPath)) {
      return 'GENESIS';
    }

    try {
      const content = fs.readFileSync(this.auditLogPath, 'utf8');
      const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);
      if (lines.length === 0) return 'GENESIS';

      const lastLine = lines[lines.length - 1];
      const lastEntry = JSON.parse(lastLine) as AuditEntry;
      return lastEntry.checksum;
    } catch {
      logger.warn('Could not load last checksum, starting new chain', {
        path: this.auditLogPath,
      });
      return 'GENESIS';
    }
  }

  /**
   * Get audit log statistics.
   */
  async getStatistics(): Promise<{
    totalEntries: number;
    actionCounts: Record<string, number>;
    firstEntry?: string;
    lastEntry?: string;
  }> {
    const entries = await this.readAllEntries();

    const actionCounts: Record<string, number> = {};
    for (const entry of entries) {
      actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;
    }

    return {
      totalEntries: entries.length,
      actionCounts,
      firstEntry: entries[0]?.timestamp,
      lastEntry: entries[entries.length - 1]?.timestamp,
    };
  }
}

export default AuditSystem;
