import type { ReactNode } from 'react';

const ESCAPED_UNICODE_RE = /\\u([0-9a-fA-F]{4})/g;
const BROKEN_U00_RE = /u00([0-9a-fA-F]{2})/g;

function fromHex(hex: string): string {
  const codePoint = Number.parseInt(hex, 16);
  if (Number.isNaN(codePoint)) {
    return '';
  }
  return String.fromCharCode(codePoint);
}

export function normalizeDisplayText(input: string): string {
  if (!input || (!input.includes('\\u') && !input.includes('u00'))) {
    return input;
  }

  let next = input.replace(ESCAPED_UNICODE_RE, (_, hex: string) => fromHex(hex));
  next = next.replace(BROKEN_U00_RE, (_, hex: string) => fromHex(`00${hex}`));
  return next;
}

export function normalizeTextNode(node: ReactNode): ReactNode {
  if (typeof node === 'string') {
    return normalizeDisplayText(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => normalizeTextNode(child));
  }

  return node;
}