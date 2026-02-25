<script lang="ts">
import { onMount, tick } from "svelte";
import type {
	TelemetryFrame,
	TelemetryStatus,
	UartRawLine,
} from "$lib/telemetry";

type ConnectionState = "connecting" | "open" | "closed";

const MAX_ROWS = 160;
const MAX_TABLE_ROWS = 24;

let connectionState: ConnectionState = "connecting";
let status: TelemetryStatus | null = null;
let frames: TelemetryFrame[] = [];
let rawLines: UartRawLine[] = [];
let rawListEl: HTMLDivElement | null = null;
let selectedNode = "all";
let selectedMode = "all";
let keepScrolledToLatest = true;
let rawListHeightPx = 210;
let resizeMoveHandler: ((event: PointerEvent) => void) | null = null;
let resizeStopHandler: (() => void) | null = null;

function ingestFrame(frame: TelemetryFrame): void {
	frames = [...frames, frame].slice(-MAX_ROWS);
}

function ingestRawLine(raw: UartRawLine): void {
	rawLines = [...rawLines, raw].slice(-MAX_ROWS * 2);
}

function scrollRawToBottom(): void {
	if (!rawListEl) {
		return;
	}
	rawListEl.scrollTop = rawListEl.scrollHeight;
}

function stopRawResize(): void {
	if (resizeMoveHandler) {
		window.removeEventListener("pointermove", resizeMoveHandler);
		resizeMoveHandler = null;
	}
	if (resizeStopHandler) {
		window.removeEventListener("pointerup", resizeStopHandler);
		window.removeEventListener("pointercancel", resizeStopHandler);
		resizeStopHandler = null;
	}
}

onMount(() => {
	const stream = new EventSource("/api/telemetry");

	stream.onopen = () => {
		connectionState = "open";
	};

	stream.onerror = () => {
		connectionState = "closed";
	};

	stream.addEventListener("status", (event) => {
		const message = event as MessageEvent<string>;
		status = JSON.parse(message.data);
		if (connectionState === "closed" && status?.connected) {
			connectionState = "open";
		}
	});

	stream.addEventListener("telemetry", (event) => {
		const message = event as MessageEvent<string>;
		ingestFrame(JSON.parse(message.data));
	});

	stream.addEventListener("raw", (event) => {
		const message = event as MessageEvent<string>;
		ingestRawLine(JSON.parse(message.data));
	});

	return () => {
		stream.close();
		stopRawResize();
	};
});

$: availableNodes = Array.from(
	new Set(
		frames.map((frame) =>
			frame.fromNode === null ? "local" : frame.fromNode.toString(),
		),
	),
).sort((left, right) => left.localeCompare(right));

$: if (selectedNode !== "all" && !availableNodes.includes(selectedNode)) {
	selectedNode = "all";
}

$: filteredFrames = frames.filter((frame) => {
	const nodeMatch =
		selectedNode === "all"
			? true
			: selectedNode === "local"
				? frame.fromNode === null
				: frame.fromNode?.toString() === selectedNode;
	const modeMatch = selectedMode === "all" ? true : frame.mode === selectedMode;
	return nodeMatch && modeMatch;
});

$: latest =
	filteredFrames.length > 0 ? filteredFrames[filteredFrames.length - 1] : null;
$: recentRows = filteredFrames.slice(-MAX_TABLE_ROWS).reverse();
$: latestRaw = rawLines.length > 0 ? rawLines[rawLines.length - 1] : null;
$: rawRows = rawLines.slice(-MAX_TABLE_ROWS);
$: headingStyle = latest ? `transform: rotate(${latest.thetaDeg}deg)` : "";
$: if (rawListEl) {
	rawListEl.style.height = `${rawListHeightPx}px`;
}
$: if (keepScrolledToLatest && rawRows.length > 0) {
	tick().then(scrollRawToBottom);
}
</script>

<svelte:head>
  <title>Charging Station Telemetry</title>
  <meta
    name="description"
    content="Live IR beacon tracking and motor drive telemetry from UART over SvelteKit SSE."
  />
</svelte:head>

