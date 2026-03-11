import { getInboxLoans, getLoanProofState, persistLoanProofStateRemote, setLoanProofStateLocal } from '@/lib/backend/data';
import { scheduleReturnReminderNotification } from '@/lib/notifications/service';

export function getPickupReturnDateISO(loanId: string) {
  return getLoanProofState(loanId).pickupReturnDateISO;
}

export function setPickupReturnDateISO(loanId: string, returnDateISO: string) {
  const previous = getLoanProofState(loanId);
  const didDateChange = previous.pickupReturnDateISO !== returnDateISO;

  const patch = {
    pickupReturnDateISO: returnDateISO,
    borrowerPickupAccepted: didDateChange ? false : previous.borrowerPickupAccepted,
    pickupAcceptedAtISO: didDateChange ? null : previous.pickupAcceptedAtISO,
  };

  setLoanProofStateLocal(loanId, patch);
  void persistLoanProofStateRemote(loanId, patch);

  const relatedLoan = getInboxLoans().find((item) => item.id === loanId);
  if (!relatedLoan) {
    return;
  }

  void scheduleReturnReminderNotification({
    loanId,
    objectName: relatedLoan.objectName,
    otherUserName: relatedLoan.otherUserName,
    returnDateISO,
  });
}

export function isBorrowerPickupAccepted(loanId: string) {
  return getLoanProofState(loanId).borrowerPickupAccepted;
}

export function setBorrowerPickupAccepted(loanId: string, value: boolean) {
  const patch = {
    borrowerPickupAccepted: value,
    pickupAcceptedAtISO: value ? new Date().toISOString() : null,
  };
  setLoanProofStateLocal(loanId, patch);
  void persistLoanProofStateRemote(loanId, patch);
}

export function formatReturnDateLabel(returnDateISO: string) {
  const parsed = new Date(returnDateISO);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date invalide';
  }

  return parsed.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function getPickupReturnDateLabel(loanId: string) {
  const returnDateISO = getPickupReturnDateISO(loanId);
  if (!returnDateISO) {
    return '';
  }

  return formatReturnDateLabel(returnDateISO);
}

export function getReturnHandbackDateISO(loanId: string) {
  return getLoanProofState(loanId).returnHandbackDateISO;
}

export function setReturnHandbackDateISO(loanId: string, handbackDateISO: string) {
  const previous = getLoanProofState(loanId);
  const didDateChange = previous.returnHandbackDateISO !== handbackDateISO;

  const patch = {
    returnHandbackDateISO: handbackDateISO,
    borrowerReturnAccepted: didDateChange ? false : previous.borrowerReturnAccepted,
    returnAcceptedAtISO: didDateChange ? null : previous.returnAcceptedAtISO,
  };

  setLoanProofStateLocal(loanId, patch);
  void persistLoanProofStateRemote(loanId, patch);
}

export function isBorrowerReturnAccepted(loanId: string) {
  return getLoanProofState(loanId).borrowerReturnAccepted;
}

export function setBorrowerReturnAccepted(loanId: string, value: boolean) {
  const patch = {
    borrowerReturnAccepted: value,
    returnAcceptedAtISO: value ? new Date().toISOString() : null,
  };
  setLoanProofStateLocal(loanId, patch);
  void persistLoanProofStateRemote(loanId, patch);
}

export function getReturnCondition(loanId: string) {
  return getLoanProofState(loanId).lenderCondition;
}

export function setReturnCondition(loanId: string, condition: 'conforme' | 'partiel' | 'abime') {
  const current = getLoanProofState(loanId);
  const didConditionChange = current.lenderCondition !== condition;

  const patch = {
    lenderCondition: condition,
    borrowerReturnAccepted: didConditionChange ? false : current.borrowerReturnAccepted,
    returnAcceptedAtISO: didConditionChange ? null : current.returnAcceptedAtISO,
  };

  setLoanProofStateLocal(loanId, patch);
  void persistLoanProofStateRemote(loanId, patch);
}

export function getReturnConditionLabel(loanId: string) {
  const value = getReturnCondition(loanId);
  if (value === 'conforme') {
    return 'Conforme';
  }

  if (value === 'partiel') {
    return 'Partiellement conforme';
  }

  if (value === 'abime') {
    return 'Abîmé';
  }

  return '';
}

export function getReturnHandbackDateLabel(loanId: string) {
  const handbackDateISO = getReturnHandbackDateISO(loanId);
  if (!handbackDateISO) {
    return '';
  }

  return formatReturnDateLabel(handbackDateISO);
}

export function getPickupAcceptedAtLabel(loanId: string) {
  const acceptedAtISO = getLoanProofState(loanId).pickupAcceptedAtISO;
  if (!acceptedAtISO) {
    return '';
  }

  return formatReturnDateLabel(acceptedAtISO);
}

export function getReturnAcceptedAtLabel(loanId: string) {
  const acceptedAtISO = getLoanProofState(loanId).returnAcceptedAtISO;
  if (!acceptedAtISO) {
    return '';
  }

  return formatReturnDateLabel(acceptedAtISO);
}
