import { useSyncExternalStore } from 'react';

export type AppNoticeTone = 'info' | 'success' | 'warning' | 'error';

type AppNoticeState = {
  visible: boolean;
  message: string;
  tone: AppNoticeTone;
};

let state: AppNoticeState = {
  visible: false,
  message: '',
  tone: 'info',
};

let hideTimeout: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeAppNotice(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAppNoticeSnapshot() {
  return state;
}

export function useAppNotice() {
  return useSyncExternalStore(subscribeAppNotice, getAppNoticeSnapshot, getAppNoticeSnapshot);
}

export function hideAppNotice() {
  if (!state.visible) {
    return;
  }

  state = {
    ...state,
    visible: false,
  };
  emit();
}

export function showAppNotice(message: string, tone: AppNoticeTone = 'info', durationMs = 2600) {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  state = {
    visible: true,
    message,
    tone,
  };
  emit();

  hideTimeout = setTimeout(() => {
    hideAppNotice();
  }, durationMs);
}
