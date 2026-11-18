'use strict';

/**
 * Orders Controller — HTTP request handling and validation for order operations.
 */
class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  handleCreateOrder(req, res, body) {
    try {
      if (!body || typeof body !== 'object') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Request body must be a valid JSON object' }));
        return;
      }

      const order = this.ordersService.createOrder(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: order }));
    } catch (err) {
      const isValidation = err.message.includes('required') || err.message.includes('must contain') || err.message.includes('Insufficient stock');
      const statusCode = isValidation ? 400 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  handleGetOrder(req, res, orderId) {
    try {
      const order = this.ordersService.getOrder(orderId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: order }));
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  handleCancelOrder(req, res, orderId, body = {}) {
    try {
      const reason = (body && typeof body.reason === 'string') ? body.reason.trim() : undefined;
      const result = this.ordersService.cancelOrder(orderId, reason);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result.order, auditLog: result.auditLog }));
    } catch (err) {
      const isNotFound = err.message.includes('not found');
      const statusCode = isNotFound ? 404 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}

module.exports = { OrdersController };
