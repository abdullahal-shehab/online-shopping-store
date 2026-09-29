document.addEventListener("DOMContentLoaded", async function () {

    const productsContainer = document.getElementById("homeProducts");

    if (!productsContainer) {
        return;
    }

    // Load products from Supabase
    const { data: products, error } = await supabaseClient
        .from("products")
        .select(`
            id,
            name,
            description,
            price,
            stock,
            image_url,
            category_id,
            categories (
                name
            )
        `)
        .order("created_at", {
            ascending: false
        })
        .limit(8);


    // Error handling
    if (error) {

        console.error("Error loading products:", error);

        productsContainer.innerHTML = `
            <p>
                Unable to load products.
            </p>
        `;

        return;
    }


    // No products
    if (!products || products.length === 0) {

        productsContainer.innerHTML = `
            <p>
                No products available yet.
            </p>
        `;

        return;
    }


    // Display products
    productsContainer.innerHTML = "";


    products.forEach(function (product) {

        const card = document.createElement("div");

        card.className = "product-card";


        // Product image
        const image = product.image_url
            ? product.image_url
            : "https://via.placeholder.com/300x220?text=No+Image";


        // Category
        const categoryName =
            product.categories?.name || "Uncategorized";


        // Stock status
        const outOfStock = Number(product.stock) <= 0;


        card.innerHTML = `

            <div class="product-image-container">

                <img
                    src="${image}"
                    alt="${product.name}"
                    class="product-image"
                    onerror="this.src='https://via.placeholder.com/300x220?text=No+Image'"
                >

            </div>


            <div class="product-info">

                <p class="product-category">
                    ${categoryName}
                </p>

                <h3 class="product-name">
                    ${product.name}
                </h3>

                <p class="product-description">
                    ${product.description || "No description available."}
                </p>

                <div class="product-price">
                    ৳${Number(product.price).toLocaleString()}
                </div>

                <p class="product-stock">
                    ${
                        outOfStock
                            ? "Out of stock"
                            : `${product.stock} available`
                    }
                </p>


                <div class="product-actions">

                    <button
                        class="add-cart-btn"
                        data-product-id="${product.id}"
                        ${outOfStock ? "disabled" : ""}>

                        Add to Cart

                    </button>


                    <button
                        class="order-now-btn"
                        data-product-id="${product.id}"
                        ${outOfStock ? "disabled" : ""}>

                        Order Now

                    </button>

                </div>

            </div>
        `;


        productsContainer.appendChild(card);

    });


    // ==========================================
    // ADD TO CART
    // ==========================================

    document.querySelectorAll(".add-cart-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const productId = Number(
                this.dataset.productId
            );

            const product = products.find(
                item => Number(item.id) === productId
            );

            if (!product) {
                return;
            }

            addProductToCart(product);

        });

    });


    // ==========================================
    // ORDER NOW
    // ==========================================

    document.querySelectorAll(".order-now-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const productId = Number(
                this.dataset.productId
            );

            const product = products.find(
                item => Number(item.id) === productId
            );

            if (!product) {
                return;
            }

            addProductToCart(product);

            // Go to cart
            window.location.href = "cart.html";

        });

    });

});


// ==========================================
// ADD PRODUCT TO CART
// ==========================================

function addProductToCart(product) {

    let cart = JSON.parse(
        localStorage.getItem("shopease_cart")
    ) || [];


    const existingProduct = cart.find(
        item => Number(item.id) === Number(product.id)
    );


    if (existingProduct) {

        // Check stock
        if (
            Number(existingProduct.quantity) >=
            Number(product.stock)
        ) {

            alert("You cannot add more than the available stock.");

            return;
        }


        existingProduct.quantity =
            Number(existingProduct.quantity) + 1;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: Number(product.price),

            image_url: product.image_url,

            quantity: 1,

            stock: Number(product.stock)

        });

    }


    localStorage.setItem(
        "shopease_cart",
        JSON.stringify(cart)
    );


    alert(
        `${product.name} has been added to your cart.`
    );

}