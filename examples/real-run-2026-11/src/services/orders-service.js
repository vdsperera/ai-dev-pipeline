'use strict';

/**
 * Order Service — Coordinates order lifecycle and stock reservations.
 */
class OrdersService {
  constructor(orderStore, inventoryService) {
    this.orderStore = orderStore;
    this.inventoryService = inventoryService;
  }

  getOrder(orderId) {
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Order ID is required');
    }
    const order = this.orderStore.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    return order;
  }

  listOrders() {
    return this.orderStore.getAllOrders();
  }

  createOrder({ customerId, items }) {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Customer ID is required');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one line item');
    }

    // Validate and reserve each line item
    for (const item of items) {
      if (!item.sku || !item.quantity || item.quantity <= 0) {
        throw new Error('Each order item must specify a valid SKU and positive quantity');
      }
      this.inventoryService.reserveStock(item.sku, item.quantity);
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const newOrder = {
      id: orderId,
      customerId: customerId.trim(),
      items: items.map(i => ({ sku: i.sku.trim().toUpperCase(), quantity: i.quantity })),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    return this.orderStore.saveOrder(newOrder);
  }

  cancelOrder(orderId, reason = 'Customer requested cancellation') {
    const order = this.getOrder(orderId);

    if (order.status === 'CANCELLED') {
      throw new Error('Order is already cancelled');
    }
    if (order.status === 'FULFILLED') {
      throw new Error('Cannot cancel order in FULFILLED status');
    }
    if (order.status !== 'PENDING') {
      throw new Error(`Order cannot be cancelled in ${order.status} status`);
    }

    // Release reserved items back to inventory
    for (const item of order.items) {
      this.inventoryService.releaseStock(item.sku, item.quantity);
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date().toISOString();
    order.cancellationReason = reason;
    this.orderStore.saveOrder(order);

    const auditLog = this.orderStore.appendAuditLog({
      orderId: order.id,
      action: 'CANCEL_ORDER',
      reason,
      restockedItems: order.items.map(i => ({ sku: i.sku, quantity: i.quantity }))
    });

    return { order, auditLog };
  }
}

module.exports = { OrdersService };
