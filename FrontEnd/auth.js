document.addEventListener("DOMContentLoaded", function () {
  const auth = firebase.auth();

  function sendUIDToWebSocket(uid) {
    localStorage.setItem("uid", uid); // this persists UID for later use throughout
    console.log("UID saved to localStorage:", uid);
  }

  // this registers user
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;

      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const uid = user.uid;

          // Initialize user in DB
          firebase.database().ref(`users/${uid}`).set({
            email: user.email,
            role: "user",
            username: "Anonymous",
            createdAt: new Date().toISOString(),
            thresholds: {
              cold: 18.0,
              hot: 28.0
            }
          }).then(() => {
            sendUIDToWebSocket(uid); // Save UID
            alert("Registration Successful! Redirecting to Dashboard...");
            window.location.href = "index.html";
          }).catch((err) => {
            console.error("DB Initialization Error:", err);
            alert("Registration failed to complete setup.");
          });
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
          const user = auth.currentUser;
          if (user) {
            const uid = user.uid;
            const db = firebase.database();

            // Tracks session
            const sessionId = `session_${Date.now()}`;
            db.ref(`users/${uid}/sessions/${sessionId}`).set({
              email: user.email,
              active: true,
              sessionStart: new Date().toISOString()
            });
            db.ref(`users/${uid}/sessions/${sessionId}/active`).onDisconnect().set(false);

            // Logs login event
            db.ref(`users/${uid}/activityLogs`).push({
              event: "login",
              timestamp: Date.now(),
              email: user.email
            });

            sendUIDToWebSocket(uid); // Save UID
          }

          alert("Login Successful! Redirecting...");
          window.location.href = "index.html";
        })
        .catch(error => alert(error.message));
    });
  }

  // this is logout logic which is for any page that includes this file
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("uid"); // 🧹 Clean up
      auth.signOut()
        .then(() => {
          alert("Logged Out Successfully!");
          window.location.href = "login.html";
        })
        .catch(error => alert(error.message));
    });
  }

  // this is the auth guard for index.html
  auth.onAuthStateChanged(user => {
    if (!user && window.location.pathname.includes("index.html")) {
      alert("Please log in first.");
      window.location.href = "login.html";
    }
  });
});
