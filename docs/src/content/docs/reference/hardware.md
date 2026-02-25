---
title: Hardware
description: Hardware components and signal-path assumptions for beacon tracking.
---

## System roles

## Master

- Dezibot node with **ESP32-S3-MINI** MCU running `master/` firmware.
- Emits IR beacon from front LED.
- Carrier currently configured to continuous **10 kHz**.

## Slave

- Dezibot node with **ESP32-S3-MINI** MCU running `slave/` firmware.
- Reads four directional IR channels:
    - `IR_FRONT`
    - `IR_BACK`
    - `IR_LEFT`
    - `IR_RIGHT`
- Executes closed-loop heading and drive control.

## IR meter

- Dezibot node with **ESP32-S3-MINI** MCU running `ir_meter/` firmware.
- Uses the same four directional channels as slave.
- Publishes CSV telemetry for calibration and bearing validation.

## Motor controller

- Standalone motor controller board with **ESP32-WROOM-32** MCU running `motor/` firmware.
- Drives two stepper motors (`AccelStepper`/`MultiStepper`).

## Development board reference

### MCU Reference

- Dezibot nodes: [ESP32-S3-MINI-1 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-s3-mini-1_datasheet_en.pdf)
- Motor controller: [ESP32-WROOM-32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf)

#### Pinout

![ESP32 Development Board Pinout](@assets/diymore-esp-dev-board-pinout.jpg)
