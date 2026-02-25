import type { RequestHandler } from "./$types";
import uartTelemetry from "$lib/server/uart-telemetry";

export const prerender = false;

const SSE_HEADERS = {
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache, no-transform",
	Connection: "keep-alive",
	"X-Accel-Buffering": "no",
};

const encoder = new TextEncoder();

function eventChunk(event: string, payload: unknown): Uint8Array {
	return encoder.encode(
		`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
	);
}

export const GET: RequestHandler = () => {
	let unsubscribeFrame: (() => void) | null = null;
	let unsubscribeRaw: (() => void) | null = null;
	let unsubscribeStatus: (() => void) | null = null;
	let heartbeat: ReturnType<typeof setInterval> | null = null;

	const cleanup = () => {
		unsubscribeFrame?.();
		unsubscribeRaw?.();
		unsubscribeStatus?.();
		unsubscribeFrame = null;
		unsubscribeRaw = null;
		unsubscribeStatus = null;
		if (heartbeat) {
			clearInterval(heartbeat);
			heartbeat = null;
		}
	};

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const safeEnqueue = (chunk: Uint8Array) => {
				try {
					controller.enqueue(chunk);
				} catch {
					cleanup();
				}
			};

			safeEnqueue(eventChunk("status", uartTelemetry.getStatus()));
			for (const frame of uartTelemetry.getRecentFrames(80)) {
				safeEnqueue(eventChunk("telemetry", frame));
			}
			for (const raw of uartTelemetry.getRecentRawLines(120)) {
				safeEnqueue(eventChunk("raw", raw));
			}

			unsubscribeFrame = uartTelemetry.onFrame((frame) => {
				safeEnqueue(eventChunk("telemetry", frame));
			});
			unsubscribeRaw = uartTelemetry.onRawLine((raw) => {
				safeEnqueue(eventChunk("raw", raw));
			});
			unsubscribeStatus = uartTelemetry.onStatus((status) => {
				safeEnqueue(eventChunk("status", status));
			});
			heartbeat = setInterval(() => {
				safeEnqueue(encoder.encode(": ping\n\n"));
			}, 15000);
		},
		cancel() {
			cleanup();
		},
	});

	return new Response(stream, { headers: SSE_HEADERS });
};
