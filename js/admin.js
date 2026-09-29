// ================================
// ADMIN AUTHENTICATION
// ================================

async function checkAdminAccess() {
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "admin-login.html";
        return false;
    }

    const { data: admin, error } = await supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error || !admin) {
        alert("Access denied. You are not an admin.");
        await supabaseClient.auth.signOut();
        window.location.href = "admin-login.html";
        return false;
    }

    return true;
}


// ================================
// ADMIN LOGIN
// ================================

async function adminLogin(email, password) {

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Login failed: " + error.message);
        console.error(error);
        return;
    }

    const user = data.user;

    const { data: admin, error: adminError } = await supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError || !admin) {
        alert("This account is not an admin account.");

        await supabaseClient.auth.signOut();

        return;
    }

    window.location.href = "admin.html";
}


// ================================
// ADMIN LOGOUT
// ================================

async function adminLogout() {

    const confirmed = confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    await supabaseClient.auth.signOut();

    window.location.href = "admin-login.html";
}


// ================================
// DASHBOARD
// ================================

async function loadDashboard() {

    const access = await checkAdminAccess();

    if (!access) return;


    // Total Products
    const { count: productCount, error: productError } =
        await supabaseClient
            .from("products")
            .select("*", {
                count: "exact",
                head: true
            });

    if (!productError) {
        const element = document.getElementById("totalProducts");

        if (element) {
            element.textContent = productCount || 0;
        }
    }


    // Total Categories
    const { count: categoryCount, error: categoryError } =
        await supabaseClient
            .from("categories")
            .select("*", {
                count: "exact",
                head: true
            });

    if (!categoryError) {
        const element = document.getElementById("totalCategories");

        if (element) {
            element.textContent = categoryCount || 0;
        }
    }


    // Total Orders
    const { data: orders, error: orderError } =
        await supabaseClient
            .from("orders")
            .select("total");

    if (!orderError) {

        const totalOrders = orders ? orders.length : 0;

        let revenue = 0;

        if (orders) {
            orders.forEach(order => {
                revenue += Number(order.total) || 0;
            });
        }

        const ordersElement = document.getElementById("totalOrders");

        if (ordersElement) {
            ordersElement.textContent = totalOrders;
        }

        const revenueElement = document.getElementById("totalRevenue");

        if (revenueElement) {
            revenueElement.textContent =
                "৳" + revenue.toFixed(2);
        }
    }
}


// ================================
// LOAD CATEGORIES
// ================================

