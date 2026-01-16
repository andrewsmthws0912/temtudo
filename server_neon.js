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

// Criar servidor HTTP
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  try {
    // ========== USUÁRIOS ==========
    
    // GET /api/users - Listar todos os usuários
    if (pathname === '/api/users' && req.method === 'GET') {
      const result = await pool.query('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
      return;
    }

    // POST /api/users - Criar novo usuário
    if (pathname === '/api/users' && req.method === 'POST') {
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
      const result = await pool.query('SELECT * FROM categories ORDER BY name');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: result.rows }));
      return;
    }

    // POST /api/categories - Criar nova categoria
    if (pathname === '/api/categories' && req.method === 'POST') {
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
      res.writeHead(200);
      res.end(JSON.stringify({ 
        success: true, 
        message: '🚀 Servidor rodando com sucesso!',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Rota não encontrada
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Rota não encontrada' }));

  } catch (err) {
    console.error('Erro:', err);
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
