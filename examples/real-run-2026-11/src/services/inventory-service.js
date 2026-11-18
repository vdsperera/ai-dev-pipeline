'use strict';

/**
 * Inventory Service — Encapsulates business logic for stock levels and reservations.
 */
class InventoryService {
  constructor(inventoryStore) {
    this.store = inventoryStore;
  }

  listStock() {
    return this.store.getAll();
  }

  getItem(sku) {
    const item = this.store.getBySku(sku);
    if (!item) {
      throw new Error(`Inventory item not found: ${sku}`);
    }
    return item;
  }

  reserveStock(sku, quantity) {
    if (!quantity || quantity <= 0) {
      throw new Error('Reservation quantity must be a positive number');
    }
    const item = this.getItem(sku);
    if (item.availableQuantity < quantity) {
      throw new Error(`Insufficient stock for SKU ${sku}: requested ${quantity}, available ${item.availableQuantity}`);
    }

    item.availableQuantity -= quantity;
    item.reservedQuantity += quantity;
    return this.store.save(item);
  }

  releaseStock(sku, quantity) {
    if (!quantity || quantity <= 0) {
      throw new Error('Release quantity must be a positive number');
    }
    const item = this.getItem(sku);
    const releaseQty = Math.min(item.reservedQuantity, quantity);

    item.reservedQuantity -= releaseQty;
    item.availableQuantity += quantity;
    return this.store.save(item);
  }

  restock(sku, quantity) {
    if (!sku || typeof sku !== 'string') {
      throw new Error('SKU is required for restock');
    }
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      throw new Error('Restock quantity must be a positive integer');
    }

    let item = this.store.getBySku(sku);
    if (!item) {
      item = {
        sku: sku.trim().toUpperCase(),
        name: `Item ${sku.trim().toUpperCase()}`,
        availableQuantity: quantity,
        reservedQuantity: 0
      };
    } else {
      item.availableQuantity += quantity;
    }

    return this.store.save(item);
  }
}

module.exports = { InventoryService };