async function loadCategories() {

    const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("id", {
            ascending: true
        });

    if (error) {
        console.error("Category loading error:", error);
        return;
    }


    // Category dropdown
    const categorySelect =
        document.getElementById("productCategory");

    if (categorySelect) {

        categorySelect.innerHTML =
            `<option value="">Select Category</option>`;

        data.forEach(category => {

            const option =
                document.createElement("option");

            option.value = category.id;

            option.textContent = category.name;

            categorySelect.appendChild(option);
        });
    }


    // Category table
    const categoryTable =
        document.getElementById("adminCategoriesTable");

    if (!categoryTable) return;

    categoryTable.innerHTML = "";


    data.forEach(category => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${category.id}</td>

            <td>${category.name}</td>

            <td>${category.description || ""}</td>

            <td>

                <button
                    class="admin-btn"
                    onclick="editCategory(${category.id})"
                >
                    Edit
                </button>

                <button
                    class="btn-delete"
                    onclick="deleteCategory(${category.id})"
                >
                    Delete
                </button>

            </td>
        `;

        categoryTable.appendChild(row);
    });
}


// ================================
// SAVE CATEGORY
// ================================

async function saveCategory() {

    const nameInput =
        document.getElementById("categoryName");

    const descriptionInput =
        document.getElementById("categoryDescription");

    if (!nameInput) return;


    const name =
        nameInput.value.trim();

    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";


    if (!name) {
        alert("Please enter a category name.");
        return;
    }


    const editingId =
        document.getElementById("editingCategoryId")?.value;


    let error;


    // EDIT
    if (editingId) {

        const result =
            await supabaseClient
                .from("categories")
                .update({
                    name: name,
                    description: description
                })
                .eq("id", editingId);

        error = result.error;

    }

    // ADD
    else {

        const result =
            await supabaseClient
                .from("categories")
                .insert({
                    name: name,
                    description: description
                });

        error = result.error;
    }


    if (error) {

        alert(
            "Error saving category: " +
            error.message
        );

        console.error(error);

        return;
    }


    alert("Category saved successfully!");


    // Reset
    nameInput.value = "";

    if (descriptionInput) {
        descriptionInput.value = "";
    }

    const editingInput =
        document.getElementById("editingCategoryId");

    if (editingInput) {
        editingInput.value = "";
    }


    loadCategories();
    loadDashboard();
}


// ================================
// EDIT CATEGORY
// ================================

async function editCategory(categoryId) {

    const { data, error } =
        await supabaseClient
            .from("categories")
            .select("*")
            .eq("id", categoryId)
            .single();


    if (error) {

        alert(
            "Error loading category: " +
            error.message
        );

        return;
    }


    document.getElementById("categoryName").value =
        data.name;

    const descriptionInput =
        document.getElementById("categoryDescription");

    if (descriptionInput) {
        descriptionInput.value =
            data.description || "";
    }


    const editingInput =
        document.getElementById("editingCategoryId");

    if (editingInput) {
        editingInput.value =
            data.id;
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ================================
// DELETE CATEGORY
// ================================

async function deleteCategory(categoryId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this category?"
        );

    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("categories")
            .delete()
            .eq("id", categoryId);


    if (error) {

        alert(
            "Error deleting category: " +
            error.message
        );

        console.error(error);

        return;
    }


    alert("Category deleted successfully!");

    loadCategories();
    loadDashboard();
}


// ================================
// LOAD PRODUCTS
// ================================

async function loadAdminProducts() {

    const { data, error } =
        await supabaseClient
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


    if (error) {

        console.error(
            "Product loading error:",
            error
        );

        return;
    }


    const table =
        document.getElementById(
            "adminProductsTable"
        );

    if (!table) return;


    table.innerHTML = "";


    data.forEach(product => {

        const row =
            document.createElement("tr");


        let imageHTML = "No Image";


        if (product.image_url) {

            imageHTML = `
                <img
                    src="${product.image_url}"
                    alt="${product.name}"
                    style="
                        width:60px;
                        height:60px;
                        object-fit:cover;
                        border-radius:8px;
                    "
                >
            `;
        }


        row.innerHTML = `

            <td>${product.id}</td>

            <td>
                ${imageHTML}
            </td>

            <td>
                ${product.name}
            </td>

            <td>
                ৳${Number(product.price).toFixed(2)}
            </td>

            <td>
                ${product.stock}
            </td>

            <td>
                ${product.categories?.name || "No Category"}
            </td>

            <td>

                <button
                    class="admin-btn"
                    onclick="editProduct(${product.id})"
                >
                    Edit
                </button>

                <button
                    class="btn-delete"
                    onclick="deleteProduct(${product.id})"
                >
                    Delete
                </button>

            </td>
        `;


        table.appendChild(row);
    });
}


// ================================
// SAVE PRODUCT
// ================================

async function saveProduct() {

    const nameInput =
        document.getElementById("productName");

    const descriptionInput =
        document.getElementById("productDescription");

    const priceInput =
        document.getElementById("productPrice");

    const stockInput =
        document.getElementById("productStock");

    const categoryInput =
        document.getElementById("productCategory");

    const imageInput =
        document.getElementById("productImage");


    if (
        !nameInput ||
        !priceInput ||
        !stockInput ||
        !categoryInput
    ) {
        return;
    }


    const name =
        nameInput.value.trim();

    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";

    const price =
        Number(priceInput.value);

    const stock =
        Number(stockInput.value);

    const categoryId =
        categoryInput.value || null;

    const imageFile =
        imageInput?.files?.[0] || null;


    if (!name) {
        alert("Please enter product name.");
        return;
    }

    if (isNaN(price)) {
        alert("Please enter a valid price.");
        return;
    }

    if (isNaN(stock)) {
        alert("Please enter valid stock.");
        return;
    }


    const editingInput =
        document.getElementById(
            "editingProductId"
        );

    const editingId =
        editingInput?.value || "";


    let imageUrl = null;


    // ==================================
    // EDIT PRODUCT
    // ==================================

    if (editingId) {

        // Get existing image
        const { data: existingProduct, error: fetchError } =
            await supabaseClient
                .from("products")
                .select("image_url")
                .eq("id", editingId)
                .single();


        if (fetchError) {

            alert(
                "Error loading existing product: " +
                fetchError.message
            );

            return;
        }


        imageUrl =
            existingProduct?.image_url || null;
    }


    // ==================================
    // IMAGE UPLOAD
    // ==================================

    if (imageFile) {

        const safeFileName =
            imageFile.name
                .replace(/[^a-zA-Z0-9.-]/g, "-");


        const filePath =
            `products/${Date.now()}-${safeFileName}`;


        const { error: uploadError } =
            await supabaseClient
                .storage
                .from("product-images")
                .upload(
                    filePath,
                    imageFile
                );


        if (uploadError) {

            alert(
                "Image upload failed: " +
                uploadError.message
            );

            console.error(uploadError);

            return;
        }


        const { data: publicUrlData } =
            supabaseClient
                .storage
                .from("product-images")
                .getPublicUrl(filePath);


        imageUrl =
            publicUrlData.publicUrl;
    }


    // ==================================
    // UPDATE PRODUCT
    // ==================================

    if (editingId) {

        const { error } =
            await supabaseClient
                .from("products")
                .update({
                    name: name,
                    description: description,
                    price: price,
                    stock: stock,
                    category_id: categoryId,
                    image_url: imageUrl
                })
                .eq("id", editingId);


        if (error) {

            alert(
                "Error updating product: " +
                error.message
            );

            console.error(error);

            return;
        }


        alert(
            "Product updated successfully!"
        );
    }


    // ==================================
    // ADD PRODUCT
    // ==================================

    else {

        const { error } =
            await supabaseClient
                .from("products")
                .insert({
                    name: name,
                    description: description,
                    price: price,
                    stock: stock,
                    category_id: categoryId,
                    image_url: imageUrl
                });


        if (error) {

            alert(
                "Error adding product: " +
                error.message
            );

            console.error(error);

            return;
        }


        alert(
            "Product added successfully!"
        );
    }


    // ==================================
    // RESET FORM
    // ==================================

    nameInput.value = "";

    if (descriptionInput) {
        descriptionInput.value = "";
    }

    priceInput.value = "";

    stockInput.value = "";

    categoryInput.value = "";

    if (imageInput) {
        imageInput.value = "";
    }

    if (editingInput) {
        editingInput.value = "";
    }


    loadAdminProducts();
    loadDashboard();
}


// ================================
// EDIT PRODUCT
// ================================

async function editProduct(productId) {

    const { data, error } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("id", productId)
            .single();


    if (error) {

        alert(
            "Error loading product: " +
            error.message
        );

        console.error(error);

        return;
    }


    document.getElementById(
        "productName"
    ).value = data.name;


    const descriptionInput =
        document.getElementById(
            "productDescription"
        );

    if (descriptionInput) {

        descriptionInput.value =
            data.description || "";
    }


    document.getElementById(
        "productPrice"
    ).value = data.price;


    document.getElementById(
        "productStock"
    ).value = data.stock;


    document.getElementById(
        "productCategory"
    ).value =
        data.category_id || "";


    const editingInput =
        document.getElementById(
            "editingProductId"
        );

    if (editingInput) {

        editingInput.value =
            data.id;
    }


    /*
        File inputs cannot be filled
        programmatically.

        Existing image is therefore
        preserved automatically unless
        the admin chooses a new image.
    */


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ================================
// DELETE PRODUCT
// ================================

async function deleteProduct(productId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this product?"
        );

    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", productId);


    if (error) {

        alert(
            "Error deleting product: " +
            error.message
        );

        console.error(error);

        return;
    }


    alert(
        "Product deleted successfully!"
    );


    loadAdminProducts();
    loadDashboard();
}


// ================================
// LOAD ADMIN ORDERS
// ================================

async function loadAdminOrders() {

    const access =
        await checkAdminAccess();

    if (!access) return;


    const { data: orders, error } =
        await supabaseClient
            .from("orders")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "Order loading error:",
            error
        );

        return;
    }


    const table =
        document.getElementById(
            "adminOrdersTable"
        );

    if (!table) return;


    table.innerHTML = "";


    for (const order of orders) {

        let customerName =
            "Unknown";

        let customerEmail =
            "";


        if (order.user_id) {

            const { data: profile } =
                await supabaseClient
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", order.user_id)
                    .maybeSingle();


            if (profile) {

                customerName =
                    profile.full_name ||
                    "Customer";

                customerEmail =
                    profile.email ||
                    "";
            }
        }


        const row =
            document.createElement("tr");


        const delivered =
            order.status === "Delivered";


        row.innerHTML = `

            <td>
                #${order.id}
            </td>

            <td>
                ${customerName}
                ${
                    customerEmail
                        ? `<br><small>${customerEmail}</small>`
                        : ""
                }
            </td>

            <td>
                ৳${Number(order.total).toFixed(2)}
            </td>

            <td>

                <select
                    onchange="updateOrderStatus(
                        ${order.id},
                        this.value
                    )"
                >

                    <option
                        value="Pending"
                        ${order.status === "Pending" ? "selected" : ""}
                    >
                        Pending
                    </option>

                    <option
                        value="Processing"
                        ${order.status === "Processing" ? "selected" : ""}
                    >
                        Processing
                    </option>

                    <option
                        value="Shipped"
                        ${order.status === "Shipped" ? "selected" : ""}
                    >
                        Shipped
                    </option>

                    <option
                        value="Delivered"
                        ${order.status === "Delivered" ? "selected" : ""}
                    >
                        Delivered
                    </option>

                    <option
                        value="Cancelled"
                        ${order.status === "Cancelled" ? "selected" : ""}
                    >
                        Cancelled
                    </option>

                </select>

            </td>

            <td>
                ${new Date(
                    order.created_at
                ).toLocaleString()}
            </td>

            <td>

                <button
                    class="admin-btn"
                    onclick="viewOrderItems(${order.id})"
                >
                    View Items
                </button>


                <button
                    class="admin-btn"
                    onclick="deliverOrder(${order.id})"
                    ${delivered ? "disabled" : ""}
                >
                    ${delivered ? "Delivered" : "Deliver"}
                </button>


                ${
                    delivered
                        ? `
                            <button
                                class="btn-delete"
                                onclick="deleteOrder(${order.id})"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }

            </td>
        `;


        table.appendChild(row);
    }
}


