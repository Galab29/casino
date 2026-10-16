import crypto from 'node:crypto';

/**
 * Genera un código de recarga con formato ROYAL-XXXX-XXXX-XXXX
 * Utiliza caracteres alfanuméricos en mayúscula excluyendo caracteres ambiguos (0, O, 1, I).
 */
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateSingleCode(): string {
  const parts: string[] = ['ROYAL'];
  for (let p = 0; p < 3; p++) {
    let block = '';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      block += CHARSET[bytes[i] % CHARSET.length];
    }
    parts.push(block);
  }
  return parts.join('-');
}

export function generateBatchCodes(count: number): string[] {
  const set = new Set<string>();
  const maxAttempts = count * 5;
  let attempts = 0;
  while (set.size < count && attempts < maxAttempts) {
    attempts++;
    set.add(generateSingleCode());
  }
  return Array.from(set);
}
