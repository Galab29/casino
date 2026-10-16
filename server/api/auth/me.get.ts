import { defineEventHandler } from 'h3';
import { getCurrentUser } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
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
