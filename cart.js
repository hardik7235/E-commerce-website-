let cart = JSON.parse(localStorage.getItem('dhagaPiroiCart')) || [];

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
}

// Function to save cart data and refresh the UI
function saveAndRefresh() {
    localStorage.setItem('dhagaPiroiCart', JSON.stringify(cart));
    updateCartBadge();
}

// Update the cart icon badge count
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => b.innerText = totalItems);
}

// Function to display the shopping cart drawer/modal
function showCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.style.cssText = "position:fixed; top:0; right:-400px; width:350px; height:100%; background:white; z-index:9999; box-shadow:-5px 0 15px rgba(0,0,0,0.2); padding:20px; overflow-y:auto; transition:0.3s ease-in-out;";
        document.body.appendChild(modal);
    }

    let total = 0;
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2 style="margin:0;">Your Cart</h2>
            <button onclick="document.getElementById('cart-modal').style.right='-400px'" style="border:none; background:none; cursor:pointer; font-size:20px;">&times;</button>
        </div>`;

    if (cart.length === 0) {
        html += `<p>Your cart is empty.</p>`;
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            html += `
            <div style="display:flex; flex-direction: column; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <strong>${item.name}</strong> 
                    <span>₹${item.price} x ${item.quantity}</span>
                </div>
                <div style="align-self: flex-end; margin-top: 5px;">
                    ₹${itemTotal} 
                    <button onclick="removeItem(${index})" style="color:red; border:none; cursor:pointer; margin-left:10px;">Remove</button>
                </div>
            </div>
`;
        });
        html += `
            <div style="margin-top:20px; font-size:18px;"><strong>Total: ₹${total}</strong></div>
            <button onclick="showReceipt()" style="width:100%; padding:12px; background:#d45d79; color:white; border:none; border-radius:5px; margin-top:10px; cursor:pointer;">Checkout & View Bill</button>`;
    }
    
    modal.innerHTML = html;
    modal.style.right = '0';
}

// Function to remove an item from the cart
function removeItem(index) {
    cart.splice(index, 1);
    saveAndRefresh();
    showCartModal();
}

// Function to display the receipt modal
function showReceipt() {
    const modal = document.getElementById('receipt-modal');
    const itemsList = document.getElementById('receipt-items');
    const totalSpan = document.getElementById('total-amount');
    
    // Fetching data using the correct key 'dhagaPiroiCart'
    let cartData = JSON.parse(localStorage.getItem('dhagaPiroiCart')) || [];
    
    itemsList.innerHTML = cartData.map(item => `
        <div style="display:flex; justify-content:space-between; margin:5px 0;">
            <span>${item.name} (x${item.quantity})</span>
            <span>₹${item.price * item.quantity}</span>
        </div>
    `).join('');
    
    let total = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalSpan.innerText = '₹' + total;
    
    modal.style.display = 'block';
}

// Function to download the receipt as PDF
function downloadPDF() {
    const element = document.getElementById('receipt-content');
    html2pdf().from(element).save('Dhaga_Piroi_Bill.pdf');
}

// Initialize on page load
window.onload = () => {
    updateCartBadge();
    const cartIcon = document.querySelector('.cart-icon');
    if(cartIcon) {
        cartIcon.addEventListener('click', (e) => { 
            e.preventDefault(); 
            showCartModal(); 
        });
    }
};