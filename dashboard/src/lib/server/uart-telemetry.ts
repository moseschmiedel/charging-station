import { ReadlineParser } from '@serialport/parser-readline';
import { SerialPort } from 'serialport';
import type { TelemetryFrame, TelemetryStatus } from '$lib/telemetry';

type FrameListener = (frame: TelemetryFrame) => void;
type StatusListener = (status: TelemetryStatus) => void;

const MAX_FRAME_BUFFER = 500;
const RECONNECT_DELAY_MS = 2000;
const DEFAULT_BAUD_RATE = 115200;
const PREFERRED_PORT_PATTERN = /(tty\.usb|ttyACM|ttyUSB|cu\.usb|COM\d+)/i;

function parseInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBeaconPayload(
  payload: string,
  source: TelemetryFrame['source'],
  fromNode: number | null
): TelemetryFrame | null {
  const columns = payload.split(',');
  if (columns.length < 17 || columns[0] !== 'beacon_nav') {
    return null;
  }

  const [
    ,
    tMsRaw,
    mode,
    rawFRaw,
    rawBRaw,
    rawLRaw,
    rawRRaw,
    ampFRaw,
    ampBRaw,
    ampLRaw,
    ampRRaw,
    thetaDegRaw,
    signalRaw,
    detectedRaw,
    dutyLRaw,
    dutyRRaw
  ] = columns;

  const tMs = parseInteger(tMsRaw);
  const rawF = parseInteger(rawFRaw);
  const rawB = parseInteger(rawBRaw);
  const rawL = parseInteger(rawLRaw);
  const rawR = parseInteger(rawRRaw);
  const ampF = parseNumber(ampFRaw);
  const ampB = parseNumber(ampBRaw);
  const ampL = parseNumber(ampLRaw);
  const ampR = parseNumber(ampRRaw);
  const thetaDeg = parseNumber(thetaDegRaw);
  const signal = parseNumber(signalRaw);
  const detected = parseInteger(detectedRaw);
  const dutyL = parseInteger(dutyLRaw);
  const dutyR = parseInteger(dutyRRaw);

  const required = [
    tMs,
    rawF,
    rawB,
    rawL,
    rawR,
    ampF,
    ampB,
    ampL,
    ampR,
    thetaDeg,
    signal,
    detected,
    dutyL,
    dutyR
  ];
  if (required.some((value) => value === null)) {
    return null;
  }

  return {
    source,
    fromNode,
    receivedAtMs: Date.now(),
    rawLine: payload,
    tMs: tMs as number,
    mode,
    rawF: rawF as number,
    rawB: rawB as number,
    rawL: rawL as number,
    rawR: rawR as number,
    ampF: ampF as number,
    ampB: ampB as number,
    ampL: ampL as number,
    ampR: ampR as number,
    thetaDeg: thetaDeg as number,
    signal: signal as number,
    detected: (detected as number) === 1,
    dutyL: dutyL as number,
    dutyR: dutyR as number
  };
}

function parseTelemetryLine(line: string): TelemetryFrame | null {
  if (line.startsWith('beacon_nav,')) {
    return parseBeaconPayload(line, 'local', null);
  }

  if (line.startsWith('wireless_log,')) {
    const rest = line.slice('wireless_log,'.length);
    const separator = rest.indexOf(',');
    if (separator <= 0) {
      return null;
    }

    const fromNode = parseInteger(rest.slice(0, separator));
    const payload = rest.slice(separator + 1);
    if (fromNode === null) {
      return null;
    }

    return parseBeaconPayload(payload, 'wireless', fromNode);
  }

  if (line.startsWith('log:beacon_nav,')) {
    return parseBeaconPayload(line.slice(4), 'wireless', null);
  }

  return null;
}

class UartTelemetryService {
  private frameListeners = new Set<FrameListener>();
  private statusListeners = new Set<StatusListener>();
  private frames: TelemetryFrame[] = [];
  private serial: SerialPort | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly status: TelemetryStatus = {
    configuredPath: process.env.UART_PATH ?? null,
    portPath: null,
    baudRate: Number(process.env.UART_BAUD ?? DEFAULT_BAUD_RATE),
    connected: false,
    lastError: null,
    lastLineAtMs: null,
    framesReceived: 0
  };

  constructor() {
    void this.initialize();
  }

  onFrame(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): TelemetryStatus {
    return { ...this.status };
  }

  getRecentFrames(limit = 100): TelemetryFrame[] {
    return this.frames.slice(-limit);
  }

  private emitFrame(frame: TelemetryFrame): void {
    for (const listener of this.frameListeners) {
      listener(frame);
    }
  }

  private emitStatus(): void {
    const snapshot = this.getStatus();
    for (const listener of this.statusListeners) {
      listener(snapshot);
    }
  }

  private recordError(message: string): void {
    this.status.lastError = message;
    this.emitStatus();
  }

  private async initialize(): Promise<void> {
    const path = await this.resolvePortPath();
    if (!path) {
      this.recordError(
        'No UART port found. Set UART_PATH (for example /dev/tty.usbmodemXXXX or COM5).'
      );
      this.scheduleReconnect();
      return;
    }

    this.open(path);
  }

  private async resolvePortPath(): Promise<string | null> {
    if (this.status.configuredPath) {
      return this.status.configuredPath;
    }

    try {
      const ports = await SerialPort.list();
      const preferred = ports.find((port) => PREFERRED_PORT_PATTERN.test(port.path));
      return (preferred ?? ports[0])?.path ?? null;
    } catch (error) {
      this.recordError(`Failed to enumerate serial ports: ${String(error)}`);
      return null;
    }
  }

  private open(path: string): void {
    if (this.serial) {
      return;
    }

    const baudRate =
      Number.isFinite(this.status.baudRate) && this.status.baudRate > 0
        ? this.status.baudRate
        : DEFAULT_BAUD_RATE;

    const serial = new SerialPort({
      path,
      baudRate,
      autoOpen: false
    });
    this.serial = serial;

    serial.on('open', () => {
      this.status.connected = true;
      this.status.portPath = path;
      this.status.lastError = null;
      this.emitStatus();
    });

    serial.on('error', (error) => {
      this.status.connected = false;
      this.recordError(`UART error on ${path}: ${String(error)}`);
    });

    serial.on('close', () => {
      this.status.connected = false;
      this.status.portPath = null;
      this.emitStatus();
      this.serial = null;
      this.scheduleReconnect();
    });

    const parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));
    parser.on('data', (line: string) => this.handleLine(line));

    serial.open((error) => {
      if (error) {
        this.status.connected = false;
        this.serial = null;
        this.recordError(`Failed to open ${path}: ${error.message}`);
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.initialize();
    }, RECONNECT_DELAY_MS);
  }

  private handleLine(rawLine: string): void {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    this.status.lastLineAtMs = Date.now();
    const frame = parseTelemetryLine(line);
    if (!frame) {
      return;
    }

    this.status.framesReceived++;
    this.frames.push(frame);
    if (this.frames.length > MAX_FRAME_BUFFER) {
      this.frames.splice(0, this.frames.length - MAX_FRAME_BUFFER);
    }

    this.emitFrame(frame);
  }
}

const globalState = globalThis as typeof globalThis & {
  __uartTelemetryService?: UartTelemetryService;
};

const uartTelemetry = globalState.__uartTelemetryService ?? new UartTelemetryService();
globalState.__uartTelemetryService = uartTelemetry;

export default uartTelemetry;
