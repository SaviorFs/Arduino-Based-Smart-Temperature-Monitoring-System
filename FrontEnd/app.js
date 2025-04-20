let coldThreshold = 25.8;
let hotThreshold = 26.3;

// this connects to local WebSocket server
const socket = new WebSocket("ws://localhost:8888");

socket.onopen = () => {
  console.log("Connected to WebSocket");
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

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
    socket.send(JSON.stringify({ coldThreshold, hotThreshold }));
    console.log("Thresholds sent:", { coldThreshold, hotThreshold });
  } else {
    console.warn("Cannot send thresholds. WebSocket not open.");
  }

  // this will also update Firebase
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

// this is a Firebase LED status listener and initial threshold fetch
const ledStatusEl = document.getElementById("led-status");
if (typeof firebase !== 'undefined' && firebase.database) {
  const db = firebase.database();

  // realtime LED status 
  if (ledStatusEl) {
    db.ref("ledStatus").on("value", (snapshot) => {
      if (snapshot.exists()) {
        ledStatusEl.textContent = snapshot.val();
      }
    });
  }

  // this will keep the threshold values once loaded in
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

// this attaches a click listener to send button
document.getElementById("set-threshold")?.addEventListener("click", sendThresholds);
