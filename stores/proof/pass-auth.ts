import type { ExchangePass } from '@/lib/backend/data';

export type ExchangeStep = 'pickup' | 'return';

export type ExchangeQrPayload = {
  type: 'tooloop-pass-step';
  version: 1;
  loanId: string;
  step: ExchangeStep;
  verifierCode: string;
  signature: string;
};

function buildStepSeed(seed: string, step: ExchangeStep) {
  return `${seed}-${step.toUpperCase()}`;
}

/**
 * Derive a verifier code from the codeSeed + step.
 * Uses a stronger hash (FNV-1a 32-bit) producing an 8-char hex code.
 */
function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getStepVerifierCode(seed: string, step: ExchangeStep) {
  const stepSeed = buildStepSeed(seed, step);
  const hash = fnv1aHash(stepSeed);
  return hash.toString(16).toUpperCase().padStart(8, '0');
}

export function getStepQrPayload(pass: ExchangePass, step: ExchangeStep): ExchangeQrPayload {
  const verifierCode = getStepVerifierCode(pass.codeSeed, step);
  // Signature = second hash combining loanId + verifierCode + seed for tamper detection
  const rawSignature = `${pass.loanId}:${verifierCode}:${pass.codeSeed}`;
  const signature = fnv1aHash(rawSignature).toString(16).toUpperCase().padStart(8, '0');

  return {
    type: 'tooloop-pass-step',
    version: 1,
    loanId: pass.loanId,
    step,
    verifierCode,
    signature,
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
    typeof payload.signature === 'string'
  );
}

export function validateQrPayload(payload: ExchangeQrPayload, pass: ExchangePass): boolean {
  const expectedCode = getStepVerifierCode(pass.codeSeed, payload.step);
  if (payload.verifierCode !== expectedCode) {
    return false;
  }

  const rawSignature = `${payload.loanId}:${payload.verifierCode}:${pass.codeSeed}`;
  const expectedSignature = fnv1aHash(rawSignature).toString(16).toUpperCase().padStart(8, '0');
  return payload.signature === expectedSignature;
}
