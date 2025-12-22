class CartManager {
  constructor() {
    this.version = "1.0"; // Increment this when you need to force clear carts
    this.items = this.loadCart();
    this.listeners = [];
  }

  loadCart() {
    try {
      const cartData = localStorage.getItem("delavilla_cart");
      const versionData = localStorage.getItem("delavilla_cart_version");
      
      // If version doesn't match or doesn't exist, clear the cart
      if (!versionData || versionData !== this.version) {
        console.log("Cart version mismatch - clearing cart");
        localStorage.removeItem("delavilla_cart");
        localStorage.setItem("delavilla_cart_version", this.version);
        return [];
      }
      
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error("Error loading cart:", error);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem("delavilla_cart", JSON.stringify(this.items));
      localStorage.setItem("delavilla_cart_version", this.version);
      this.notifyListeners();
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  }

  addItem(product, variantId, quantity = 1) {
    const variant = product.variants.find(v => v.id === variantId);
    
    if (!variant) {
      throw new Error("Variant not found");
    }
    
    if (!variant.available) {
      throw new Error("This item is out of stock");
    }

    const existingItem = this.items.find(item => item.variantId === variantId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        productId: product.id,
        variantId: variantId,
        title: product.title,
        variantTitle: variant.title === "Default Title" ? null : variant.title,
        price: variant.price,
        image: product.images[0]?.url,
        quantity: quantity
      });
    }
    
    this.saveCart();
  }

  removeItem(variantId) {
    this.items = this.items.filter(item => item.variantId !== variantId);
    this.saveCart();
  }

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

  getItems() {
    return this.items;
  }

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.saveCart();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.items));
  }
}