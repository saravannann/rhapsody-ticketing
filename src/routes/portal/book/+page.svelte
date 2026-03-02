<script lang="ts">
  import TicketForm from '$lib/components/TicketForm.svelte';
  import ShareLink from '$lib/components/ShareLink.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>Buy Tickets | Rhapsody</title>
</svelte:head>

<div class="py-12 px-4 sm:px-6 lg:px-8 relative min-h-[calc(100vh-80px)] bg-brand-purple text-brand-white">
  <div class="max-w-7xl mx-auto pt-4 relative z-10">
    <div class="mb-12 text-center">
      <div class="inline-block bg-brand-gold/20 border border-brand-gold/30 text-brand-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 shadow-inner">
        Organiser Tools
      </div>
      <h1 class="text-3xl font-extrabold text-brand-white sm:text-4xl tracking-tight">Rapid Checkout Portal</h1>
      <p class="mt-4 text-brand-white/60 font-light text-lg max-w-2xl mx-auto">
        Issue tickets and submit receipts on behalf of supporters. Your entries will be automatically tracked in your performance logs.
      </p>
    </div>

    <!-- Share link widget -->
    {#if data.currentUser}
      <div class="max-w-xl mx-auto mb-8">
        <ShareLink userId={data.currentUser.id} userName={data.currentUser.full_name} />
      </div>
    {/if}

    <div class="mb-16">
      <TicketForm isOrganiser={true} categories={data.categories} />
    </div>
  </div>
</div>