// ================================
// UPDATE ORDER STATUS
// ================================

async function updateOrderStatus(
    orderId,
    newStatus
) {

    const { error } =
        await supabaseClient
            .from("orders")
            .update({
                status: newStatus
            })
            .eq("id", orderId);


    if (error) {

        alert(
            "Error updating order: " +
            error.message
        );

        console.error(error);

        return;
    }


    alert(
        "Order status updated successfully!"
    );


    loadAdminOrders();
    loadDashboard();
}


// ================================
// DELIVER ORDER
// ================================

async function deliverOrder(orderId) {

    const confirmed =
        confirm(
            `Mark Order #${orderId} as Delivered?`
        );


    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("orders")
            .update({
                status: "Delivered"
            })
            .eq("id", orderId);


    if (error) {

        alert(
            "Error delivering order: " +
            error.message
        );

        console.error(error);

        return;
    }


    alert(
        `Order #${orderId} marked as Delivered!`
    );


    loadAdminOrders();
    loadDashboard();
}


// ================================
// DELETE ORDER
// ================================

async function deleteOrder(orderId) {

    const confirmed =
        confirm(
            `Are you sure you want to delete Order #${orderId}?`
        );


    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("orders")
            .delete()
            .eq("id", orderId);


    if (error) {

        alert(
            "Error deleting order: " +
            error.message
        );

        console.error(error);

        return;
    }


    alert(
        `Order #${orderId} deleted successfully!`
    );


    loadAdminOrders();
    loadDashboard();
}


