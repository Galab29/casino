import { defineEventHandler, readBody, createError } from 'h3';
import { getDatabase, verifyPassword } from '../../utils/db';
import { setUserSession } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const username = String(body?.username || '').trim();
  const password = String(body?.password || '');

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nombre de usuario y contraseña requeridos',
    });
  }

  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE');
  const user = stmt.get(username) as any;

  if (!user || !user.password_hash) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas',
    });
  }

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas',
    });
  }

  // Establecer sesión
  setUserSession(event, user.id);

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      chips: user.chips,
      role: user.role,
    },
  };
});
