// ==========================================
// 1. INITIALIZATION & CONFIGURATION
// ==========================================
const CART_SUPABASE_URL = 'https://aybzziayodaybspnuxos.supabase.co';
const CART_SUPABASE_ANON_KEY = 'sb_publishable__YSi8eCD5W3QW1XN9uE08g_U8VHT3Ik';
const cartSupabaseClient = supabase.createClient(CART_SUPABASE_URL, CART_SUPABASE_ANON_KEY);

let cart = []; 
let currentUser = null; 
window.isPaymentCompleted = false; 

// ==========================================
// 2. STYLES & TOAST NOTIFICATIONS
// ==========================================
function injectResponsiveStyles() {
    if (!document.getElementById('cart-responsive-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-responsive-styles';
        style.innerHTML = `
            .cart-badge { position: absolute !important; top: -8px !important; right: -8px !important; background: #d45d79 !important; color: #fff !important; font-size: 10px !important; padding: 2px 5px !important; border-radius: 50% !important; min-width: 16px !important; height: 16px !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: bold !important; z-index: 9999 !important; line-height: 1 !important; box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important; }
            .cart-toast { position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000; transform: translateX(120%); transition: transform 0.4s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.2); font-weight: 500;}
            .cart-toast.show { transform: translateX(0); }
            .cart-items-scroll::-webkit-scrollbar { width: 6px; }
            .cart-items-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
            .cart-items-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
            .cart-items-scroll::-webkit-scrollbar-thumb:hover { background: #d45d79; }
            input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number], textarea { -moz-appearance: textfield; }
            
            .btn-premium { width:100%; padding:16px; background:#d45d79; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:15px; letter-spacing:1px; transition:all 0.3s ease; display: flex; justify-content: center; align-items: center; }
            .btn-premium:hover { background:#bf4b65; box-shadow: 0 5px 15px rgba(212, 93, 121, 0.3); transform: translateY(-2px); }
            .btn-premium:disabled { background: #e094a5; cursor: not-allowed; transform: none; box-shadow: none; }
            
            .btn-pay-now { background:#222; }
            .btn-pay-now:hover { background:#000; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }

            @media (max-width: 600px) {
                #cart-modal { width: 100% !important; max-width: 100% !important; padding: 20px 15px !important; }
                .checkout-modal-content { width: 100% !important; max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; min-height: 100vh !important; padding: 20px 15px !important; }
                .checkout-inputs-wrapper { flex-direction: column !important; }
                .checkout-inputs-wrapper input, .checkout-inputs-wrapper button { width: 100% !important; }
            }
        `;
        document.head.appendChild(style);
    }
}

function showToastNotification(message) {
    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add("show"); }, 10);
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => { toast.remove(); }, 400); }, 3000);
}

// ==========================================
// 3. LOCAL-FIRST CART LOGIC (Solves empty cart issue)
// ==========================================
function addToCart(product, quantityInputId = null) {
    const qty = quantityInputId ? parseInt(document.getElementById(quantityInputId).value) : 1;
    
    const existingIndex = cart.findIndex(item => item.product_id === product.id || item.id === product.id);
    if (existingIndex > -1) { 
        cart[existingIndex].quantity += qty; 
    } else { 
        cart.push({ 
            ...product, 
            product_id: product.id, 
            quantity: qty,
            image_url: product.image_url || '',
            description: product.description || ''
        }); 
    }
    
    saveCartLocally();
    showToastNotification(product.name + " added to cart!");
    syncToDBInBackground();
}

function changeQuantity(index, changeAmount) {
    if (!cart[index]) return;
    cart[index].quantity += changeAmount;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    saveCartLocally();
    showCartModal();
    syncToDBInBackground();
}

function removeItem(index) {
    if (!cart[index]) return;
    cart.splice(index, 1);
    
    saveCartLocally();
    showCartModal(); 
    syncToDBInBackground();
}

