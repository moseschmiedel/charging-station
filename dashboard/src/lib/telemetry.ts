export type TelemetrySource = "local" | "wireless";

export interface UartRawLine {
	receivedAtMs: number;
	line: string;
	parsed: boolean;
}

export interface TelemetryFrame {
	source: TelemetrySource;
	fromNode: number | null;
	receivedAtMs: number;
	rawLine: string;
	tMs: number;
	mode: string;
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

export interface TelemetryStatus {
	configuredPath: string | null;
	portPath: string | null;
	baudRate: number;
	connected: boolean;
	lastError: string | null;
	lastLineAtMs: number | null;
	framesReceived: number;
	rawLinesReceived: number;
}
