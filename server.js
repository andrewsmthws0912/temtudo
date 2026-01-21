const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Pool de Conexão com o Neon
// A variável DATABASE_URL deve ser configurada no seu ambiente de hospedagem
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões seguras com o Neon
  }
});

// Inicialização do Banco de Dados (Criação de Tabelas)
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_data (
        key TEXT PRIMARY KEY,
        value JSONB
      );
    `);
    
    // Inicializa valores padrão se a tabela estiver vazia
    const res = await client.query("SELECT count(*) FROM store_data");
    if (parseInt(res.rows[0].count) === 0) {
      const defaults = [
        ['produtos', '[]'],
        ['pedidos', '[]'],
        ['usuarios', '{"admin": {"senha": "123", "nivel": "admin"}}'],
        ['categorias', '["Utilidades", "Variedades"]'],
        ['whatsappNumber', '""'],
        ['produtosIncompletos', '[]']
      ];
      for (let [key, val] of defaults) {
        await client.query("INSERT INTO store_data (key, value) VALUES ($1, $2)", [key, val]);
      }
    }
    console.log("Banco de dados PostgreSQL (Neon) pronto.");
  } catch (err) {
    console.error("Erro ao inicializar banco de dados:", err);
  } finally {
    client.release();
  }
}

initDB();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname)));

// --- ROTAS DA API ---

// Obter todos os dados iniciais
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM store_data");
    const data = {};
    result.rows.forEach(row => {
      data[row.key] = row.value;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Função genérica para salvar dados
async function upsertData(key, value) {
  await pool.query(
    "INSERT INTO store_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
    [key, JSON.stringify(value)]
  );
}

app.post('/api/produtos', async (req, res) => {
  try { await upsertData('produtos', req.body); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pedidos', async (req, res) => {
  try { await upsertData('pedidos', req.body); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/usuarios', async (req, res) => {
  try { await upsertData('usuarios', req.body); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categorias', async (req, res) => {
  try { await upsertData('categorias', req.body); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/config', async (req, res) => {
  try { await upsertData('whatsappNumber', req.body.whatsappNumber); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/produtosIncompletos', async (req, res) => {
  try { await upsertData('produtosIncompletos', req.body); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Rota principal para servir o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
