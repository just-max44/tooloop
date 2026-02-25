import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const reminderNotificationByLoanId: Record<string, string> = {};
const NOTIFICATIONS_ENABLED_KEY = 'tooloop.notifications.enabled';
const FIRST_LOGIN_PROMPT_PREFIX = 'tooloop.notifications.first-login-prompt';
const NOTIFICATION_TYPE_PREFIX = 'tooloop.notifications.type';

export type NotificationEventType =
  | 'new_message_received'
  | 'loan_request_accepted'
  | 'return_due_tomorrow';

const NOTIFICATION_TYPES: NotificationEventType[] = [
  'new_message_received',
  'loan_request_accepted',
  'return_due_tomorrow',
];

function getFirstLoginPromptKey(userId: string) {
  return `${FIRST_LOGIN_PROMPT_PREFIX}.${userId}`;
}

export async function getNotificationsEnabled() {
  if (Platform.OS === 'web') {
    return false;
  }

  const savedValue = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (savedValue === null) {
    return true;
  }

  return savedValue === '1';
}

export async function setNotificationsEnabled(enabled: boolean) {
  if (Platform.OS === 'web') {
    return;
  }

  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? '1' : '0');

  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  }
}

function getNotificationTypeKey(type: NotificationEventType) {
  return `${NOTIFICATION_TYPE_PREFIX}.${type}`;
}

export async function getNotificationTypeEnabled(type: NotificationEventType) {
  if (Platform.OS === 'web') {
    return false;
  }

  const savedValue = await AsyncStorage.getItem(getNotificationTypeKey(type));
  if (savedValue === null) {
    return true;
  }

  return savedValue === '1';
}

export async function setNotificationTypeEnabled(type: NotificationEventType, enabled: boolean) {
  if (Platform.OS === 'web') {
    return;
  }

  await AsyncStorage.setItem(getNotificationTypeKey(type), enabled ? '1' : '0');
}

export async function getNotificationTypePreferences() {
  const entries = await Promise.all(
    NOTIFICATION_TYPES.map(async (type) => [type, await getNotificationTypeEnabled(type)] as const)
  );

  return Object.fromEntries(entries) as Record<NotificationEventType, boolean>;
}

export async function isNotificationAllowedForType(type: NotificationEventType) {
  const globalEnabled = await getNotificationsEnabled();
  if (!globalEnabled) {
    return false;
  }

  return getNotificationTypeEnabled(type);
}

export async function ensureNotificationPermission(requestIfNeeded = false) {
  if (Platform.OS === 'web') {
    return false;
  }

  const notificationsEnabled = await getNotificationsEnabled();
  if (!notificationsEnabled) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  if (!requestIfNeeded) {
    return false;
  }

  const next = await Notifications.requestPermissionsAsync();
  return next.granted || next.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function promptNotificationPermissionOnFirstLogin(userId: string) {
  if (!userId || Platform.OS === 'web') {
    return false;
  }

  const promptKey = getFirstLoginPromptKey(userId);
  const hasAlreadyPrompted = await AsyncStorage.getItem(promptKey);
  if (hasAlreadyPrompted === '1') {
    return false;
  }

  await AsyncStorage.setItem(promptKey, '1');
  return ensureNotificationPermission(true);
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  type?: NotificationEventType
) {
  if (type) {
    const allowed = await isNotificationAllowedForType(type);
    if (!allowed) {
      return;
    }
  }

  const granted = await ensureNotificationPermission(false);
  if (!granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null,
  });
}

export async function scheduleReturnReminderNotification(input: {
  loanId: string;
  objectName: string;
  otherUserName: string;
  returnDateISO: string;
}) {
  const allowed = await isNotificationAllowedForType('return_due_tomorrow');
  if (!allowed) {
    return;
  }

  const granted = await ensureNotificationPermission(false);
  if (!granted) {
    return;
  }

  const parsedDate = new Date(input.returnDateISO);
  if (Number.isNaN(parsedDate.getTime())) {
    return;
  }

  const reminderDate = new Date(parsedDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(9, 0, 0, 0);

  const now = new Date();
  if (reminderDate <= now) {
    return;
  }

  const previousNotificationId = reminderNotificationByLoanId[input.loanId];
  if (previousNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(previousNotificationId).catch(() => {});
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Retour prévu demain',
      body: `${input.objectName} avec ${input.otherUserName} · pense à préparer le retour.`,
      data: {
        type: 'return_due_tomorrow',
        loanId: input.loanId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  reminderNotificationByLoanId[input.loanId] = notificationId;
}
