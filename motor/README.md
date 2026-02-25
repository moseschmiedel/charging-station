# Motor Firmware (ESP32)

Firmware for the motor controller running on an ESP32 (`esp32dev`) using Arduino + PlatformIO.  
It drives two 4-wire steppers via `AccelStepper`/`MultiStepper` and prints runtime logs over UART.

## Build

From the `motor/` directory:

```bash
pio run
```

## Flash / Run

Connect the ESP32 over USB, then upload:

```bash
pio run -t upload
```

After upload, the firmware starts automatically.

## UART Output (ESP32 Serial)

This firmware uses `Serial.begin(115200)`, so monitor at **115200 baud**.

### Option 1: USB serial (recommended)
If your ESP32 dev board has onboard USB-UART, use:

```bash
pio device monitor -b 115200
```

### Option 2: External USB-to-UART adapter
Use 3.3V TTL UART and connect:

- Adapter `GND` -> ESP32 `GND`
- Adapter `RX` -> ESP32 `TX0` (GPIO1 / U0TXD)
- Adapter `TX` -> ESP32 `RX0` (GPIO3 / U0RXD)

Then open a serial monitor at `115200` baud.
