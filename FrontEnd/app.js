let coldThreshold = 25.8;
let hotThreshold = 26.3;

let socket = null;
let resendInterval = null;

function sendUIDToArduinoRepeatedly(uid) {
  firebase.database().ref(`users/${uid}/thresholds`).once("value").then((snapshot) => {
    const thresholds = snapshot.val();
    if (!thresholds) return;

    const payload = {
      type: "register-uid",
      uid: uid,
      coldThreshold: thresholds.cold || 18,
      hotThreshold: thresholds.hot || 28
    };

    resendInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
        console.log("Re-sent register-uid + thresholds to Arduino:", payload);
      }
    }, 3000);
  });
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    localStorage.setItem("uid", user.uid);
    socket = new WebSocket("ws://localhost:8888");

    socket.onopen = () => {
      console.log("WebSocket connected.");
      sendUIDToArduinoRepeatedly(user.uid);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.temperature !== undefined) {
          clearInterval(resendInterval);
          console.log("Arduino responded. Stopped re-sending UID.");
          updateUI(data.temperature);
        }

        if (data.coldThreshold !== undefined) {
          coldThreshold = data.coldThreshold;
          const coldInput = document.getElementById("coldInput");
          if (coldInput) coldInput.value = coldThreshold;
        }

        if (data.hotThreshold !== undefined) {
          hotThreshold = data.hotThreshold;
          const hotInput = document.getElementById("hotInput");
          if (hotInput) hotInput.value = hotThreshold;
        }

        if (data.ledStatus !== undefined) {
          const ledStatus = document.getElementById("led-status");
          if (ledStatus) ledStatus.textContent = data.ledStatus;
        }

        if (data.type === "kick") {
          alert(data.message || "You have been kicked by an admin.");
          window.location.href = "login.html";
        }

      } catch (err) {
        console.warn("Invalid WebSocket message:", event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.warn("WebSocket disconnected.");
      clearInterval(resendInterval);
    };

    // Attach logout
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("uid");
        firebase.auth().signOut().then(() => {
          window.location.href = "login.html";
        });
      });
    }

    // Load thresholds once
    firebase.database().ref(`users/${user.uid}/thresholds`).once("value").then((snapshot) => {
      const thresholds = snapshot.val();
      if (thresholds) {
        if (thresholds.cold !== undefined) {
          coldThreshold = thresholds.cold;
          const coldInput = document.getElementById("coldInput");
          if (coldInput) coldInput.value = coldThreshold;
        }
        if (thresholds.hot !== undefined) {
          hotThreshold = thresholds.hot;
          const hotInput = document.getElementById("hotInput");
          if (hotInput) hotInput.value = hotThreshold;
        }
      }
    });

    // Listen for LED status
    firebase.database().ref(`users/${user.uid}/ledStatus/value`).on("value", (snapshot) => {
      const ledStatusEl = document.getElementById("led-status");
      if (ledStatusEl && snapshot.exists()) {
        ledStatusEl.textContent = snapshot.val();
      }
    });

    // Threshold update handler
    document.getElementById("set-threshold")?.addEventListener("click", sendThresholds);

    // Track session
    const sessionId = `session_${Date.now()}`;
    firebase.database().ref(`users/${user.uid}/sessions/${sessionId}`).set({
      email: user.email || "unknown@example.com",
      active: true,
      sessionStart: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });

    window.addEventListener("beforeunload", () => {
      firebase.database().ref(`users/${user.uid}/sessions/${sessionId}/active`).set(false);
    });
  }
});

function sendThresholds() {
  const cold = parseFloat(document.getElementById("coldInput").value);
  const hot = parseFloat(document.getElementById("hotInput").value);

  if (!isNaN(cold)) coldThreshold = cold;
  if (!isNaN(hot)) hotThreshold = hot;

  const payload = {
    coldThreshold,
    hotThreshold
  };

  const uid = localStorage.getItem("uid");
  if (uid) {
    payload.uid = uid;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      console.log("Thresholds sent:", payload);
    }

    firebase.database().ref(`users/${uid}/thresholds`).set({
      cold: coldThreshold,
      hot: hotThreshold
    });
  }
}

function updateUI(temp) {
  const tempDisplay = document.getElementById("temp-value");
  if (tempDisplay) tempDisplay.textContent = temp.toFixed(2);

  const virtualLED = document.getElementById("virtual-led");
  let status = "Unknown";

  if (temp <= coldThreshold) {
    status = "Too Cold";
    if (virtualLED) virtualLED.style.backgroundColor = "blue";
  } else if (temp < hotThreshold) {
    status = "Just Right";
    if (virtualLED) virtualLED.style.backgroundColor = "green";
  } else {
    status = "Too Hot";
    if (virtualLED) virtualLED.style.backgroundColor = "red";
  }

  const statusEl = document.getElementById("statusDisplay");
  if (statusEl) statusEl.textContent = status;
}
