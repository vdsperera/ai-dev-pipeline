'use strict';

const http = require('node:http');
const { InventoryStore } = require('./models/inventory-store');
const { OrderStore } = require('./models/order-store');
const { InventoryService } = require('./services/inventory-service');
const { OrdersService } = require('./services/orders-service');
const { InventoryController } = require('./controllers/inventory-controller');
const { OrdersController } = require('./controllers/orders-controller');

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Malformed JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function createApp(options = {}) {
  const inventoryStore = options.inventoryStore || new InventoryStore();
  const orderStore = options.orderStore || new OrderStore();

  const inventoryService = new InventoryService(inventoryStore);
  const ordersService = new OrdersService(orderStore, inventoryService);

  const inventoryController = new InventoryController(inventoryService);
  const ordersController = new OrdersController(ordersService);

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    // Health check
    if (method === 'GET' && pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // Inventory routes
    if (method === 'GET' && pathname === '/api/inventory') {
      inventoryController.handleListStock(req, res);
      return;
    }

    if (method === 'POST' && pathname === '/api/inventory/restock') {
      try {
        const body = await parseJsonBody(req);
        inventoryController.handleRestock(req, res, body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // Orders routes
    if (method === 'POST' && pathname === '/api/orders') {
      try {
        const body = await parseJsonBody(req);
        ordersController.handleCreateOrder(req, res, body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    const cancelMatch = pathname.match(/^\/api\/orders\/([^/]+)\/cancel$/);
    if (method === 'POST' && cancelMatch) {
      const orderId = decodeURIComponent(cancelMatch[1]);
      try {
        const body = await parseJsonBody(req);
        ordersController.handleCancelOrder(req, res, orderId, body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    const orderIdMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (method === 'GET' && orderIdMatch) {
      const orderId = decodeURIComponent(orderIdMatch[1]);
      ordersController.handleGetOrder(req, res, orderId);
      return;
    }

    // 404 handler
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  });

  return {
    server,
    stores: { inventoryStore, orderStore },
    services: { inventoryService, ordersService },
    controllers: { inventoryController, ordersController }
  };
}

module.exports = { createApp, parseJsonBody };
