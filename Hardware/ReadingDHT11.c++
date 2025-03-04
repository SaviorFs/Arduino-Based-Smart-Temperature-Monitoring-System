// NOTE: USE ARDUINO IDE or other extensions may be required
// Library: https://github.com/adafruit/DHT-sensor-library

#include <WiFiS3.h>
#include <ArduinoWebsockets.h>
#include <DHT.h>

#define WIFI_SSID "your_WiFi_name"      // enter in wifi
#define WIFI_PASS "your_WiFi_password"  // enter in your wifi password
#define WEBSOCKET_SERVER ""  // this is server ip change it accordingly this will probably end up being localhost 

#define DHTPIN 7
#define DHTTYPE DHT11

// LED pins
#define BLUE_LED 3
#define GREEN_LED 4
#define RED_LED 5

// The default threshold for temp
float coldThreshold = 17.5;
float hotThreshold = 25.0;

DHT dht(DHTPIN, DHTTYPE);

using namespace websockets;
WebsocketsClient client;

void setup() {
    Serial.begin(9600);
    dht.begin();

    // LED pins as a OUTPUT
    pinMode(BLUE_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);
    pinMode(RED_LED, OUTPUT);

    // this connects to WiFi
    Serial.print("Connecting to WiFi...");
    while (WiFi.begin(WIFI_SSID, WIFI_PASS) != WL_CONNECTED) {
        Serial.print(".");
        delay(1000);
    }
    Serial.println("\nWiFi Connected!");

    // this connects to WebSocket server
    if (client.connect(WEBSOCKET_SERVER)) {
        Serial.println("Connected to WebSocket server!");
    } else {
        Serial.println("WebSocket connection failed!");
    }
}

void loop() {
    delay(2000); // 2s delay due to limit of DHT11 sensor

    float temp = dht.readTemperature();

    if (isnan(temp)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }

    Serial.println("Temperature is " + String(temp) + "°C");

    // defines the message
    String message = "{\"temperature\":" + String(temp) + "}";

    // this sends data to WebSocket server
    client.send(message);

    // LED turning on logic 
    if (temp <= coldThreshold) {
        digitalWrite(BLUE_LED, HIGH);
        digitalWrite(GREEN_LED, LOW);
        digitalWrite(RED_LED, LOW);
    }
    else if (temp > coldThreshold && temp < hotThreshold) {
        digitalWrite(BLUE_LED, LOW);
        digitalWrite(GREEN_LED, HIGH);
        digitalWrite(RED_LED, LOW);
    }
    else {
        digitalWrite(BLUE_LED, LOW);
        digitalWrite(GREEN_LED, LOW);
        digitalWrite(RED_LED, HIGH);
    }

    // this keeps the WebSocket connection up
    client.poll();
}
