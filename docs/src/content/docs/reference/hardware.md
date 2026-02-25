---
title: Hardware
description: Hardware components and signal-path assumptions for beacon tracking.
---

## System roles

## Master

- ESP32-S3 running `master/` firmware.
- Emits IR beacon from front LED.
- Carrier currently configured to continuous **10 kHz**.

## Slave

- ESP32-S3 running `slave/` firmware.
- Reads four directional IR channels:
  - `IR_FRONT`
  - `IR_BACK`
  - `IR_LEFT`
  - `IR_RIGHT`
- Executes closed-loop heading and drive control.

## IR meter

- ESP32-S3 running `ir_meter/` firmware.
- Uses the same four directional channels as slave.
- Publishes CSV telemetry for calibration and bearing validation.

## Receive-path assumption

Beacon-tracking firmware assumes each channel behaves as a demodulated amplitude source:

`Photodiode -> TIA -> band-pass (~carrier) -> envelope detector -> low-pass -> ADC`

If raw photodiode outputs are used instead, add analog demodulation or software demodulation before using current thresholds/constants.

## Motor/actuator constraints

Drive control uses duty dead-zone compensation because low PWM values do not reliably move vibration motors.

## Development board reference

### ESP32 Development Board

- [Amazon link](https://amzn.eu/d/0aacuYDf)
- [ESP32-WROOM-32 Microcontroller Datasheet](https://documentation.espressif.com/esp32-wroom-32_datasheet_en.pdf)

#### Pinout

![ESP32 Development Board Pinout](@assets/diymore-esp-dev-board-pinout.jpg)
