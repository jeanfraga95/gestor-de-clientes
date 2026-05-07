const cron = require('node-cron');
const db = require('../db/init');
const { sendWhatsApp, processTemplate } = require('./whatsapp');

/**
 * Verifica e envia notificações para todos os clientes próximos ao vencimento
 * de todas as revendas configuradas.
 */
async function runNotifications() {
  console.log(`[${new Date().toLocaleString('pt-BR')}] 🔔 Iniciando verificação de notificações...`);

  // Busca todas as revendas ativas com WhatsApp configurado
  const resellers = db.prepare(`
    SELECT id, name, wa_api_url, wa_instance, wa_token, wa_type, notify_days, notify_time
    FROM resellers
    WHERE active = 1 AND wa_api_url IS NOT NULL AND wa_token IS NOT NULL
  `).all();

  let totalSent = 0;
  let totalFailed = 0;

  for (const reseller of resellers) {
    // notify_days = "7,3,1" → array de dias
    const notifyDays = (reseller.notify_days || '3,1').split(',').map(d => parseInt(d.trim())).filter(Boolean);

    for (const daysBefore of notifyDays) {
      // Busca clientes que vencem exatamente em X dias e não receberam notificação hoje
      const clients = db.prepare(`
        SELECT cl.*, cat.message_template, cat.name AS category_name
        FROM clients cl
        LEFT JOIN categories cat ON cat.id = cl.category_id
        WHERE cl.reseller_id = ?
          AND cl.active = 1
          AND date(cl.expires_at) = date('now', '+${daysBefore} days')
          AND cat.message_template IS NOT NULL
          AND cl.id NOT IN (
            SELECT client_id FROM notification_logs
            WHERE days_before = ? AND date(sent_at) = date('now')
              AND status = 'sent'
          )
      `).all(reseller.id, daysBefore);

      for (const client of clients) {
        const message = processTemplate(client.message_template, client, daysBefore);

        try {
          await sendWhatsApp(reseller, client.phone, message);

          db.prepare(`
            INSERT INTO notification_logs (client_id, reseller_id, message, phone, days_before, status)
            VALUES (?, ?, ?, ?, ?, 'sent')
          `).run(client.id, reseller.id, message, client.phone, daysBefore);

          console.log(`  ✅ [${reseller.name}] Notificação enviada → ${client.name} (${client.phone}) — vence em ${daysBefore}d`);
          totalSent++;

        } catch (err) {
          db.prepare(`
            INSERT INTO notification_logs (client_id, reseller_id, message, phone, days_before, status, error_msg)
            VALUES (?, ?, ?, ?, ?, 'failed', ?)
          `).run(client.id, reseller.id, message, client.phone, daysBefore, err.message);

          console.error(`  ❌ [${reseller.name}] Falha → ${client.name}: ${err.message}`);
          totalFailed++;
        }
      }
    }
  }

  console.log(`[Notificações] ✅ Enviadas: ${totalSent} | ❌ Falhas: ${totalFailed}`);
}

/**
 * Inicia o agendador — roda todo minuto e verifica se alguma revenda
 * configurou o horário atual como horário de envio.
 */
function startScheduler() {
  // Cron a cada minuto
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Verifica se há alguma revenda com notify_time igual ao horário atual
    const hasMatch = db.prepare(`
      SELECT COUNT(*) AS n FROM resellers
      WHERE active = 1 AND notify_time = ? AND wa_api_url IS NOT NULL
    `).get(currentTime);

    if (hasMatch.n > 0) {
      await runNotifications();
    }
  });

  console.log('⏰ Agendador de notificações iniciado');
}

module.exports = { startScheduler, runNotifications };
