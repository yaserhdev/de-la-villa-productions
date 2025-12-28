let shopifyAPI, cartManager, countdownInterval, openingCountdownInterval;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if limited drop mode is enabled
  if (!SHOPIFY_CONFIG.limitedDropMode) {
    // Shop is always open - skip all timing checks
    startShop();
    return;
  }
  
  // Limited drop mode - use existing timing logic
  const shopStatus = getShopStatus();
  
  if (shopStatus === 'not-yet-open') {
    showShopOpening();
    startOpeningCountdown();
    return;
  }
  
  if (shopStatus === 'closed') {
    showShopClosed();
    return;
  }
  
  startCountdown();
  startShop();
});

// Initialize shop functionality
async function startShop() {
  shopifyAPI = new ShopifyAPI(SHOPIFY_CONFIG);
  cartManager = new CartManager();
  
  await validateCart();
  
  updateCartUI();
  cartManager.subscribe(updateCartUI);
  
  await loadProducts();
  setupCartModal();
  resetCheckoutButton();
}

async function validateCart() {
  const items = cartManager.getItems();
  if (items.length === 0) return;
  
  try {
    const products = await shopifyAPI.getProducts();
    const updatedItems = [];
    const removedItems = [];
    
    items.forEach(cartItem => {
      // Find the product and variant in current Shopify data
      const product = products.find(p => p.id === cartItem.productId);
      
      if (!product) {
        removedItems.push(cartItem.title);
        return;
      }
      
      const variant = product.variants.find(v => v.id === cartItem.variantId);
      
      if (!variant || !variant.available) {
        removedItems.push(`${cartItem.title}${cartItem.variantTitle ? ` (${cartItem.variantTitle})` : ''}`);
        return;
      }
      
      // Check if quantity exceeds available stock
      if (cartItem.quantity > variant.quantityAvailable) {
        cartItem.quantity = variant.quantityAvailable;
      }
      
      updatedItems.push(cartItem);
    });
    
    // Update cart with validated items
    if (removedItems.length > 0 || updatedItems.length !== items.length) {
      cartManager.items = updatedItems;
      cartManager.saveCart();
      
      // Notify user of changes
      if (removedItems.length > 0) {
        const message = removedItems.length === 1
          ? `"${removedItems[0]}" is no longer available and was removed from your cart.`
          : `The following items are no longer available and were removed from your cart:\n${removedItems.map(item => `• ${item}`).join('\n')}`;
        
        // Show notification after a brief delay so page loads first
        setTimeout(() => alert(message), 500);
      }
    }
  } catch (error) {
    console.error('Error validating cart:', error);
  }
}

// Reset checkout button state
function resetCheckoutButton() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout';
  }
}

// Determine shop status
function getShopStatus() {
  const now = new Date();
  const openingDate = new Date(SHOPIFY_CONFIG.shopOpeningDate);
  const closingDate = new Date(SHOPIFY_CONFIG.shopClosingDate);
  
  if (now < openingDate) {
    return 'not-yet-open';
  } else if (now >= closingDate) {
    return 'closed';
  } else {
    return 'open';
  }
}

// Show shop opening soon state
function showShopOpening() {
  document.getElementById('shopSection').classList.add('is-hidden');
  document.getElementById('shopOpeningSoon').classList.remove('is-hidden');
  document.getElementById('fixedCartButton').classList.add('is-hidden');
}

// Show shop closed state
function showShopClosed() {
  document.getElementById('shopSection').classList.add('is-hidden');
  document.getElementById('shopClosed').classList.remove('is-hidden');
  document.getElementById('fixedCartButton').classList.add('is-hidden');
}

