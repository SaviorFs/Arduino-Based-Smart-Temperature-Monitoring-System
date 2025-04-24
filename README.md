# Arduino-Based Smart Temperature Monitoring System

This project is a full-stack IoT application designed to monitor ambient temperature using an Arduino Uno R4 WiFi and a DHT11 temperature sensor. It operates in a local development environment and uses a Node.js-based WebSocket server to relay data in real time between the Arduino and a browser-based dashboard. Users can observe temperature readings, configure custom thresholds, and receive immediate visual feedback through onboard LEDs.

## Features

- Real-time temperature updates displayed on a web dashboard
- Adjustable cold and hot thresholds configurable per user
- Visual LED indicators on the Arduino: Red (hot), Green (normal), Blue (cold)
- Two-way WebSocket communication between the Arduino and browser
- Threshold logic processed onboard with instant LED response
- Optional daily average chart toggle for historical overview


## System Overview

1. The **Arduino Uno R4 WiFi** reads ambient temperature values from a connected DHT11 sensor at regular intervals.
2. These readings are transmitted over a local network using the WebSocket protocol to a locally hosted **Node.js WebSocket server**.
3. The server receives incoming temperature data and broadcasts it in real time to all connected web clients, including a browser-based dashboard.
4. The **frontend dashboard** displays live temperature readings and provides controls for users to update cold and hot threshold values.
5. When thresholds are updated, the values are sent back to the Arduino, which compares the current temperature to the new thresholds and activates the appropriate **LED indicator** (Red, Green, or Blue) based on the temperature range.


## Repository Structure

Arduino/
  ├── ArduinoTempMonitor.ino
  └── tests/
      └── tests.txt

FrontEnd/
  ├── admin.html
  ├── app.js
  ├── auth.js
  ├── chart.html
  ├── firebase-config.js
  ├── index.html
  ├── login.html
  ├── navbar.html
  ├── register.html
  ├── styles.css
  ├── threshold.html
  ├── package.json
  ├── package-lock.json
  ├── tests/
  │   └── (test files)
  └── lang/
      ├── en.json
      ├── it.json
      └── i18n.js

WebSocketServer/
  ├── server.js
  ├── package.json
  ├── package-lock.json
  ├── firebase-service-account.json
  └── tests/
      └── tests.txt

.github/
  └── workflows/
      └── node-ci.yml

.gitignore
README.md


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

This system is currently deployed and tested in a local development environment.

- The WebSocket server runs locally on port `8081` and accepts `ws://` connections from both the browser dashboard and the Arduino Uno R4 WiFi.
- The frontend interface is accessed directly via `index.html` opened in a browser.
- No NGINX reverse proxy or SSL (WSS) is currently configured, as the application does not require public access or secure WebSocket connections in this setup.
- Firebase services are accessed remotely for authentication and real-time database operations.

This setup is suitable for development and testing on a single machine or local network.

## License

This project is licensed for educational use under the MIT License.