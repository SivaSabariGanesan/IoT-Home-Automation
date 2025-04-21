#include "BluetoothSerial.h"

#define RELAY_PIN 5  // D5 on ESP32

BluetoothSerial BTSerial;

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // Default state: Relay OFF (LED OFF)
  Serial.begin(9600);
  BTSerial.begin("ESP32Voice");  // Bluetooth name for voice commands
  Serial.println("Bluetooth is ready. Send 'turn on' or 'turn off'");
}

void loop() {
  if (BTSerial.available()) {
    String voiceCommand = BTSerial.readStringUntil('\n');
    voiceCommand.trim(); // Clean up the input
    
    Serial.println("Received command: " + voiceCommand);
    
    if (voiceCommand.equalsIgnoreCase("turn on")) {
      digitalWrite(RELAY_PIN, HIGH); // Relay not triggered → LED ON
      BTSerial.println("LED ON ✅");
      Serial.println("LED ON ✅");
    } 
    else if (voiceCommand.equalsIgnoreCase("turn off")) {
      digitalWrite(RELAY_PIN, LOW); // Relay triggered → LED OFF
      BTSerial.println("LED OFF 📴");
      Serial.println("LED OFF 📴");
    } 
    else {
      BTSerial.println("Invalid command. Use 'turn on' or 'turn off'");
      Serial.println("Invalid command. Use 'turn on' or 'turn off'");
    }
  }
}
