<script lang="ts">
  import { page } from '$app/stores';
  import TicketForm from '$lib/components/TicketForm.svelte';
  
  let { data } = $props();
  
  // Extract ref from URL params exactly as requested for the Public entry point
  let referrerId = $derived($page.url.searchParams.get('ref') || ''); 
  
  // Check if they are already logged in as Staff/Organiser locally
  let isStaff = $derived(['Organiser', 'Admin'].includes($page.data.profile?.role));
</script>

<svelte:head>
  <title>Buy Tickets | Rhapsody</title>
</svelte:head>

<div class="min-h-[calc(100vh-80px)] bg-brand-purple py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
  <!-- Dynamic Background Ambient Effects -->
  <div class="absolute top-0 right-0 w-96 h-96 bg-brand-purple-light rounded-full blur-[100px] opacity-20 transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-80 h-80 bg-brand-gold rounded-full blur-[100px] opacity-10 transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

  <div class="max-w-7xl mx-auto pt-4 relative z-10">
    <div class="text-center mb-10">
      {#if referrerId}
        <div class="inline-block bg-brand-purple-light/20 border border-brand-purple-light/40 text-brand-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
          <span class="text-brand-gold mr-2 text-sm">✦</span>
          You were invited by <span class="text-brand-gold">{data.referrerName ?? 'a Rhapsody Organiser'}</span>
        </div>
      {/if}
      <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-light sm:text-4xl lg:text-5xl tracking-tight mb-4">
        Secure Your Spot
      </h1>
      <p class="mt-3 text-brand-white/70 max-w-xl mx-auto text-lg font-light leading-relaxed">
        Join our annual fundraiser to support cancer patients. Complete the 3-step checkout below to secure your tickets for a noble cause.
      </p>
    </div>

    <TicketForm referrerId={referrerId} isOrganiser={isStaff} categories={data.categories} />
  </div>
</div>
