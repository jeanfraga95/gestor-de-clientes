const express = require('express');
const db = require('../db/init');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/categories
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM clients cl WHERE cl.category_id = c.id) AS client_count
    FROM categories c
    WHERE c.reseller_id = ? AND c.active = 1
    ORDER BY c.name ASC
  `).all(req.user.id);
  res.json(rows);
});

// POST /api/categories
router.post('/', (req, res) => {
  const { name, description, color, message_template } = req.body;
  if (!name || !message_template) return res.status(400).json({ error: 'Nome e mensagem são obrigatórios' });

  const result = db.prepare(`
    INSERT INTO categories (reseller_id, name, description, color, message_template)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, name, description || null, color || '#25D366', message_template);

  res.status(201).json({ id: result.lastInsertRowid, name });
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const { name, description, color, message_template, active } = req.body;
  const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND reseller_id = ?').get(req.params.id, req.user.id);
  if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' });

  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name), description = COALESCE(?, description),
      color = COALESCE(?, color), message_template = COALESCE(?, message_template),
      active = COALESCE(?, active)
    WHERE id = ?
  `).run(name, description, color, message_template, active, req.params.id);

  res.json({ message: 'Categoria atualizada' });
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND reseller_id = ?').get(req.params.id, req.user.id);
  if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' });
  db.prepare('UPDATE categories SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Categoria removida' });
});

module.exports = router;
