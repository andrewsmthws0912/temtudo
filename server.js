const http = require('http');
const { Client } = require('pg');
const url = require('url');

// Configuração do banco de dados
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Conectar ao banco
client.connect()
  .then(() => {
    console.log('✅ Conectado ao banco de dados Neon');
    criarTabelas();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco:', err);
    process.exit(1);
  });

// ========== CRIAR TABELAS AUTOMATICAMENTE ==========
async function criarTabelas() {
  try {
    console.log('📋 Criando tabelas...');

    // Tabela de Usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        level VARCHAR(50) DEFAULT 'cliente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela users criada');

    // Tabela de Categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela categories criada');

    // Tabela de Produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        ean VARCHAR(13),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela products criada');

    // Tabela de Pedidos
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela orders criada');

    // Tabela de Itens do Pedido
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela order_items criada');

    // Tabela de Produtos Incompletos
    await client.query(`
      CREATE TABLE IF NOT EXISTS incomplete_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        price DECIMAL(10, 2),
        category_id INTEGER REFERENCES categories(id),
        image_url TEXT,
        ean VARCHAR(13),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela incomplete_products criada');

    // Tabela de Formas de Pagamento
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela payment_methods criada');

    // Tabela de Contatos
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela contacts criada');

    // Tabela de WhatsApp
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela whatsapp_messages criada');

    console.log('🎉 Todas as tabelas criadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err);
  }
}

// ========== SERVIDOR HTTP ==========
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // ========== ROTAS ==========

    // Health Check
    if (pathname === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: '🚀 Servidor rodando com sucesso!',
        timestamp: new Date().toISOString()
      }));
    }

    // ========== USUÁRIOS ==========
    else if (pathname === '/api/users' && req.method === 'GET') {
      const result = await client.query('SELECT id, name, level, created_at FROM users');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
    }

    else if (pathname === '/api/users' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, password, level } = JSON.parse(body);
        try {
          const result = await client.query(
            'INSERT INTO users (name, password, level) VALUES ($1, $2, $3) RETURNING *',
            [name, password, level || 'cliente']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }

    // ========== CATEGORIAS ==========
    else if (pathname === '/api/categories' && req.method === 'GET') {
      const result = await client.query('SELECT * FROM categories');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
    }

    else if (pathname === '/api/categories' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, description } = JSON.parse(body);
        try {
          const result = await client.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description || '']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }

    // ========== PRODUTOS ==========
    else if (pathname === '/api/products' && req.method === 'GET') {
      const result = await client.query('SELECT * FROM products');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
    }

    else if (pathname === '/api/products' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, description, price, category_id, image_url, stock, ean } = JSON.parse(body);
        try {
          const result = await client.query(
            'INSERT INTO products (name, description, price, category_id, image_url, stock, ean) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, description || '', price, category_id || null, image_url || '', stock || 0, ean || '']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }

    // ========== PEDIDOS ==========
    else if (pathname === '/api/orders' && req.method === 'GET') {
      const result = await client.query('SELECT * FROM orders ORDER BY created_at DESC');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
    }

    else if (pathname === '/api/orders' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { user_id, total_price, status, payment_method } = JSON.parse(body);
        try {
          const result = await client.query(
            'INSERT INTO orders (user_id, total_price, status, payment_method) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id || null, total_price, status || 'pending', payment_method || '']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }

    // ========== FORMAS DE PAGAMENTO ==========
    else if (pathname === '/api/payment-methods' && req.method === 'GET') {
      const result = await client.query('SELECT * FROM payment_methods');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
    }

    else if (pathname === '/api/payment-methods' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, description } = JSON.parse(body);
        try {
          const result = await client.query(
            'INSERT INTO payment_methods (name, description) VALUES ($1, $2) RETURNING *',
            [name, description || '']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }

    // ========== CONTATOS ==========
    else if (pathname === '/api/contacts' && req.method === 'GET') {
      const result = await client.query('SELECT * FROM contacts ORDER BY created_at DESC');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
    }

    else if (pathname === '/api/contacts' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { name, email, phone, message } = JSON.parse(body);
        try {
          const result = await client.query(
            'INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, phone || '', message || '']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }

    // ========== WHATSAPP ==========
    else if (pathname === '/api/whatsapp' && req.method === 'GET') {
      const result = await client.query('SELECT * FROM whatsapp_messages');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
    }

    else if (pathname === '/api/whatsapp' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { phone_number, message } = JSON.parse(body);
        try {
          const result = await client.query(
            'INSERT INTO whatsapp_messages (phone_number, message) VALUES ($1, $2) ON CONFLICT (phone_number) DO UPDATE SET message = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
            [phone_number, message || '']
          );
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, data: result.rows[0] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }

    // ========== PÁGINA INICIAL ==========
    else if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Tem Tudo - API</title>
          <style>
            body { font-family: Arial; background: #f5f5f5; padding: 20px; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #111; text-align: center; }
            .status { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; font-weight: bold; }
            .endpoint { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3; border-radius: 5px; }
            .endpoint strong { color: #2196F3; }
            .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; margin-right: 10px; }
            .get { background: #4CAF50; color: white; }
            .post { background: #2196F3; color: white; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🛒 Tem Tudo - API REST</h1>
            <div class="status">✅ Servidor rodando com sucesso!</div>
            
            <h2>📋 Endpoints Disponíveis</h2>
            
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/health</strong> - Verificar status do servidor
            </div>
            
            <h3>👥 Usuários</h3>
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/users</strong> - Listar usuários
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <strong>/api/users</strong> - Criar usuário
            </div>
            
            <h3>📂 Categorias</h3>
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/categories</strong> - Listar categorias
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <strong>/api/categories</strong> - Criar categoria
            </div>
            
            <h3>📦 Produtos</h3>
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/products</strong> - Listar produtos
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <strong>/api/products</strong> - Criar produto
            </div>
            
            <h3>🛒 Pedidos</h3>
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/orders</strong> - Listar pedidos
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <strong>/api/orders</strong> - Criar pedido
            </div>
            
            <h3>💳 Formas de Pagamento</h3>
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/payment-methods</strong> - Listar formas de pagamento
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <strong>/api/payment-methods</strong> - Criar forma de pagamento
            </div>
            
            <h3>📧 Contatos</h3>
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/contacts</strong> - Listar contatos
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <strong>/api/contacts</strong> - Criar contato
            </div>
            
            <h3>📱 WhatsApp</h3>
            <div class="endpoint">
              <span class="method get">GET</span>
              <strong>/api/whatsapp</strong> - Listar números WhatsApp
            </div>
            <div class="endpoint">
              <span class="method post">POST</span>
              <strong>/api/whatsapp</strong> - Salvar número WhatsApp
            </div>
            
            <div class="footer">
              <p>🎉 Desenvolvido por: Andrews Pablo</p>
              <p>Data: 16 de Janeiro de 2026</p>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Rota não encontrada
    else {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Rota não encontrada' }));
    }

  } catch (err) {
    console.error('Erro:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
});
