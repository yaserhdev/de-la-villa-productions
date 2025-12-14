// cart-manager.js - Shopping Cart State Management

class CartManager {
  constructor() {
    this.items = this.loadCart();
    this.listeners = [];
  }

  // Load cart from localStorage
  loadCart() {
    try {
      const saved = localStorage.getItem('delavilla_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  // Save cart to localStorage
  saveCart() {
    try {
      localStorage.setItem('delavilla_cart', JSON.stringify(this.items));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  // Add item to cart
  addItem(product, variantId, quantity = 1) {
    const variant = product.variants.find(v => v.id === variantId);
    
    if (!variant) {
      throw new Error('Variant not found');
    }

    if (!variant.available) {
      throw new Error('This item is out of stock');
    }

    // Check if item already in cart
    const existingItem = this.items.find(item => item.variantId === variantId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        productId: product.id,
        variantId: variantId,
        title: product.title,
        variantTitle: variant.title !== 'Default Title' ? variant.title : null,
        price: variant.price,
        image: product.images[0]?.url,
        quantity: quantity
      });
    }

    this.saveCart();
  }

  // Remove item from cart
  removeItem(variantId) {
    this.items = this.items.filter(item => item.variantId !== variantId);
    this.saveCart();
  }

  // Update item quantity
  updateQuantity(variantId, quantity) {
    const item = this.items.find(item => item.variantId === variantId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeItem(variantId);
      } else {
        item.quantity = quantity;
        this.saveCart();
      }
    }
  }

  // Get cart items
  getItems() {
    return this.items;
  }

  // Get cart total
  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get item count
  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  // Clear cart
  clear() {
    this.items = [];
    this.saveCart();
  }

  // Subscribe to cart changes
  subscribe(callback) {
    this.listeners.push(callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.items));
  }
}