// ================================
// VIEW ORDER ITEMS
// ================================

async function viewOrderItems(orderId) {

    const { data: items, error } =
        await supabaseClient
            .from("order_items")
            .select(`
                *,
                products (
                    name,
                    image_url
                )
            `)
            .eq("order_id", orderId);


    if (error) {

        alert(
            "Error loading order items: " +
            error.message
        );

        console.error(error);

        return;
    }


    if (!items || items.length === 0) {

        alert(
            "No items found for this order."
        );

        return;
    }


    let message =
        `Order #${orderId} Items:\n\n`;


    items.forEach((item, index) => {

        const productName =
            item.products?.name ||
            "Unknown Product";


        message +=
            `${index + 1}. ${productName}\n`;

        message +=
            `   Quantity: ${item.quantity}\n`;

        message +=
            `   Price: ৳${Number(
                item.price
            ).toFixed(2)}\n\n`;
    });


    alert(message);
}


// ================================
// PAGE INITIALIZATION
// ================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /*
            ADMIN LOGIN PAGE
        */

        const adminLoginForm =
            document.getElementById(
                "adminLoginForm"
            );


        if (adminLoginForm) {

            adminLoginForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const email =
                        document.getElementById(
                            "adminEmail"
                        ).value.trim();


                    const password =
                        document.getElementById(
                            "adminPassword"
                        ).value;


                    if (!email || !password) {

                        alert(
                            "Please enter email and password."
                        );

                        return;
                    }


                    await adminLogin(
                        email,
                        password
                    );
                }
            );
        }


        /*
            ADMIN DASHBOARD
        */

        const adminProductsTable =
            document.getElementById(
                "adminProductsTable"
            );


        if (adminProductsTable) {

            const access =
                await checkAdminAccess();

            if (!access) return;


            loadDashboard();

            loadCategories();

            loadAdminProducts();

            loadAdminOrders();
        }


        /*
            PRODUCT FORM
        */

        const productForm =
            document.getElementById(
                "productForm"
            );


        if (productForm) {

            productForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    await saveProduct();
                }
            );
        }


        /*
            CATEGORY FORM
        */

        const categoryForm =
            document.getElementById(
                "categoryForm"
            );


        if (categoryForm) {

            categoryForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    await saveCategory();
                }
            );
        }
        // ==========================================
