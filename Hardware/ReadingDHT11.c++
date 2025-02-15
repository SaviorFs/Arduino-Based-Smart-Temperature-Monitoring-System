// NOTE: USE ARDUINO IDE or other extensions may be required
// lib used https://github.com/adafruit/DHT-sensor-library
// This reads temp data from DHT11 sensor and shows it in the serial monitor
#include <DHT.h>

#define DHTPIN 7
#define DHTTYPE DHT11

// LED
#define BLUE_LED 3
#define GREEN_LED 4
#define RED_LED 5

// System default threshold for temp
float coldThreshold = 17.5;
float hotThreshold = 25.0;

DHT dht(DHTPIN, DHTTYPE);

void setup() {
    Serial.begin(9600);
    dht.begin();

    //LED pins as OUTPUT
    pinMode(BLUE_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);
    pinMode(RED_LED, OUTPUT);
}

void loop() {
    delay(2000); // 2s delay due to limit of DHT11 sensor

    float temp = dht.readTemperature();

    if (isnan(temp)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }

    Serial.println("Temperature is " + String(temp) + "°C");

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
}