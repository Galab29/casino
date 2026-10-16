import { getDatabase } from './db';
import type { H3Event } from 'h3';

/**
 * Control de fuerza bruta para canje de códigos:
 * Máximo 5 intentos fallidos en los últimos 10 minutos por IP o usuario.
 * Si se supera, se bloquea por 5 minutos.
 */
export function checkRedeemRateLimit(event: H3Event, userId?: number): { allowed: boolean; retryAfterSeconds?: number } {
  const db = getDatabase();
  const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1';
  const now = Math.floor(Date.now() / 1000);
  const tenMinutesAgo = now - 600;

  // Buscar intentos fallidos recientes
  const stmt = db.prepare(`
    SELECT created_at FROM redeem_attempts
    WHERE (ip_address = ? OR (user_id IS NOT NULL AND user_id = ?))
      AND success = 0
      AND created_at >= ?
    ORDER BY created_at DESC
  `);
  
  const recentFailures = stmt.all(ip, userId ?? -1, tenMinutesAgo) as Array<{ created_at: number }>;

  if (recentFailures.length >= 5) {
    // Tomar el más reciente y ver si han pasado 5 minutos (300 seg)
    const latest = recentFailures[0].created_at;
    const cooldown = 300;
    const elapsed = now - latest;
    if (elapsed < cooldown) {
      return {
        allowed: false,
        retryAfterSeconds: cooldown - elapsed,
      };
    }
  }

  return { allowed: true };
}

export function recordRedeemAttempt(event: H3Event, userId: number | undefined, code: string, success: boolean) {
  try {
    const db = getDatabase();
    const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1';
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      INSERT INTO redeem_attempts (ip_address, user_id, code_attempted, success, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(ip, userId ?? null, code.substring(0, 50), success ? 1 : 0, now);
  } catch (err) {
    console.error('Error recording redeem attempt:', err);
  }
}