// ADD PRODUCT BUTTON
// ==========================================

const showAddProductBtn = document.getElementById("showAddProductBtn");
const addProductForm = document.getElementById("addProductForm");
const cancelProductBtn = document.getElementById("cancelProductBtn");

if (showAddProductBtn && addProductForm) {
    showAddProductBtn.addEventListener("click", function () {
        addProductForm.style.display = "block";

        const productName = document.getElementById("productName");

        if (productName) {
            productName.focus();
        }
    });
}

if (cancelProductBtn && addProductForm) {
    cancelProductBtn.addEventListener("click", function () {
        addProductForm.style.display = "none";

        const productName = document.getElementById("productName");
        const productDescription = document.getElementById("productDescription");
        const productPrice = document.getElementById("productPrice");
        const productStock = document.getElementById("productStock");
        const productImage = document.getElementById("productImage");
        const productCategory = document.getElementById("productCategory");
        const editingProductId = document.getElementById("editingProductId");

        if (productName) productName.value = "";
        if (productDescription) productDescription.value = "";
        if (productPrice) productPrice.value = "";
        if (productStock) productStock.value = "";
        if (productImage) productImage.value = "";
        if (productCategory) productCategory.value = "";
        if (editingProductId) editingProductId.value = "";
    });
}


// ==========================================
// ADD CATEGORY BUTTON
// ==========================================

const showAddCategoryBtn = document.getElementById("showAddCategoryBtn");
const addCategoryForm = document.getElementById("addCategoryForm");
const cancelCategoryBtn = document.getElementById("cancelCategoryBtn");

if (showAddCategoryBtn && addCategoryForm) {
    showAddCategoryBtn.addEventListener("click", function () {
        addCategoryForm.style.display = "block";

        const categoryName = document.getElementById("categoryName");

        if (categoryName) {
            categoryName.focus();
        }
    });
}

if (cancelCategoryBtn && addCategoryForm) {
    cancelCategoryBtn.addEventListener("click", function () {
        addCategoryForm.style.display = "none";

        const categoryName = document.getElementById("categoryName");
        const categoryDescription = document.getElementById("categoryDescription");
        const editingCategoryId = document.getElementById("editingCategoryId");

        if (categoryName) categoryName.value = "";
        if (categoryDescription) categoryDescription.value = "";
        if (editingCategoryId) editingCategoryId.value = "";
    });
}

// ==========================================
// ADD PRODUCT SUBMIT
// ==========================================

const addProductBtn = document.getElementById("addProductBtn");

if (addProductBtn) {
    addProductBtn.addEventListener("click", async function (event) {
        event.preventDefault();
        await saveProduct();
    });
}


// ==========================================
// ADD CATEGORY SUBMIT
// ==========================================

const addCategoryBtn = document.getElementById("addCategoryBtn");

if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", async function (event) {
        event.preventDefault();
        await saveCategory();
    });
}

    }
);