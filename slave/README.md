# Slave Firmware (Dezibot)

Firmware for the charging-station slave robot on an ESP32-S3 (`esp32s3usbotg`) using Arduino + PlatformIO.

## Build

From the `slave/` directory:

```bash
pio run
```

## Flash / Run

Connect the board via USB, then upload:

```bash
pio run -t upload
```

After upload, the firmware starts automatically.

## UART Output (Dezibot)

The firmware prints logs on `Serial` at **115200 baud**.

### Option 1: USB serial (recommended)

USB CDC is enabled on boot (`ARDUINO_USB_CDC_ON_BOOT=1`), so you can monitor directly over USB:

```bash
pio device monitor -b 115200
```

### Option 2: External USB-to-UART adapter (3.3V TTL)

For board `esp32s3usbotg`, UART0 pins are:

- `TX` = GPIO43
- `RX` = GPIO44
- `GND` = GND

To read Dezibot output only:

- Adapter `GND` -> Dezibot `GND`
- Adapter `RX` -> Dezibot `TX` (GPIO43)

If you also want to send data to the board:

- Adapter `TX` -> Dezibot `RX` (GPIO44)

Use **115200 8N1** and **3.3V TTL levels**.
