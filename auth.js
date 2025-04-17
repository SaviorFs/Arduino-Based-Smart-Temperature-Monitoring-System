// auth.js
document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();

    // Register User
    const registerBtn = document.getElementById("register-btn");
    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            const email = document.getElementById("reg-email").value;
            const password = document.getElementById("reg-password").value;
            
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Registration Successful! Redirecting to Dashboard...");
                    window.location.href = "index.html"; // Redirect to dashboard
                })
                .catch(error => alert(error.message));
        });
    }

    // Login User
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Login Successful! Redirecting...");
                    window.location.href = "index.html";
                })
                .catch(error => alert(error.message));
        });
    }

    // Logout User
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            auth.signOut()
                .then(() => {
                    alert("Logged Out Successfully!");
                    window.location.href = "login.html";
                })
                .catch(error => alert(error.message));
        });
    }

    // Redirect if not logged in (for dashboard)
    auth.onAuthStateChanged(user => {
        if (!user && window.location.pathname.includes("index.html")) {
            alert("Please log in first.");
            window.location.href = "login.html";
        }
    });
});