function saveCartLocally() {
    localStorage.setItem('dhagaPiroiCart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

async function syncToDBInBackground() {
    if (!currentUser) return;
    try {
        await cartSupabaseClient.from('cart_items').delete().eq('user_id', currentUser.id);
        
        if (cart.length > 0) {
            const dbData = cart.map(item => ({
                user_id: currentUser.id,
                product_id: item.product_id || item.id,
                name: item.name,
                price: item.price,
                image_url: item.image_url || '',
                description: item.description || '',
                quantity: item.quantity
            }));
            await cartSupabaseClient.from('cart_items').insert(dbData);
        }
    } catch(e) { console.log("Silent DB Sync Error:", e); }
}

// ==========================================
// 4. CART UI MODAL
// ==========================================
function showCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.style.cssText = "position:fixed; top:0; right:-100%; width:400px; height:100%; background:#ffffff; z-index:9999; box-shadow:-5px 0 25px rgba(0,0,0,0.15); padding:25px; transition:right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); display: flex; flex-direction: column;";
        document.body.appendChild(modal);
    }

    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let html = `
        <div style="flex-shrink:0; display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:15px;">
            <h2 style="margin:0; font-family:'Georgia', serif; color:#d45d79;">Your Cart</h2>
            <button onclick="document.getElementById('cart-modal').style.right='-100%'" style="border:none; background:none; cursor:pointer; font-size:28px; color:#999; transition:color 0.2s;">&times;</button>
        </div>
        
        <div class="cart-items-scroll" style="flex-grow:1; overflow-y:auto; padding-right:10px; margin-bottom:15px;">`;
    
    if (cart.length === 0) {
        html += `<p style="text-align:center; color:#888; margin-top:50px;">Your cart is empty.</p>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:15px;">`;
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            const safeImage = item.image_url || 'https://placehold.co/100x100/eeeeee/999999?text=No+Image';
            
            html += `
            <div style="position:relative; display:flex; align-items:center; padding-top:10px; padding-bottom:15px; border-bottom:1px dashed #eee;">
                <button onclick="removeItem(${index})" style="position:absolute; top:5px; right:0px; background:none; border:none; cursor:pointer; font-size:22px; color:#ccc; line-height:1;">&times;</button>
                <img src="${safeImage}" style="width:70px; height:70px; object-fit:cover; margin-right:15px; border-radius:8px; border:1px solid #f5f5f5;">
                <div style="flex-grow:1; padding-right: 25px;">
                    <strong style="display:block; font-size:15px; color:#222; margin-bottom:4px;">${item.name}</strong>
                    <div style="display:flex; align-items:center; margin-top:8px; gap:12px;">
                        <div style="font-size:14px; color:#555; font-weight:600;">₹${item.price}</div>
                        <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:6px; overflow:hidden;">
                            <button onclick="changeQuantity(${index}, -1)" style="width:28px; height:28px; background:#f9f9f9; border:none; cursor:pointer; font-weight:bold;">-</button>
                            <div style="width:30px; height:28px; display:flex; justify-content:center; align-items:center; font-size:13px; font-weight:bold; background:#fff;">${item.quantity}</div>
                            <button onclick="changeQuantity(${index}, 1)" style="width:28px; height:28px; background:#f9f9f9; border:none; cursor:pointer; font-weight:bold;">+</button>
                        </div>
                    </div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; justify-content:center; height:70px;">
                    <div style="font-weight:bold; font-size:16px; color:#d45d79; margin-top:15px;">₹${itemTotal.toFixed(2)}</div>
                </div>
            </div>`;
        });
        html += `</div>`;
    }
    html += `</div>`; 

    html += `<div style="flex-shrink:0; border-top:2px solid #f0f0f0; padding-top:15px;">`;
    if (cart.length > 0) {
        html += `
        <div style="font-size:18px; display:flex; justify-content:space-between; align-items:center; padding-bottom:15px;">
            <span style="color:#555;">Subtotal:</span>
            <strong style="font-size:22px; color:#222;">₹${total.toFixed(2)}</strong>
        </div>
        <button onclick="showReceipt()" class="btn-premium" style="background:#222;">CHECKOUT</button>`;
    }

    html += `
        <div onclick="showProfileSection()" style="margin-top:20px; display:flex; align-items:center; background:#fafafa; padding:12px 15px; border-radius:8px; border:1px solid #eaeaea; cursor:pointer;">
            <img id="cart-profile-pic" src="https://ui-avatars.com/api/?name=User&background=eee&color=888" style="width:42px; height:42px; border-radius:50%; object-fit:cover; margin-right:15px;">
            <div style="flex-grow:1;">
                <div id="cart-profile-name" style="font-weight:bold; font-size:14px; color:#333;">Loading...</div>
                <div style="font-size:11.5px; color:#28a745; font-weight:600;">View Profile & Orders</div>
            </div>
            <button onclick="event.stopPropagation(); handleCartLogout()" title="Logout" style="background:none; border:none; cursor:pointer; color:#d45d79; display: flex; align-items: center; justify-content: center; padding: 5px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </button>
        </div>
    </div>`;

    modal.innerHTML = html;
    setTimeout(() => { modal.style.right = '0'; }, 10);
    fetchSidebarProfile();
}

