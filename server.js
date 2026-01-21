const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const url = require('url');

// Configurar Pool PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Criar servidor
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        // Servir index.html na raiz
        if (pathname === '/' || pathname === '/index.html') {
            const indexPath = path.join(__dirname, 'index.html');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(indexContent);
            return;
        }

        // ROTAS DE API
        if (pathname.startsWith('/api/')) {
            // Health Check
            if (pathname === '/api/health' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: '🚀 Servidor rodando com sucesso!',
                    timestamp: new Date().toISOString()
                }));
                return;
            }

            // USUÁRIOS
            if (pathname === '/api/users') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, name FROM users');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { name, password, level } = JSON.parse(body);
                        await pool.query(
                            'INSERT INTO users (name, password, level) VALUES ($1, $2, $3)',
                            [name, password, level || 'cliente']
                        );
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Usuário criado' }));
                    });
                }
                return;
            }

            // CATEGORIAS
            if (pathname === '/api/categories') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, name FROM categories');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { name } = JSON.parse(body);
                        await pool.query('INSERT INTO categories (name) VALUES ($1)', [name]);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Categoria criada' }));
                    });
                }
                return;
            }

            // PRODUTOS
            if (pathname === '/api/products') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, name, description, price, category FROM products');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { name, description, price, category } = JSON.parse(body);
                        await pool.query(
                            'INSERT INTO products (name, description, price, category) VALUES ($1, $2, $3, $4)',
                            [name, description, price, category]
                        );
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Produto criado' }));
                    });
                }
                return;
            }

            // PEDIDOS
            if (pathname === '/api/orders') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, user_id, total, created_at FROM orders');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { user_id, total, items } = JSON.parse(body);
                        const result = await pool.query(
                            'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id',
                            [user_id, total]
                        );
                        const orderId = result.rows[0].id;
                        
                        if (items && items.length > 0) {
                            for (const item of items) {
                                await pool.query(
                                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                                    [orderId, item.product_id, item.quantity, item.price]
                                );
                            }
                        }
                        
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Pedido criado', orderId }));
                    });
                }
                return;
            }

            // FORMAS DE PAGAMENTO
            if (pathname === '/api/payment-methods') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, name FROM payment_methods');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { name } = JSON.parse(body);
                        await pool.query('INSERT INTO payment_methods (name) VALUES ($1)', [name]);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Forma de pagamento criada' }));
                    });
                }
                return;
            }

            // CONTATOS
            if (pathname === '/api/contacts') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, name, email, message FROM contacts');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { name, email, message } = JSON.parse(body);
                        await pool.query(
                            'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)',
                            [name, email, message]
                        );
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Contato registrado' }));
                    });
                }
                return;
            }

            // WHATSAPP
            if (pathname === '/api/whatsapp') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, number FROM whatsapp_messages');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { number, message } = JSON.parse(body);
                        await pool.query(
                            'INSERT INTO whatsapp_messages (number, message) VALUES ($1, $2)',
                            [number, message]
                        );
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'WhatsApp adicionado' }));
                    });
                }
                return;
            }

            // PRODUTOS INCOMPLETOS
            if (pathname === '/api/incomplete-products') {
                if (req.method === 'GET') {
                    const result = await pool.query('SELECT id, name, description FROM incomplete_products');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result.rows }));
                } else if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                        const { name, description } = JSON.parse(body);
                        await pool.query(
                            'INSERT INTO incomplete_products (name, description) VALUES ($1, $2)',
                            [name, description]
                        );
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Produto incompleto salvo' }));
                    });
                }
                return;
            }

            // Rota não encontrada
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Rota não encontrada' }));
            return;
        }

        // Arquivo não encontrado
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Rota não encontrada' }));

    } catch (err) {
        console.error('Erro:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
    }
});

// Inicializar banco de dados
async function inicializarBanco() {
    try {
        console.log('🔄 Conectando ao banco de dados Neon...');
        
        // Criar tabelas
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(100) NOT NULL,
                level VARCHAR(20) DEFAULT 'cliente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                total DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                price DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS payment_methods (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id SERIAL PRIMARY KEY,
                number VARCHAR(20) NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS incomplete_products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const query of queries) {
            await pool.query(query);
        }

        console.log('✅ Banco de dados inicializado com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err);
    }
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    await inicializarBanco();
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
});
