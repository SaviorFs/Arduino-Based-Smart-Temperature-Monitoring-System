let coldThreshold = 25.8;
let hotThreshold = 26.3;

let currentUser = null;
let socket = new WebSocket("ws://localhost:8888");

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;

    // this will mark session active in Firebase
    firebase.database().ref("sessions/" + user.uid).set({
      email: user.email || "unknown@example.com",
      status: "Active"
    });

    // this listens for disconnect to clean up session
    window.addEventListener("beforeunload", () => {
      firebase.database().ref("sessions/" + user.uid + "/status").set("Disconnected");
    });
  }
});

socket.onopen = () => {
  console.log("Connected to WebSocket");

  // If user is known we send id
  if (currentUser) {
    socket.send(JSON.stringify({
      uid: currentUser.uid,
      email: currentUser.email
    }));
  }
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    // this the kick handler (admin feature)
    if (data.type === "kick") {
      alert(data.message || "You have been kicked by an admin.");
      window.location.href = "login.html";
      return;
    }

    if (data.temperature !== undefined) {
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

  } catch (err) {
    console.warn("Invalid WebSocket message:", event.data);
  }
};

socket.onerror = (err) => {
  console.error("WebSocket error:", err);
};

socket.onclose = () => {
  console.warn("WebSocket disconnected");
};

function sendThresholds() {
  const cold = parseFloat(document.getElementById("coldInput").value);
  const hot = parseFloat(document.getElementById("hotInput").value);

  if (!isNaN(cold)) coldThreshold = cold;
  if (!isNaN(hot)) hotThreshold = hot;

  if (socket.readyState === WebSocket.OPEN) {
    const payload = {
      coldThreshold,
      hotThreshold
    };

    if (currentUser) {
      payload.uid = currentUser.uid;
      payload.email = currentUser.email;
    }

    socket.send(JSON.stringify(payload));
    console.log("Thresholds sent:", payload);
  } else {
    console.warn("Cannot send thresholds. WebSocket not open.");
  }

  // Update Firebase
  if (typeof firebase !== 'undefined' && firebase.database) {
    const db = firebase.database();
    db.ref().update({ coldThreshold, hotThreshold });
  }
}

function updateUI(temp) {
  const tempDisplay = document.getElementById("temp-value");
  if (tempDisplay) tempDisplay.textContent = temp.toFixed(2);

  let status = "Unknown";
  const virtualLED = document.getElementById("virtual-led");

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

// Firebase LED status and thresholds
const ledStatusEl = document.getElementById("led-status");
if (typeof firebase !== 'undefined' && firebase.database) {
  const db = firebase.database();

  // Realtime LED status
  if (ledStatusEl) {
    db.ref("ledStatus").on("value", (snapshot) => {
      if (snapshot.exists()) {
        ledStatusEl.textContent = snapshot.val();
      }
    });
  }

  // Load thresholds once on load
  db.ref().once("value").then((snapshot) => {
    const data = snapshot.val();
    if (data) {
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
    }
  });
}

// Logout button
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      window.location.href = "login.html";
    }).catch((error) => {
      console.error("Logout Error:", error);
    });
  });
}

document.getElementById("set-threshold")?.addEventListener("click", sendThresholds);
