let shopifyAPI,cartManager,countdownInterval,openingCountdownInterval;document.addEventListener("DOMContentLoaded",async()=>{const a=getShopStatus();return"not-yet-open"===a?(showShopOpening(),void startOpeningCountdown()):"closed"===a?void showShopClosed():void(startCountdown(),shopifyAPI=new ShopifyAPI(SHOPIFY_CONFIG),cartManager=new CartManager,await validateCart(),updateCartUI(),cartManager.subscribe(updateCartUI),await loadProducts(),setupCartModal(),resetCheckoutButton())});async function validateCart(){const a=cartManager.getItems();if(0!==a.length)try{const b=await shopifyAPI.getProducts(),c=[],d=[];if(a.forEach(a=>{const e=b.find(b=>b.id===a.productId);if(!e)return void d.push(a.title);const f=e.variants.find(b=>b.id===a.variantId);return f&&f.available?void(a.quantity>f.quantityAvailable&&(a.quantity=f.quantityAvailable),c.push(a)):void d.push(`${a.title}${a.variantTitle?` (${a.variantTitle})`:""}`)}),(0<d.length||c.length!==a.length)&&(cartManager.items=c,cartManager.saveCart(),0<d.length)){const a=1===d.length?`"${d[0]}" is no longer available and was removed from your cart.`:`The following items are no longer available and were removed from your cart:\n${d.map(a=>`• ${a}`).join("\n")}`;setTimeout(()=>alert(a),500)}}catch(a){console.error("Error validating cart:",a)}}function resetCheckoutButton(){const a=document.getElementById("checkoutBtn");a&&(a.disabled=!1,a.textContent="Proceed to Checkout")}function getShopStatus(){const a=new Date,b=new Date(SHOPIFY_CONFIG.shopOpeningDate),c=new Date(SHOPIFY_CONFIG.shopClosingDate);return a<b?"not-yet-open":a>=c?"closed":"open"}function showShopOpening(){document.getElementById("shopSection").classList.add("is-hidden"),document.getElementById("shopOpeningSoon").classList.remove("is-hidden"),document.getElementById("fixedCartButton").classList.add("is-hidden")}function showShopClosed(){document.getElementById("shopSection").classList.add("is-hidden"),document.getElementById("shopClosed").classList.remove("is-hidden"),document.getElementById("fixedCartButton").classList.add("is-hidden")}function startOpeningCountdown(){function a(){const a=new Date,d=b-a;if(0>=d)return clearInterval(openingCountdownInterval),void window.location.reload();const e=Math.floor(d/86400000),f=Math.floor(d%86400000/3600000),g=Math.floor(d%3600000/60000),h=Math.floor(d%60000/1e3),i=`${(e+"").padStart(2,"0")}:${(f+"").padStart(2,"0")}:${(g+"").padStart(2,"0")}:${(h+"").padStart(2,"0")}`;c.textContent=`The shop will be open in ${i}`}const b=new Date(SHOPIFY_CONFIG.shopOpeningDate),c=document.getElementById("openingCountdownText");a(),openingCountdownInterval=setInterval(a,1e3)}function startCountdown(){function a(){const a=new Date,d=c-a;if(0>=d)return clearInterval(countdownInterval),void showShopClosed();const e=Math.floor(d/86400000),f=Math.floor(d%86400000/3600000),g=Math.floor(d%3600000/60000),h=Math.floor(d%60000/1e3),i=`${(e+"").padStart(2,"0")}:${(f+"").padStart(2,"0")}:${(g+"").padStart(2,"0")}:${(h+"").padStart(2,"0")}`;b.textContent=`Limited Drop [${i}]`}const b=document.getElementById("shopTimer"),c=new Date(SHOPIFY_CONFIG.shopClosingDate);a(),countdownInterval=setInterval(a,1e3)}async function loadProducts(){const a=document.getElementById("loadingState"),b=document.getElementById("errorState"),c=document.getElementById("productsGrid");try{const b=await shopifyAPI.getProducts();if(a.classList.add("is-hidden"),c.classList.remove("is-hidden"),0===b.length)return void(c.innerHTML="<p class=\"has-text-centered subtitle\">No products available at this time.</p>");c.innerHTML=b.map(a=>createProductCard(a)).join(""),document.querySelectorAll(".variant-select").forEach(a=>{a.addEventListener("change",a=>{const b=a.target.value,c=a.target.options[a.target.selectedIndex],d=parseInt(c.dataset.stock)||10,e=a.target.closest(".product-card"),f=e.querySelector(".add-to-cart-btn"),g=e.querySelector(".quantity-select");f.dataset.variantId=b,g.innerHTML=Array.from({length:d},(a,b)=>b+1).map(a=>`<option value="${a}">${a}</option>`).join(""),g.value="1",f.dataset.quantity="1"})}),document.querySelectorAll(".quantity-select").forEach(a=>{a.addEventListener("change",a=>{const b=a.target.value,c=a.target.closest(".product-card"),d=c.querySelector(".add-to-cart-btn");d.dataset.quantity=b})}),document.querySelectorAll(".add-to-cart-btn").forEach(a=>{a.addEventListener("click",handleAddToCart)})}catch(c){console.error("Error loading products:",c),a.classList.add("is-hidden"),b.classList.remove("is-hidden")}}function formatDescription(a){if(!a)return"";const b=a.split(" - ");if(1>=b.length)return a;const c=b[0].trim(),d=b.slice(1).map(a=>a.trim());return`
    <p>${c}</p>
    <ul>
      ${d.map(a=>`<li>${a}</li>`).join("")}
    </ul>
  `}function createProductCard(a){const b=a.variants[0],c=a.images[0]?.url||"https://via.placeholder.com/400x400?text=No+Image",d=shopifyAPI.formatPrice(a.price,a.currencyCode),e=1<a.variants.length&&"Default Title"!==a.variants[0].title;return`
    <div class="column is-full-mobile is-half-tablet is-one-third-fullhd">
      <div class="product-card">
        <figure class="product-image">
          <img src="${c}" alt="${a.title}">
        </figure>
        <div class="product-info">
          <h4 class="title is-5 has-text-centered mb-2">${a.title}</h4>
          ${a.description?`<div class="product-description mb-3">${formatDescription(a.description)}</div>`:""}
          <div class="is-flex is-flex-direction-column is-align-items-center ${a.description?"":"mt-4"}">
            <span class="subtitle has-text-white mb-4">${d}</span>
            
            <div class="variant-selectors mb-4">
              ${e?`
                <div class="field">
                  <label class="label has-text-white">Size:</label>
                  <div class="control">
                    <div class="select">
                      <select class="variant-select" data-product-id="${a.id}">
                        ${a.variants.map(a=>`
                          <option value="${a.id}" 
                                  ${a.available?"":"disabled"}
                                  data-stock="${a.quantityAvailable}">
                            ${a.title} ${a.available?"":"(Out of Stock)"}
                          </option>
                        `).join("")}
                      </select>
                    </div>
                  </div>
                </div>
              `:""}
              <div class="field">
                <label class="label has-text-white">Qty:</label>
                <div class="control">
                  <div class="select">
                    <select class="quantity-select" data-product-id="${a.id}">
                      ${Array.from({length:b.quantityAvailable||10},(a,b)=>b+1).map(a=>`
                        <option value="${a}">${a}</option>
                      `).join("")}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            ${a.available?`<button class="button is-primary has-text-white add-to-cart-btn" 
                         data-product='${JSON.stringify(a)}' 
                         data-variant-id="${b.id}"
                         data-quantity="1">
                   Add to Cart
                 </button>`:`<button class="button is-primary has-text-white" disabled>
                   Out of Stock
                 </button>`}
          </div>
        </div>
      </div>
    </div>
  `}function handleAddToCart(a){const b=a.currentTarget,c=JSON.parse(b.dataset.product),d=b.dataset.variantId,e=parseInt(b.dataset.quantity)||1;try{cartManager.addItem(c,d,e),b.textContent="Added!",setTimeout(()=>{b.textContent="Add to Cart"},1500),openCartModal()}catch(a){console.error("Error adding to cart:",a),alert(a.message)}}function updateCartUI(){const a=document.getElementById("cartCount"),b=cartManager.getItemCount();a.textContent=b,a.style.display=0<b?"flex":"none",updateCartModal()}function setupCartModal(){const a=document.getElementById("cartModal"),b=document.getElementById("fixedCartButton"),c=document.getElementById("cartClose"),d=document.getElementById("checkoutBtn");b.addEventListener("click",a=>{a.preventDefault(),openCartModal()}),c.addEventListener("click",closeCartModal),a.addEventListener("click",b=>{b.target===a&&closeCartModal()}),d.addEventListener("click",handleCheckout)}function openCartModal(){const a=document.getElementById("cartModal");a.classList.add("is-active"),document.body.style.overflow="hidden",resetCheckoutButton(),updateCartModal()}function closeCartModal(){const a=document.getElementById("cartModal");a.classList.remove("is-active"),document.body.style.overflow=""}function updateCartModal(){const a=document.getElementById("cartBody"),b=document.getElementById("cartTotal"),c=cartManager.getItems();return 0===c.length?(a.innerHTML="<p class=\"has-text-centered py-6\">Your cart is empty</p>",void(b.textContent="$0.00")):void(a.innerHTML=c.map(a=>`
    <div class="cart-item">
      <img src="${a.image}" alt="${a.title}" class="cart-item-image">
      <div class="cart-item-details">
        <h5 class="title is-6">${a.title}</h5>
        ${a.variantTitle?`<p class="is-size-7">${a.variantTitle}</p>`:""}
        <p class="subtitle is-6">${shopifyAPI.formatPrice(a.price)}</p>
      </div>
      <div class="cart-item-quantity">
        <button class="quantity-btn" data-variant-id="${a.variantId}" data-action="decrease">-</button>
        <span>${a.quantity}</span>
        <button class="quantity-btn" data-variant-id="${a.variantId}" data-action="increase">+</button>
      </div>
      <button class="cart-item-remove" data-variant-id="${a.variantId}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join(""),b.textContent=shopifyAPI.formatPrice(cartManager.getTotal()),document.querySelectorAll(".quantity-btn").forEach(a=>{a.addEventListener("click",handleQuantityChange)}),document.querySelectorAll(".cart-item-remove").forEach(a=>{a.addEventListener("click",handleRemoveItem)}))}function handleQuantityChange(a){const b=a.currentTarget.dataset.variantId,c=a.currentTarget.dataset.action,d=cartManager.getItems().find(a=>a.variantId===b);if(d){const a="increase"===c?d.quantity+1:d.quantity-1;cartManager.updateQuantity(b,a)}}function handleRemoveItem(a){const b=a.currentTarget.dataset.variantId;cartManager.removeItem(b)}async function handleCheckout(){const a=document.getElementById("checkoutBtn"),b=cartManager.getItems();if(0===b.length)return void alert("Your cart is empty");try{a.disabled=!0,a.textContent="Creating checkout...";const c=b.map(a=>({variantId:a.variantId,quantity:a.quantity})),d=await shopifyAPI.createCheckout(c);cartManager.clear(),window.location.href=d.webUrl}catch(b){console.error("Checkout error:",b),alert("Error creating checkout. Please try again."),a.disabled=!1,a.textContent="Proceed to Checkout"}}