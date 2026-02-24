type PickupAgreement = {
  returnDateISO: string | null;
  borrowerAccepted: boolean;
  pickupAcceptedAtISO: string | null;
};

type ReturnAgreement = {
  handbackDateISO: string | null;
  borrowerAccepted: boolean;
  lenderCondition: 'conforme' | 'partiel' | 'abime' | null;
  returnAcceptedAtISO: string | null;
};

const agreementByLoanId: Record<string, PickupAgreement> = {};
const returnAgreementByLoanId: Record<string, ReturnAgreement> = {};

function getOrCreateAgreement(loanId: string): PickupAgreement {
  if (!agreementByLoanId[loanId]) {
    agreementByLoanId[loanId] = {
      returnDateISO: null,
      borrowerAccepted: false,
      pickupAcceptedAtISO: null,
    };
  }

  return agreementByLoanId[loanId];
}

function getOrCreateReturnAgreement(loanId: string): ReturnAgreement {
  if (!returnAgreementByLoanId[loanId]) {
    returnAgreementByLoanId[loanId] = {
      handbackDateISO: null,
      borrowerAccepted: false,
      lenderCondition: null,
      returnAcceptedAtISO: null,
    };
  }

  return returnAgreementByLoanId[loanId];
}

export function getPickupReturnDateISO(loanId: string) {
  return getOrCreateAgreement(loanId).returnDateISO;
}

export function setPickupReturnDateISO(loanId: string, returnDateISO: string) {
  const previous = getOrCreateAgreement(loanId);
  const didDateChange = previous.returnDateISO !== returnDateISO;

  agreementByLoanId[loanId] = {
    returnDateISO,
    borrowerAccepted: didDateChange ? false : previous.borrowerAccepted,
    pickupAcceptedAtISO: didDateChange ? null : previous.pickupAcceptedAtISO,
  };
}

export function isBorrowerPickupAccepted(loanId: string) {
  return getOrCreateAgreement(loanId).borrowerAccepted;
}

export function setBorrowerPickupAccepted(loanId: string, value: boolean) {
  const current = getOrCreateAgreement(loanId);
  agreementByLoanId[loanId] = {
    ...current,
    borrowerAccepted: value,
    pickupAcceptedAtISO: value ? new Date().toISOString() : null,
  };
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
  return getOrCreateReturnAgreement(loanId).handbackDateISO;
}

export function setReturnHandbackDateISO(loanId: string, handbackDateISO: string) {
  const previous = getOrCreateReturnAgreement(loanId);
  const didDateChange = previous.handbackDateISO !== handbackDateISO;

  returnAgreementByLoanId[loanId] = {
    handbackDateISO,
    borrowerAccepted: didDateChange ? false : previous.borrowerAccepted,
    lenderCondition: previous.lenderCondition,
    returnAcceptedAtISO: didDateChange ? null : previous.returnAcceptedAtISO,
  };
}

export function isBorrowerReturnAccepted(loanId: string) {
  return getOrCreateReturnAgreement(loanId).borrowerAccepted;
}

export function setBorrowerReturnAccepted(loanId: string, value: boolean) {
  const current = getOrCreateReturnAgreement(loanId);
  returnAgreementByLoanId[loanId] = {
    ...current,
    borrowerAccepted: value,
    returnAcceptedAtISO: value ? new Date().toISOString() : null,
  };
}

export function getReturnCondition(loanId: string) {
  return getOrCreateReturnAgreement(loanId).lenderCondition;
}

export function setReturnCondition(loanId: string, condition: 'conforme' | 'partiel' | 'abime') {
  const current = getOrCreateReturnAgreement(loanId);
  const didConditionChange = current.lenderCondition !== condition;

  returnAgreementByLoanId[loanId] = {
    ...current,
    lenderCondition: condition,
    borrowerAccepted: didConditionChange ? false : current.borrowerAccepted,
    returnAcceptedAtISO: didConditionChange ? null : current.returnAcceptedAtISO,
  };
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
  const acceptedAtISO = getOrCreateAgreement(loanId).pickupAcceptedAtISO;
  if (!acceptedAtISO) {
    return '';
  }

  return formatReturnDateLabel(acceptedAtISO);
}

export function getReturnAcceptedAtLabel(loanId: string) {
  const acceptedAtISO = getOrCreateReturnAgreement(loanId).returnAcceptedAtISO;
  if (!acceptedAtISO) {
    return '';
  }

  return formatReturnDateLabel(acceptedAtISO);
}
