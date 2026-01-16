const http = require('http');
const { Pool } = require('pg');
const url = require('url');

// Configuração do banco de dados Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_W5gUfjMrzc6v@ep-young-mode-ahdcwm6c-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Testa a conexão com o banco
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('✅ Banco de dados conectado com sucesso!');
    console.log('⏰ Hora do servidor:', result.rows[0].now);
  }
});

// HTML da página inicial
const homepageHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tem Tudo - API REST</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 900px;
      width: 100%;
      padding: 60px 40px;
      text-align: center;
    }
    
    h1 {
      color: #333;
      font-size: 3em;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      color: #666;
      font-size: 1.2em;
      margin-bottom: 40px;
    }
    
    .status {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 40px;
      text-align: left;
    }
    
    .status h3 {
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .status-item {
      color: #555;
      margin: 8px 0;
      font-size: 0.95em;
    }
    
    .status-item.success {
      color: #27ae60;
    }
    
    .endpoints {
      margin-top: 40px;
      text-align: left;
    }
    
    .endpoints h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.3em;
    }
    
    .endpoint-group {
      margin-bottom: 30px;
    }
    
    .endpoint-group h4 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    
    .endpoint {
      background: #f8f9fa;
      padding: 12px 15px;
      margin: 8px 0;
      border-radius: 6px;
      border-left: 3px solid #667eea;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #333;
      overflow-x: auto;
    }
    
    .endpoint.get {
      border-left-color: #27ae60;
    }
    
    .endpoint.post {
      border-left-color: #f39c12;
    }
    
    .method {
      font-weight: bold;
      margin-right: 10px;
      display: inline-block;
      min-width: 50px;
    }
    
    .method.get {
      color: #27ae60;
    }
    
    .method.post {
      color: #f39c12;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 0.9em;
    }
    
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    
    .badge.success {
      background: #27ae60;
    }
    
    .badge.warning {
      background: #f39c12;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Tem Tudo</h1>
    <p class="subtitle">Sistema de Hospedagem de Produtos - API REST</p>
    
    <div class="status">
      <h3>📊 Status do Servidor</h3>
      <div class="status-item success">✅ Servidor rodando com sucesso</div>
      <div class="status-item success">✅ Banco de dados conectado</div>
      <div class="status-item success">✅ Todas as rotas disponíveis</div>
    </div>
    
    <div class="endpoints">
      <h3>📡 Endpoints Disponíveis</h3>
      
      <div class="endpoint-group">
        <h4>👥 Usuários</h4>
        <div class="endpoint get">
          <span class="method get">GET</span> /api/users
        </div>
        <div class="endpoint post">
          <span class="method post">POST</span> /api/users
        </div>
      </div>
      
      <div class="endpoint-group">
        <h4>📂 Categorias</h4>
        <div class="endpoint get">
          <span class="method get">GET</span> /api/categories
        </div>
        <div class="endpoint post">
          <span class="method post">POST</span> /api/categories
        </div>
      </div>
      
      <div class="endpoint-group">
        <h4>📦 Produtos</h4>
        <div class="endpoint get">
          <span class="method get">GET</span> /api/products
        </div>
        <div class="endpoint post">
          <span class="method post">POST</span> /api/products
        </div>
      </div>
      
      <div class="endpoint-group">
        <h4>🛒 Pedidos</h4>
        <div class="endpoint get">
          <span class="method get">GET</span> /api/orders
        </div>
        <div class="endpoint post">
          <span class="method post">POST</span> /api/orders
        </div>
      </div>
      
      <div class="endpoint-group">
        <h4>🔄 Utilitários</h4>
        <div class="endpoint get">
          <span class="method get">GET</span> /api/health
        </div>
        <div class="endpoint post">
          <span class="method post">POST</span> /api/migrate
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>🚀 Desenvolvido por: Andrews Pablo</p>
      <p>📅 Data: 16 de Janeiro de 2026</p>
    </div>
  </div>
</body>
</html>
`;

// Criar servidor HTTP
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  try {
    // ========== PÁGINA INICIAL ==========
    
    // GET / - Página inicial
    if (pathname === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(homepageHTML);
      return;
    }

    // ========== USUÁRIOS ==========
    
    // GET /api/users - Listar todos os usuários
    if (pathname === '/api/users' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      const result = await pool.query('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
      return;
    }

    // POST /api/users - Criar novo usuário
    if (pathname === '/api/users' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, email, phone, password } = JSON.parse(body);
        try {
          const result = await pool.query(
            'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, phone, password]
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // ========== CATEGORIAS ==========
    
    // GET /api/categories - Listar todas as categorias
    if (pathname === '/api/categories' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      const result = await pool.query('SELECT * FROM categories ORDER BY name');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
      return;
    }

    // POST /api/categories - Criar nova categoria
    if (pathname === '/api/categories' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, description } = JSON.parse(body);
        try {
          const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // ========== PRODUTOS ==========
    
    // GET /api/products - Listar todos os produtos
    if (pathname === '/api/products' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      const result = await pool.query(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        ORDER BY p.created_at DESC
      `);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
      return;
    }

    // POST /api/products - Criar novo produto
    if (pathname === '/api/products' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, description, price, category_id, image_url, stock } = JSON.parse(body);
        try {
          const result = await pool.query(
            'INSERT INTO products (name, description, price, category_id, image_url, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, price, category_id, image_url, stock || 0]
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // ========== PEDIDOS ==========
    
    // GET /api/orders - Listar todos os pedidos
    if (pathname === '/api/orders' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      const result = await pool.query(`
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
      return;
    }

    // POST /api/orders - Criar novo pedido
    if (pathname === '/api/orders' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { user_id, total_price, status } = JSON.parse(body);
        try {
          const result = await pool.query(
            'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING *',
            [user_id, total_price, status || 'pending']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // ========== MIGRAÇÃO DE DADOS ==========
    
    // POST /api/migrate - Migrar dados do localStorage
    if (pathname === '/api/migrate' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const data = JSON.parse(body);
        try {
          let migratedCount = 0;

          // Migrar usuários
          if (data.users && Array.isArray(data.users)) {
            for (const user of data.users) {
              await pool.query(
                'INSERT INTO users (name, email, phone) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
                [user.name, user.email, user.phone]
              );
              migratedCount++;
            }
          }

          // Migrar categorias
          if (data.categories && Array.isArray(data.categories)) {
            for (const cat of data.categories) {
              await pool.query(
                'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [cat.name, cat.description]
              );
              migratedCount++;
            }
          }

          // Migrar produtos
          if (data.products && Array.isArray(data.products)) {
            for (const prod of data.products) {
              await pool.query(
                'INSERT INTO products (name, description, price, image_url, stock) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                [prod.name, prod.description, prod.price, prod.image_url, prod.stock || 0]
              );
              migratedCount++;
            }
          }

          // Migrar pedidos
          if (data.orders && Array.isArray(data.orders)) {
            for (const order of data.orders) {
              await pool.query(
                'INSERT INTO orders (total_price, status) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [order.total_price, order.status || 'pending']
              );
              migratedCount++;
            }
          }

          res.writeHead(200);
          res.end(JSON.stringify({ 
            success: true, 
            message: `✅ ${migratedCount} registros migrados com sucesso!`,
            migratedCount 
          }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // ========== HEALTH CHECK ==========
    
    // GET /api/health - Verificar saúde do servidor
    if (pathname === '/api/health' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ 
        success: true, 
        message: '🚀 Servidor rodando com sucesso!',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Rota não encontrada
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Rota não encontrada' }));

  } catch (err) {
    console.error('Erro:', err);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`📊 Banco de dados: Neon PostgreSQL`);
  console.log(`🔗 URL do Neon: https://console.neon.tech`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido, encerrando...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    pool.end();
    process.exit(0);
  });
});
