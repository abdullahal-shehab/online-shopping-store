// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    const productsContainer =
        document.getElementById("productsContainer");

    if (!productsContainer) {
        return;
    }

    // Get category from URL
    const urlParams =
        new URLSearchParams(window.location.search);

    const categoryId =
        urlParams.get("category");

    let query =
        supabaseClient
            .from("products")
            .select(`
                *,
                categories (
                    name
                )
            `)
            .order("id", {
                ascending: true
            });

    // Filter by category if selected
    if (categoryId) {
        query = query.eq(
            "category_id",
            categoryId
        );
    }

    const { data, error } =
        await query;

    if (error) {

        console.error(error);

        productsContainer.innerHTML = `
            <p>Unable to load products.</p>
        `;

        return;
    }

    if (!data || data.length === 0) {

        productsContainer.innerHTML = `
            <p>No products available in this category.</p>
        `;

        return;
    }

    productsContainer.innerHTML = "";

    data.forEach(product => {

        const productCard =
            document.createElement("div");

        productCard.className =
            "product-card";

        productCard.innerHTML = `

            <div class="product-image">

                ${
                    product.image_url
                    ?
                    `<img
                        src="${product.image_url}"
                        alt="${product.name}"
                    >`
                    :
                    `<div class="no-image">
                        No Image
                    </div>`
                }

            </div>

            <div class="product-info">

                <h3>
                    ${product.name}
                </h3>

                <p class="product-category">

                    ${
                        product.categories
                        ? product.categories.name
                        : "Uncategorized"
                    }

                </p>

                <p class="product-description">
                    ${product.description || ""}
                </p>

                <p class="product-price">
                    ৳${Number(product.price).toFixed(2)}
                </p>

                <p class="product-stock">
                    Stock: ${product.stock}
                </p>

                <button
                    class="add-cart-btn"
                    onclick="addToCart(${product.id})"
                >
                    Add to Cart
                </button>

            </div>
        `;

        productsContainer.appendChild(
            productCard
        );
    });
}

loadProducts();