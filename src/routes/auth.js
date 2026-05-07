const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'notifypro_secret';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  const user = db.prepare('SELECT * FROM resellers WHERE email = ? AND active = 1').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, is_admin: !!user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, is_admin, wa_api_url, wa_instance, wa_type, wa_token, notify_days, notify_time, created_at FROM resellers WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// POST /api/auth/change-password
router.post('/change-password', auth, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM resellers WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ error: 'Senha atual incorreta' });
  }
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE resellers SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ message: 'Senha alterada com sucesso' });
});

module.exports = router;
