// 1. Enter your Supabase Project details here
const SUPABASE_URL = 'https://aybzziayodaybspnuxos.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__YSi8eCD5W3QW1XN9uE08g_U8VHT3Ik';

// 2. Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. Function to fetch data and create cards dynamically
async function fetchAndDisplayProducts() {
    
    // Select the empty div container we created in index.html
    const container = document.getElementById('product-container');

    try {
        // Fetch all data from the 'products' table in the database
        let { data: products, error } = await supabaseClient
            .from('products')
            .select('*');

        if (error) {
            console.error("Error fetching data: ", error.message);
            container.innerHTML = "<p>Error loading products.</p>";
            return;
        }

        // Clear the 'Loading...' text once the data is received (empty the div)
        container.innerHTML = '';

        // 4. forEach loop: This code will run for every single product
        products.forEach(product => {
            
            // Write the HTML structure inside backticks (`)
            // Use ${variable} to inject database data into the HTML
            const cardHTML = `
                <a href="product.html?id=${product.id}" class="product-card" style="text-decoration: none; color: inherit; cursor: pointer;">
                    
                    <div class="img-container">
                        <img src="${product.image_url}" alt="${product.name}" class="product-img">
                    </div>
                    
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <span class="product-price">₹ ${product.price}</span>
                        
                        <button class="add-to-cart-btn">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg> 
                            Add to Cart
                        </button>
                    </div>
                    
                </a>
            `;

            // += means append each new card after the previous ones
            container.innerHTML += cardHTML;
        });

    } catch (err) {
        console.error("System error: ", err);
    }
}

// 5. Start the function as soon as the page loads
fetchAndDisplayProducts();