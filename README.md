# Arduino-Based Smart Temperature Monitoring System

This project is a full-stack IoT system designed to monitor ambient temperature using an Arduino Uno R4 WiFi, a DHT11 temperature sensor, and a Node.js-based WebSocket server. Users can view real-time temperature readings via a browser dashboard and configure temperature thresholds that control LED indicators on the Arduino.

## Features

- Real-time temperature monitoring via WebSockets
- Adjustable cold and hot temperature thresholds from a frontend dashboard
- Visual feedback through colored LEDs on the Arduino (Red, Green, Blue)
- Bi-directional WebSocket communication between the frontend and hardware
- Threshold logic handled onboard with immediate visual response
- Secure WebSocket support (WSS) via NGINX reverse proxy and SSL certificates

## System Overview

1. **Arduino Uno R4 WiFi** reads temperature from the DHT11 sensor.
2. Temperature data is sent to a Node.js WebSocket server.
3. The server broadcasts the data to connected clients (such as a web dashboard).
4. The web dashboard updates live and allows the user to send updated thresholds.
5. The Arduino receives threshold changes and updates its LED state accordingly.

## Repository Structure

```
Arduino/
  ├── ArduinoTempMonitor.ino
  └── tests/
      └── tests.txt

WebSocketServer/
  ├── server.js
  ├── package.json
  └── tests/
      └── tests.txt

Frontend/
  ├── index.html
  ├── app.js
  ├── styles.css
  └── (tests/ - to be added)
```

## CI Integration

A GitHub Actions workflow is used for Continuous Integration. The workflow performs the following:
- Checks out the codebase
- Installs dependencies for the Node.js WebSocket server
- Optionally lints and performs basic runtime validation

CI workflow file location:
```
.github/workflows/node-ci.yml
```

## Testing Documentation

Each major folder contains a `tests/` subfolder with a `tests.txt` file documenting the manual and code-based tests performed. These tests cover:
- WiFi connectivity and reconnection logic
- WebSocket communication between the Arduino and browser
- Threshold logic and LED behavior verification
- Error handling for failed sensor readings
- Open port validation and secure connection testing

Tools used during testing include:
- WebSocketKing (https://websocketking.com) for live WebSocket message testing
- YouGetSignal (https://www.yougetsignal.com/tools/open-ports/) for external port checking

## Deployment

Secure connections are handled using NGINX reverse proxy on port 8443 for WSS traffic. The WebSocket server runs on port 8081 locally. Port forwarding was configured to allow secure and non-secure traffic from both browser and Arduino clients.

## License

This project is licensed for educational use under the MIT License.