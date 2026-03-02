<script lang="ts">
  let { data } = $props();
  // Check if they are already logged in as Staff/Organiser locally
  let isStaff = $derived(['Organiser', 'Admin'].includes(data.profile?.role));
</script>

<svelte:head>
  <title>Rhapsody Ticketing</title>
</svelte:head>

<div class="relative overflow-hidden bg-brand-purple">
  <!-- Decorative background elements -->
  <div class="absolute -top-32 -left-40 w-96 h-96 rounded-full bg-brand-purple-light opacity-20 blur-3xl"></div>
  <div class="absolute top-20 right-0 w-80 h-80 rounded-full bg-brand-gold opacity-10 blur-3xl"></div>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 relative z-10 flex flex-col md:flex-row items-center">
    <div class="w-full md:w-1/2 md:pr-12 text-center md:text-left">
      {#if data.profile?.full_name}
        <div class="inline-flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/20 px-4 py-1.5 rounded-full text-brand-gold text-sm font-bold uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-top-4">
          <span class="animate-pulse">✦</span> Welcome Back, {data.profile.full_name}
        </div>
      {/if}
      <h1 class="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl mb-6">
        <span class="block text-brand-white drop-shadow-md">Harmonizing Hope</span>
        <span class="block text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-light mt-2">
          Through Music & Art
        </span>
      </h1>
      <p class="mt-3 text-base text-brand-white/80 sm:mt-5 sm:text-lg sm:max-w-xl md:mt-5 md:text-xl font-light">
        Join our annual cultural, musical, and artistic fundraiser dedicated to supporting underprivileged cancer patients.
      </p>
      <div class="mt-8">
        <p class="text-sm text-brand-white/60">Organized entirely by volunteers. 100% of proceeds are donated to the comprehensive care and holistic treatment of underprivileged cancer patients.</p>
      </div>
    </div>
    
    <div class="w-full md:w-1/2 mt-16 md:mt-0 relative group">
      <!-- "Glassmorphism" effect for card -->
      <div class="absolute inset-0 bg-gradient-to-tr from-brand-gold/30 to-brand-purple-light/30 rounded-3xl transform rotate-3 scale-105 blur-lg transition-transform duration-500"></div>
      
      <div class="relative bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl relative">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-brand-gold opacity-10 rounded-full blur-xl pointer-events-none"></div>

         <h3 class="text-2xl font-bold text-brand-gold mb-6 border-b border-brand-white/20 pb-4">Fundraiser Details</h3>
            
         <ul class="space-y-6">
           <li class="flex items-start gap-4">
             <div class="w-12 h-12 rounded-full bg-brand-white/10 flex items-center justify-center flex-shrink-0 text-brand-white">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
             </div>
             <div>
               <p class="font-bold text-brand-white text-lg">Date & Time</p>
               <p class="text-brand-white/70 mt-1 font-light">Saturday, December 12th, 2026<br/>6:00 PM Onwards</p>
             </div>
           </li>
              
           <li class="flex items-start gap-4">
             <div class="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0 text-brand-gold">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             </div>
             <div>
               <p class="font-bold text-brand-white text-lg">Venue</p>
               <p class="text-brand-white/70 mt-1 font-light">The Grand Auditorium<br/>City Central Cultural Hub</p>
             </div>
           </li>
         </ul>
         <div class="mt-8 pt-6 border-t border-brand-white/20">
           <a href="/buy" class="w-full block text-center bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-purple hover:from-white hover:to-brand-gold-light px-5 py-4 rounded-full font-bold text-lg transition-transform transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
             Support & Book Tickets
           </a>
         </div>
      </div>
    </div>
  </div>
</div>

