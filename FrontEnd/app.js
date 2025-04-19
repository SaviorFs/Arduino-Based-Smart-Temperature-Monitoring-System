let coldThreshold = 25.8;
let hotThreshold = 26.3;

const socket = new WebSocket("wss://realtimetempmonitor.com:8443");

socket.onopen = () => {
  console.log("Connected to WebSocket");
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    if (data.temperature !== undefined) {
      updateUI(data.temperature);
    }

    if (data.coldThreshold !== undefined) coldThreshold = data.coldThreshold;
    if (data.hotThreshold !== undefined) hotThreshold = data.hotThreshold;
  } catch (err) {
    console.warn("Invalid message:", event.data);
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
  socket.send(JSON.stringify({ coldThreshold, hotThreshold }));
  console.log("Thresholds sent:", { coldThreshold, hotThreshold });
}

function updateUI(temp) {
  document.getElementById("tempDisplay").textContent = temp.toFixed(2);

  const status = temp <= coldThreshold
    ? "Too Cold"
    : temp < hotThreshold
    ? "Just Right"
    : "Too Hot";
  document.getElementById("statusDisplay").textContent = status;

  // Firebase-style virtual LED color update
  const virtualLED = document.getElementById("virtual-led");
  if (virtualLED) {
    if (temp <= coldThreshold) {
      virtualLED.style.backgroundColor = "blue";
    } else if (temp < hotThreshold) {
      virtualLED.style.backgroundColor = "green";
    } else {
      virtualLED.style.backgroundColor = "red";
    }
  }
}

// Firebase LED status watcher 
const ledStatus = document.getElementById("led-status");
if (typeof firebase !== 'undefined' && firebase.database) {
  const db = firebase.database();

  db.ref("ledStatus").on("value", (snapshot) => {
    if (snapshot.exists() && ledStatus) {
      ledStatus.innerText = snapshot.val() ? "ON" : "OFF";
    }
  });
}

// Logout functionality 
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
