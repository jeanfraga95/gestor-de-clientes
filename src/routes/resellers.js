const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/init');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/resellers — lista todas as revendas (admin)
router.get('/', adminOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, r.name, r.email, r.phone, r.active, r.is_admin,
           r.wa_type, r.wa_instance, r.notify_days, r.notify_time,
           r.created_at,
           (SELECT COUNT(*) FROM clients c WHERE c.reseller_id = r.id) AS client_count
    FROM resellers r WHERE r.is_admin = 0
    ORDER BY r.created_at DESC
  `).all();
  res.json(rows);
});

// POST /api/resellers — criar revenda (admin)
router.post('/', adminOnly, (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

  const exists = db.prepare('SELECT id FROM resellers WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email já cadastrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO resellers (name, email, password_hash, phone, notify_days, notify_time)
    VALUES (?, ?, ?, ?, '3,1', '09:00')
  `).run(name, email.toLowerCase(), hash, phone || null);

  res.status(201).json({ id: result.lastInsertRowid, name, email });
});

// PUT /api/resellers/:id — editar revenda (admin)
router.put('/:id', adminOnly, (req, res) => {
  const { name, email, phone, active, password } = req.body;
  const { id } = req.params;

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE resellers SET password_hash = ? WHERE id = ?').run(hash, id);
  }

  db.prepare(`
    UPDATE resellers SET name = COALESCE(?, name), email = COALESCE(?, email),
    phone = COALESCE(?, phone), active = COALESCE(?, active),
    updated_at = datetime('now') WHERE id = ?
  `).run(name, email, phone, active, id);

  res.json({ message: 'Revenda atualizada' });
});

// DELETE /api/resellers/:id — desativar revenda (admin)
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('UPDATE resellers SET active = 0 WHERE id = ? AND is_admin = 0').run(req.params.id);
  res.json({ message: 'Revenda desativada' });
});

// GET /api/resellers/settings — configurações da revenda logada
router.get('/settings', (req, res) => {
  const user = db.prepare(`
    SELECT id, name, email, phone, wa_api_url, wa_instance, wa_token, wa_type, notify_days, notify_time
    FROM resellers WHERE id = ?
  `).get(req.user.id);
  if (user.wa_token) user.wa_token = '****' + user.wa_token.slice(-4);
  res.json(user);
});

// PUT /api/resellers/settings — salvar configurações da revenda logada
router.put('/settings', (req, res) => {
  const { name, phone, wa_api_url, wa_instance, wa_token, wa_type, notify_days, notify_time } = req.body;
  db.prepare(`
    UPDATE resellers SET
      name = COALESCE(?, name), phone = COALESCE(?, phone),
      wa_api_url = COALESCE(?, wa_api_url), wa_instance = COALESCE(?, wa_instance),
      wa_type = COALESCE(?, wa_type), notify_days = COALESCE(?, notify_days),
      notify_time = COALESCE(?, notify_time),
      wa_token = CASE WHEN ? IS NOT NULL AND ? != '****' THEN ? ELSE wa_token END,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, phone, wa_api_url, wa_instance, wa_type, notify_days, notify_time, wa_token, wa_token, wa_token, req.user.id);
  res.json({ message: 'Configurações salvas' });
});

module.exports = router;
