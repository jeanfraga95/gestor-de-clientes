require('dotenv').config();
require('./src/db/init'); // Inicializa o banco 

const express = require('express');
const cors = require('cors');
const path = require('path');
const { startScheduler } = require('./src/services/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ───────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.trim()))) cb(null, true);
    else cb(new Error('CORS bloqueado'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',       require('./src/routes/auth'));
app.use('/api/resellers',  require('./src/routes/resellers'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/clients',    require('./src/routes/clients'));
app.use('/api/whatsapp',   require('./src/routes/whatsapp'));

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── Serve React frontend (produção) ───────────────────────────────
const frontendDist = path.join(__dirname, 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 NotifyPro Backend rodando na porta ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api\n`);
  startScheduler();
});
