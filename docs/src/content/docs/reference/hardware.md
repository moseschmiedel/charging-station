---
title: Hardware
description: Hardware components and signal-path assumptions for beacon tracking.
---

## Block diagram

```d2
direction: down

slaveA: "Slave Dezibot"
slaveB: "Slave Dezibot"
slaveC: "Slave Dezibot"
slaveD: "Slave Dezibot"
master: "Master Dezibot\nI2C: SDA=GPIO1, SCL=GPIO2"
motor: "Motor Controller\nI2C: SDA=GPIO21, SCL=GPIO22"
stepper_left: "Stepper Driver Left (H-Bridge)\nIN1..IN4: 14, 27, 26, 25"
stepper_right: "Stepper Driver Right (H-Bridge)\nIN1..IN4: 5, 17, 16, 4"

slaveA <-> master: "Wi-Fi (painlessMesh)"
slaveB <-> master: "Wi-Fi (painlessMesh)"
slaveC <-> master: "Wi-Fi (painlessMesh)"
slaveD <-> master: "Wi-Fi (painlessMesh)"
master <-> motor: "I2C (addr 0x12)"
motor -> stepper_left: "GPIO"
motor -> stepper_right: "GPIO"
```

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

## Stepper Driver

- [L2980N](https://www.st.com/resource/en/datasheet/l298.pdf)

#### Pinout

![ESP32 Development Board Pinout](@assets/diymore-esp-dev-board-pinout.jpg)
