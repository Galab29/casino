import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { getDatabase } from '../../../../utils/db';
import { requireAdmin } from '../../../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);
  const newStatus = body?.status;

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de código inválido.',
    });
  }

  if (!['active', 'disabled'].includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Estado inválido. Solo se puede alternar entre active y disabled.',
    });
  }

  const db = getDatabase();
  const selectStmt = db.prepare('SELECT * FROM recharge_codes WHERE id = ?');
  const code = selectStmt.get(id) as any;

  if (!code) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Código no encontrado.',
    });
  }

  if (code.status === 'redeemed') {
    throw createError({
      statusCode: 400,
      statusMessage: 'No se puede modificar un código que ya ha sido canjeado.',
    });
  }

  const updateStmt = db.prepare('UPDATE recharge_codes SET status = ? WHERE id = ?');
  updateStmt.run(newStatus, id);

  return {
    success: true,
    message: `Código ${code.code} cambiado a estado ${newStatus === 'disabled' ? 'Desactivado' : 'Activo'}.`,
    id,
    status: newStatus,
  };
});
