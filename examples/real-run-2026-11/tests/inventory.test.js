'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InventoryStore } = require('../src/models/inventory-store');
const { InventoryService } = require('../src/services/inventory-service');

test('InventoryService reserves and restocks items accurately', () => {
  const store = new InventoryStore();
  store.seed([
    { sku: 'WIDGET-01', name: 'Standard Widget', availableQuantity: 20, reservedQuantity: 0 }
  ]);
  const service = new InventoryService(store);

  // Reserve stock
  service.reserveStock('WIDGET-01', 5);
  let item = service.getItem('WIDGET-01');
  assert.equal(item.availableQuantity, 15);
  assert.equal(item.reservedQuantity, 5);

  // Restock
  service.restock('WIDGET-01', 10);
  item = service.getItem('WIDGET-01');
  assert.equal(item.availableQuantity, 25);
  assert.equal(item.reservedQuantity, 5);
});

test('InventoryService rejects over-reservation beyond stock level', () => {
  const store = new InventoryStore();
  store.seed([
    { sku: 'GADGET-01', name: 'Mini Gadget', availableQuantity: 3, reservedQuantity: 0 }
  ]);
  const service = new InventoryService(store);

  assert.throws(
    () => service.reserveStock('GADGET-01', 10),
    /Insufficient stock for SKU GADGET-01/
  );
});
