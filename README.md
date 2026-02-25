# Charging Station

Multi-node charging-station project for Dezibot, including ESP32/ESP32-S3 firmware, hardware assets, and documentation.

## Quick Start

```bash
git submodule update --init --recursive
```

Build all firmware projects:

```bash
for fw in master slave motor ir_meter; do
  (cd "$fw" && pio run)
done
```

## Repository Layout

- `master/` - master node firmware (ESP32-S3, PlatformIO)
- `slave/` - slave node firmware (ESP32-S3, PlatformIO)
- `motor/` - motor controller firmware (ESP32, PlatformIO)
- `ir_meter/` - IR meter and beacon-tracking firmware (ESP32-S3, PlatformIO)
- `dezibot/` - Dezibot library submodule
- `docs/` - Astro Starlight docs site

## Requirements

- [PlatformIO Core](https://platformio.org/install)
- [Bun](https://bun.sh/) for `docs/`
- Initialized Git submodules

## Firmware Workflow

Run commands from one firmware directory (`master/`, `slave/`, `motor/`, or `ir_meter/`):

```bash
# build
pio run

# upload
pio run -t upload

# serial monitor
pio device monitor -b 115200
```

### Board Targets

- `master`: `esp32s3usbotg`
- `slave`: `esp32s3usbotg`
- `ir_meter`: `esp32s3usbotg`
- `motor`: `esp32dev`

For target-specific details, see:

- `master/README.md`
- `slave/README.md`
- `motor/README.md`
- `ir_meter/README.md`

## Documentation Site

```bash
cd docs
bun install
bun run dev
```

Build static output:

```bash
bun run build
```
