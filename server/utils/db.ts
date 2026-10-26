import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

let dbInstance: DatabaseSync | null = null

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance

  // Crear directorio .data si no existe
  const dataDir = resolve(process.cwd(), '.data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = resolve(dataDir, 'casino.db')
  const db = new DatabaseSync(dbPath)

  // Optimización de SQLite y claves foráneas
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA synchronous = NORMAL;')

  // ── Migración: recrear tablas con esquema antiguo incompatible ──
  const colsOf = (t: string) =>
    (db.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c) => `${c.name}:${c.type}`)
  const txCols = colsOf('transactions')
  const codeCols = colsOf('recharge_codes')
  const attCols = colsOf('redeem_attempts')
  if (txCols.length && !txCols.some((c) => c.startsWith('code_id:'))) {
    db.exec('DROP TABLE transactions')
  }
  if (codeCols.length && !codeCols.includes('id:INTEGER')) {
    db.exec('DROP TABLE IF EXISTS transactions')
    db.exec('DROP TABLE recharge_codes')
  }
  if (attCols.length && !attCols.some((c) => c.startsWith('ip_address:'))) {
    db.exec('DROP TABLE redeem_attempts')
  }

  // ── Tablas del sistema ──────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      chips INTEGER NOT NULL DEFAULT 1000,
      role TEXT NOT NULL DEFAULT 'player',
      password_hash TEXT,
      created_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recharge_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at INTEGER,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      redeemed_by TEXT,
      redeemed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      code_id INTEGER,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      balance_after INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS redeem_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      user_id TEXT,
      code_attempted TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    -- Estadísticas por juego (un JSON por usuario y juego)
    CREATE TABLE IF NOT EXISTS game_stats (
      user_id TEXT NOT NULL,
      game TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, game)
    );

    -- Preferencias del usuario (clave/valor)
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, key)
    );

    -- Historial de la Mesa de Fichas (/apuestas)
    CREATE TABLE IF NOT EXISTS bet_slips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bet_slips_user ON bet_slips(user_id, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_recharge_codes_code ON recharge_codes(code);
    CREATE INDEX IF NOT EXISTS idx_recharge_codes_status ON recharge_codes(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `)

  // ── Inicializar Administrador por defecto si no existe ────────
  initDefaultAdmin(db)

  dbInstance = db
  return dbInstance
}

/** Hashear contraseñas de forma segura con scrypt */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/** Verificar contraseña con scrypt */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) return false
    const keyBuffer = Buffer.from(key, 'hex')
    const derivedKey = scryptSync(password, salt, 64)
    return timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}

function initDefaultAdmin(db: DatabaseSync) {
  const checkAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get()
  if (!checkAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'RoyalAdmin2026!'
    const pwdHash = hashPassword(adminPassword)
    const now = new Date().toISOString()
    const insertAdmin = db.prepare(`
      INSERT INTO users (id, username, chips, role, password_hash, created_at, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertAdmin.run(
      'admin-root-01',
      'admin',
      999999,
      'admin',
      pwdHash,
      now,
      now
    )
    console.log('[Casino DB] Administrador inicial creado (usuario: admin)')
  }
}
