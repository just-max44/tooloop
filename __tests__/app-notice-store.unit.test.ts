import {
  getAppNoticeSnapshot,
  hideAppNotice,
  showAppErrorNotice,
  showAppNotice,
} from '@/stores/app-notice-store';

describe('app-notice-store', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    hideAppNotice();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    hideAppNotice();
  });

  it('shows a trimmed notice message with default tone', () => {
    showAppNotice('   Bonjour   ');

    const snapshot = getAppNoticeSnapshot();
    expect(snapshot.visible).toBe(true);
    expect(snapshot.message).toBe('Bonjour');
    expect(snapshot.tone).toBe('info');
  });

  it('ignores empty notice messages', () => {
    showAppNotice('   ');

    const snapshot = getAppNoticeSnapshot();
    expect(snapshot.visible).toBe(false);
    expect(snapshot.message).toBe('');
    expect(snapshot.tone).toBe('info');
  });

  it('auto-hides notice after provided duration', () => {
    showAppNotice('Chargement terminé', 'success', 1000);
    expect(getAppNoticeSnapshot().visible).toBe(true);

    jest.advanceTimersByTime(1000);

    expect(getAppNoticeSnapshot().visible).toBe(false);
  });

  it('keeps notice visible when duration is non-positive', () => {
    showAppNotice('Mode persistant', 'warning', 0);

    jest.advanceTimersByTime(5000);

    const snapshot = getAppNoticeSnapshot();
    expect(snapshot.visible).toBe(true);
    expect(snapshot.message).toBe('Mode persistant');
    expect(snapshot.tone).toBe('warning');
  });

  it('uses error message when available', () => {
    showAppErrorNotice(new Error('Erreur backend explicite'));

    const snapshot = getAppNoticeSnapshot();
    expect(snapshot.visible).toBe(true);
    expect(snapshot.message).toBe('Erreur backend explicite');
    expect(snapshot.tone).toBe('error');
  });

  it('uses fallback error message for unknown error values', () => {
    showAppErrorNotice('backend-down', 'Message fallback');

    const snapshot = getAppNoticeSnapshot();
    expect(snapshot.visible).toBe(true);
    expect(snapshot.message).toBe('Message fallback');
    expect(snapshot.tone).toBe('error');
  });
});
