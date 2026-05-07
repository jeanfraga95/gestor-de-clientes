const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/notifypro.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resellers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      logo_url TEXT,
      active INTEGER DEFAULT 1,
      is_admin INTEGER DEFAULT 0,
      -- WhatsApp config
      wa_api_url TEXT,
      wa_instance TEXT,
      wa_token TEXT,
      wa_type TEXT DEFAULT 'evolution',  -- evolution | zapi | twilio
      -- Notification config
      notify_days TEXT DEFAULT '3,1',    -- dias antes do vencimento
      notify_time TEXT DEFAULT '09:00',  -- horário de envio
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reseller_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#25D366',
      -- Mensagem enviada X dias antes
      message_template TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reseller_id INTEGER NOT NULL,
      category_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      notes TEXT,
      plan_name TEXT,
      expires_at TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      reseller_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      phone TEXT NOT NULL,
      days_before INTEGER,
      status TEXT DEFAULT 'pending',  -- pending | sent | failed
      error_msg TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@notifypro.com';
  const existing = db.prepare('SELECT id FROM resellers WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare(`
      INSERT INTO resellers (name, email, password_hash, is_admin, notify_days, notify_time)
      VALUES (?, ?, ?, 1, '3,1', '09:00')
    `).run(process.env.ADMIN_NAME || 'Administrador', adminEmail, hash);
    console.log(`✅ Admin criado: ${adminEmail}`);
  }

  console.log('✅ Banco de dados inicializado com sucesso');
}

initDB();
module.exports = db;
