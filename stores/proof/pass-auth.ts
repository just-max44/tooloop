import type { ExchangePass } from '@/lib/backend/data';

export type ExchangeStep = 'pickup' | 'return';

export type ExchangeQrPayload = {
  type: 'tooloop-pass-step';
  version: 1;
  loanId: string;
  step: ExchangeStep;
  verifierCode: string;
  codeSeed: string;
};

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) & 0xffffffff;
  }
  return Math.abs(hash);
}

function buildStepSeed(seed: string, step: ExchangeStep) {
  return `${seed}-${step.toUpperCase()}`;
}

export function getStepVerifierCode(seed: string, step: ExchangeStep) {
  const stepSeed = buildStepSeed(seed, step);
  const hashed = hashSeed(stepSeed);
  const base36 = hashed.toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return base36.padEnd(4, '0').slice(0, 4);
}

export function getStepQrPayload(pass: ExchangePass, step: ExchangeStep): ExchangeQrPayload {
  return {
    type: 'tooloop-pass-step',
    version: 1,
    loanId: pass.loanId,
    step,
    verifierCode: getStepVerifierCode(pass.codeSeed, step),
    codeSeed: buildStepSeed(pass.codeSeed, step),
  };
}

export function isExchangeQrPayload(value: unknown): value is ExchangeQrPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<ExchangeQrPayload>;
  return (
    payload.type === 'tooloop-pass-step' &&
    payload.version === 1 &&
    (payload.step === 'pickup' || payload.step === 'return') &&
    typeof payload.loanId === 'string' &&
    typeof payload.verifierCode === 'string' &&
    typeof payload.codeSeed === 'string'
  );
}
