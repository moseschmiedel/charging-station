---
title: Software API
description: API reference for dashboard telemetry streaming and UART payload contracts.
sidebar:
  order: 5
---

## Scope

This reference covers software-facing interfaces currently used in this workspace:

- Dashboard Server-Sent Events (SSE) endpoint
- Dashboard telemetry data models
- UART log line formats parsed by the dashboard backend

## Dashboard SSE endpoint

Base route:

- `GET /api/telemetry`

Behavior:

- Returns an SSE stream (`Content-Type: text/event-stream`).
- Sends a status snapshot immediately after connect.
- Replays recent buffers on connect:
  - up to 80 `telemetry` events
  - up to 120 `raw` events
- Sends heartbeat comments every 15 seconds (`: ping`).

### SSE event: `status`

JSON payload shape (`TelemetryStatus`):

```ts
interface TelemetryStatus {
  configuredPath: string | null;
  portPath: string | null;
  baudRate: number;
  connected: boolean;
  lastError: string | null;
  lastLineAtMs: number | null;
  framesReceived: number;
  rawLinesReceived: number;
}
```

### SSE event: `telemetry`

JSON payload shape (`TelemetryFrame`):

```ts
type TelemetrySource = "local" | "wireless";

interface TelemetryFrame {
  source: TelemetrySource;
  fromNode: number | null;
  receivedAtMs: number;
  rawLine: string;
  tMs: number;
  mode: string; // expected: "track" | "search"
  rawF: number;
  rawB: number;
  rawL: number;
  rawR: number;
  ampF: number;
  ampB: number;
  ampL: number;
  ampR: number;
  thetaDeg: number;
  signal: number;
  detected: boolean;
  dutyL: number;
  dutyR: number;
}
```

### SSE event: `raw`

JSON payload shape (`UartRawLine`):

```ts
interface UartRawLine {
  receivedAtMs: number;
  line: string;
  parsed: boolean;
}
```

`parsed` is `true` if the line was accepted as telemetry and converted into a `TelemetryFrame`.

## UART payload contracts

The dashboard UART service parses these input line formats:

1. Local slave telemetry:
   - `beacon_nav,t_ms,mode,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,theta_deg,S,detected,duty_l,duty_r`
2. Master-forwarded wireless telemetry:
   - `wireless_log,<from_node>,beacon_nav,t_ms,mode,...,duty_l,duty_r`
3. Mesh-forwarded payload form:
   - `log:beacon_nav,t_ms,mode,...,duty_l,duty_r`

Notes:

- `detected` is parsed as integer `0/1` and exposed as `boolean`.
- Any parse failure keeps the line in raw history but does not emit a `telemetry` event.

## UART service runtime defaults

- Default baud: `115200` (`UART_BAUD` override supported).
- Optional port override: `UART_PATH`.
- Auto-detect picks first preferred port matching:
  - `tty.usb`, `ttyACM`, `ttyUSB`, `cu.usb`, or `COM<number>`.
- Reconnect delay after disconnect/error: `2000 ms`.
- In-memory ring limits:
  - telemetry frames: `500`
  - raw lines: `1000`

## Producer/consumer mapping

- `slave/` emits `beacon_nav` lines over serial and mesh.
- `master/` logs/forwards wireless payloads (`wireless_log,...`).
- `dashboard/` consumes these lines and exposes normalized SSE events.
- `ir_meter/` emits a different CSV format for tracker calibration; it is not parsed into `TelemetryFrame`.