// Start opening countdown timer
function startOpeningCountdown() {
  const openingDate = new Date(SHOPIFY_CONFIG.shopOpeningDate);
  const countdownText = document.getElementById('openingCountdownText');
  
  function updateOpeningTimer() {
    const now = new Date();
    const diff = openingDate - now;
    
    if (diff <= 0) {
      clearInterval(openingCountdownInterval);
      window.location.reload();
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const formattedTime = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    countdownText.textContent = `The shop will be open in ${formattedTime}`;
  }
  
  updateOpeningTimer();
  openingCountdownInterval = setInterval(updateOpeningTimer, 1000);
}

// Start countdown timer (while shop is open)
function startCountdown() {
  // Only show countdown in limited drop mode
  if (!SHOPIFY_CONFIG.limitedDropMode) {
    return;
  }
  
  const timerElement = document.getElementById('shopTimer');
  const closingDate = new Date(SHOPIFY_CONFIG.shopClosingDate);

  function updateTimer() {
    const now = new Date();
    const diff = closingDate - now;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      showShopClosed();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const formattedTime = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    timerElement.textContent = `Limited Drop [${formattedTime}]`;
  }

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

    document.querySelectorAll('.color-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const selectedColor = e.target.value;
        const card = e.target.closest('.product-card');
        const productData = JSON.parse(card.dataset.product);
        const sizeSelect = card.querySelector('.size-select');
        const quantitySelect = card.querySelector('.quantity-select');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const stockWarningContainer = card.querySelector('.stock-warning-container');
        const productImage = card.querySelector('.product-image img');
        
        // Get selected size (or first available size if none selected)
        const selectedSize = sizeSelect ? sizeSelect.value : null;
        
        // Find matching variant
        let matchingVariant = null;
        
        if (selectedSize) {
          // Both color and size exist
          matchingVariant = productData.variants.find(v => {
            const colorOption = v.selectedOptions.find(opt => opt.name === 'Color');
            const sizeOption = v.selectedOptions.find(opt => opt.name === 'Size');
            return colorOption && colorOption.value === selectedColor &&
                   sizeOption && sizeOption.value === selectedSize;
          });
        } else {
          // Only color exists (single size product)
          matchingVariant = productData.variants.find(v => {
            const colorOption = v.selectedOptions.find(opt => opt.name === 'Color');
            return colorOption && colorOption.value === selectedColor;
          });
        }
        
        // Fallback: find any variant with the selected color
        if (!matchingVariant) {
          matchingVariant = productData.variants.find(v => {
            const colorOption = v.selectedOptions.find(opt => opt.name === 'Color');
            return colorOption && colorOption.value === selectedColor;
          });
        }
        
        if (matchingVariant) {
          // Update product image if variant has its own image
          if (matchingVariant.image && matchingVariant.image.url) {
            productImage.src = matchingVariant.image.url;
            productImage.alt = matchingVariant.image.alt || productData.title;
          }
          
          // Update size options based on selected color
          if (sizeSelect) {
            const sizesForColor = productData.variants.filter(v => {
              const colorOption = v.selectedOptions.find(opt => opt.name === 'Color');
              return colorOption && colorOption.value === selectedColor;
            });
            
            sizeSelect.innerHTML = sizesForColor.map(variant => {
              const sizeOption = variant.selectedOptions.find(opt => opt.name === 'Size');
              return `
                <option value="${sizeOption.value}" 
                        ${!variant.available ? 'disabled' : ''}
                        data-variant-id="${variant.id}"
                        data-stock="${variant.quantityAvailable}">
                  ${sizeOption.value} ${!variant.available ? '(Out of Stock)' : ''}
                </option>
              `;
            }).join('');
            
            // Trigger size change to update quantity and button
            sizeSelect.dispatchEvent(new Event('change'));
          } else {
            // No size selector (single size product)
            const stock = matchingVariant.quantityAvailable || 10;
            
            addToCartBtn.dataset.variantId = matchingVariant.id;
            
            quantitySelect.innerHTML = Array.from({length: stock}, (_, i) => i + 1)
              .map(num => `<option value="${num}">${num}</option>`)
              .join('');
            
            quantitySelect.value = '1';
            addToCartBtn.dataset.quantity = '1';
            
            updateStockWarning(stockWarningContainer, stock);
          }
        }
      });
    });

    document.querySelectorAll('.size-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const selectedSize = e.target.value;
        const selectedOption = e.target.options[e.target.selectedIndex];
        const variantId = selectedOption.dataset.variantId;
        const stock = parseInt(selectedOption.dataset.stock) || 10;
        
        const card = e.target.closest('.product-card');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const quantitySelect = card.querySelector('.quantity-select');
        const stockWarningContainer = card.querySelector('.stock-warning-container');
        
        addToCartBtn.dataset.variantId = variantId;
        
        quantitySelect.innerHTML = Array.from({length: stock}, (_, i) => i + 1)
          .map(num => `<option value="${num}">${num}</option>`)
          .join('');
        
        quantitySelect.value = '1';
        addToCartBtn.dataset.quantity = '1';
        
        updateStockWarning(stockWarningContainer, stock);
      });
    });

    document.querySelectorAll('.variant-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const variantId = e.target.value;
        const selectedOption = e.target.options[e.target.selectedIndex];
        const stock = parseInt(selectedOption.dataset.stock) || 10;
        
        const card = e.target.closest('.product-card');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const quantitySelect = card.querySelector('.quantity-select');
        const stockWarningContainer = card.querySelector('.stock-warning-container');
        
        addToCartBtn.dataset.variantId = variantId;
        
        quantitySelect.innerHTML = Array.from({length: stock}, (_, i) => i + 1)
          .map(num => `<option value="${num}">${num}</option>`)
          .join('');
        
        quantitySelect.value = '1';
        addToCartBtn.dataset.quantity = '1';
        
        // Update stock warning
        updateStockWarning(stockWarningContainer, stock);
      });
    });

    document.querySelectorAll('.quantity-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const quantity = e.target.value;
        const card = e.target.closest('.product-card');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        addToCartBtn.dataset.quantity = quantity;
      });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });

    // Setup image lightbox
    setupImageLightbox();

  } catch (error) {
    console.error('Error loading products:', error);
    loadingState.classList.add('is-hidden');
    errorState.classList.remove('is-hidden');
  }
}