// ==========================================
// 5. SMART CHECKOUT MODAL (Dynamic Buttons)
// ==========================================
window.calculateDelivery = function() {
    const pincode = document.getElementById('checkout-pincode')?.value;
    const subtotalVal = parseFloat(document.getElementById('subtotal-val')?.value || 0);
    let charge = 0;
    
    if (pincode && pincode.length === 6) { charge = (pincode === "123456") ? 0 : 50; }

    document.getElementById('delivery-display').innerText = '₹' + charge.toFixed(2);
    document.getElementById('grand-total-display').innerText = '₹' + (subtotalVal + charge).toFixed(2);
};

window.togglePaymentButton = function() {
    const method = document.getElementById('checkout-payment-method').value;
    const container = document.getElementById('checkout-action-container');
    
    if (method === 'cod') {
        window.isPaymentCompleted = false;
        container.innerHTML = `<button onclick="processPayment()" class="btn-premium">PLACE ORDER (COD)</button>`;
    } else {
        if (window.isPaymentCompleted) {
            container.innerHTML = `<button onclick="processPayment()" class="btn-premium" style="background: #28a745;">SECURELY PLACE ORDER</button>`;
        } else {
            container.innerHTML = `<button onclick="processOnlinePayment()" class="btn-premium btn-pay-now">PAY NOW</button>`;
        }
    }
};

