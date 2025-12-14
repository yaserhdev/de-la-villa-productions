// shop.js - Shop page functionality

let shopifyAPI;
let cartManager;
let countdownInterval;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if shop is closed first
  if (isShopClosed()) {
    showShopClosed();
    return;
  }

  // Initialize countdown timer
  startCountdown();

  // Initialize Shopify API and Cart Manager
  shopifyAPI = new ShopifyAPI(SHOPIFY_CONFIG);
  cartManager = new CartManager();

  // Update cart count on load
  updateCartUI();

  // Subscribe to cart changes
  cartManager.subscribe(updateCartUI);

  // Load products
  await loadProducts();

  // Setup cart modal
  setupCartModal();
});

// Check if shop is closed
function isShopClosed() {
  const closingDate = new Date(SHOPIFY_CONFIG.shopClosingDate);
  const now = new Date();
  return now >= closingDate;
}

// Show shop closed state
function showShopClosed() {
  document.getElementById('shopSection').classList.add('is-hidden');
  document.getElementById('shopClosed').classList.remove('is-hidden');
  document.getElementById('fixedCartButton').classList.add('is-hidden');
}

// Start countdown timer
function startCountdown() {
  const timerElement = document.getElementById('shopTimer');
  const closingDate = new Date(SHOPIFY_CONFIG.shopClosingDate);

  function updateTimer() {
    const now = new Date();
    const diff = closingDate - now;

    if (diff <= 0) {
      // Shop is now closed
      clearInterval(countdownInterval);
      showShopClosed();
      return;
    }

    // Calculate time remaining
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Format as DD:HH:MM:SS
    const formattedTime = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    timerElement.textContent = `for ${formattedTime}`;
  }

  // Update immediately and then every second
  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

// Load and display products
async function loadProducts() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const productsGrid = document.getElementById('productsGrid');

  try {
    const products = await shopifyAPI.getProducts();

    loadingState.classList.add('is-hidden');
    productsGrid.classList.remove('is-hidden');

    if (products.length === 0) {
      productsGrid.innerHTML = '<p class="has-text-centered subtitle">No products available at this time.</p>';
      return;
    }

    productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');

    // Add event listeners for variant selects
    document.querySelectorAll('.variant-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const variantId = e.target.value;
        const selectedOption = e.target.options[e.target.selectedIndex];
        const stock = parseInt(selectedOption.dataset.stock) || 10;
        
        const card = e.target.closest('.product-card');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const quantitySelect = card.querySelector('.quantity-select');
        
        // Update button variant ID
        addToCartBtn.dataset.variantId = variantId;
        
        // Update quantity dropdown based on stock
        quantitySelect.innerHTML = Array.from({length: stock}, (_, i) => i + 1)
          .map(num => `<option value="${num}">${num}</option>`)
          .join('');
        
        // Reset quantity to 1
        quantitySelect.value = '1';
        addToCartBtn.dataset.quantity = '1';
      });
    });

    // Add event listeners for quantity selects
    document.querySelectorAll('.quantity-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const quantity = e.target.value;
        const card = e.target.closest('.product-card');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        addToCartBtn.dataset.quantity = quantity;
      });
    });

    // Add event listeners to "Add to Cart" buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });

  } catch (error) {
    console.error('Error loading products:', error);
    loadingState.classList.add('is-hidden');
    errorState.classList.remove('is-hidden');
  }
}

