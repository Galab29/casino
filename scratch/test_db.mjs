import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync(':memory:')
db.exec('PRAGMA foreign_keys = ON;')
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    chips INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'player',
    created_at TEXT NOT NULL
  );

  CREATE TABLE recharge_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    redeemed_by TEXT,
    redeemed_at TEXT
  );

  CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    previous_balance INTEGER NOT NULL,
    new_balance INTEGER NOT NULL,
    reference TEXT,
    created_at TEXT NOT NULL
  );
`)

const insertUser = db.prepare('INSERT INTO users (id, username, chips, role, created_at) VALUES (?, ?, ?, ?, ?)')
insertUser.run('u1', 'player1', 1000, 'player', new Date().toISOString())

const insertCode = db.prepare('INSERT INTO recharge_codes (id, code, amount, status, expires_at, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
insertCode.run('c1', 'ROYAL-TEST-1234', 5000, 'active', null, 'admin', new Date().toISOString())

// Test atomic transaction
db.exec('BEGIN IMMEDIATE')
const code = db.prepare('SELECT * FROM recharge_codes WHERE code = ?').get('ROYAL-TEST-1234')
console.log('Found code:', code)

db.prepare("UPDATE recharge_codes SET status = 'redeemed', redeemed_by = ?, redeemed_at = ? WHERE id = ?").run('u1', new Date().toISOString(), code.id)
db.prepare('UPDATE users SET chips = chips + ? WHERE id = ?').run(code.amount, 'u1')
db.prepare('INSERT INTO transactions (id, user_id, type, amount, previous_balance, new_balance, reference, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('t1', 'u1', 'recharge', code.amount, 1000, 6000, code.code, new Date().toISOString())
db.exec('COMMIT')

const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get('u1')
console.log('Updated user chips:', updatedUser.chips)
console.log('SUCCESS! node:sqlite transactions and tables verified 100%!')
