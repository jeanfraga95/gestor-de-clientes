const express = require('express');
const db = require('../db/init');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/clients — lista clientes com filtros
router.get('/', (req, res) => {
  const { search, category_id, status, expiring_days } = req.query;

  let where = 'cl.reseller_id = ?';
  const params = [req.user.id];

  if (search) {
    where += ` AND (cl.name LIKE ? OR cl.phone LIKE ? OR cl.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category_id) { where += ` AND cl.category_id = ?`; params.push(category_id); }
  if (status === 'active') { where += ` AND cl.active = 1`; }
  if (status === 'expired') { where += ` AND cl.expires_at < date('now') AND cl.active = 1`; }
  if (status === 'expiring' && expiring_days) {
    where += ` AND cl.expires_at >= date('now') AND cl.expires_at <= date('now', '+${parseInt(expiring_days)} days')`;
  }

  const rows = db.prepare(`
    SELECT cl.*, cat.name AS category_name, cat.color AS category_color,
      CAST(julianday(cl.expires_at) - julianday('now') AS INTEGER) AS days_until_expiry
    FROM clients cl
    LEFT JOIN categories cat ON cat.id = cl.category_id
    WHERE ${where}
    ORDER BY cl.expires_at ASC
  `).all(...params);

  res.json(rows);
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const client = db.prepare(`
    SELECT cl.*, cat.name AS category_name, cat.color AS category_color,
      cat.message_template,
      CAST(julianday(cl.expires_at) - julianday('now') AS INTEGER) AS days_until_expiry
    FROM clients cl
    LEFT JOIN categories cat ON cat.id = cl.category_id
    WHERE cl.id = ? AND cl.reseller_id = ?
  `).get(req.params.id, req.user.id);

  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  const logs = db.prepare(`
    SELECT * FROM notification_logs WHERE client_id = ? ORDER BY sent_at DESC LIMIT 20
  `).all(req.params.id);

  res.json({ ...client, notification_logs: logs });
});

// POST /api/clients
router.post('/', (req, res) => {
  const { name, phone, email, notes, plan_name, category_id, expires_at } = req.body;
  if (!name || !phone || !expires_at) return res.status(400).json({ error: 'Nome, telefone e vencimento são obrigatórios' });

  const result = db.prepare(`
    INSERT INTO clients (reseller_id, category_id, name, phone, email, notes, plan_name, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, category_id || null, name, phone, email || null, notes || null, plan_name || null, expires_at);

  res.status(201).json({ id: result.lastInsertRowid, name });
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const { name, phone, email, notes, plan_name, category_id, expires_at, active } = req.body;
  const client = db.prepare('SELECT id FROM clients WHERE id = ? AND reseller_id = ?').get(req.params.id, req.user.id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  db.prepare(`
    UPDATE clients SET
      name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email),
      notes = COALESCE(?, notes), plan_name = COALESCE(?, plan_name),
      category_id = COALESCE(?, category_id), expires_at = COALESCE(?, expires_at),
      active = COALESCE(?, active), updated_at = datetime('now')
    WHERE id = ?
  `).run(name, phone, email, notes, plan_name, category_id, expires_at, active, req.params.id);

  res.json({ message: 'Cliente atualizado' });
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const client = db.prepare('SELECT id FROM clients WHERE id = ? AND reseller_id = ?').get(req.params.id, req.user.id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ message: 'Cliente removido' });
});

// GET /api/clients/stats/dashboard
router.get('/stats/dashboard', (req, res) => {
  const rid = req.user.id;
  const total = db.prepare('SELECT COUNT(*) AS n FROM clients WHERE reseller_id = ? AND active = 1').get(rid).n;
  const expired = db.prepare("SELECT COUNT(*) AS n FROM clients WHERE reseller_id = ? AND active = 1 AND expires_at < date('now')").get(rid).n;
  const expiring7 = db.prepare("SELECT COUNT(*) AS n FROM clients WHERE reseller_id = ? AND active = 1 AND expires_at >= date('now') AND expires_at <= date('now', '+7 days')").get(rid).n;
  const sentToday = db.prepare("SELECT COUNT(*) AS n FROM notification_logs WHERE reseller_id = ? AND status = 'sent' AND date(sent_at) = date('now')").get(rid).n;
  const categories = db.prepare('SELECT COUNT(*) AS n FROM categories WHERE reseller_id = ? AND active = 1').get(rid).n;

  // Próximos a vencer (7 dias)
  const upcoming = db.prepare(`
    SELECT cl.name, cl.phone, cl.expires_at, cat.name AS category_name, cat.color,
      CAST(julianday(cl.expires_at) - julianday('now') AS INTEGER) AS days_left
    FROM clients cl LEFT JOIN categories cat ON cat.id = cl.category_id
    WHERE cl.reseller_id = ? AND cl.active = 1
      AND cl.expires_at >= date('now') AND cl.expires_at <= date('now', '+7 days')
    ORDER BY cl.expires_at ASC LIMIT 10
  `).all(rid);

  res.json({ total, expired, expiring7, sentToday, categories, upcoming });
});

module.exports = router;
