# Charging Station

Repository for a multi-node Dezibot charging-station setup built around ESP32/ESP32-S3 firmware, plus project documentation.

## Repository Layout

- `master/` - charging-station master firmware (ESP32-S3, PlatformIO)
- `slave/` - charging-station slave firmware (ESP32-S3, PlatformIO)
- `motor/` - motor controller firmware (ESP32, PlatformIO)
- `ir_meter/` - IR measurement/tracking firmware and evaluation assets
- `dezibot/` - Dezibot library (Git submodule)
- `docs/` - Astro Starlight documentation site

## Prerequisites

- [PlatformIO Core](https://platformio.org/install)
- [Bun](https://bun.sh/) (for `docs/`)
- Git submodules initialized (for `dezibot/`)

## Setup

```bash
git submodule update --init --recursive
```

## Build Firmware

Run from the respective directory:

```bash
# master node (ESP32-S3)
cd master && pio run

# slave node (ESP32-S3)
cd ../slave && pio run

# motor controller (ESP32)
cd ../motor && pio run

# IR meter node (ESP32-S3)
cd ../ir_meter && pio run
```

## Flash Firmware

Connect the target board over USB, then run in the corresponding folder:

```bash
pio run -t upload
```

## Serial Monitor

All firmware targets use `115200` baud:

```bash
pio device monitor -b 115200
```

## Documentation Site

```bash
cd docs
bun install
bun run dev
```

Build static docs:

```bash
bun run build
```