// Update stock warning display
function updateStockWarning(container, stock) {
  if (stock <= 3 && stock > 0) {
    container.innerHTML = `<span class="stock-warning">Only ${stock} left in stock!</span>`;
  } else {
    container.innerHTML = '';
  }
}

// Setup image lightbox
function setupImageLightbox() {
  const lightbox = document.getElementById('imageLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');
  
  if (!lightbox || !lightboxImage || !lightboxClose) return;
  
  // Add click handlers to all product images
  document.querySelectorAll('.product-image img').forEach(img => {
    img.addEventListener('click', async () => {
      lightboxImage.src = img.src;
      lightboxImage.alt = img.alt;
      lightbox.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      
      // Request fullscreen on mobile/tablet
      try {
        if (lightbox.requestFullscreen) {
          await lightbox.requestFullscreen();
        } else if (lightbox.webkitRequestFullscreen) {
          await lightbox.webkitRequestFullscreen();
        } else if (lightbox.msRequestFullscreen) {
          await lightbox.msRequestFullscreen();
        }
      } catch (error) {
        // Fullscreen failed, no problem - lightbox still works
        console.log('Fullscreen not available');
      }
    });
  });
  
  // Close lightbox
  async function closeLightbox() {
    // Exit fullscreen if active
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (error) {
      console.log('Exit fullscreen error');
    }
    
    lightbox.classList.remove('is-active');
    document.body.style.overflow = '';
  }
  
  lightboxClose.addEventListener('click', closeLightbox);
  
  // Close on background click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Close on ESC key or fullscreen exit
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-active')) {
      closeLightbox();
    }
  });
  
  // Handle fullscreen change (user exits fullscreen via device button)
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && lightbox.classList.contains('is-active')) {
      closeLightbox();
    }
  });
  
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && lightbox.classList.contains('is-active')) {
      closeLightbox();
    }
  });
}

function formatDescription(desc) {
  if (!desc) return '';
  
  const parts = desc.split(' - ');
  
  if (parts.length <= 1) {
    return desc;
  }
  
  const title = parts[0].trim();
  const bullets = parts.slice(1).map(item => item.trim());
  
  return `
    <p>${title}</p>
    <div class="description-bullets">
      <ul>
        ${bullets.map(bullet => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
  `;
}

