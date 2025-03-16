import { describe, it, expect, beforeEach } from "vitest"

// Mock Clarity contract interaction
const inventoryContract = {
  state: {
    inventoryCount: 0,
    inventory: new Map(),
    admin: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  },
  
  addInventoryItem(foodType, quantity, expirationDate, donationId, sender) {
    const itemId = this.state.inventoryCount + 1
    
    this.state.inventory.set(itemId, {
      foodType,
      quantity,
      expirationDate,
      donationId,
      available: true,
    })
    
    this.state.inventoryCount = itemId
    return { value: itemId }
  },
  
  updateQuantity(itemId, newQuantity, sender) {
    if (sender !== this.state.admin) {
      return { error: 100 } // Unauthorized
    }
    
    if (!this.state.inventory.has(itemId)) {
      return { error: 102 } // Not found
    }
    
    const item = this.state.inventory.get(itemId)
    item.quantity = newQuantity
    this.state.inventory.set(itemId, item)
    
    return { value: true }
  },
  
  markUnavailable(itemId, sender) {
    if (sender !== this.state.admin) {
      return { error: 100 } // Unauthorized
    }
    
    if (!this.state.inventory.has(itemId)) {
      return { error: 102 } // Not found
    }
    
    const item = this.state.inventory.get(itemId)
    item.available = false
    this.state.inventory.set(itemId, item)
    
    return { value: true }
  },
  
  getInventoryItem(itemId) {
    return this.state.inventory.get(itemId) || null
  },
  
  getInventoryCount() {
    return this.state.inventoryCount
  },
}

describe("Inventory Management Contract", () => {
  const admin = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  const nonAdmin = "ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ"
  
  beforeEach(() => {
    // Reset state before each test
    inventoryContract.state.inventoryCount = 0
    inventoryContract.state.inventory = new Map()
    inventoryContract.state.admin = admin
  })
  
  it("should add inventory item", () => {
    const now = Math.floor(Date.now() / 1000)
    const future = now + 86400 * 30 // 30 days later
    
    const result = inventoryContract.addInventoryItem("Canned Goods", 100, future, 1, admin)
    
    expect(result).toHaveProperty("value")
    expect(result.value).toBe(1)
    expect(inventoryContract.getInventoryCount()).toBe(1)
    
    const item = inventoryContract.getInventoryItem(1)
    expect(item).not.toBeNull()
    expect(item.foodType).toBe("Canned Goods")
    expect(item.quantity).toBe(100)
    expect(item.available).toBe(true)
  })
  
  it("should update quantity when admin", () => {
    // Add an item first
    inventoryContract.addInventoryItem("Canned Goods", 100, Date.now() + 86400 * 30, 1, admin)
    
    // Update the quantity
    const result = inventoryContract.updateQuantity(1, 75, admin)
    
    expect(result).toHaveProperty("value")
    expect(result.value).toBe(true)
    
    const item = inventoryContract.getInventoryItem(1)
    expect(item.quantity).toBe(75)
  })
  
  it("should not update quantity when non-admin", () => {
    // Add an item first
    inventoryContract.addInventoryItem("Canned Goods", 100, Date.now() + 86400 * 30, 1, admin)
    
    // Try to update the quantity as non-admin
    const result = inventoryContract.updateQuantity(1, 75, nonAdmin)
    
    expect(result).toHaveProperty("error")
    expect(result.error).toBe(100) // Unauthorized
    
    const item = inventoryContract.getInventoryItem(1)
    expect(item.quantity).toBe(100) // Unchanged
  })
  
  it("should mark item as unavailable when admin", () => {
    // Add an item first
    inventoryContract.addInventoryItem("Canned Goods", 100, Date.now() + 86400 * 30, 1, admin)
    
    // Mark as unavailable
    const result = inventoryContract.markUnavailable(1, admin)
    
    expect(result).toHaveProperty("value")
    expect(result.value).toBe(true)
    
    const item = inventoryContract.getInventoryItem(1)
    expect(item.available).toBe(false)
  })
  
  it("should not mark as unavailable when non-admin", () => {
    // Add an item first
    inventoryContract.addInventoryItem("Canned Goods", 100, Date.now() + 86400 * 30, 1, admin)
    
    // Try to mark as unavailable as non-admin
    const result = inventoryContract.markUnavailable(1, nonAdmin)
    
    expect(result).toHaveProperty("error")
    expect(result.error).toBe(100) // Unauthorized
    
    const item = inventoryContract.getInventoryItem(1)
    expect(item.available).toBe(true) // Unchanged
  })
})