// Create product card HTML
function createProductCard(product) {
  const defaultVariant = product.variants[0];
  const imageSrc = product.images[0]?.url || 'https://via.placeholder.com/400x400?text=No+Image';
  const priceFormatted = shopifyAPI.formatPrice(product.price, product.currencyCode);
  
  // Check if product has multiple variants (sizes)
  const hasVariants = product.variants.length > 1 && product.variants[0].title !== 'Default Title';

  return `
    <div class="column is-full-mobile is-half-tablet is-one-third-fullhd">
      <div class="product-card">
        <figure class="product-image box">
          <img src="${imageSrc}" alt="${product.title}">
        </figure>
        <div class="product-info">
          <h4 class="title is-5 has-text-centered mb-2">${product.title}</h4>
          ${product.description ? `<p class="product-description has-text-centered mb-3">${truncateText(product.description, 80)}</p>` : ''}
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <span class="subtitle has-text-white mb-4">${priceFormatted}</span>
            
            ${hasVariants ? `
              <div class="variant-selectors mb-4">
                <div class="field">
                  <label class="label has-text-white">Size:</label>
                  <div class="control">
                    <div class="select">
                      <select class="variant-select" data-product-id="${product.id}">
                        ${product.variants.map(variant => `
                          <option value="${variant.id}" 
                                  ${!variant.available ? 'disabled' : ''}
                                  data-stock="${variant.quantityAvailable}">
                            ${variant.title} ${!variant.available ? '(Out of Stock)' : ''}
                          </option>
                        `).join('')}
                      </select>
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label class="label has-text-white">Qty:</label>
                  <div class="control">
                    <div class="select">
                      <select class="quantity-select" data-product-id="${product.id}">
                        ${Array.from({length: defaultVariant.quantityAvailable || 10}, (_, i) => i + 1).map(num => `
                          <option value="${num}">${num}</option>
                        `).join('')}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            ${product.available 
              ? `<button class="button is-primary has-text-white add-to-cart-btn" 
                         data-product='${JSON.stringify(product)}' 
                         data-variant-id="${defaultVariant.id}"
                         data-quantity="1">
                   Add to Cart
                 </button>`
              : `<button class="button is-primary has-text-white" disabled>
                   Out of Stock
                 </button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

// Handle add to cart
function handleAddToCart(e) {
  const btn = e.currentTarget;
  const product = JSON.parse(btn.dataset.product);
  const variantId = btn.dataset.variantId;
  const quantity = parseInt(btn.dataset.quantity) || 1;

  try {
    cartManager.addItem(product, variantId, quantity);
    
    // Visual feedback
    btn.textContent = 'Added!';
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
    }, 1500);

    // Open cart modal
    openCartModal();

  } catch (error) {
    console.error('Error adding to cart:', error);
    alert(error.message);
  }
}

// Update cart UI
function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const count = cartManager.getItemCount();
  
  cartCount.textContent = count;
  cartCount.style.display = count > 0 ? 'flex' : 'none';

  updateCartModal();
}

// Setup cart modal
function setupCartModal() {
  const modal = document.getElementById('cartModal');
  const fixedCartButton = document.getElementById('fixedCartButton');
  const cartClose = document.getElementById('cartClose');
  const checkoutBtn = document.getElementById('checkoutBtn');

  fixedCartButton.addEventListener('click', (e) => {
    e.preventDefault();
    openCartModal();
  });

  cartClose.addEventListener('click', closeCartModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCartModal();
    }
  });

  checkoutBtn.addEventListener('click', handleCheckout);
}

// Open cart modal
function openCartModal() {
  const modal = document.getElementById('cartModal');
  modal.classList.add('is-active');
  document.body.style.overflow = 'hidden';
  updateCartModal();
}

// Close cart modal
function closeCartModal() {
  const modal = document.getElementById('cartModal');
  modal.classList.remove('is-active');
  document.body.style.overflow = '';
}

// Update cart modal content
function updateCartModal() {
  const cartBody = document.getElementById('cartBody');
  const cartTotal = document.getElementById('cartTotal');
  const items = cartManager.getItems();

  if (items.length === 0) {
    cartBody.innerHTML = '<p class="has-text-centered py-6">Your cart is empty</p>';
    cartTotal.textContent = '$0.00';
    return;
  }

  cartBody.innerHTML = items.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}" class="cart-item-image">
      <div class="cart-item-details">
        <h5 class="title is-6">${item.title}</h5>
        ${item.variantTitle ? `<p class="is-size-7">${item.variantTitle}</p>` : ''}
        <p class="subtitle is-6">${shopifyAPI.formatPrice(item.price)}</p>
      </div>
      <div class="cart-item-quantity">
        <button class="quantity-btn" data-variant-id="${item.variantId}" data-action="decrease">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn" data-variant-id="${item.variantId}" data-action="increase">+</button>
      </div>
      <button class="cart-item-remove" data-variant-id="${item.variantId}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');

  cartTotal.textContent = shopifyAPI.formatPrice(cartManager.getTotal());

  // Add event listeners for quantity changes and remove buttons
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', handleQuantityChange);
  });

  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', handleRemoveItem);
  });
}

// Handle quantity change
function handleQuantityChange(e) {
  const variantId = e.currentTarget.dataset.variantId;
  const action = e.currentTarget.dataset.action;
  const item = cartManager.getItems().find(item => item.variantId === variantId);

  if (!item) return;

  const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
  cartManager.updateQuantity(variantId, newQuantity);
}

// Handle remove item
function handleRemoveItem(e) {
  const variantId = e.currentTarget.dataset.variantId;
  cartManager.removeItem(variantId);
}

// Handle checkout
async function handleCheckout() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  const items = cartManager.getItems();

  if (items.length === 0) {
    alert('Your cart is empty');
    return;
  }

  try {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Creating checkout...';

    const lineItems = items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));

    const checkout = await shopifyAPI.createCheckout(lineItems);

    // Clear cart before redirecting
    cartManager.clear();

    // Redirect to Shopify checkout
    window.location.href = checkout.webUrl;

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Error creating checkout. Please try again.');
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout';
  }
}

// Utility: Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}