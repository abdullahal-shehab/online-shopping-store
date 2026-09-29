// ========================================
// SIGN UP
// ========================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // Check passwords

        if (password !== confirmPassword) {

            alert("Passwords do not match!");

            return;
        }


        // Check password length

        if (password.length < 6) {

            alert("Password must be at least 6 characters.");

            return;
        }


        try {

            // Create Supabase account

            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {
                            full_name: name
                        }

                    }

                });


            if (error) {

                alert(error.message);

                return;
            }


            // Check whether a session was created

            if (data.user && data.session) {

                // Create customer profile

                const { error: profileError } =
                    await supabaseClient
                        .from("profiles")
                        .insert([
                            {
                                id: data.user.id,
                                full_name: name,
                                email: email
                            }
                        ]);


                if (profileError) {

                    console.error(
                        "Profile creation error:",
                        profileError
                    );

                    alert(
                        "Account created, but profile creation failed."
                    );

                    return;
                }

            }


            alert(
                "Account created successfully! Please check your email if verification is required."
            );


            // Go to login page

            window.location.href = "login.html";


        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong. Please try again."
            );

        }

    });

}
// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;


        try {

            const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
});

if (error) {
    alert(error.message);
    return;
}

const user = data.user;

if (user) {

    const fullName =
        user.user_metadata?.full_name ||
        "Customer";

    const { error: profileError } =
        await supabaseClient
            .from("profiles")
            .upsert(
                {
                    id: user.id,
                    full_name: fullName,
                    email: user.email
                },
                {
                    onConflict: "id"
                }
            );

    if (profileError) {
        console.error(
            "Profile creation/update error:",
            profileError
        );
    }
}

window.location.href = "index.html";


        } catch (error) {

            console.error(error);

            alert("Something went wrong. Please try again.");

        }

    });

}
// ========================================
// NAVBAR AUTH STATUS
// ========================================

async function updateNavbar() {

    const authNav = document.getElementById("authNav");

    if (!authNav) {
        return;
    }


    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();


    if (user) {

        authNav.innerHTML = `
            <a href="#" id="logoutBtn">Logout</a>
        `;


        const logoutBtn =
            document.getElementById("logoutBtn");


        logoutBtn.addEventListener("click", async function (event) {

            event.preventDefault();


            const { error } =
                await supabaseClient.auth.signOut();


            if (error) {

                alert(error.message);

                return;
            }


            alert("Logged out successfully!");


            window.location.href = "index.html";

        });

    } else {

        authNav.innerHTML = `
            <a href="login.html">Login</a>
        `;

    }

}


// Run navbar check
updateNavbar();