// NOTE: USE ARDUINO IDE or other extensions may be required
// lib used https://github.com/adafruit/DHT-sensor-library
// This reads temp data from DHT11 sensor and shows it in the serial monitor
#include <DHT.h>

#define DHTPIN 7
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
    Serial.begin(9600);
    dht.begin();
}

void loop() {
    delay(2000);

    float t = dht.readTemperature();

    if (isnan(t)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }

    Serial.println("Temperature is " + String(t) + "°C");\
}