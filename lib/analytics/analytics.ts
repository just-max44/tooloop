// lib/analytics/analytics.ts
// Simple analytics integration (Expo + custom events)

import * as Analytics from 'expo-firebase-analytics';
import { logError, logInfo, logWarn } from '@/lib/log/logger';

type AnalyticsParamValue = string | number | boolean;

export type AnalyticsAlert = {
  type: 'analytics_delivery_failure';
  severity: 'warning' | 'critical';
  failureStreak: number;
  threshold: number;
  operation: 'trackEvent' | 'trackScreen';
  eventName: string;
  timestamp: string;
};

type AnalyticsMonitoringOptions = {
  failureThreshold?: number;
  onAlert?: (alert: AnalyticsAlert) => void;
};

const DEFAULT_FAILURE_THRESHOLD = 3;

let failureStreak = 0;
let alertCount = 0;
let failureThreshold = DEFAULT_FAILURE_THRESHOLD;
let onAlertHandler: ((alert: AnalyticsAlert) => void) | null = null;

function emitAlert(operation: 'trackEvent' | 'trackScreen', eventName: string) {
  const alert: AnalyticsAlert = {
    type: 'analytics_delivery_failure',
    severity: failureStreak >= failureThreshold * 2 ? 'critical' : 'warning',
    failureStreak,
    threshold: failureThreshold,
    operation,
    eventName,
    timestamp: new Date().toISOString(),
  };

  alertCount += 1;

  if (onAlertHandler) {
    onAlertHandler(alert);
    return;
  }

  logError('Analytics delivery alert', alert);
}

function registerFailure(operation: 'trackEvent' | 'trackScreen', eventName: string, error: unknown, params?: Record<string, AnalyticsParamValue>) {
  failureStreak += 1;

  logWarn('Analytics delivery failed', {
    operation,
    eventName,
    failureStreak,
    params,
    error: error instanceof Error ? error.message : 'unknown_error',
  });

  if (failureStreak >= failureThreshold) {
    emitAlert(operation, eventName);
  }
}

function registerSuccess(operation: 'trackEvent' | 'trackScreen', eventName: string) {
  if (failureStreak > 0) {
    logInfo('Analytics delivery recovered', {
      operation,
      eventName,
      previousFailureStreak: failureStreak,
    });
  }

  failureStreak = 0;
}

export function configureAnalyticsMonitoring(options: AnalyticsMonitoringOptions = {}) {
  failureThreshold = Math.max(1, options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD);
  onAlertHandler = options.onAlert ?? null;
}

export function getAnalyticsMonitoringSnapshot() {
  return {
    failureStreak,
    alertCount,
    failureThreshold,
  };
}

export function resetAnalyticsMonitoring() {
  failureStreak = 0;
  alertCount = 0;
  failureThreshold = DEFAULT_FAILURE_THRESHOLD;
  onAlertHandler = null;
}

export async function trackEvent(event: string, params?: Record<string, AnalyticsParamValue>) {
  try {
    await Analytics.logEvent(event, params);
    registerSuccess('trackEvent', event);
  } catch (error) {
    registerFailure('trackEvent', event, error, params);
  }
}

export async function trackScreen(screenName: string) {
  try {
    await Analytics.logEvent('screen_view', { screen_name: screenName });
    registerSuccess('trackScreen', 'screen_view');
  } catch (error) {
    registerFailure('trackScreen', 'screen_view', error, { screen_name: screenName });
  }
}

// Usage example:
// trackEvent('listing_viewed', { id: '123', category: 'Outils' });
// trackScreen('Explore');
