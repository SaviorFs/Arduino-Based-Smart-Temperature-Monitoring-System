#include <WiFiS3.h>
#include <WebSocketsClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi Credentials
#define WIFI_SSID "" //wifi username
#define WIFI_PASS "" //wifi password

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

// temperature thresholds
float coldThreshold = 25.8;
float hotThreshold = 26.3;
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000;

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

  // I will collect the temperature first
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("Failed to read temperature");
    return;
  }

  Serial.print("Temperature: ");
  Serial.println(temp);

  // this will update LEDs based on user set thresholds
  updateLEDs(temp);

  // this sends data through the WebSocket
  String message = "{\"temperature\":" + String(temp) + "}";
  client.sendTXT(message);
  Serial.println("Sent: " + message);

  delay(2000);
}

void connectToWebSocket() {
  Serial.println("Connecting to WebSocket...");
  client.begin("realtimetempmonitor.com", 8443, "/");
  client.onEvent(webSocketEvent);
  client.enableHeartbeat(5000, 1000, 3);
}

void updateLEDs(float temp) {
  if (temp <= coldThreshold) {
    digitalWrite(BLUE_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, LOW);
  } else if (temp < hotThreshold) {
    digitalWrite(BLUE_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);
  } else {
    digitalWrite(BLUE_LED, LOW);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);
  }

  Serial.print("LED State Updated Cold: ");
  Serial.print(coldThreshold);
  Serial.print("Hot: ");
  Serial.print(hotThreshold);
  Serial.print("Temp: ");
  Serial.println(temp);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("WebSocket Connected");
      client.sendTXT("{\"status\":\"Arduino Connected\"}");
      isConnected = true;
      break;

    case WStype_DISCONNECTED:
      Serial.println("WebSocket Disconnected");
      isConnected = false;
      break;

    case WStype_TEXT: {
      Serial.print("Message from server: ");
      Serial.println((char*)payload);

      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, payload);
      if (!error) {
        bool updated = false;
        if (doc.containsKey("coldThreshold")) {
          coldThreshold = doc["coldThreshold"];
          Serial.print("Cold Threshold Updated: ");
          Serial.println(coldThreshold);
          updated = true;
        }
        if (doc.containsKey("hotThreshold")) {
          hotThreshold = doc["hotThreshold"];
          Serial.print("Hot Threshold Updated: ");
          Serial.println(hotThreshold);
          updated = true;
        }

        if (updated) {
          float temp = dht.readTemperature();
          if (!isnan(temp)) {
            updateLEDs(temp); 
          }
        }
      }
      break;
    }
  }
}
