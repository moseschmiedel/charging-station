# Beacon Dashboard

Live SvelteKit dashboard for beacon tracking telemetry from UART.

## Features

- Node-side UART reader using `serialport`
- SSE stream endpoint at `/api/telemetry`
- Browser dashboard with live bearing, channel bars, and recent frame table
- Supports both formats:
  - direct slave logs: `beacon_nav,...`
  - master-forwarded logs: `wireless_log,<from>,beacon_nav,...`

## Configure UART

Set environment variables before `dev` or `build`:

- `UART_PATH` (optional, recommended): serial device path, e.g.
  - macOS: `/dev/tty.usbmodem12345`
  - Linux: `/dev/ttyACM0`
  - Windows: `COM5`
- `UART_BAUD` (optional): defaults to `115200`

If `UART_PATH` is not set, the backend tries to auto-select a serial port.

## Run

```sh
bun install
bun run dev
```

Open `http://localhost:5173`.

## Build

```sh
bun run build
bun run preview
```

This project uses the Node adapter (`@sveltejs/adapter-node`) so UART access is available in server runtime.
