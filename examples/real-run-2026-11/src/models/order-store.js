'use strict';

/**
 * Order Store — In-memory persistence for orders and audit log entries.
 */
class OrderStore {
  constructor() {
    this.orders = new Map();
    this.auditLogs = [];
  }

  saveOrder(order) {
    if (!order || !order.id) throw new Error('Cannot save order without ID');
    this.orders.set(order.id, { ...order });
    return this.orders.get(order.id);
  }

  getOrderById(id) {
    if (!id || typeof id !== 'string') return null;
    return this.orders.get(id) || null;
  }

  getAllOrders() {
    return Array.from(this.orders.values());
  }

  appendAuditLog(entry) {
    const logRecord = {
      id: `AUD-${Date.now()}-${this.auditLogs.length + 1}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.auditLogs.push(logRecord);
    return logRecord;
  }

  getAuditLogsForOrder(orderId) {
    return this.auditLogs.filter(log => log.orderId === orderId);
  }

  clear() {
    this.orders.clear();
    this.auditLogs = [];
  }
}

module.exports = { OrderStore };
