import { defineEventHandler, readBody, createError } from 'h3';
import { getDatabase } from '../../utils/db';
import { requireAdmin } from '../../utils/auth';
import { generateBatchCodes } from '../../utils/codeGenerator';

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody(event);

  const amount = Number(body?.amount);
  const count = Math.min(Math.max(Number(body?.count) || 1, 1), 50); // Entre 1 y 50 códigos por lote
  const expiresInHours = body?.expiresInHours ? Number(body.expiresInHours) : null;

  if (!amount || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El monto en fichas debe ser un entero positivo válido.',
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = expiresInHours && expiresInHours > 0 ? now + expiresInHours * 3600 : null;

  const codesToInsert = generateBatchCodes(count);
  const db = getDatabase();

  const insertStmt = db.prepare(`
    INSERT INTO recharge_codes (code, amount, status, created_by, created_at, expires_at)
    VALUES (?, ?, 'active', ?, ?, ?)
  `);

  const createdList: any[] = [];

  try {
    db.exec('BEGIN TRANSACTION');
    for (const code of codesToInsert) {
      const res = insertStmt.run(code, amount, admin.id, now, expiresAt);
      createdList.push({
        id: Number(res.lastInsertRowid),
        code,
        amount,
        status: 'active',
        createdAt: now,
        expiresAt,
        createdBy: admin.username,
        redeemedBy: null,
      });
    }
    db.exec('COMMIT');
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {}
    console.error('Error generating codes:', err);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno al generar los códigos.',
    });
  }

  return {
    success: true,
    message: `Se ${count === 1 ? 'ha generado 1 código' : `han generado ${count} códigos`} de ${amount.toLocaleString()} fichas.`,
    codes: createdList,
  };
});
