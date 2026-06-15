// Initialize cart from localStorage or create an empty array
let cart = JSON.parse(localStorage.getItem('dhagaPiroiCart')) || [];

// Function to add items to the cart
function addToCart(product, quantityInputId = null) {
    const qty = quantityInputId ? parseInt(document.getElementById(quantityInputId).value) : 1;
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += qty;
    } else {
        // Pushes the entire product object including image_url and description
        cart.push({ ...product, quantity: qty });
    }
    
    saveAndRefresh();
    
    // Call showToast if it exists on the page (for categories.html)
    if (typeof showToast === "function") {
        showToast(product.name);
    } else {
        // Optional fallback: Automatically open cart if toast isn't available
        // showCartModal(); 
    }
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
    badges.forEach(badge => badge.innerText = totalItems);
}

// Function to display the sliding shopping cart drawer
function showCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.style.cssText = "position:fixed; top:0; right:-450px; width:100%; max-width:400px; height:100%; background:#ffffff; z-index:9999; box-shadow:-5px 0 25px rgba(0,0,0,0.15); padding:25px; overflow-y:auto; transition:right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);";
        document.body.appendChild(modal);
    }

    let total = 0;
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; border-bottom:1px solid #f0f0f0; padding-bottom:15px;">
            <h2 style="margin:0; font-family:'Georgia', serif; color:#d45d79;">Your Cart</h2>
            <button onclick="document.getElementById('cart-modal').style.right='-450px'" style="border:none; background:none; cursor:pointer; font-size:28px; color:#999; transition:color 0.2s;">&times;</button>
        </div>`;

    if (cart.length === 0) {
        html += `<p style="text-align:center; color:#888; margin-top:50px;">Your cart is currently empty.</p>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            // Database image_url is used here, with a safe fallback to prevent blinking loops
            const safeImage = item.image_url || 'https://placehold.co/100x100/eeeeee/999999?text=No+Image';
            
            // Item Row with X button at top right
            html += `
            <div style="position:relative; display:flex; align-items:center; padding-top:10px; padding-bottom:15px; border-bottom:1px dashed #eee;">
                
                <!-- Remove 'X' Button -->
                <button onclick="removeItem(${index})" title="Remove item" style="position:absolute; top:0; right:0; background:none; border:none; cursor:pointer; font-size:22px; color:#ccc; line-height:1; transition:color 0.2s ease;" onmouseover="this.style.color='#d45d79'" onmouseout="this.style.color='#ccc'">
                    &times;
                </button>

                <img src="${safeImage}" alt="${item.name}" style="width:70px; height:70px; object-fit:cover; margin-right:15px; border-radius:8px; border:1px solid #f5f5f5;" onerror="this.onerror=null; this.src='https://placehold.co/100x100/eeeeee/999999?text=No+Image';">
                
                <div style="flex-grow:1; padding-right: 20px;">
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
    
    // Slight delay to ensure CSS transition triggers
    setTimeout(() => {
        modal.style.right = '0';
    }, 10);
}

// Function to remove an item from the cart
function removeItem(index) {
    cart.splice(index, 1);
    saveAndRefresh();
    showCartModal(); // Refresh cart UI
}

// Function to display the Checkout Modal with Database Images & Payment Form
function showReceipt() {
    const modal = document.getElementById('receipt-modal');
    if(!modal) {
        console.error("Receipt modal container not found in HTML!");
        return;
    }
    
    // Generate HTML for items list using database image_url
    const itemsHtml = cart.map(item => {
        const safeImage = item.image_url || 'https://placehold.co/100x100/eeeeee/999999?text=No+Image';
        return `
        <div style="display:flex; align-items:center; margin-bottom:12px; border-bottom:1px solid #f5f5f5; padding-bottom:12px;">
            <img src="${safeImage}" alt="${item.name}" style="width:55px; height:55px; object-fit:cover; border-radius:6px; margin-right:15px; border:1px solid #eee;" onerror="this.onerror=null; this.src='https://placehold.co/100x100/eeeeee/999999?text=No+Image';">
            <div style="flex-grow:1;">
                <div style="font-weight:bold; font-size:14px; color:#222; margin-bottom:4px;">${item.name}</div>
                <div style="font-size:11px; color:#888; margin-bottom:4px;">${item.description ? item.description.substring(0, 40) + '...' : ''}</div>
                <div style="font-size:12px; color:#666; font-weight:500;">Qty: ${item.quantity}</div>
            </div>
            <div style="font-weight:bold; font-size:15px; color:#222;">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>
        `;
    }).join('');
    
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Inject Custom Checkout UI Layout
    modal.innerHTML = `
    <div style="background:#ffffff; width:95%; max-width:480px; margin:40px auto; padding:30px; border-radius:16px; position:relative; box-shadow:0 15px 40px rgba(0,0,0,0.2); max-height:85vh; overflow-y:auto; display:flex; flex-direction:column;">
        
        <!-- Close Button (Top Right Only) -->
        <span onclick="document.getElementById('receipt-modal').style.display='none'" style="position:absolute; top:15px; right:20px; cursor:pointer; font-size:28px; color:#aaa; transition:0.2s;" onmouseover="this.style.color='#333'" onmouseout="this.style.color='#aaa'">&times;</span>
        
        <h2 style="text-align:center; color:#d45d79; margin:0 0 5px 0; font-family:'Georgia', serif; font-size:26px;">Checkout</h2>
        <p style="text-align:center; color:#888; font-size:13px; margin-bottom:25px;">Review your items and complete payment</p>
        
        <!-- Cart Items List (Scrollable) -->
        <div style="flex-grow:1; overflow-y:auto; padding-right:5px; margin-bottom:20px; max-height:250px;">
            ${itemsHtml}
        </div>
        
        <!-- Order Total -->
        <div style="border-top:2px dashed #eee; padding-top:20px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#555; font-size:16px;">Amount to Pay:</span>
            <strong style="color:#d45d79; font-size:24px;">₹${total.toFixed(2)}</strong>
        </div>
        
        <!-- Inputs: Pincode and Search Side-by-Side -->
        <div style="display:flex; gap:12px; margin-bottom:15px;">
            <input type="number" id="checkout-pincode" placeholder="Pincode (6 digits)*" required style="flex:1.5; padding:14px; border:1px solid #ddd; border-radius:8px; outline:none; font-size:14px; transition:border 0.3s;" onfocus="this.style.borderColor='#d45d79'" onblur="this.style.borderColor='#ddd'" oninput="if(this.value.length > 6) this.value = this.value.slice(0, 6);">
            <input type="text" placeholder="Search..." style="flex:1; padding:14px; border:1px solid #ddd; border-radius:8px; outline:none; font-size:14px; background:#fafafa;">
        </div>

        <!-- Payment Method Dropdown -->
        <div style="margin-bottom:25px;">
            <select id="checkout-payment-method" style="width:100%; padding:14px; border-radius:8px; border:1px solid #ddd; outline:none; font-size:14px; cursor:pointer; background-color:#fff; transition:border 0.3s;" onfocus="this.style.borderColor='#d45d79'" onblur="this.style.borderColor='#ddd'" onchange="updateCheckoutButton()">
                <option value="" disabled selected>Select Payment Method *</option>
                <option value="online">Online Payment (UPI / Net Banking)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cod">Cash on Delivery (COD)</option>
            </select>
        </div>

        <!-- Submit Button -->
        <button id="checkout-action-btn" onclick="processPayment()" style="width:100%; padding:16px; background:#d45d79; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; letter-spacing:1px; transition:all 0.3s ease; box-shadow:0 4px 15px rgba(212, 93, 121, 0.25);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(212, 93, 121, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(212, 93, 121, 0.25)';">
            BUY NOW
        </button>
    </div>`;
    
    // Close the cart drawer before opening checkout modal
    document.getElementById('cart-modal').style.right = '-450px';
    modal.style.display = 'block';
}

// Function to update the button text dynamically based on selected payment method
function updateCheckoutButton() {
    const method = document.getElementById('checkout-payment-method').value;
    const btn = document.getElementById('checkout-action-btn');
    
    if (method === 'online' || method === 'card') {
        btn.innerText = 'PAY NOW';
    } else {
        btn.innerText = 'BUY NOW'; // For COD or Default
    }
}

// Function to validate inputs and process payment
function processPayment() {
    const pincode = document.getElementById('checkout-pincode').value;
    const paymentMethod = document.getElementById('checkout-payment-method').value;

    if (!pincode || pincode.length !== 6) {
        alert("Please enter a valid 6-digit Pincode.");
        return;
    }
    
    if(!paymentMethod) {
        alert("Please select a payment method.");
        return;
    }
    
    alert(`Processing Payment...\nMethod: ${paymentMethod.toUpperCase()}\nPincode: ${pincode}\n\nRedirecting to secure gateway...`);
    
    // Add logic here to clear the cart, save orders to the database, etc.
}

// Global initialization
window.onload = () => {
    updateCartBadge();
    
    // Attach event listeners to all cart icons on the page
    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(icon => {
        icon.addEventListener('click', (e) => { 
            e.preventDefault(); 
            showCartModal(); 
        });
    });
};