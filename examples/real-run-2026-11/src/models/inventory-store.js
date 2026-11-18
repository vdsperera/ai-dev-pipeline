'use strict';

/**
 * Inventory Store — In-memory persistence for SKU inventory.
 */
class InventoryStore {
  constructor() {
    this.items = new Map();
  }

  seed(initialItems = []) {
    this.items.clear();
    for (const item of initialItems) {
      this.items.set(item.sku, {
        sku: item.sku,
        name: item.name,
        availableQuantity: item.availableQuantity,
        reservedQuantity: item.reservedQuantity || 0
      });
    }
  }

  getBySku(sku) {
    if (!sku || typeof sku !== 'string') return null;
    return this.items.get(sku.trim().toUpperCase()) || null;
  }

  getAll() {
    return Array.from(this.items.values());
  }

  save(item) {
    if (!item || !item.sku) throw new Error('Cannot save inventory item without SKU');
    const normalizedSku = item.sku.trim().toUpperCase();
    this.items.set(normalizedSku, { ...item, sku: normalizedSku });
    return this.items.get(normalizedSku);
  }

  clear() {
    this.items.clear();
  }
}

module.exports = { InventoryStore };
