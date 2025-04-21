#include "BluetoothSerial.h"
BluetoothSerial BTSerial;

void setup() {
  Serial.begin(9600);
  BTSerial.begin("ESP32Voice");
}

void loop() {
  if (BTSerial.available()) {
    String voiceCommand = BTSerial.readStringUntil('\n');
    Serial.println(voiceCommand);
  }
}
