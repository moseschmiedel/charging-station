---
title: Getting Started
description: Build and run the charging-station firmware projects.
---

## Workspace layout

This workspace contains separate firmware repositories:

- `master/`: Dezibot master node firmware (ESP32-S3-MINI).
- `slave/`: Dezibot mobile node firmware (ESP32-S3-MINI).
- `ir_meter/`: Dezibot instrumentation firmware for beacon validation (ESP32-S3-MINI).
- `motor/`: standalone motor controller firmware (ESP32-WROOM-32).
- `dashboard/`: live telemetry dashboard (SvelteKit + UART).
- `docs/`: this documentation site.

## Prerequisites

Initialize submodules before building firmware (required for `dezibot/` library):

```bash
cd charging-station
git submodule update --init --recursive
```

## Build commands

Run the commands inside each repository.

```bash
# Master firmware
cd charging-station/master
pio run

# Slave firmware
cd charging-station/slave
pio run

# IR meter firmware
cd charging-station/ir_meter
pio run

# Motor controller firmware (ESP32-WROOM-32)
cd charging-station/motor
pio run
```

## Flash and monitor

```bash
# Example: slave
cd charging-station/slave
pio run -t upload
pio device monitor -b 115200
```

## Dashboard

Run the live telemetry dashboard:

```bash
cd charging-station/dashboard
bun install
bun run dev
```

Open `http://localhost:5173`.

## Next step

Follow the implementation guide for the full beacon-tracking and drive-control workflow:

- [Beacon Tracking + Drive Control](/guides/beacon-tracking-drive-control/)
