import { defineEventHandler, getQuery } from 'h3';
import { getDatabase } from '../../utils/db';
import { requireAdmin } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = getDatabase();
  const query = getQuery(event);

  const statusFilter = query.status ? String(query.status) : '';
  const search = query.search ? String(query.search).trim() : '';

  let sql = `
    SELECT 
      c.id, c.code, c.amount, c.status, c.created_at, c.expires_at, c.redeemed_at,
      u_creator.username AS created_by_username,
      u_redeemer.username AS redeemed_by_username
    FROM recharge_codes c
    LEFT JOIN users u_creator ON c.created_by = u_creator.id
    LEFT JOIN users u_redeemer ON c.redeemed_by = u_redeemer.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (statusFilter && ['active', 'redeemed', 'disabled', 'expired'].includes(statusFilter)) {
    sql += ' AND c.status = ?';
    params.push(statusFilter);
  }

  if (search) {
    sql += ' AND (c.code LIKE ? OR u_redeemer.username LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY c.created_at DESC LIMIT 200';

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as any[];

  // Actualizar visualmente si alguno expiró en el ínterin
  const now = Math.floor(Date.now() / 1000);
  const formatted = rows.map((r) => {
    let actualStatus = r.status;
    if (actualStatus === 'active' && r.expires_at && r.expires_at < now) {
      actualStatus = 'expired';
    }
    return {
      id: r.id,
      code: r.code,
      amount: r.amount,
      status: actualStatus,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      redeemedAt: r.redeemed_at,
      createdBy: r.created_by_username || 'Sistema',
      redeemedBy: r.redeemed_by_username || null,
    };
  });

  return {
    success: true,
    codes: formatted,
  };
});
