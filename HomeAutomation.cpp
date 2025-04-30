#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Custom service UUID
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Pin definitions
const int LIGHT_PIN = 5;  // D5
const int MOTOR_PIN = 23; // D23

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Device connected");
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Device disconnected");
      // Restart advertising to allow new connections
      pServer->getAdvertising()->start();
    }
};

class CharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      // Get the raw data
      uint8_t* data = pCharacteristic->getData();
      size_t len = pCharacteristic->getLength();
      
      if (len > 0) {
        // Convert to null-terminated string
        char* command = new char[len + 1];
        memcpy(command, data, len);
        command[len] = '\0';
        
        // Convert to lowercase
        for(size_t i = 0; i < len; i++) {
          command[i] = tolower(command[i]);
        }
        
        // Process commands
        if (strcmp(command, "light on") == 0) {
          digitalWrite(LIGHT_PIN, HIGH);
          Serial.println("Light turned ON");
        }
        else if (strcmp(command, "light off") == 0) {
          digitalWrite(LIGHT_PIN, LOW);
          Serial.println("Light turned OFF");
        }
        else if (strcmp(command, "motor on") == 0) {
          digitalWrite(MOTOR_PIN, HIGH);
          Serial.println("Motor turned ON");
        }
        else if (strcmp(command, "motor off") == 0) {
          digitalWrite(MOTOR_PIN, LOW);
          Serial.println("Motor turned OFF");
        }
        
        delete[] command;
      }
    }
};

void setup() {
  Serial.begin(115200);
  
  // Configure pins
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(LIGHT_PIN, LOW);
  digitalWrite(MOTOR_PIN, LOW);
  
  // Initialize BLE
  BLEDevice::init("ESP32Voice");
  
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create the BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->setCallbacks(new CharacteristicCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  
  Serial.println("BLE device ready to pair...");
}

void loop() {
  // Add a small delay to prevent watchdog issues
  delay(20);
}
