import { defineEventHandler, readBody, createError } from 'h3';
import { getDatabase } from '../../utils/db';
import { getCurrentUser } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  const body = await readBody(event);
  const chips = Number(body?.chips);

  if (isNaN(chips) || chips < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Monto de fichas inválido',
    });
  }

  const db = getDatabase();
  const stmt = db.prepare('UPDATE users SET chips = ? WHERE id = ?');
  stmt.run(Math.floor(chips), user.id);

  return {
    success: true,
    chips: Math.floor(chips),
  };
});
