let coldThreshold = 25.8;
let hotThreshold = 26.3;

const socket = new WebSocket("ws://localhost:8443");

socket.onopen = () => {
  console.log("Connected to WebSocket");
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (data.temperature !== undefined) updateUI(data.temperature);
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
}
