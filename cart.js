// Initialize cart from localStorage or create an empty array
let cart = JSON.parse(localStorage.getItem('dhagaPiroiCart')) || [];

// Function to inject custom CSS for perfect Mobile & Tablet responsiveness
function injectResponsiveStyles() {
    if (!document.getElementById('cart-responsive-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-responsive-styles';
        style.innerHTML = `
            .cart-badge {
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                background: #d45d79 !important;
                color: #fff !important;
                font-size: 10px !important;
                padding: 2px 5px !important;
                border-radius: 50% !important;
                min-width: 16px !important;
                height: 16px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-weight: bold !important;
                z-index: 9999 !important;
                line-height: 1 !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            }

            /* Toast Notification Style */
            .cart-toast {
                position: fixed; bottom: 20px; right: 20px; background: #333; color: white;
                padding: 12px 20px; border-radius: 8px; z-index: 10000;
                transform: translateX(120%); transition: transform 0.4s ease;
            }
            .cart-toast.show { transform: translateX(0); }

            /* Hide number input spin buttons for a cleaner look */
            input[type=number]::-webkit-inner-spin-button, 
            input[type=number]::-webkit-outer-spin-button { 
                -webkit-appearance: none; margin: 0; 
            }
            input[type=number] { -moz-appearance: textfield; }

            /* Mobile Specific Styles */
            @media (max-width: 600px) {
                #cart-modal { 
                    width: 100% !important; 
                    max-width: 100% !important; 
                    padding: 20px 15px !important; 
                }
                .checkout-modal-content { 
                    width: 100% !important; 
                    max-width: 100% !important; 
                    margin: 0 !important; 
                    border-radius: 0 !important; 
                    min-height: 100vh !important; 
                    padding: 20px 15px !important; 
                }
                .checkout-inputs-wrapper { 
                    flex-direction: column !important; 
                }
                .checkout-inputs-wrapper input {
                    width: 100% !important;
                }
                .item-img-cart { width: 60px !important; height: 60px !important; }
                .item-img-checkout { width: 45px !important; height: 45px !important; margin-right: 10px !important; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Global Toast Notification Function
function showToastNotification(message) {
    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add("show"); }, 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => { toast.remove(); }, 400);
    }, 3000);
}

// Function to add items to the cart
function addToCart(product, quantityInputId = null) {
    const qty = quantityInputId ? parseInt(document.getElementById(quantityInputId).value) : 1;
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += qty;
    } else {
        cart.push({ ...product, quantity: qty });
    }
    
    saveAndRefresh();
    
    // Popup message trigger
    showToastNotification(product.name + " added to cart!");
}

// Function to save cart data to local storage and refresh the UI
function saveAndRefresh() {
    localStorage.setItem('dhagaPiroiCart', JSON.stringify(cart));
    updateCartBadge();
}

// Update the cart icon badge count across all navigation bars
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Function to display the sliding shopping cart drawer
function showCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.style.cssText = "position:fixed; top:0; right:-100%; width:400px; height:100%; background:#ffffff; z-index:9999; box-shadow:-5px 0 25px rgba(0,0,0,0.15); padding:25px; overflow-y:auto; transition:right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);";
        document.body.appendChild(modal);
    }

    let total = 0;
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; border-bottom:1px solid #f0f0f0; padding-bottom:15px;">
            <h2 style="margin:0; font-family:'Georgia', serif; color:#d45d79;">Your Cart</h2>
            <button onclick="document.getElementById('cart-modal').style.right='-100%'" style="border:none; background:none; cursor:pointer; font-size:28px; color:#999; transition:color 0.2s;">&times;</button>
        </div>`;

    if (cart.length === 0) {
        html += `<p style="text-align:center; color:#888; margin-top:50px;">Your cart is currently empty.</p>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const safeImage = item.image_url || 'https://placehold.co/100x100/eeeeee/999999?text=No+Image';
            
            html += `
            <div style="position:relative; display:flex; align-items:center; padding-top:10px; padding-bottom:15px; border-bottom:1px dashed #eee;">
                <button onclick="removeItem(${index})" title="Remove item" style="position:absolute; top:5px; right:0px; background:none; border:none; cursor:pointer; font-size:22px; color:#ccc; line-height:1; transition:color 0.2s ease;" onmouseover="this.style.color='#d45d79'" onmouseout="this.style.color='#ccc'">
                    &times;
                </button>
                <img class="item-img-cart" src="${safeImage}" alt="${item.name}" style="width:70px; height:70px; object-fit:cover; margin-right:15px; border-radius:8px; border:1px solid #f5f5f5;" onerror="this.onerror=null; this.src='https://placehold.co/100x100/eeeeee/999999?text=No+Image';">
                <div style="flex-grow:1; padding-right: 25px;">
                    <strong style="display:block; font-size:15px; color:#222; margin-bottom:4px;">${item.name}</strong>
                    <div style="font-size:12px; color:#888; margin-bottom:6px;">${item.description ? item.description.substring(0, 30) + '...' : ''}</div>
                    <div style="font-size:13px; color:#555; font-weight:600;">₹${item.price} <span style="color:#aaa; font-weight:normal;">x ${item.quantity}</span></div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; justify-content:center; height:70px;">
                    <div style="font-weight:bold; font-size:16px; color:#d45d79; margin-top:15px;">₹${itemTotal.toFixed(2)}</div>
                </div>
            </div>`;
        });
        html += `</div>`;
        html += `
            <div style="margin-top:30px; font-size:18px; display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-top:2px solid #f0f0f0;">
                <span style="color:#555;">Subtotal:</span>
                <strong style="font-size:22px; color:#222;">₹${total.toFixed(2)}</strong>
            </div>
            <button onclick="showReceipt()" style="width:100%; padding:16px; background:#222; color:white; border:none; border-radius:8px; margin-top:10px; cursor:pointer; font-weight:bold; font-size:15px; letter-spacing:1px; transition:background 0.3s;" onmouseover="this.style.background='#d45d79'" onmouseout="this.style.background='#222'">CHECKOUT</button>`;
    }
    
    modal.innerHTML = html;
    setTimeout(() => { modal.style.right = '0'; }, 10);
}

// Function to remove an item from the cart
function removeItem(index) {
    cart.splice(index, 1);
    saveAndRefresh();
    showCartModal(); 
}

// Function to display the Checkout Modal
function showReceipt() {
    const modal = document.getElementById('receipt-modal');
    if(!modal) { return; }
    
    const itemsHtml = cart.map(item => {
        const safeImage = item.image_url || 'https://placehold.co/100x100/eeeeee/999999?text=No+Image';
        return `
        <div style="display:flex; align-items:center; margin-bottom:12px; border-bottom:1px solid #f5f5f5; padding-bottom:12px;">
            <img class="item-img-checkout" src="${safeImage}" alt="${item.name}" style="width:55px; height:55px; object-fit:cover; border-radius:6px; margin-right:15px; border:1px solid #eee;" onerror="this.onerror=null; this.src='https://placehold.co/100x100/eeeeee/999999?text=No+Image';">
            <div style="flex-grow:1;">
                <div style="font-weight:bold; font-size:14px; color:#222; margin-bottom:4px;">${item.name}</div>
                <div style="font-size:11px; color:#888; margin-bottom:4px;">${item.description ? item.description.substring(0, 35) + '...' : ''}</div>
                <div style="font-size:12px; color:#666; font-weight:500;">Qty: ${item.quantity}</div>
            </div>
            <div style="font-weight:bold; font-size:15px; color:#222;">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>`;
    }).join('');
    
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    modal.innerHTML = `
    <div class="checkout-modal-content" style="background:#ffffff; width:95%; max-width:480px; margin:40px auto; padding:30px; border-radius:16px; position:relative; box-shadow:0 15px 40px rgba(0,0,0,0.2); max-height:85vh; overflow-y:auto; display:flex; flex-direction:column;">
        <span onclick="document.getElementById('receipt-modal').style.display='none'" style="position:absolute; top:15px; right:20px; cursor:pointer; font-size:28px; color:#aaa; transition:0.2s;" onmouseover="this.style.color='#333'" onmouseout="this.style.color='#aaa'">&times;</span>
        <h2 style="text-align:center; color:#d45d79; margin:0 0 5px 0; font-family:'Georgia', serif; font-size:26px;">Checkout</h2>
        <p style="text-align:center; color:#888; font-size:13px; margin-bottom:25px;">Review your items and complete payment</p>
        <div style="flex-grow:1; overflow-y:auto; padding-right:5px; margin-bottom:20px; max-height:250px;">
            ${itemsHtml}
        </div>
        <div style="border-top:2px dashed #eee; padding-top:20px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#555; font-size:16px;">Amount to Pay:</span>
            <strong style="color:#d45d79; font-size:24px;">₹${total.toFixed(2)}</strong>
        </div>
        <div class="checkout-inputs-wrapper" style="display:flex; gap:12px; margin-bottom:15px;">
            <input type="number" id="checkout-pincode" placeholder="Pincode (6 digits)*" required style="flex:1.5; padding:14px; border:1px solid #ddd; border-radius:8px; outline:none; font-size:14px; transition:border 0.3s;" onfocus="this.style.borderColor='#d45d79'" onblur="this.style.borderColor='#ddd'" oninput="if(this.value.length > 6) this.value = this.value.slice(0, 6);">
            <input type="text" placeholder="Search..." style="flex:1; padding:14px; border:1px solid #ddd; border-radius:8px; outline:none; font-size:14px; background:#fafafa;">
        </div>
        <select id="checkout-payment-method" style="width:100%; padding:14px; border-radius:8px; border:1px solid #ddd; outline:none; font-size:14px; cursor:pointer; background-color:#fff; transition:border 0.3s;" onfocus="this.style.borderColor='#d45d79'" onblur="this.style.borderColor='#ddd'" onchange="updateCheckoutButton()">
            <option value="" disabled selected>Select Payment Method *</option>
            <option value="online">Online Payment (UPI / Net Banking)</option>
            <option value="card">Credit / Debit Card</option>
            <option value="cod">Cash on Delivery (COD)</option>
        </select>
        <button id="checkout-action-btn" onclick="processPayment()" style="width:100%; padding:16px; background:#d45d79; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; letter-spacing:1px; transition:all 0.3s ease; box-shadow:0 4px 15px rgba(212, 93, 121, 0.25);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(212, 93, 121, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(212, 93, 121, 0.25)';">
            BUY NOW
        </button>
    </div>`;
    
    document.getElementById('cart-modal').style.right = '-100%';
    modal.style.display = 'block';
}

function updateCheckoutButton() {
    const method = document.getElementById('checkout-payment-method').value;
    const btn = document.getElementById('checkout-action-btn');
    if (method === 'online' || method === 'card') {
        btn.innerText = 'PAY NOW';
    } else {
        btn.innerText = 'BUY NOW';
    }
}

function processPayment() {
    const pincode = document.getElementById('checkout-pincode').value;
    const paymentMethod = document.getElementById('checkout-payment-method').value;
    if (!pincode || pincode.length !== 6) { alert("Please enter a valid 6-digit Pincode."); return; }
    if(!paymentMethod) { alert("Please select a payment method."); return; }
    alert(`Processing Payment...\nMethod: ${paymentMethod.toUpperCase()}\nPincode: ${pincode}\n\nRedirecting to secure gateway...`);
}

window.onload = () => {
    injectResponsiveStyles();
    updateCartBadge();
    document.querySelectorAll('.cart-icon').forEach(icon => {
        icon.style.position = 'relative'; 
        icon.addEventListener('click', (e) => { e.preventDefault(); showCartModal(); });
    });
};