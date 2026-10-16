import { defineEventHandler } from 'h3';
import { getDatabase } from '../../utils/db';
import { getCurrentUser } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT t.id, t.amount, t.type, t.description, t.balance_after, t.created_at, c.code
    FROM transactions t
    LEFT JOIN recharge_codes c ON t.code_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
    LIMIT 50
  `);

  const list = stmt.all(user.id) as any[];

  return {
    success: true,
    transactions: list.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      balanceAfter: tx.balance_after,
      createdAt: tx.created_at,
      code: tx.code,
    })),
  };
});
