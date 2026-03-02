<script lang="ts">
  import { browser } from '$app/environment';

  let { userId, userName = 'Organiser' } = $props<{ userId: string; userName?: string }>();

  // Build the referral URL
  const baseUrl = $derived(
    browser ? `${window.location.origin}/buy?ref=${userId}` : `/buy?ref=${userId}`
  );

  const shareText = $derived(
    `🎶 Support a great cause! Get your Rhapsody event tickets here 🎟\n\n${baseUrl}\n\nEvery ticket helps cancer patients. Secure your spot now!`
  );

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  async function copyLink() {
    if (!browser) return;
    try {
      await navigator.clipboard.writeText(baseUrl);
      copied = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copied = false; }, 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = baseUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copied = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copied = false; }, 2500);
    }
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  }

  function shareSMS() {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_blank');
  }

  async function shareNative() {
    if (!browser || !navigator.share) return;
    try {
      await navigator.share({
        title: 'Rhapsody — Buy Tickets',
        text: '🎶 Get your Rhapsody event tickets and support cancer care!',
        url: baseUrl
      });
    } catch (e) {
      // User cancelled or not supported
    }
  }

  const canNativeShare = $derived(browser && !!navigator.share);
</script>

<div class="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 space-y-4">
  <!-- Header -->
  <div class="flex items-center gap-2">
    <div class="h-8 w-8 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold flex-shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    </div>
    <div>
      <p class="text-sm font-extrabold text-brand-white">Share Your Link</p>
      <p class="text-[10px] text-brand-white/50 font-medium">Every ticket sold through this link counts as your credit</p>
    </div>
  </div>

  <!-- URL pill + copy -->
  <div class="flex items-center gap-2">
    <div class="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 min-w-0">
      <p class="text-xs font-mono text-brand-gold/90 truncate">{baseUrl}</p>
    </div>
    <button
      onclick={copyLink}
      title="Copy link"
      class="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200
        {copied ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-brand-gold hover:text-brand-purple text-brand-white'}"
    >
      {#if copied}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      {/if}
    </button>
  </div>

  {#if copied}
    <p class="text-[10px] text-green-400 font-bold text-center animate-in fade-in duration-200">✓ Copied to clipboard!</p>
  {/if}

  <!-- Share buttons -->
  <div class="grid grid-cols-3 gap-2">
    <!-- WhatsApp -->
    <button
      onclick={shareWhatsApp}
      class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/30 border border-[#25D366]/30 transition-all group"
    >
      <svg class="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.555 4.109 1.523 5.836L.057 23.625a.75.75 0 00.918.918l5.789-1.466A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.5-5.243-1.375l-.374-.217-3.438.871.887-3.438-.221-.378A9.944 9.944 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
      <span class="text-[10px] font-bold text-[#25D366]">WhatsApp</span>
    </button>

    <!-- SMS -->
    <button
      onclick={shareSMS}
      class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/30 transition-all group"
    >
      <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      <span class="text-[10px] font-bold text-blue-400">SMS</span>
    </button>

    <!-- Native Share / More -->
    {#if canNativeShare}
      <button
        onclick={shareNative}
        class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/30 border border-brand-gold/30 transition-all group"
      >
        <svg class="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        <span class="text-[10px] font-bold text-brand-gold">More</span>
      </button>
    {:else}
      <!-- Email fallback when native share not available -->
      <a
        href="mailto:?subject={encodeURIComponent('Get your Rhapsody tickets!')}&body={encodeURIComponent(shareText)}"
        target="_blank"
        class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/30 border border-brand-gold/30 transition-all group no-underline"
      >
        <svg class="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span class="text-[10px] font-bold text-brand-gold">Email</span>
      </a>
    {/if}
  </div>
</div>