function createProductCard(product) {
  const defaultVariant = product.variants[0];
  
  // Use variant image if available, otherwise fall back to product image
  const imageSrc = defaultVariant.image?.url || product.images[0]?.url || 'https://via.placeholder.com/400x400?text=No+Image';
  
  const priceFormatted = shopifyAPI.formatPrice(product.price, product.currencyCode);
  
  // Extract unique colors and sizes from variants
  const colors = [];
  const sizes = [];
  
  product.variants.forEach(variant => {
    variant.selectedOptions.forEach(option => {
      if (option.name === 'Color' && !colors.includes(option.value)) {
        colors.push(option.value);
      }
      if (option.name === 'Size' && !sizes.includes(option.value)) {
        sizes.push(option.value);
      }
    });
  });
  
  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const hasOldStyleVariants = product.variants.length > 1 && product.variants[0].title !== 'Default Title' && !hasColors && !hasSizes;
  
  // Add out-of-stock class if product is unavailable
  const outOfStockClass = !product.available ? 'is-out-of-stock' : '';
  
  // Determine initial stock warning
  const defaultStock = defaultVariant.quantityAvailable || 0;
  const stockWarning = (defaultStock <= 3 && defaultStock > 0) 
    ? `<span class="stock-warning">Only ${defaultStock} left in stock!</span>` 
    : '';

  return `
    <div class="column is-full-mobile is-half-tablet is-one-third-fullhd">
      <div class="product-card ${outOfStockClass}" data-product='${JSON.stringify(product)}'>
        <figure class="product-image">
          <img src="${imageSrc}" alt="${product.title}">
        </figure>
        <div class="product-info">
          <h4 class="title is-5 has-text-centered mb-2">${product.title}</h4>
          ${product.description ? `<div class="product-description mb-3">${formatDescription(product.description)}</div>` : ''}
          <div class="is-flex is-flex-direction-column is-align-items-center ${product.description ? '' : 'mt-4'}">
            <span class="subtitle has-text-white mb-4">${priceFormatted}</span>
            
            <div class="variant-selectors mb-4">
              ${hasColors ? `
                <div class="field">
                  <label class="label has-text-white">Color:</label>
                  <div class="control">
                    <div class="select">
                      <select class="color-select" data-product-id="${product.id}">
                        ${colors.map(color => `
                          <option value="${color}">${color}</option>
                        `).join('')}
                      </select>
                    </div>
                  </div>
                </div>
              ` : ''}
              
              ${hasSizes ? `
                <div class="field">
                  <label class="label has-text-white">Size:</label>
                  <div class="control">
                    <div class="select">
                      <select class="size-select" data-product-id="${product.id}">
                        ${(() => {
                          // Get sizes for the default (first) color
                          const defaultColor = colors[0] || null;
                          const sizesForColor = product.variants.filter(v => {
                            if (!defaultColor) return true;
                            const colorOption = v.selectedOptions.find(opt => opt.name === 'Color');
                            return colorOption && colorOption.value === defaultColor;
                          });
                          
                          return sizesForColor.map(variant => {
                            const sizeOption = variant.selectedOptions.find(opt => opt.name === 'Size');
                            return `
                              <option value="${sizeOption.value}" 
                                      ${!variant.available ? 'disabled' : ''}
                                      data-variant-id="${variant.id}"
                                      data-stock="${variant.quantityAvailable}">
                                ${sizeOption.value} ${!variant.available ? '(Out of Stock)' : ''}
                              </option>
                            `;
                          }).join('');
                        })()}
                      </select>
                    </div>
                  </div>
                </div>
              ` : ''}
              
              ${hasOldStyleVariants ? `
                <div class="field">
                  <label class="label has-text-white">Option:</label>
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
              ` : ''}
              
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
            
            <div class="stock-warning-container">${stockWarning}</div>
            
            ${product.available 
              ? `<button class="button is-primary has-text-white add-to-cart-btn" 
                         data-product='${JSON.stringify(product)}' 
                         data-variant-id="${defaultVariant.id}"
                         data-quantity="1">
                   Add to Cart
                 </button>`
              : `<button class="button is-primary has-text-white add-to-cart-btn" disabled>
                   Out of Stock
                 </button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleAddToCart(e) {
  const btn = e.currentTarget;
  const product = JSON.parse(btn.dataset.product);
  const variantId = btn.dataset.variantId;
  const quantity = parseInt(btn.dataset.quantity) || 1;

  try {
    cartManager.addItem(product, variantId, quantity);
    
    btn.textContent = 'Added!';
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
    }, 1500);

    openCartModal();

  } catch (error) {
    console.error('Error adding to cart:', error);
    alert(error.message);
  }
}

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const count = cartManager.getItemCount();
  
  cartCount.textContent = count;
  cartCount.style.display = count > 0 ? 'flex' : 'none';

  updateCartModal();
}

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

function openCartModal() {
  const modal = document.getElementById('cartModal');
  modal.classList.add('is-active');
  document.body.style.overflow = 'hidden';
  
  resetCheckoutButton();
  updateCartModal();
}

function closeCartModal() {
  const modal = document.getElementById('cartModal');
  modal.classList.remove('is-active');
  document.body.style.overflow = '';
}

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

  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', handleQuantityChange);
  });

  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', handleRemoveItem);
  });
}

function handleQuantityChange(e) {
  const variantId = e.currentTarget.dataset.variantId;
  const action = e.currentTarget.dataset.action;
  const item = cartManager.getItems().find(item => item.variantId === variantId);

  if (!item) return;

  const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
  cartManager.updateQuantity(variantId, newQuantity);
}

function handleRemoveItem(e) {
  const variantId = e.currentTarget.dataset.variantId;
  cartManager.removeItem(variantId);
}

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

    cartManager.clear();
    window.location.href = checkout.webUrl;

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Error creating checkout. Please try again.');
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout';
  }
}