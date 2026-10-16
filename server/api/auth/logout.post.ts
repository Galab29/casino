import { defineEventHandler } from 'h3';
import { clearUserSession } from '../../utils/auth';

export default defineEventHandler((event) => {
  clearUserSession(event);
  return {
    success: true,
    message: 'Sesión cerrada',
  };
});
