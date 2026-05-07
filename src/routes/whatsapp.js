const express = require('express');
const db = require('../db/init');
const { auth } = require('../middleware/auth');
const { sendWhatsApp, processTemplate } = require('../services/whatsapp');

const router = express.Router();
router.use(auth);

// POST /api/whatsapp/test — testa conexão enviando mensagem de teste
router.post('/test', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefone é obrigatório' });

  const config = db.prepare(`
    SELECT wa_api_url, wa_instance, wa_token, wa_type FROM resellers WHERE id = ?
  `).get(req.user.id);

  try {
    await sendWhatsApp(config, phone, `✅ *NotifyPro* — Conexão testada com sucesso!\n\nSeu WhatsApp está configurado corretamente.`);
    res.json({ message: 'Mensagem de teste enviada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: `Falha ao enviar: ${err.message}` });
  }
});

// POST /api/whatsapp/send/:clientId — envia manualmente para um cliente
router.post('/send/:clientId', async (req, res) => {
  const client = db.prepare(`
    SELECT cl.*, cat.message_template, cat.name AS category_name
    FROM clients cl
    LEFT JOIN categories cat ON cat.id = cl.category_id
    WHERE cl.id = ? AND cl.reseller_id = ?
  `).get(req.params.clientId, req.user.id);

  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
  if (!client.message_template) return res.status(400).json({ error: 'Categoria sem mensagem configurada' });

  const config = db.prepare(`
    SELECT wa_api_url, wa_instance, wa_token, wa_type FROM resellers WHERE id = ?
  `).get(req.user.id);

  const expiresDate = new Date(client.expires_at + 'T00:00:00');
  const daysLeft = Math.ceil((expiresDate - new Date()) / (1000 * 60 * 60 * 24));
  const message = processTemplate(client.message_template, client, Math.max(0, daysLeft));

  try {
    await sendWhatsApp(config, client.phone, message);
    db.prepare(`
      INSERT INTO notification_logs (client_id, reseller_id, message, phone, days_before, status)
      VALUES (?, ?, ?, ?, ?, 'sent')
    `).run(client.id, req.user.id, message, client.phone, Math.max(0, daysLeft));
    res.json({ message: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    db.prepare(`
      INSERT INTO notification_logs (client_id, reseller_id, message, phone, days_before, status, error_msg)
      VALUES (?, ?, ?, ?, ?, 'failed', ?)
    `).run(client.id, req.user.id, message, client.phone, 0, err.message);
    res.status(500).json({ error: `Falha ao enviar: ${err.message}` });
  }
});

// GET /api/whatsapp/logs — histórico de notificações
router.get('/logs', (req, res) => {
  const { limit = 50, status } = req.query;
  let where = 'nl.reseller_id = ?';
  const params = [req.user.id];
  if (status) { where += ' AND nl.status = ?'; params.push(status); }

  const logs = db.prepare(`
    SELECT nl.*, cl.name AS client_name, cl.phone AS client_phone
    FROM notification_logs nl
    LEFT JOIN clients cl ON cl.id = nl.client_id
    WHERE ${where}
    ORDER BY nl.sent_at DESC LIMIT ?
  `).all(...params, parseInt(limit));
  res.json(logs);
});

module.exports = router;
