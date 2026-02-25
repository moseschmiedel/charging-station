---
title: Getting Started
description: Build and run the charging-station firmware projects.
---

## Workspace layout

This workspace contains separate firmware repositories:

- `master/`: charging station master node (beacon transmitter + mesh control).
- `slave/`: mobile node (beacon tracking and drive control).
- `ir_meter/`: instrumentation firmware for beacon signal validation.
- `motor/`: standalone motor controller experiments.
- `docs/`: this documentation site.

## Build commands

Run the commands inside each repository.

```bash
# Master firmware
cd /Volumes/Programming/htwk/charging-station/master
pio run -e esp32dev

# Slave firmware
cd /Volumes/Programming/htwk/charging-station/slave
pio run -e esp32dev

# IR meter firmware
cd /Volumes/Programming/htwk/charging-station/ir_meter
pio run -e esp32dev
```

## Flash and monitor

```bash
# Example: slave
cd /Volumes/Programming/htwk/charging-station/slave
pio run -e esp32dev -t upload
pio device monitor -b 115200
```

## Next step

Follow the implementation guide for the full beacon-tracking and drive-control workflow:

- [Beacon Tracking + Drive Control](/guides/beacon-tracking-drive-control/)