<main class="shell">
  <header class="hero">
    <p class="eyebrow">Charging Station Dashboard</p>
    <h1>Live Beacon Tracking Telemetry</h1>
    <div class="status-row">
      <span
        class={`pill ${
          connectionState === "open"
            ? "state-ok"
            : connectionState === "closed"
              ? "state-error"
              : "state-warn"
        }`}
        >{
          connectionState === "open"
            ? "Live"
            : connectionState === "closed"
              ? "Reconnecting"
              : "Connecting"
        }</span
      >
      <span class="pill soft">
        port: {status?.portPath ?? status?.configuredPath ?? "auto-detect"}
      </span>
      <span class="pill soft">baud: {status?.baudRate ?? 115200}</span>
      <span class="pill soft">frames: {status?.framesReceived ?? 0}</span>
      <span class="pill soft">raw: {status?.rawLinesReceived ?? 0}</span>
    </div>
    {#if status?.lastError}
      <p class="error">UART: {status.lastError}</p>
    {/if}
  </header>

  <section class="grid">
    <article class="card filters">
      <h2>Filters</h2>
      <label>
        Node
        <select bind:value={selectedNode}>
          <option value="all">all nodes</option>
          {#each availableNodes as node}
            <option value={node}>{node}</option>
          {/each}
        </select>
      </label>
      <label>
        Mode
        <select bind:value={selectedMode}>
          <option value="all">all</option>
          <option value="track">track</option>
          <option value="search">search</option>
        </select>
      </label>
      <p class="meta">
        Last UART line: {status?.lastLineAtMs
          ? new Date(status.lastLineAtMs).toLocaleTimeString()
          : "n/a"}
      </p>
    </article>

    <article class="card heading">
      <h2>Bearing</h2>
      {#if latest}
        <div class="compass">
          <div class="needle" style={headingStyle}></div>
          <div class="center"></div>
        </div>
        <p class="angle">{latest.thetaDeg.toFixed(2)}°</p>
        <p class="meta">
          mode={latest.mode} detected={latest.detected ? 1 : 0} source={latest.source}
          {#if latest.fromNode !== null}
            node={latest.fromNode}
          {/if}
        </p>
      {:else}
        <p class="meta">Waiting for telemetry frame...</p>
      {/if}
    </article>

    <article class="card channels">
      <h2>Channels + Drive</h2>
      {#if latest}
        <div class="bar-row">
          <span>raw_f</span><progress max={4095} value={latest.rawF}
          ></progress><strong>{latest.rawF}</strong>
        </div>
        <div class="bar-row">
          <span>raw_b</span><progress max={4095} value={latest.rawB}
          ></progress><strong>{latest.rawB}</strong>
        </div>
        <div class="bar-row">
          <span>raw_l</span><progress max={4095} value={latest.rawL}
          ></progress><strong>{latest.rawL}</strong>
        </div>
        <div class="bar-row">
          <span>raw_r</span><progress max={4095} value={latest.rawR}
          ></progress><strong>{latest.rawR}</strong>
        </div>
        <div class="drive-row">
          <span>duty_l: {latest.dutyL}</span>
          <span>duty_r: {latest.dutyR}</span>
          <span>S: {latest.signal.toFixed(1)}</span>
        </div>
      {:else}
        <p class="meta">No channel data yet.</p>
      {/if}
    </article>
  </section>

  <section class="card table-card">
    <h2>Recent Frames</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>rx_time</th>
            <th>node</th>
            <th>mode</th>
            <th>theta_deg</th>
            <th>S</th>
            <th>det</th>
            <th>duty_l</th>
            <th>duty_r</th>
          </tr>
        </thead>
        <tbody>
          {#if recentRows.length === 0}
            <tr>
              <td colspan="8">Waiting for first frame...</td>
            </tr>
          {:else}
            {#each recentRows as frame}
              <tr>
                <td>{new Date(frame.receivedAtMs).toLocaleTimeString()}</td>
                <td>{frame.fromNode ?? "local"}</td>
                <td>{frame.mode}</td>
                <td>{frame.thetaDeg.toFixed(2)}</td>
                <td>{frame.signal.toFixed(1)}</td>
                <td>{frame.detected ? 1 : 0}</td>
                <td>{frame.dutyL}</td>
                <td>{frame.dutyR}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <section class="card raw-card">
    <div class="raw-card-head">
      <h2>Raw Output</h2>
      <div class="raw-controls">
        <button
          class="raw-toggle"
          type="button"
          on:click={() => {
            keepScrolledToLatest = !keepScrolledToLatest;
            if (keepScrolledToLatest) {
              scrollRawToBottom();
            }
          }}
        >
          {keepScrolledToLatest ? "Keep Scrolled: On" : "Keep Scrolled: Off"}
        </button>
      </div>
    </div>
    <div
      class="raw-list"
      bind:this={rawListEl}
    >
      {#if rawRows.length === 0}
        <p class="meta">Waiting for UART data...</p>
      {:else}
        {#each rawRows as frame}
          <div class="raw-item">
            <span class="raw-time">
              {new Date(frame.receivedAtMs).toLocaleTimeString()}
            </span>
            <code>{frame.line}</code>
          </div>
        {/each}
      {/if}
    </div>
    <div
      class="raw-resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize raw output"
      on:pointerdown={(event) => {
        event.preventDefault();
        const startY = event.clientY;
        const startHeight = rawListHeightPx;

        stopRawResize();

        resizeMoveHandler = (moveEvent: PointerEvent) => {
          const deltaY = moveEvent.clientY - startY;
          rawListHeightPx = Math.min(
            720,
            Math.max(120, startHeight + deltaY),
          );
        };

        resizeStopHandler = () => {
          stopRawResize();
        };

        window.addEventListener("pointermove", resizeMoveHandler);
        window.addEventListener("pointerup", resizeStopHandler);
        window.addEventListener("pointercancel", resizeStopHandler);
      }}
    ></div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: "Sora", "Segoe UI", sans-serif;
    color: #0d2030;
    background:
      radial-gradient(
        circle at 10% 5%,
        #f3fbff 0%,
        #eef6ff 35%,
        transparent 45%
      ),
      radial-gradient(
        circle at 90% 0%,
        #ffeecf 0%,
        #fff5e4 28%,
        transparent 43%
      ),
      linear-gradient(180deg, #f7fbff 0%, #eef3fb 100%);
  }

  .shell {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.3rem 1.1rem 2rem;
    display: grid;
    gap: 1rem;
  }

  .hero {
    border: 1px solid #d6e4f4;
    background: linear-gradient(120deg, #ffffff 0%, #f3f9ff 58%, #fff8ed 100%);
    border-radius: 18px;
    padding: 1.1rem 1.25rem;
    box-shadow: 0 8px 28px rgba(36, 76, 118, 0.09);
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.72rem;
    color: #2a6e9d;
    font-weight: 700;
  }

  h1 {
    margin: 0.35rem 0 0.7rem;
    font-size: clamp(1.3rem, 3vw, 2rem);
    line-height: 1.1;
  }

  .status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .pill {
    border-radius: 999px;
    padding: 0.3rem 0.62rem;
    font-size: 0.76rem;
    font-weight: 700;
  }

  .pill.soft {
    border: 1px solid #d4dfec;
    background: #ffffffcf;
    color: #1c425d;
  }

  .state-ok {
    background: #daf5de;
    color: #18592f;
  }

  .state-warn {
    background: #ffefc9;
    color: #795304;
  }

  .state-error {
    background: #ffd9d5;
    color: #7a2016;
  }

  .error {
    margin: 0.6rem 0 0;
    color: #a12d1e;
    font-size: 0.84rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .card {
    border: 1px solid #d9e3ef;
    background: #ffffffd9;
    border-radius: 16px;
    padding: 0.95rem 1rem;
    box-shadow: 0 5px 20px rgba(25, 53, 84, 0.08);
  }

  .card h2 {
    margin: 0 0 0.8rem;
    font-size: 0.94rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #244666;
  }

  label {
    display: grid;
    gap: 0.32rem;
    font-size: 0.84rem;
    font-weight: 600;
    margin-bottom: 0.6rem;
  }

  select {
    border-radius: 9px;
    border: 1px solid #c8d8ea;
    background: #f9fcff;
    padding: 0.4rem 0.5rem;
    font-size: 0.84rem;
  }

  .compass {
    width: 132px;
    height: 132px;
    border-radius: 50%;
    border: 2px solid #b9d2ea;
    background: radial-gradient(
      circle at center,
      #ffffff 0%,
      #f4fbff 62%,
      #ecf5ff 100%
    );
    margin: 0 auto;
    position: relative;
  }

  .needle {
    position: absolute;
    width: 2px;
    height: 47px;
    left: 50%;
    top: 14px;
    margin-left: -1px;
    transform-origin: 50% calc(100% - 14px);
    background: linear-gradient(180deg, #0c6f93 0%, #2f3e85 100%);
    border-radius: 8px;
    transition: transform 120ms linear;
  }

  .center {
    position: absolute;
    width: 14px;
    height: 14px;
    left: 50%;
    top: 50%;
    margin: -7px 0 0 -7px;
    border-radius: 50%;
    background: #18476d;
    box-shadow: 0 0 0 4px #dcecff;
  }

  .angle {
    margin: 0.8rem 0 0.2rem;
    text-align: center;
    font-size: 1.42rem;
    font-weight: 700;
  }

  .meta {
    margin: 0;
    color: #3c5871;
    font-size: 0.82rem;
    font-family: "JetBrains Mono", "SFMono-Regular", monospace;
    line-height: 1.45;
    word-break: break-word;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 58px 1fr auto;
    gap: 0.52rem;
    align-items: center;
    margin-bottom: 0.47rem;
  }

  .bar-row span,
  .bar-row strong {
    font-size: 0.8rem;
    font-family: "JetBrains Mono", "SFMono-Regular", monospace;
  }

  .bar-row progress {
    width: 100%;
    height: 11px;
  }

  .bar-row progress::-webkit-progress-bar {
    background: #e6edf6;
    border-radius: 10px;
  }

  .bar-row progress::-webkit-progress-value {
    background: linear-gradient(90deg, #1992b8, #2f85c8);
    border-radius: 10px;
  }

  .drive-row {
    margin-top: 0.72rem;
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    color: #234a66;
    font-weight: 700;
  }

  .table-card {
    overflow: hidden;
  }

  .raw-card {
    display: grid;
    gap: 0.6rem;
  }

  .raw-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .raw-controls {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .raw-toggle {
    border: 1px solid #bfd3e7;
    border-radius: 999px;
    background: #f2f8ff;
    color: #1f4c6d;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.28rem 0.62rem;
    cursor: pointer;
  }

  .raw-toggle:hover {
    background: #e7f2ff;
  }

  .raw-height {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 0 0.2rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: #2b526f;
    min-width: 62px;
    text-align: right;
    padding: 0.2rem 0.45rem;
    border: 1px solid #c9d9ea;
    border-radius: 999px;
    background: #f4f9ff;
    font-family: "JetBrains Mono", "SFMono-Regular", monospace;
  }

  .raw-line {
    margin: 0;
    max-height: 120px;
    overflow: auto;
    background: #f4f9ff;
    padding: 0.5rem 0.62rem;
    font-size: 0.76rem;
    line-height: 1;
    font-family: "JetBrains Mono", "SFMono-Regular", monospace;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .raw-list {
    min-height: 120px;
    overflow: auto;
    display: grid;
    gap: 0.36rem;
    border: 1px solid #dde8f4;
    border-radius: 10px;
    background: #fbfdff;
    padding: 0.5rem;
  }

  .raw-resize-handle {
    height: 14px;
    margin-top: 0.15rem;
    border: 1px solid #d4e2f0;
    border-radius: 10px;
    background: linear-gradient(180deg, #f7fbff 0%, #edf5ff 100%);
    cursor: ns-resize;
    position: relative;
    touch-action: none;
  }

  .raw-resize-handle::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 70px;
    height: 3px;
    border-radius: 99px;
    background: #8aa5bd;
  }

  .raw-item {
    display: grid;
    grid-template-columns: 88px 1fr;
    align-items: start;
  }

  .raw-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .raw-time {
    font-size: 0.74rem;
    color: #46637c;
    font-family: "JetBrains Mono", "SFMono-Regular", monospace;
  }

  .raw-item code {
    font-size: 0.72rem;
    line-height: 1.33;
    color: #1f3a53;
    font-family: "JetBrains Mono", "SFMono-Regular", monospace;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.81rem;
  }

  th,
  td {
    text-align: left;
    padding: 0.42rem 0.46rem;
    border-bottom: 1px solid #e4edf5;
    font-family: "JetBrains Mono", "SFMono-Regular", monospace;
    white-space: nowrap;
  }

  th {
    color: #2f5575;
    background: #f3f9ff;
    position: sticky;
    top: 0;
  }

  @media (max-width: 980px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