window.processOnlinePayment = function() {
    const btn = document.querySelector('#checkout-action-container button');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin" style="margin-right:8px; animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> Processing...`;
    btn.disabled = true;
    
    if(!document.getElementById('spin-style')) {
        const style = document.createElement('style'); style.id="spin-style";
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        showToastNotification("Payment Successful!");
        window.isPaymentCompleted = true;
        togglePaymentButton(); 
    }, 2000);
};

function showReceipt() {
    if (!currentUser) {
        alert("Please login first to proceed to Checkout.");
        window.location.href = 'index.html'; 
        return;
    }

    const modal = document.getElementById('receipt-modal') || (() => {
        const m = document.createElement('div'); m.id = 'receipt-modal'; document.body.appendChild(m); return m;
    })();
    
    window.isPaymentCompleted = false; 
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const itemsHtml = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px;">
            <div>${item.name} <span style="color:#888;">(x${item.quantity})</span></div>
            <div style="font-weight:bold;">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    modal.innerHTML = `
    <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; padding:20px; overflow-y:auto;">
        <div class="checkout-modal-content" style="background:#ffffff; width:95%; max-width:450px; margin:20px auto; padding:30px; border-radius:16px; position:relative; box-shadow:0 15px 40px rgba(0,0,0,0.2);">
            <span onclick="this.parentElement.parentElement.style.display='none'" style="position:absolute; top:15px; right:20px; cursor:pointer; font-size:28px; color:#aaa;">&times;</span>
            <h2 style="text-align:center; color:#d45d79; margin:0 0 15px 0; font-family:'Georgia', serif;">Checkout</h2>
            
            <input type="hidden" id="subtotal-val" value="${subtotal}">
            <div style="background:#fcfcfc; border:1px solid #f0f0f0; border-radius:8px; padding:15px; margin-bottom:20px;">
                ${itemsHtml}
            </div>

            <div style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:15px;"><span>Subtotal:</span> <strong>₹${subtotal.toFixed(2)}</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:15px;"><span>Delivery:</span> <strong id="delivery-display">₹0.00</strong></div>
                <div style="display:flex; justify-content:space-between; margin-top:10px; padding-top:10px; border-top:1px dashed #ddd; font-size:18px;">
                    <span>Grand Total:</span> <strong id="grand-total-display" style="color:#d45d79;">₹${subtotal.toFixed(2)}</strong>
                </div>
            </div>
            
            <textarea id="checkout-address" placeholder="Full Delivery Address*" required style="width:100%; padding:14px; border:1px solid #ddd; border-radius:8px; outline:none; font-size:14px; margin-bottom:15px; resize:none;"></textarea>

            <div class="checkout-inputs-wrapper" style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="number" id="checkout-pincode" placeholder="Pincode*" required oninput="if(this.value.length > 6) this.value = this.value.slice(0,6); calculateDelivery()" style="flex:1.5; padding:14px; border:1px solid #ddd; border-radius:8px; outline:none;">
                <button onclick="calculateDelivery(); showToastNotification('Delivery charge updated!')" style="flex:1; background: #e5e7eb; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-weight: bold; color: #374151;">SEARCH</button>
            </div>

            <select id="checkout-payment-method" onchange="togglePaymentButton()" style="width:100%; padding:14px; border-radius:8px; border:1px solid #ddd; outline:none; font-size:14px; margin-bottom:20px;">
                <option value="cod" selected>Cash on Delivery (COD)</option>
                <option value="online">Online Payment (UPI / Net Banking)</option>
                <option value="card">Credit / Debit Card</option>
            </select>
            
            <div id="checkout-action-container">
                <button onclick="processPayment()" class="btn-premium">PLACE ORDER (COD)</button>
            </div>
        </div>
    </div>`;
    
    document.getElementById('cart-modal').style.right = '-100%';
    modal.style.display = 'block';
}

// ==========================================
// 6. DB INSERT LOGIC 
// ==========================================
async function processPayment() {
    const address = document.getElementById('checkout-address').value;
    const pincode = document.getElementById('checkout-pincode').value;
    const paymentMethod = document.getElementById('checkout-payment-method').value;

    if (!address || !pincode) {
        alert("Please fill in Address and Pincode.");
        return;
    }

    try {
        // User ki profile details (Name aur Phone Number) fetch karna
        let custName = "Unknown";
        let custPhone = "Unknown";
        
        const { data: profile } = await cartSupabaseClient.from('profiles').select('full_name, mobile').eq('id', currentUser.id).single();
        if (profile) {
            custName = profile.full_name || "Unknown";
            custPhone = profile.mobile || "Unknown";
        }

        const fullAddress = `${address} (Pincode: ${pincode}) | Paid via: ${paymentMethod.toUpperCase()}`;

        // Order data array jisme Name aur Phone Number bhi attach hoga
        const orderData = cart.map(item => ({
            user_id: currentUser.id,
            customer_name: custName,
            customer_phone: custPhone,
            product_name: item.name || 'Unknown',
            image_url: item.image_url || '',
            description: item.description || '',
            price: item.price || 0,
            quantity: item.quantity || 1,
            address: fullAddress
        }));

        const { error: insertError } = await cartSupabaseClient.from('orders').insert(orderData);
        if (insertError) {
            console.error("Supabase Order Insert Error:", insertError);
            throw new Error(insertError.message);
        }

        alert("Order placed successfully! Check your Profile for details.");
        
        cart = [];
        saveCartLocally();
        await syncToDBInBackground(); 

        document.getElementById('receipt-modal').style.display = 'none';
        
        if (document.getElementById('profile-modal')) {
            fetchDetailedUserProfile();
        }

    } catch (error) {
        alert("Database Error: Failed to place order! \nReason: " + error.message);
    }
}

// ==========================================
// 7. PROFILE & ORDER HISTORY MODAL
// ==========================================
window.showProfileSection = async function() {
    let profileModal = document.getElementById('profile-modal');
    if (!profileModal) {
        profileModal = document.createElement('div');
        profileModal.id = 'profile-modal';
        profileModal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10005; display:none; padding:20px; box-sizing:border-box; align-items:center; justify-content:center;";
        document.body.appendChild(profileModal);
    }

    profileModal.innerHTML = `
    <div style="background:white; width:100%; max-width:550px; padding:25px; border-radius:16px; max-height:85vh; display:flex; flex-direction:column; position:relative; box-shadow: 0 15px 40px rgba(0,0,0,0.25);">
        <button onclick="document.getElementById('profile-modal').style.display='none'" style="position:absolute; top:15px; right:20px; border:none; background:none; font-size:30px; cursor:pointer; color:#999;">&times;</button>
        <h2 style="margin:0 0 20px 0; color:#d45d79; font-family:'Georgia', serif;">My Dashboard</h2>
        
        <div style="display:flex; gap:10px; margin-bottom:20px;">
            <button onclick="document.getElementById('account-tab').style.display='block'; document.getElementById('orders-tab').style.display='none'" style="flex:1; padding:12px; background:#fcfcfc; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-weight:bold; color:#333;">Account Info</button>
            <button onclick="document.getElementById('account-tab').style.display='none'; document.getElementById('orders-tab').style.display='block'" style="flex:1; padding:12px; background:#fcfcfc; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-weight:bold; color:#333;">Order History</button>
        </div>

        <div id="account-tab" style="display:block; overflow-y:auto; padding-right:5px;">
            <p style="text-align:center; color:#888;">Fetching profile...</p>
        </div>
        <div id="orders-tab" style="display:none; overflow-y:auto; flex-grow:1; padding-right:5px;">
            <p style="text-align:center; color:#888;">Fetching orders...</p>
        </div>
    </div>`;

    let cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.right = '-100%'; 
    profileModal.style.display = 'flex';
    
    await fetchDetailedUserProfile();
};

async function fetchDetailedUserProfile() {
    const accTab = document.getElementById('account-tab');
    const ordTab = document.getElementById('orders-tab');

    if (!currentUser) {
        accTab.innerHTML = `<p style="text-align:center; color:#888; margin-top:30px;">Please login to view profile.</p>`;
        ordTab.innerHTML = `<p style="text-align:center; color:#888; margin-top:30px;">Please login to view orders.</p>`;
        return;
    }

    try {
        const { data: profile } = await cartSupabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
        if (profile) {
            accTab.innerHTML = `
                <div style="background:#fcfcfc; border:1px solid #eee; padding:15px; border-radius:8px; margin-bottom:12px;">
                    <p style="margin:0 0 5px 0; color:#888; font-size:13px;">Full Name</p>
                    <p style="margin:0; font-size:16px; font-weight:bold;">${profile.full_name || 'N/A'}</p>
                </div>
                <div style="background:#fcfcfc; border:1px solid #eee; padding:15px; border-radius:8px; margin-bottom:12px;">
                    <p style="margin:0 0 5px 0; color:#888; font-size:13px;">Email Address</p>
                    <p style="margin:0; font-size:16px; font-weight:bold;">${profile.email || 'N/A'}</p>
                </div>
                <div style="background:#fcfcfc; border:1px solid #eee; padding:15px; border-radius:8px;">
                    <p style="margin:0 0 5px 0; color:#888; font-size:13px;">Phone Number</p>
                    <p style="margin:0; font-size:16px; font-weight:bold;">${profile.mobile || 'N/A'}</p>
                </div>`;
        }

        const { data: orders, error: ordersError } = await cartSupabaseClient.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        if (ordersError) throw ordersError;

        if (orders && orders.length > 0) {
            ordTab.innerHTML = orders.map(order => {
                const safeImage = order.image_url || 'https://placehold.co/100x100/eeeeee/999999?text=No+Image';
                const orderDate = new Date(order.created_at).toLocaleDateString();
                return `
                <div style="border:1px solid #eee; padding:15px; margin-bottom:15px; border-radius:8px; display:flex; gap:15px; align-items:center; background:#fafafa;">
                    <img src="${safeImage}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid #ddd;">
                    <div style="flex-grow:1;">
                        <p style="margin:0 0 4px; font-weight:bold; color:#222; font-size:15px;">${order.product_name} <span style="color:#d45d79;">(x${order.quantity})</span></p>
                        <p style="margin:0 0 6px; font-size:13px; color:#666;">${order.description || ''}</p>
                        <p style="margin:0; font-size:12px; color:#888;"><strong>Delivered to:</strong> ${order.address}</p>
                        <p style="margin:4px 0 0 0; font-size:11px; color:#aaa;">Ordered on: ${orderDate}</p>
                    </div>
                    <div style="font-weight:bold; color:#222; font-size:16px;">₹${order.price * order.quantity}</div>
                </div>`;
            }).join('');
        } else {
            ordTab.innerHTML = `<p style="text-align:center; color:#888; padding-top:30px;">No past orders found.</p>`;
        }
    } catch (err) {
        console.error("Profile Fetch Error:", err);
    }
}

async function fetchSidebarProfile() {
    const nameElem = document.getElementById('cart-profile-name');
    const picElem = document.getElementById('cart-profile-pic');
    if (currentUser) {
        try {
            const { data } = await cartSupabaseClient.from('profiles').select('full_name').eq('id', currentUser.id).single();
            let displayName = data?.full_name || currentUser.email.split('@')[0];
            if(nameElem) nameElem.innerText = displayName;
            if(picElem) picElem.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=d45d79&color=fff`;
        } catch(e) {}
    } else {
        if(nameElem) nameElem.innerText = "Guest User";
    }
}

