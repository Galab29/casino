import { defineEventHandler } from 'h3';
import { getDatabase } from '../../utils/db';
import { requireAdmin } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = getDatabase();

  const totalCodesRow = db.prepare('SELECT COUNT(*) as count FROM recharge_codes').get() as any;
  const activeCodesRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as chips FROM recharge_codes WHERE status = 'active'").get() as any;
  const redeemedCodesRow = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as chips FROM recharge_codes WHERE status = 'redeemed'").get() as any;
  const disabledCodesRow = db.prepare("SELECT COUNT(*) as count FROM recharge_codes WHERE status = 'disabled'").get() as any;
  const totalUsersRow = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(chips), 0) as total_chips FROM users').get() as any;

  return {
    success: true,
    stats: {
      totalCodes: totalCodesRow?.count || 0,
      activeCodes: activeCodesRow?.count || 0,
      activeChips: activeCodesRow?.chips || 0,
      redeemedCodes: redeemedCodesRow?.count || 0,
      redeemedChips: redeemedCodesRow?.chips || 0,
      disabledCodes: disabledCodesRow?.count || 0,
      totalUsers: totalUsersRow?.count || 0,
      totalUserChips: totalUsersRow?.total_chips || 0,
    },
  };
});
