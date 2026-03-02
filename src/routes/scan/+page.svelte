<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Html5QrcodeScanner } from 'html5-qrcode';
  import { browser } from '$app/environment';

  let { data } = $props();

  // ── Result codes returned by the API ──────────────────────────────────────
  type ResultCode = 'ADMITTED' | 'DUPLICATE' | 'INVALID' | 'NOT_BOOKED' | 'OFFLINE' | 'ERROR';

  type ScanResult = {
    code: ResultCode;
    name?: string;
    category?: string;
    qrData: string;
    message: string;
    checkedInAt?: string;   // ISO string — for DUPLICATE
    timestamp: number;
  };

  let scanner: Html5QrcodeScanner | null = null;
  let isOnline       = $state(true);
  let isProcessing   = $state(false);
  let syncInProgress = $state(false);
  let scanHistory    = $state<ScanResult[]>([]);
  let lastResult     = $state<ScanResult | null>(null);   // drives the full-screen overlay
  let overlayTimer: ReturnType<typeof setTimeout> | null = null;

  // Sound effects
  let successAudio: HTMLAudioElement;
  let warnAudio: HTMLAudioElement;
  let errorAudio: HTMLAudioElement;

  onMount(() => {
    if (!browser) return;
    isOnline = navigator.onLine;
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    successAudio = new Audio('/success-beep.mp3');
    warnAudio    = new Audio('/warn-beep.mp3');
    errorAudio   = new Audio('/error-beep.mp3');

    const saved = localStorage.getItem('rhapsody_scan_history');
    if (saved) {
      try { scanHistory = JSON.parse(saved); } catch { scanHistory = []; }
    }

    initScanner();
    if (isOnline) syncOfflineQueue();
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    scanner?.clear().catch(console.error);
    if (overlayTimer) clearTimeout(overlayTimer);
  });

  function handleOnline()  { isOnline = true;  syncOfflineQueue(); }
  function handleOffline() { isOnline = false; }
  function saveHistory()   { localStorage.setItem('rhapsody_scan_history', JSON.stringify(scanHistory)); }

  function initScanner() {
    scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 12, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
      false
    );
    scanner.render(onScanSuccess, () => {});
  }

  function showResult(result: ScanResult, duration = 3500) {
    lastResult = result;
    if (overlayTimer) clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => { lastResult = null; }, duration);
  }

  async function onScanSuccess(decodedText: string) {
    if (isProcessing) return;
    // Debounce — ignore same QR within 3 s
    const recent = scanHistory.find(s => s.qrData === decodedText && Date.now() - s.timestamp < 3000);
    if (recent) return;

    isProcessing = true;

    if (!isOnline) {
      const r: ScanResult = { code: 'OFFLINE', qrData: decodedText, message: 'Stored — will sync when online', timestamp: Date.now() };
      warnAudio?.play().catch(() => {});
      scanHistory = [r, ...scanHistory].slice(0, 100);
      saveHistory();
      showResult(r, 2500);
      setTimeout(() => { isProcessing = false; }, 2000);
      return;
    }

    try {
      const res = await fetch('/api/scan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_data: decodedText })
      });
      const json = await res.json();

      let result: ScanResult;

      if (res.status === 409 || json.code === 'DUPLICATE') {
        // Already checked-in
        // Resolve the best available timestamp (DB column → ticket.updated_at → null)
        const rawTs = json.checked_in_at ?? json.ticket?.updated_at ?? null;
        const when = rawTs
          ? new Date(rawTs).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
          : null;
        result = {
          code: 'DUPLICATE',
          name: json.ticket?.supporter_name,
          category: json.ticket?.category,
          qrData: decodedText,
          message: when ? `Already Checked-in at ${when}` : 'Already Checked-in (timestamp unavailable)',
          checkedInAt: when,   // null is fine — overlay handles it explicitly
          timestamp: Date.now()
        };
        warnAudio?.play().catch(() => {});
      } else if (res.ok && json.code === 'ADMITTED') {
        result = {
          code: 'ADMITTED',
          name: json.ticket?.supporter_name,
          category: json.ticket?.category,
          qrData: decodedText,
          message: `Admitted — ${json.ticket?.supporter_name}`,
          timestamp: Date.now()
        };
        successAudio?.play().catch(() => {});
      } else {
        result = {
          code: json.code ?? 'ERROR',
          qrData: decodedText,
          message: json.error ?? 'Verification failed',
          timestamp: Date.now()
        };
        errorAudio?.play().catch(() => {});
      }

      scanHistory = [result, ...scanHistory].slice(0, 100);
      saveHistory();
      showResult(result);

    } catch {
      const r: ScanResult = { code: 'ERROR', qrData: decodedText, message: 'Network error — check connection', timestamp: Date.now() };
      errorAudio?.play().catch(() => {});
      scanHistory = [r, ...scanHistory].slice(0, 100);
      saveHistory();
      showResult(r);
    } finally {
      setTimeout(() => { isProcessing = false; }, 2000);
    }
  }

  async function syncOfflineQueue() {
    if (syncInProgress) return;
    const pending = scanHistory.filter(s => s.code === 'OFFLINE');
    if (!pending.length) return;

    syncInProgress = true;
    const updated = [...scanHistory];

    for (const scan of pending) {
      try {
        const res  = await fetch('/api/scan/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_data: scan.qrData, isOfflineSync: true })
        });
        const json = await res.json();
        const idx  = updated.findIndex(s => s.timestamp === scan.timestamp);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            code: res.ok ? 'ADMITTED' : (json.code ?? 'ERROR'),
            message: res.ok ? `Synced — ${json.ticket?.supporter_name}` : (json.error ?? 'Sync failed'),
            name: json.ticket?.supporter_name
          };
        }
      } catch { /* keep as offline */ }
    }

    scanHistory = updated;
    saveHistory();
    syncInProgress = false;
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  const overlayConfig: Record<ResultCode, { bg: string; icon: string; title: string; textColor: string }> = {
    ADMITTED:   { bg: 'bg-green-500',  textColor: 'text-white',      icon: '✓',  title: 'ADMITTED'         },
    DUPLICATE:  { bg: 'bg-amber-400',  textColor: 'text-amber-900',  icon: '⚠',  title: 'ALREADY CHECKED-IN'},
    INVALID:    { bg: 'bg-red-600',    textColor: 'text-white',      icon: '✕',  title: 'INVALID TICKET'   },
    NOT_BOOKED: { bg: 'bg-red-500',    textColor: 'text-white',      icon: '✕',  title: 'NOT APPROVED'     },
    OFFLINE:    { bg: 'bg-blue-500',   textColor: 'text-white',      icon: '⏳', title: 'SAVED OFFLINE'    },
    ERROR:      { bg: 'bg-gray-700',   textColor: 'text-white',      icon: '!',  title: 'ERROR'            },
  };

  const historyStyle: Record<ResultCode, { card: string; badge: string; badgeText: string }> = {
    ADMITTED:   { card: 'bg-green-50 border-green-200',   badge: 'bg-green-100 text-green-700',   badgeText: 'Admitted'      },
    DUPLICATE:  { card: 'bg-amber-50 border-amber-200',   badge: 'bg-amber-100 text-amber-800',   badgeText: 'Duplicate'     },
    INVALID:    { card: 'bg-red-50 border-red-200',       badge: 'bg-red-100 text-red-700',       badgeText: 'Invalid'       },
    NOT_BOOKED: { card: 'bg-red-50 border-red-200',       badge: 'bg-red-100 text-red-700',       badgeText: 'Not Approved'  },
    OFFLINE:    { card: 'bg-blue-50 border-blue-200',     badge: 'bg-blue-100 text-blue-700',     badgeText: 'Offline'       },
    ERROR:      { card: 'bg-gray-50 border-gray-200',     badge: 'bg-gray-100 text-gray-700',     badgeText: 'Error'         },
  };

  const todayAdmitted = $derived(
    scanHistory.filter(s => s.code === 'ADMITTED' && new Date(s.timestamp).toDateString() === new Date().toDateString()).length
  );
