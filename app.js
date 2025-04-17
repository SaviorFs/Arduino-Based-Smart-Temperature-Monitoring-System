// app.js
document.addEventListener("DOMContentLoaded", function () {
    const tempValue = document.getElementById("temp-value");
    const thresholdInput = document.getElementById("threshold");
    const setThresholdBtn = document.getElementById("set-threshold");
    const ledStatus = document.getElementById("led-status");
    const logoutBtn = document.getElementById("logout");
    const virtualLED = document.getElementById("virtual-led"); // Add this div in HTML

    const db = firebase.database();

    // Get real-time temperature updates
    db.ref("temperature").on("value", (snapshot) => {
        if (snapshot.exists()) {
            const celsius = snapshot.val();
            const fahrenheit = (celsius * 9 / 5) + 32;
            tempValue.innerText = fahrenheit.toFixed(1);

            // Update virtual LED color based on Fahrenheit range
            if (virtualLED) {
                if (fahrenheit < 50) {
                    virtualLED.style.backgroundColor = "blue";
                } else if (fahrenheit >= 50 && fahrenheit <= 70) {
                    virtualLED.style.backgroundColor = "green";
                } else {
                    virtualLED.style.backgroundColor = "red";
                }
            }
        }
    });

    // Get real-time LED status updates
    db.ref("ledStatus").on("value", (snapshot) => {
        if (snapshot.exists()) {
            ledStatus.innerText = snapshot.val() ? "ON" : "OFF";
        }
    });

    // Set threshold in Firebase
    if (setThresholdBtn) {
        setThresholdBtn.addEventListener("click", () => {
            const threshold = parseFloat(thresholdInput.value);
            if (!isNaN(threshold)) {
                db.ref("threshold").set(threshold);
                alert("Threshold set successfully!");
            } else {
                alert("Please enter a valid number.");
            }
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            firebase.auth().signOut().then(() => {
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });
    }
});

