---
title: Overview
description: Firmware architecture map for charging, beacon tracking, and drive control.
sidebar:
    order: 1
---

## Repository map

- `master/`: Dezibot master node firmware (ESP32-S3-MINI) for station coordination and IR beacon transmission.
- `slave/`: Dezibot mobile node firmware (ESP32-S3-MINI) with charge-seeking state machine and closed-loop drive control.
- `ir_meter/`: Dezibot instrumentation firmware (ESP32-S3-MINI) for beacon measurement and tuning.
- `motor/`: standalone motor controller firmware (ESP32-WROOM-32) for controlling the charging station stepper motors for moving the bridge.
- `dashboard/`: live telemetry UI (SvelteKit) for `beacon_nav` logs over UART.
- `dezibot/`: shared device library used by firmware targets.

## Beacon tracking architecture

Implemented in both `ir_meter` and `slave` as `BeaconTracker`:

1. Read directional channels (`front/back/left/right`).
2. Apply calibration (`gain`, `offset`) per channel.
3. Compute vector (`vx`, `vy`) and bearing (`theta`).
4. Compute total signal `S` and detection flag.
5. Low-pass filter `theta` with wrapped-angle update.

## Drive-control architecture (slave)

Inside `step_to_charge`:

1. Run tracker update at fixed period.
2. If signal is missing: search spin behavior.
3. If signal is present: compute `u/w`, generate `mL/mR`, map to duty.
4. Check arrival (`detected`, `S_arrive`, front dominance).
5. Return `true` to advance existing autocharge state machine.

## Transmission architecture (master)

Master configures front IR LED beacon parameters on boot:

- carrier frequency: 10 kHz
- duty cycle: explicit constant

Settings are logged at startup for traceability.