</script>

<svelte:head>
  <title>Front Desk Scanner | Rhapsody</title>
</svelte:head>

<!-- Full-screen result overlay -->
{#if lastResult}
  {@const cfg = overlayConfig[lastResult.code]}
  <div
    class="fixed inset-0 z-50 flex flex-col items-center justify-center {cfg.bg} {cfg.textColor} animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
    onclick={() => { lastResult = null; }}
    role="status"
    aria-live="assertive"
  >
    <!-- Giant icon -->
    <div class="text-[100px] leading-none font-black mb-4 drop-shadow-lg select-none">{cfg.icon}</div>

    <p class="text-2xl font-black tracking-widest uppercase mb-3">{cfg.title}</p>

    {#if lastResult.name}
      <p class="text-4xl font-extrabold mb-1 drop-shadow">{lastResult.name}</p>
    {/if}

    {#if lastResult.category}
      <p class="text-lg font-bold opacity-80 mb-2">{lastResult.category} Pass</p>
    {/if}

    {#if lastResult.code === 'DUPLICATE' && lastResult.checkedInAt}
      <div class="mt-3 px-6 py-2 rounded-full bg-black/20 text-lg font-bold">
        ⏱ Checked-in at {lastResult.checkedInAt}
      </div>
    {/if}

    {#if lastResult.code !== 'ADMITTED' && lastResult.code !== 'DUPLICATE'}
      <p class="mt-4 text-sm opacity-70 max-w-xs text-center">{lastResult.message}</p>
    {/if}

    <p class="absolute bottom-6 text-xs opacity-50">Tap anywhere to dismiss</p>
  </div>
{/if}

<div class="min-h-[calc(100vh-80px)] bg-gray-950 flex flex-col lg:flex-row">

  <!-- ── LEFT: Scanner Panel ───────────────────────────────────────────── -->
  <div class="lg:w-[420px] flex-shrink-0 bg-gray-900 flex flex-col items-center p-6 border-r border-gray-800">

    <!-- Header -->
    <div class="w-full mb-6">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-brand-purple flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p class="text-white font-extrabold text-lg leading-tight">Entry Gate</p>
            <p class="text-gray-400 text-xs">{data.profile?.full_name ?? 'Front Desk'}</p>
          </div>
        </div>

        <!-- Online status pill -->
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold {isOnline ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}">
          <div class="w-1.5 h-1.5 rounded-full {isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}"></div>
          {isOnline ? 'Live' : 'Offline'}
        </div>
      </div>

      {#if syncInProgress}
        <p class="text-xs text-brand-gold font-bold mt-2 animate-pulse text-center">⏳ Syncing offline scans…</p>
      {/if}
    </div>

    <!-- Today's counter -->
    <div class="w-full flex gap-3 mb-6">
      <div class="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
        <p class="text-3xl font-black text-green-400">{todayAdmitted}</p>
        <p class="text-xs text-gray-400 font-medium mt-0.5">Admitted Today</p>
      </div>
      <div class="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
        <p class="text-3xl font-black text-amber-400">{scanHistory.filter(s => s.code === 'DUPLICATE').length}</p>
        <p class="text-xs text-gray-400 font-medium mt-0.5">Duplicates Caught</p>
      </div>
    </div>

    <!-- Scanner viewport -->
    <div class="w-full max-w-sm relative">
      {#if isProcessing}
        <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
          <div class="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-3 text-sm font-bold text-brand-gold">Verifying…</p>
        </div>
      {/if}

      <!-- Corner frame decorations -->
      <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-gold rounded-tl-lg z-10 pointer-events-none"></div>
      <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-gold rounded-tr-lg z-10 pointer-events-none"></div>
      <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-gold rounded-bl-lg z-10 pointer-events-none"></div>
      <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-gold rounded-br-lg z-10 pointer-events-none"></div>

      <div id="reader" class="rounded-2xl overflow-hidden bg-black shadow-2xl ring-2 ring-brand-purple/40"></div>
    </div>

    <p class="mt-4 text-xs text-gray-500 text-center">Point camera at attendee's ticket QR code</p>
  </div>

  <!-- ── RIGHT: History Panel ──────────────────────────────────────────── -->
  <div class="flex-1 flex flex-col overflow-hidden bg-gray-950">

    <!-- History header -->
    <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
      <h2 class="text-white font-extrabold text-lg">Scan Log</h2>
      <div class="flex items-center gap-3">
        {#if scanHistory.some(s => s.code === 'OFFLINE')}
          <button
            onclick={syncOfflineQueue}
            disabled={syncInProgress || !isOnline}
            class="text-xs font-bold text-brand-gold hover:text-brand-gold-light disabled:opacity-40 transition-colors"
          >
            Sync Offline ({scanHistory.filter(s => s.code === 'OFFLINE').length})
          </button>
        {/if}
        <span class="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-md font-medium">{scanHistory.length} total</span>
      </div>
    </div>

    <!-- Log entries -->
    <div class="flex-1 overflow-y-auto px-6 py-4">
      {#if scanHistory.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-center py-20">
          <div class="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <p class="text-gray-500 font-medium">No tickets scanned yet.</p>
          <p class="text-gray-600 text-sm mt-1">Scans will appear here in real time.</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each scanHistory as s (s.timestamp)}
            {@const style = historyStyle[s.code]}
            <div class="flex items-center gap-3 p-3 rounded-xl border {style.card} transition-all">
              <!-- Status badge -->
              <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 {style.badge}">
                {style.badgeText}
              </span>

              <!-- Name + detail -->
              <div class="flex-1 min-w-0">
                {#if s.name}
                  <p class="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                {:else}
                  <p class="text-xs font-mono text-gray-500 truncate">{s.qrData}</p>
                {/if}
                {#if s.code === 'DUPLICATE' && s.checkedInAt}
                  <p class="text-xs text-amber-700 font-semibold">Checked-in at {s.checkedInAt}</p>
                {:else if s.category}
                  <p class="text-xs text-gray-500">{s.category} Pass</p>
                {:else if s.message && s.code !== 'ADMITTED'}
                  <p class="text-xs text-gray-500 truncate">{s.message}</p>
                {/if}
              </div>

              <!-- Time -->
              <p class="text-[10px] text-gray-400 shrink-0">{new Date(s.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
