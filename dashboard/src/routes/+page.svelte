<script lang="ts">
  import { onMount } from 'svelte';
  import type { TelemetryFrame, TelemetryStatus } from '$lib/telemetry';

  type ConnectionState = 'connecting' | 'open' | 'closed';

  const MAX_ROWS = 160;
  const MAX_TABLE_ROWS = 24;
  const ADC_MAX = 4095;

  let connectionState: ConnectionState = 'connecting';
  let status: TelemetryStatus | null = null;
  let frames: TelemetryFrame[] = [];
  let selectedNode = 'all';
  let selectedMode = 'all';

  const connectionLabel = {
    connecting: 'Connecting',
    open: 'Live',
    closed: 'Reconnecting'
  };

  const connectionClass = {
    connecting: 'state-warn',
    open: 'state-ok',
    closed: 'state-error'
  };

  function formatTime(ts: number | null): string {
    if (!ts) {
      return 'n/a';
    }
    return new Date(ts).toLocaleTimeString();
  }

  function ingestFrame(frame: TelemetryFrame): void {
    frames = [...frames, frame].slice(-MAX_ROWS);
  }

  onMount(() => {
    const stream = new EventSource('/api/telemetry');

    stream.onopen = () => {
      connectionState = 'open';
    };

    stream.onerror = () => {
      connectionState = 'closed';
    };

    stream.addEventListener('status', (event) => {
      const message = event as MessageEvent<string>;
      status = JSON.parse(message.data);
      if (connectionState === 'closed' && status?.connected) {
        connectionState = 'open';
      }
    });

    stream.addEventListener('telemetry', (event) => {
      const message = event as MessageEvent<string>;
      ingestFrame(JSON.parse(message.data));
    });

    return () => {
      stream.close();
    };
  });

  $: availableNodes = Array.from(
    new Set(
      frames.map((frame) =>
        frame.fromNode === null ? 'local' : frame.fromNode.toString()
      )
    )
  ).sort((left, right) => left.localeCompare(right));

  $: if (selectedNode !== 'all' && !availableNodes.includes(selectedNode)) {
    selectedNode = 'all';
  }

  $: filteredFrames = frames.filter((frame) => {
    const nodeMatch =
      selectedNode === 'all'
        ? true
        : selectedNode === 'local'
          ? frame.fromNode === null
          : frame.fromNode?.toString() === selectedNode;
    const modeMatch = selectedMode === 'all' ? true : frame.mode === selectedMode;
    return nodeMatch && modeMatch;
  });

  $: latest = filteredFrames.length > 0 ? filteredFrames[filteredFrames.length - 1] : null;
  $: recentRows = filteredFrames.slice(-MAX_TABLE_ROWS).reverse();
  $: headingStyle = latest ? `transform: rotate(${latest.thetaDeg}deg)` : '';
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
      <span class={`pill ${connectionClass[connectionState]}`}>{connectionLabel[connectionState]}</span>
      <span class="pill soft">
        port: {status?.portPath ?? status?.configuredPath ?? 'auto-detect'}
      </span>
      <span class="pill soft">baud: {status?.baudRate ?? 115200}</span>
      <span class="pill soft">frames: {status?.framesReceived ?? 0}</span>
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
      <p class="meta">Last UART line: {formatTime(status?.lastLineAtMs ?? null)}</p>
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
          <span>raw_f</span><progress max={ADC_MAX} value={latest.rawF}></progress><strong>{latest.rawF}</strong>
        </div>
        <div class="bar-row">
          <span>raw_b</span><progress max={ADC_MAX} value={latest.rawB}></progress><strong>{latest.rawB}</strong>
        </div>
        <div class="bar-row">
          <span>raw_l</span><progress max={ADC_MAX} value={latest.rawL}></progress><strong>{latest.rawL}</strong>
        </div>
        <div class="bar-row">
          <span>raw_r</span><progress max={ADC_MAX} value={latest.rawR}></progress><strong>{latest.rawR}</strong>
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
                <td>{formatTime(frame.receivedAtMs)}</td>
                <td>{frame.fromNode ?? 'local'}</td>
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
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Sora', 'Segoe UI', sans-serif;
    color: #0d2030;
    background:
      radial-gradient(circle at 10% 5%, #f3fbff 0%, #eef6ff 35%, transparent 45%),
      radial-gradient(circle at 90% 0%, #ffeecf 0%, #fff5e4 28%, transparent 43%),
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
    background: radial-gradient(circle at center, #ffffff 0%, #f4fbff 62%, #ecf5ff 100%);
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
    font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
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
    font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
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
    font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
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