async function handleCartLogout() {
    if (confirm("Are you sure you want to log out?")) {
        await cartSupabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
}

// ==========================================
// 8. BOOTSTRAP
// ==========================================
async function initCart() {
    injectResponsiveStyles();

    // Preserve local cart items so they are not lost on page refresh
    let localCart = JSON.parse(localStorage.getItem('dhagaPiroiCart')) || [];

    const { data: { session } } = await cartSupabaseClient.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        try {
            const { data } = await cartSupabaseClient.from('cart_items').select('*').eq('user_id', currentUser.id);
            
            if (data && data.length > 0) {
                cart = data; // DB has priority
            } else if (localCart.length > 0) {
                cart = localCart; // Preserve un-synced items added before refresh
                await syncToDBInBackground(); 
            } else {
                cart = [];
            }
            saveCartLocally(); 
        } catch(e) {
            cart = localCart;
            saveCartLocally();
        }
    } else {
        cart = localCart;
        updateCartBadge();
    }
    
    document.querySelectorAll('.cart-icon').forEach(icon => {
        let newIcon = icon.cloneNode(true);
        icon.replaceWith(newIcon);
        newIcon.style.cursor = 'pointer';
        newIcon.addEventListener('click', (e) => { 
            e.preventDefault(); 
            showCartModal(); 
        });
    });

    const profileIcon = document.getElementById('user-profile-icon');
    if (profileIcon) {
        profileIcon.style.cursor = 'pointer';
        profileIcon.addEventListener('click', (e) => {
            e.preventDefault();
            window.showProfileSection();
        });
    }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initCart); } 
else { initCart(); }