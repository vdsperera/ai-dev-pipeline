'use strict';

/**
 * Inventory Controller — HTTP request handling for inventory operations.
 */
class InventoryController {
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
  }

  handleListStock(req, res) {
    try {
      const items = this.inventoryService.listStock();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: items.length, data: items }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  handleRestock(req, res, body) {
    try {
      const { sku, quantity } = body;
      const updatedItem = this.inventoryService.restock(sku, quantity);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: updatedItem }));
    } catch (err) {
      const status = err.message.includes('required') || err.message.includes('positive') ? 400 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}

module.exports = { InventoryController };
