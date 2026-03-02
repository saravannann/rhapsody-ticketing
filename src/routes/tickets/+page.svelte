<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>My Tickets | Rhapsody</title>
</svelte:head>

<div class="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
  <div class="max-w-4xl mx-auto pt-8">
    
    <div class="flex items-center justify-between mb-10 pb-6 border-b border-gray-200">
      <div>
        <h1 class="text-3xl font-extrabold text-brand-purple tracking-tight">Your Digital Tickets</h1>
        <p class="mt-2 text-gray-500 max-w-xl">
          View your confirmed bookings and generate the entry QR code for the event. Thank you for your support.
        </p>
      </div>
      
      <div class="hidden sm:block">
        <div class="w-16 h-16 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
        </div>
      </div>
    </div>

    {#if data.tickets && data.tickets.length > 0}
      <div class="grid gap-6">
        {#each data.tickets as ticket}
          <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row transition-transform hover:-translate-y-1">
            <!-- Ticket Left Decorative Brand Strip -->
            <div class="w-full md:w-32 bg-brand-purple flex md:flex-col items-center justify-center p-4 relative overflow-hidden shrink-0">
               <div class="absolute inset-0 bg-brand-gold opacity-10 mix-blend-overlay rotate-12 -translate-y-8"></div>
               <div class="relative z-10 font-black text-brand-gold text-2xl rotate-0 md:-rotate-90 whitespace-nowrap tracking-widest leading-none">RHAPSODY</div>
            </div>

            <!-- Main Content Area -->
            <div class="flex-grow p-8 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-black uppercase tracking-widest text-brand-gold/80">{ticket.category} PASS</span>
                  <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest {ticket.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                    {ticket.status}
                  </span>
                </div>
                <h3 class="text-2xl font-black text-brand-purple mb-4">Rhapsody Fundraiser 2026</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-gray-400 uppercase font-black text-[10px] mb-1">Supporter</p>
                    <p class="font-bold text-gray-900">{ticket.supporter_name}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 uppercase font-black text-[10px] mb-1">Ticket ID</p>
                    <p class="font-mono text-gray-600">RH-{ticket.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <!-- Ticket Info Footer -->
              <div class="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span class="text-xs font-medium">Dec 12, 2026 • 6:00 PM</span>
                </div>
              </div>
            </div>

            <!-- Action Area / QR Code Mockup -->
            <div class="w-full md:w-56 bg-gray-50 p-8 border-t md:border-t-0 md:border-l border-dashed border-gray-200 flex flex-col items-center justify-center shrink-0">
               {#if ticket.status === 'Confirmed'}
                 <div class="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 mb-4 transition-transform hover:scale-105 cursor-pointer">
                    <!-- QR Mock SVG -->
                    <svg viewBox="0 0 100 100" class="w-24 h-24">
                       <rect width="100" height="100" fill="#ffffff" rx="4"/>
                       <path d="M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z M40,10 h20 v5 h-20 z M40,25 h15 v5 h-15 z M40,40 h5 v20 h-5 z M50,40 h10 v5 h-10 z M65,40 h25 v5 h-25 z M10,40 h20 v5 h-20 z M10,55 h10 v5 h-10 z M25,55 h5 v35 h-5 z M40,70 h20 v5 h-20 z M40,85 h10 v5 h-10 z M70,70 h10 v20 h-10 z M85,70 h5 v20 h-5 z" fill="#3d1c47"/>
                    </svg>
                 </div>
                 <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Scan at Entrance</p>
               {:else}
                 <div class="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 mb-4 animate-pulse">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 </div>
                 <p class="text-[10px] font-black text-yellow-600 uppercase tracking-widest text-center">Pending Approval</p>
               {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- Empty State -->
      <div class="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden text-center py-20 px-6">
         <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-purple/5 text-brand-purple mb-6">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
         </div>
         <h3 class="text-xl font-bold text-gray-900 mb-2">No tickets found</h3>
         <p class="text-gray-500 mb-8 max-w-sm mx-auto">
           It seems you haven't booked any tickets yet, or you need to sign in to view your history.
         </p>
         
         <div class="flex flex-col sm:flex-row gap-4 justify-center">
           <a href="/buy" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-full text-brand-purple bg-brand-gold hover:bg-brand-gold-light transition-colors shadow-md">
             Book Now
           </a>
         </div>
      </div>
    {/if}

  </div>
</div>
