const axios = require('axios');

/**
 * Formata o número de telefone para o padrão internacional
 * 11999887766 → 5511999887766
 */
function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return '55' + digits;
}

/**
 * Processa o template da mensagem substituindo variáveis
 * Variáveis disponíveis: {nome}, {telefone}, {plano}, {vencimento}, {dias}
 */
function processTemplate(template, client, daysLeft) {
  const expiresDate = new Date(client.expires_at + 'T00:00:00');
  const formatted = expiresDate.toLocaleDateString('pt-BR');

  return template
    .replace(/{nome}/gi, client.name)
    .replace(/{telefone}/gi, client.phone)
    .replace(/{plano}/gi, client.plan_name || client.category_name || 'seu plano')
    .replace(/{vencimento}/gi, formatted)
    .replace(/{dias}/gi, daysLeft === 0 ? 'hoje' : `${daysLeft} dia${daysLeft > 1 ? 's' : ''}`);
}

/**
 * Envia mensagem via Evolution API (open source)
 */
async function sendEvolution(config, phone, message) {
  const { wa_api_url, wa_instance, wa_token } = config;
  const url = `${wa_api_url}/message/sendText/${wa_instance}`;
  const response = await axios.post(url, {
    number: formatPhone(phone),
    text: message,
  }, {
    headers: { apikey: wa_token, 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  return response.data;
}

/**
 * Envia mensagem via Z-API
 */
async function sendZAPI(config, phone, message) {
  const { wa_api_url, wa_instance, wa_token } = config;
  // wa_api_url = https://api.z-api.io/instances/{instance_id}/token/{token}
  const url = `${wa_api_url}/send-text`;
  const response = await axios.post(url, {
    phone: formatPhone(phone),
    message,
  }, {
    headers: { 'Client-Token': wa_token, 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  return response.data;
}

/**
 * Envia mensagem via webhook genérico (qualquer API)
 * O payload é enviado como POST JSON
 */
async function sendWebhook(config, phone, message) {
  const { wa_api_url, wa_token } = config;
  const response = await axios.post(wa_api_url, {
    phone: formatPhone(phone),
    message,
    token: wa_token,
  }, {
    headers: { Authorization: `Bearer ${wa_token}`, 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  return response.data;
}

/**
 * Função principal — seleciona o provider e envia
 */
async function sendWhatsApp(config, phone, message) {
  const type = config.wa_type || 'evolution';

  if (!config.wa_api_url) throw new Error('API URL do WhatsApp não configurada');
  if (!config.wa_token && type !== 'webhook') throw new Error('Token do WhatsApp não configurado');

  switch (type) {
    case 'evolution': return sendEvolution(config, phone, message);
    case 'zapi':      return sendZAPI(config, phone, message);
    case 'webhook':   return sendWebhook(config, phone, message);
    default: throw new Error(`Tipo de API desconhecido: ${type}`);
  }
}

module.exports = { sendWhatsApp, processTemplate, formatPhone };
