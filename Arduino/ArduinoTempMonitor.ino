#include <WiFiS3.h>
#include <WebSocketsClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi Credentials
#define WIFI_SSID ""
#define WIFI_PASS ""

// DHT11 Sensor Setup
#define DHTPIN 7
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// LED Pins
#define RED_LED 2
#define GREEN_LED 3
#define BLUE_LED 4

WebSocketsClient client;
bool isConnected = false;

float coldThreshold = 25.8;
float hotThreshold = 26.3;
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000;
String lastLEDStatus = "";
String dynamicUID = "";  // this is the UID received from frontend

void setup() {
  Serial.begin(9600);
  delay(1000);

  dht.begin();
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BLUE_LED, OUTPUT);

  Serial.print("Connecting to WiFi...");
  while (WiFi.begin(WIFI_SSID, WIFI_PASS) != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nWiFi Connected!");

  connectToWebSocket();
}

void loop() {
  client.loop();

  if (!client.isConnected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > reconnectInterval) {
      Serial.println("Attempting WebSocket reconnect...");
      connectToWebSocket();
      lastReconnectAttempt = now;
    }
    return;
  }

  if (dynamicUID == "") {
    Serial.println("Waiting for UID from frontend...");
    delay(2000);
    return;
  }

  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("Failed to read temperature");
    return;
  }

  Serial.print("Temperature: ");
  Serial.println(temp);

  String status = updateLEDs(temp);

  StaticJsonDocument<150> doc;
  doc["uid"] = dynamicUID;
  doc["temperature"] = temp;
  doc["ledStatus"] = status;

  String message;
  serializeJson(doc, message);
  client.sendTXT(message);
  Serial.println("Sent: " + message);

  delay(2000);
}

String updateLEDs(float temp) {
  String status;

  if (temp <= coldThreshold) {
    digitalWrite(BLUE_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, LOW);
    status = "BLUE";
  } else if (temp < hotThreshold) {
    digitalWrite(BLUE_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);
    status = "GREEN";
  } else {
    digitalWrite(BLUE_LED, LOW);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    status = "RED";
  }

  if (status != lastLEDStatus) {
    Serial.print("LED Changed to: ");
    Serial.println(status);
    lastLEDStatus = status;
  }

  return status;
}

void connectToWebSocket() {
  Serial.println("Connecting to WebSocket...");
  client.begin("10.0.0.102", 8888, "/");
  client.onEvent(webSocketEvent);
  client.enableHeartbeat(5000, 1000, 3);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.println("WebSocket Connected");
    isConnected = true;
  } else if (type == WStype_DISCONNECTED) {
    Serial.println("WebSocket Disconnected");
    isConnected = false;
    dynamicUID = ""; // this clears UID on disconnect
  } else if (type == WStype_TEXT) {
    Serial.print("[WS Payload] ");
    Serial.println((char*)payload);  // debug incoming message

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (error) {
      Serial.print("JSON Parse Error: ");
      Serial.println(error.c_str());
      return;
    }

    if (doc.containsKey("type") && doc["type"] == "register-uid" && doc.containsKey("uid")) {
      dynamicUID = doc["uid"].as<String>();
      Serial.print("Received UID from frontend: ");
      Serial.println(dynamicUID);
    }

    bool thresholdUpdated = false;

    if (doc.containsKey("coldThreshold")) {
      coldThreshold = doc["coldThreshold"];
      Serial.print("⬇️  Updated Cold Threshold: ");
      Serial.println(coldThreshold);
      thresholdUpdated = true;
    }

    if (doc.containsKey("hotThreshold")) {
      hotThreshold = doc["hotThreshold"];
      Serial.print("⬆️  Updated Hot Threshold: ");
      Serial.println(hotThreshold);
      thresholdUpdated = true;
    }

    if (thresholdUpdated) {
      float currentTemp = dht.readTemperature();
      if (!isnan(currentTemp)) {
        Serial.println("Re-evaluating LED after threshold update...");
        lastLEDStatus = "";  // force refresh
        String status = updateLEDs(currentTemp);

        // this sends temp and LED status back to dashboard
        StaticJsonDocument<150> response;
        response["uid"] = dynamicUID;
        response["temperature"] = currentTemp;
        response["ledStatus"] = status;

        String msg;
        serializeJson(response, msg);
        client.sendTXT(msg);
        Serial.println("Sent LED update after threshold change: " + msg);
      }
    }
  }
}
