/* eslint-disable @typescript-eslint/no-require-imports */

const mockLogEvent = jest.fn();
const mockLogError = jest.fn();
const mockLogWarn = jest.fn();
const mockLogInfo = jest.fn();

jest.mock('expo-firebase-analytics', () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

jest.mock('@/lib/log/logger', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
  logWarn: (...args: unknown[]) => mockLogWarn(...args),
  logInfo: (...args: unknown[]) => mockLogInfo(...args),
}));

const {
  configureAnalyticsMonitoring,
  getAnalyticsMonitoringSnapshot,
  resetAnalyticsMonitoring,
  trackEvent,
  trackScreen,
} = require('@/lib/analytics/analytics');

describe('analytics monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAnalyticsMonitoring();
  });

  it('emits an alert when failure threshold is reached', async () => {
    const alerts: unknown[] = [];
    configureAnalyticsMonitoring({
      failureThreshold: 2,
      onAlert: (alert: unknown) => alerts.push(alert),
    });

    mockLogEvent.mockRejectedValue(new Error('network_down'));

    await trackEvent('listing_created', { category: 'Bricolage' });
    await trackEvent('listing_created', { category: 'Bricolage' });

    const snapshot = getAnalyticsMonitoringSnapshot();

    expect(snapshot.failureStreak).toBe(2);
    expect(snapshot.alertCount).toBe(1);
    expect(alerts).toHaveLength(1);
    expect(mockLogWarn).toHaveBeenCalledTimes(2);
  });

  it('resets failure streak after a successful event', async () => {
    mockLogEvent
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(undefined);

    await trackEvent('loan_requested', { source: 'card' });
    await trackScreen('Inbox');

    const snapshot = getAnalyticsMonitoringSnapshot();

    expect(snapshot.failureStreak).toBe(0);
    expect(snapshot.alertCount).toBe(0);
    expect(mockLogInfo).toHaveBeenCalledTimes(1);
    expect(mockLogError).not.toHaveBeenCalled();
  });
});