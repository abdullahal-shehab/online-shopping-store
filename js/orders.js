// ========================================
// ORDERS & CHECKOUT
// ========================================


// Get cart
function getOrderCart() {

    const cart =
        localStorage.getItem("shopease_cart");

    return cart ? JSON.parse(cart) : [];
}


// ========================================
// CHECK LOGIN
// ========================================

async function getCurrentUser() {

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    return user;
}


// ========================================
// LOAD CHECKOUT
// ========================================

async function loadCheckout() {

    const checkoutContainer =
        document.getElementById(
            "checkoutContainer"
        );

    if (!checkoutContainer) {
        return;
    }

    const user =
        await getCurrentUser();

    if (!user) {

        checkoutContainer.innerHTML = `

            <div class="order-message">

                <p>
                    Please login before placing an order.
                </p>

                <a
                    href="login.html"
                    class="category-btn"
                >
                    Login
                </a>

            </div>

        `;

        return;
    }


    const cart =
        getOrderCart();


    if (cart.length === 0) {

        checkoutContainer.innerHTML = `

            <div class="order-message">

                <p>
                    Your cart is empty.
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


    let total = 0;


    let itemsHTML = "";


    cart.forEach(item => {

        const itemTotal =
            item.price * item.quantity;

        total += itemTotal;


        itemsHTML += `

            <div class="checkout-item">

                <span>
                    ${item.name}
                </span>

                <span>
                    ${item.quantity}
                    ×
                    ৳${item.price.toFixed(2)}
                </span>

            </div>

        `;

    });


    checkoutContainer.innerHTML = `

        <div class="checkout-box">

            ${itemsHTML}

            <div class="checkout-total">

                <strong>
                    Total:
                </strong>

                <strong>
                    ৳${total.toFixed(2)}
                </strong>

            </div>

            <button
                id="placeOrderBtn"
                class="checkout-btn"
            >
                Place Order
            </button>

        </div>

    `;


    document
        .getElementById("placeOrderBtn")
        .addEventListener(
            "click",
            placeOrder
        );
}


// ========================================
// PLACE ORDER
// ========================================

async function placeOrder() {

    const user =
        await getCurrentUser();

    if (!user) {

        alert(
            "Please login before placing an order."
        );

        window.location.href =
            "login.html";

        return;
    }


    const cart =
        getOrderCart();


    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;
    }


    let total = 0;


    cart.forEach(item => {

        total +=
            item.price * item.quantity;

    });


    const button =
        document.getElementById(
            "placeOrderBtn"
        );


    button.disabled = true;

    button.textContent =
        "Placing Order...";


    try {

        // Create order
        const {
            data: order,
            error: orderError
        } = await supabaseClient
            .from("orders")
            .insert({
                user_id: user.id,
                total: total,
                status: "Pending"
            })
            .select()
            .single();


        if (orderError) {

            throw orderError;

        }


        // Create order items
        const orderItems =
            cart.map(item => ({

                order_id: order.id,

                product_id: item.id,

                quantity: item.quantity,

                price: item.price

            }));


        const {
            error: itemError
        } = await supabaseClient
            .from("order_items")
            .insert(orderItems);


        if (itemError) {

            throw itemError;

        }


        // Clear cart
        localStorage.removeItem(
            "shopease_cart"
        );


        alert(
            "Order placed successfully!"
        );


        window.location.href =
            "orders.html";


    } catch (error) {

        console.error(error);

        alert(
            "Unable to place order: " +
            error.message
        );


        button.disabled = false;

        button.textContent =
            "Place Order";
    }
}


// ========================================
// LOAD PREVIOUS ORDERS
// ========================================

async function loadOrders() {

    const ordersContainer =
        document.getElementById(
            "ordersContainer"
        );

    if (!ordersContainer) {
        return;
    }


    const user =
        await getCurrentUser();


    if (!user) {

        ordersContainer.innerHTML = `

            <p>
                Please login to view your orders.
            </p>

        `;

        return;
    }


    const {
        data: orders,
        error
    } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        ordersContainer.innerHTML = `
            <p>
                Unable to load orders.
            </p>
        `;

        return;
    }


    if (!orders || orders.length === 0) {

        ordersContainer.innerHTML = `
            <p>
                You have no previous orders.
            </p>
        `;

        return;
    }


    ordersContainer.innerHTML = "";


    orders.forEach(order => {

        const orderCard =
            document.createElement("div");


        orderCard.className =
            "order-card";


        orderCard.innerHTML = `

            <h3>
                Order #${order.id}
            </h3>

            <p>
                Total:
                <strong>
                    ৳${Number(order.total).toFixed(2)}
                </strong>
            </p>

            <p>
                Status:
                <strong>
                    ${order.status}
                </strong>
            </p>

            <p>
                Date:
                ${new Date(
                    order.created_at
                ).toLocaleString()}
            </p>

        `;


        ordersContainer.appendChild(
            orderCard
        );

    });
}


// ========================================
// START
// ========================================

loadCheckout();

loadOrders();