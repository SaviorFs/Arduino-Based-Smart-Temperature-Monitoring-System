document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
  
    // Register User
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent reload
  
        const email = document.getElementById("reg-email").value;
        const password = document.getElementById("reg-password").value;
  
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => {
            alert("Registration Successful! Redirecting to Dashboard...");
            window.location.href = "index.html";
          })
          .catch(error => {
            console.error("Registration Error:", error);
            alert(error.message);
          });
      });
    }
  
    // Login logic
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
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
  
    // Logout logic
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
  
    // Protect dashboard
    auth.onAuthStateChanged(user => {
      if (!user && window.location.pathname.includes("index.html")) {
        alert("Please log in first.");
        window.location.href = "login.html";
      }
    });
  });
  