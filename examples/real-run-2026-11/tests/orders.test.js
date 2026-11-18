'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InventoryStore } = require('../src/models/inventory-store');
const { OrderStore } = require('../src/models/order-store');
const { InventoryService } = require('../src/services/inventory-service');
const { OrdersService } = require('../src/services/orders-service');
const { OrdersController } = require('../src/controllers/orders-controller');

function setupTestContext() {
  const inventoryStore = new InventoryStore();
  inventoryStore.seed([
    { sku: 'ITEM-A', name: 'Widget Alpha', availableQuantity: 50, reservedQuantity: 0 },
    { sku: 'ITEM-B', name: 'Widget Beta', availableQuantity: 10, reservedQuantity: 0 }
  ]);
  const orderStore = new OrderStore();
  const inventoryService = new InventoryService(inventoryStore);
  const ordersService = new OrdersService(orderStore, inventoryService);

  return { inventoryStore, orderStore, inventoryService, ordersService };
}

test('OrdersService creates order and decrements inventory available quantity', () => {
  const { ordersService, inventoryService } = setupTestContext();

  const order = ordersService.createOrder({
    customerId: 'CUST-100',
    items: [{ sku: 'ITEM-A', quantity: 5 }]
  });

  assert.ok(order.id.startsWith('ORD-'));
  assert.equal(order.status, 'PENDING');
  assert.equal(order.items.length, 1);

  const itemA = inventoryService.getItem('ITEM-A');
  assert.equal(itemA.availableQuantity, 45);
  assert.equal(itemA.reservedQuantity, 5);
});

test('OrdersService throws error when order items exceed inventory', () => {
  const { ordersService } = setupTestContext();

  assert.throws(
    () => ordersService.createOrder({
      customerId: 'CUST-101',
      items: [{ sku: 'ITEM-B', quantity: 99 }]
    }),
    /Insufficient stock for SKU ITEM-B/
  );
});

test('cancelOrder successfully cancels PENDING order, restocks inventory, and appends audit log', () => {
  const { ordersService, inventoryService, orderStore } = setupTestContext();

  const order = ordersService.createOrder({
    customerId: 'CUST-102',
    items: [{ sku: 'ITEM-A', quantity: 10 }]
  });

  const { order: cancelledOrder, auditLog } = ordersService.cancelOrder(order.id, 'Customer changed mind');

  assert.equal(cancelledOrder.status, 'CANCELLED');
  assert.equal(cancelledOrder.cancellationReason, 'Customer changed mind');
  assert.ok(cancelledOrder.cancelledAt);

  // Inventory check
  const itemA = inventoryService.getItem('ITEM-A');
  assert.equal(itemA.availableQuantity, 50); // returned from 40 back to 50
  assert.equal(itemA.reservedQuantity, 0);

  // Audit log check
  assert.ok(auditLog.id.startsWith('AUD-'));
  assert.equal(auditLog.orderId, order.id);
  assert.equal(auditLog.action, 'CANCEL_ORDER');
  assert.equal(auditLog.reason, 'Customer changed mind');
  assert.deepEqual(auditLog.restockedItems, [{ sku: 'ITEM-A', quantity: 10 }]);

  const logs = orderStore.getAuditLogsForOrder(order.id);
  assert.equal(logs.length, 1);
});

test('cancelOrder rejects cancellation of already CANCELLED or FULFILLED order', () => {
  const { ordersService, orderStore } = setupTestContext();

  const order = ordersService.createOrder({
    customerId: 'CUST-103',
    items: [{ sku: 'ITEM-B', quantity: 2 }]
  });

  // Cancel once
  ordersService.cancelOrder(order.id);

  // Attempt second cancellation
  assert.throws(
    () => ordersService.cancelOrder(order.id),
    /Order is already cancelled/
  );

  // Mark an order as FULFILLED and test
  const fulfilledOrder = orderStore.saveOrder({
    id: 'ORD-FULFILLED-1',
    customerId: 'CUST-104',
    items: [{ sku: 'ITEM-B', quantity: 1 }],
    status: 'FULFILLED',
    createdAt: new Date().toISOString()
  });

  assert.throws(
    () => ordersService.cancelOrder(fulfilledOrder.id),
    /Cannot cancel order in FULFILLED status/
  );
});

test('cancelOrder rejects non-existent order with typed error', () => {
  const { ordersService } = setupTestContext();

  assert.throws(
    () => ordersService.cancelOrder('ORD-DOES-NOT-EXIST'),
    /Order not found: ORD-DOES-NOT-EXIST/
  );
});

test('OrdersController handleCancelOrder returns 200 on success, 404 on missing, 400 on duplicate', () => {
  const { ordersService } = setupTestContext();
  const controller = new OrdersController(ordersService);

  const order = ordersService.createOrder({
    customerId: 'CUST-200',
    items: [{ sku: 'ITEM-A', quantity: 2 }]
  });

  function createMockResponse() {
    return {
      statusCode: null,
      headers: null,
      body: '',
      writeHead(code, headers) {
        this.statusCode = code;
        this.headers = headers;
      },
      end(data) {
        this.body = data;
      }
    };
  }

  // 1. Success case
  const res1 = createMockResponse();
  controller.handleCancelOrder({}, res1, order.id, { reason: 'Accidental order' });
  assert.equal(res1.statusCode, 200);
  const data1 = JSON.parse(res1.body);
  assert.equal(data1.success, true);
  assert.equal(data1.data.status, 'CANCELLED');
  assert.equal(data1.auditLog.reason, 'Accidental order');

  // 2. Duplicate case (400)
  const res2 = createMockResponse();
  controller.handleCancelOrder({}, res2, order.id, {});
  assert.equal(res2.statusCode, 400);
  const data2 = JSON.parse(res2.body);
  assert.equal(data2.success, false);
  assert.match(data2.error, /already cancelled/);

  // 3. Not found case (404)
  const res3 = createMockResponse();
  controller.handleCancelOrder({}, res3, 'ORD-UNKNOWN-99', {});
  assert.equal(res3.statusCode, 404);
  const data3 = JSON.parse(res3.body);
  assert.equal(data3.success, false);
  assert.match(data3.error, /not found/);
});
