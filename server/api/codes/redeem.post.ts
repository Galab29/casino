import { defineEventHandler, readBody, createError } from 'h3';
import { getDatabase } from '../../utils/db';
import { getCurrentUser } from '../../utils/auth';
import { checkRedeemRateLimit, recordRedeemAttempt } from '../../utils/rateLimit';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);

  // Rate limiting contra fuerza bruta
  const rateLimit = checkRedeemRateLimit(event, user.id);
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: `Demasiados intentos fallidos. Por seguridad, espera ${Math.ceil(
        (rateLimit.retryAfterSeconds || 60) / 60
      )} minuto(s) antes de intentar de nuevo.`,
    });
  }

  const body = await readBody(event);
  const rawCode = String(body?.code || '').trim().toUpperCase();

  if (!rawCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Por favor, ingresa un código de recarga.',
    });
  }

  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  // Ejecución atómica usando transacción SQLite
  try {
    db.exec('BEGIN IMMEDIATE');

    const selectStmt = db.prepare('SELECT * FROM recharge_codes WHERE code = ?');
    const codeRecord = selectStmt.get(rawCode) as any;

    if (!codeRecord) {
      db.exec('ROLLBACK');
      recordRedeemAttempt(event, user.id, rawCode, false);
      throw createError({
        statusCode: 404,
        statusMessage: 'El código ingresado es incorrecto o no existe.',
      });
    }

    if (codeRecord.status === 'disabled') {
      db.exec('ROLLBACK');
      recordRedeemAttempt(event, user.id, rawCode, false);
      throw createError({
        statusCode: 400,
        statusMessage: 'Este código ha sido desactivado por la administración.',
      });
    }

    if (codeRecord.status === 'redeemed') {
      db.exec('ROLLBACK');
      recordRedeemAttempt(event, user.id, rawCode, false);
      throw createError({
        statusCode: 400,
        statusMessage: 'Este código ya ha sido canjeado anteriormente.',
      });
    }

    if (codeRecord.expires_at && codeRecord.expires_at < now) {
      // Actualizar estado a expired
      const updateExp = db.prepare("UPDATE recharge_codes SET status = 'expired' WHERE id = ?");
      updateExp.run(codeRecord.id);
      db.exec('COMMIT');
      recordRedeemAttempt(event, user.id, rawCode, false);
      throw createError({
        statusCode: 400,
        statusMessage: 'Este código ha caducado y no tiene validez.',
      });
    }

    if (codeRecord.status !== 'active') {
      db.exec('ROLLBACK');
      recordRedeemAttempt(event, user.id, rawCode, false);
      throw createError({
        statusCode: 400,
        statusMessage: 'Este código no se encuentra disponible para canje.',
      });
    }

    // Código válido -> Canjear
    const updateCodeStmt = db.prepare(`
      UPDATE recharge_codes 
      SET status = 'redeemed', redeemed_by = ?, redeemed_at = ?
      WHERE id = ? AND status = 'active'
    `);
    const codeResult = updateCodeStmt.run(user.id, now, codeRecord.id);

    if (codeResult.changes === 0) {
      db.exec('ROLLBACK');
      recordRedeemAttempt(event, user.id, rawCode, false);
      throw createError({
        statusCode: 409,
        statusMessage: 'El código ya fue canjeado en otra solicitud concurrente.',
      });
    }

    // Incrementar saldo del usuario
    const updateUserStmt = db.prepare(`
      UPDATE users 
      SET chips = chips + ?
      WHERE id = ?
    `);
    updateUserStmt.run(codeRecord.amount, user.id);

    // Obtener nuevo saldo
    const userRow = db.prepare('SELECT chips FROM users WHERE id = ?').get(user.id) as any;
    const newBalance = userRow?.chips ?? (user.chips + codeRecord.amount);

    // Registrar transacción
    const insertTxStmt = db.prepare(`
      INSERT INTO transactions (user_id, code_id, amount, type, description, balance_after, created_at)
      VALUES (?, ?, ?, 'recharge', ?, ?, ?)
    `);
    insertTxStmt.run(
      user.id,
      codeRecord.id,
      codeRecord.amount,
      `Recarga canjeada: ${codeRecord.code} (+${codeRecord.amount.toLocaleString()} fichas)`,
      newBalance,
      now
    );

    db.exec('COMMIT');
    recordRedeemAttempt(event, user.id, rawCode, true);

    return {
      success: true,
      message: `¡Recarga exitosa! Se han añadido ${codeRecord.amount.toLocaleString()} fichas a tu cuenta.`,
      amount: codeRecord.amount,
      newBalance,
    };
  } catch (err: any) {
    try {
      db.exec('ROLLBACK');
    } catch {}
    if (err.statusCode) {
      throw err;
    }
    console.error('Error redeeming code:', err);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno al procesar el canje de código.',
    });
  }
});
