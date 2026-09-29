// ========================================
// LOAD CATEGORIES
// ========================================

async function loadCategories() {

    const categoriesContainer =
        document.getElementById("categoriesContainer");

    if (!categoriesContainer) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("categories")
            .select("*")
            .order("id", {
                ascending: true
            });

    if (error) {
        console.error(error);

        categoriesContainer.innerHTML = `
            <p>Unable to load categories.</p>
        `;

        return;
    }

    if (!data || data.length === 0) {
        categoriesContainer.innerHTML = `
            <p>No categories available.</p>
        `;

        return;
    }

    categoriesContainer.innerHTML = "";

    data.forEach(category => {

        const categoryCard =
            document.createElement("div");

        categoryCard.className =
            "category-card";

        categoryCard.innerHTML = `

            <h2>${category.name}</h2>

            <p>
                ${category.description || ""}
            </p>

            <a
                href="products.html?category=${category.id}"
                class="category-btn"
            >
                View Products
            </a>

        `;

        categoriesContainer.appendChild(categoryCard);
    });
}

loadCategories();