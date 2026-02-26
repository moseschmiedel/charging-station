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

## TIP: Good surface for Dezibots to walk on

[XXL Mouse Desktop Mat](https://amzn.eu/d/0cMn5z1g)

## Repository Layout

- `master/` - Dezibot master node firmware (ESP32-S3-MINI, PlatformIO)
- `slave/` - Dezibot slave node firmware (ESP32-S3-MINI, PlatformIO)
- `ir_meter/` - Dezibot IR meter and beacon-tracking firmware (ESP32-S3-MINI, PlatformIO)
- `motor/` - standalone motor controller firmware (ESP32-WROOM-32, PlatformIO)
- `dezibot/` - Dezibot library submodule
- `dashboard/` - live beacon telemetry dashboard (SvelteKit + UART)
- `docs/` - Astro Starlight docs site

## Requirements

- [PlatformIO Core](https://platformio.org/install)
- [Bun](https://bun.sh/) for `dashboard/` and `docs/`
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

- `master`: env `esp32dev`, board `esp32s3usbotg`, MCU `ESP32-S3-MINI`
- `slave`: env `esp32dev`, board `esp32s3usbotg`, MCU `ESP32-S3-MINI`
- `ir_meter`: env `esp32dev`, board `esp32s3usbotg`, MCU `ESP32-S3-MINI`
- `motor`: env `esp32dev`, board `esp32dev`, MCU `ESP32-WROOM-32`

For target-specific details, see:

- `master/README.md`
- `slave/README.md`
- `motor/README.md`
- `ir_meter/README.md`

## Dashboard

```bash
cd dashboard
bun install
bun run dev
```

Open `http://localhost:5173`.

Optional UART configuration before run:

- `UART_PATH` (for example `/dev/tty.usbmodem12345`)
- `UART_BAUD` (default `115200`)

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
