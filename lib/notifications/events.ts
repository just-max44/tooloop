import { isNotificationAllowedForType, sendLocalNotification, type NotificationEventType } from '@/lib/notifications/service';

type NotificationEventPayload = {
  type: NotificationEventType;
  loanId: string;
  objectName: string;
  otherUserName: string;
};

function resolveNotificationCopy(payload: NotificationEventPayload) {
  if (payload.type === 'new_message_received') {
    return {
      title: 'Nouveau message reçu',
      body: `${payload.otherUserName} t’a écrit à propos de ${payload.objectName}.`,
    };
  }

  if (payload.type === 'loan_request_accepted') {
    return {
      title: 'Demande acceptée',
      body: `Bonne nouvelle: la demande pour ${payload.objectName} est acceptée.`,
    };
  }

  return {
    title: 'Retour prévu demain',
    body: `Rappel: retour prévu demain pour ${payload.objectName}.`,
  };
}

export async function notifyEvent(payload: NotificationEventPayload) {
  const allowed = await isNotificationAllowedForType(payload.type);
  if (!allowed) {
    return;
  }

  const copy = resolveNotificationCopy(payload);

  await sendLocalNotification(copy.title, copy.body, {
    type: payload.type,
    loanId: payload.loanId,
  }, payload.type).catch(() => {});
}
