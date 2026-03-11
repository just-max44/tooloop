// lib/log/logger.ts
// Structured logger for app events, errors, and monitoring

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  // For now, print to console. Later: send to remote, file, etc.
  if (level === 'error') {
    console.error('[LOG]', entry);
  } else if (level === 'warn') {
    console.warn('[LOG]', entry);
  } else {
    console.log('[LOG]', entry);
  }
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  log('info', message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  log('warn', message, context);
}

export function logError(message: string, context?: Record<string, unknown>) {
  log('error', message, context);
}

export function logDebug(message: string, context?: Record<string, unknown>) {
  log('debug', message, context);
}
