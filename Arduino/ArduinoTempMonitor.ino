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
  Serial.println("WiFi Connected!");

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

  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("Failed to read temperature");
    return;
  }

  Serial.print("Temperature: ");
  Serial.println(temp);

  String status = updateLEDs(temp);

  // this will send only what's needed
  StaticJsonDocument<100> doc;
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
  client.begin("10.0.0.102", 8888, "/"); // this is localhost for now
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
  } else if (type == WStype_TEXT) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      if (doc.containsKey("coldThreshold")) coldThreshold = doc["coldThreshold"];
      if (doc.containsKey("hotThreshold")) hotThreshold = doc["hotThreshold"];

      float temp = dht.readTemperature();
      if (!isnan(temp)) {
        updateLEDs(temp);
      }
    }
  }
}
