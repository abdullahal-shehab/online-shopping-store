// ========================================
// SHOPPING CART
// ========================================

// Get cart from localStorage
function getCart() {

    const cart =
        localStorage.getItem("shopease_cart");

    return cart ? JSON.parse(cart) : [];
}


// Save cart to localStorage
function saveCart(cart) {

    localStorage.setItem(
        "shopease_cart",
        JSON.stringify(cart)
    );
}


// ========================================
// ADD TO CART
// ========================================

async function addToCart(productId) {

    const { data: product, error } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("id", productId)
            .single();

    if (error) {

        console.error(error);

        alert("Unable to add product to cart.");

        return;
    }

    let cart = getCart();

    const existingProduct =
        cart.find(item => item.id === productId);

    if (existingProduct) {

        if (existingProduct.quantity < product.stock) {

            existingProduct.quantity++;

        } else {

            alert("Not enough stock available.");

            return;
        }

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: Number(product.price),

            image_url: product.image_url,

            quantity: 1

        });
    }

    saveCart(cart);

    alert(`${product.name} added to cart!`);

    updateCartCount();
}


// ========================================
// UPDATE CART COUNT
// ========================================

function updateCartCount() {

    const cart = getCart();

    const totalItems =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    const cartLink =
        document.querySelector(
            'a[href="cart.html"]'
        );

    if (cartLink) {

        cartLink.textContent =
            `Cart (${totalItems})`;
    }
}


// ========================================
// LOAD CART PAGE
// ========================================

function loadCart() {

    const cartContainer =
        document.getElementById(
            "cartContainer"
        );

    if (!cartContainer) {
        return;
    }

    const cart = getCart();

    if (cart.length === 0) {

        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>

                <p>
                    Add some products to your cart.
                </p>

                <a
                    href="products.html"
                    class="category-btn"
                >
                    Continue Shopping
                </a>
            </div>
        `;

        return;
    }

    cartContainer.innerHTML = "";

    let total = 0;

    cart.forEach(item => {

        const itemTotal =
            item.price * item.quantity;

        total += itemTotal;

        const cartItem =
            document.createElement("div");

        cartItem.className =
            "cart-item";

        cartItem.innerHTML = `

            <div class="cart-item-info">

                <h3>
                    ${item.name}
                </h3>

                <p>
                    Price:
                    ৳${item.price.toFixed(2)}
                </p>

            </div>

            <div class="cart-quantity">

                <button
                    onclick="changeQuantity(
                        ${item.id},
                        -1
                    )"
                >
                    −
                </button>

                <span>
                    ${item.quantity}
                </span>

                <button
                    onclick="changeQuantity(
                        ${item.id},
                        1
                    )"
                >
                    +
                </button>

            </div>

            <div class="cart-item-total">

                ৳${itemTotal.toFixed(2)}

            </div>

            <button
                class="remove-cart-btn"
                onclick="removeFromCart(
                    ${item.id}
                )"
            >
                Remove
            </button>

        `;

        cartContainer.appendChild(cartItem);

    });


    // Total section

    const totalSection =
        document.createElement("div");

    totalSection.className =
        "cart-total";

    totalSection.innerHTML = `

        <h2>
            Total:
            ৳${total.toFixed(2)}
        </h2>

        <button
            class="checkout-btn"
            onclick="checkout()"
        >
            Proceed to Checkout
        </button>

    `;

    cartContainer.appendChild(
        totalSection
    );
}


// ========================================
// CHANGE QUANTITY
// ========================================

function changeQuantity(
    productId,
    change
) {

    let cart = getCart();

    const product =
        cart.find(
            item => item.id === productId
        );

    if (!product) {
        return;
    }

    product.quantity += change;

    if (product.quantity <= 0) {

        cart =
            cart.filter(
                item => item.id !== productId
            );
    }

    saveCart(cart);

    loadCart();

    updateCartCount();
}


// ========================================
// REMOVE FROM CART
// ========================================

function removeFromCart(productId) {

    let cart = getCart();

    cart =
        cart.filter(
            item => item.id !== productId
        );

    saveCart(cart);

    loadCart();

    updateCartCount();
}


// ========================================
// CHECKOUT
// ========================================

function checkout() {

    const cart = getCart();

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;
    }

    window.location.href =
        "orders.html";
}


// ========================================
// START
// ========================================

updateCartCount();

loadCart();