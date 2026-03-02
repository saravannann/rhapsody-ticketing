<script lang="ts">
  // Fundraiser Event Details Page
</script>

<svelte:head>
  <title>Fundraiser Details | Rhapsody</title>
</svelte:head>

<div class="min-h-[calc(100vh-80px)] bg-brand-white py-16 px-4 sm:px-6 lg:px-8 relative">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-16">
      <div class="inline-flex items-center gap-2 bg-brand-purple/10 px-4 py-1.5 rounded-full text-brand-purple text-sm font-bold uppercase tracking-widest mb-4">
        <svg class="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>
        Our Cause
      </div>
      <h1 class="text-4xl md:text-5xl font-extrabold text-brand-purple tracking-tight mb-6">
        Rhapsody Fundraiser 2026
      </h1>
      <p class="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
        Join us for a beautiful evening dedicated to art, music, and profound community impact.
      </p>
    </div>

    <!-- Details Card -->
    <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      <div class="h-48 md:h-64 bg-gradient-to-br from-brand-purple to-brand-purple-dark relative flex items-center justify-center">
         <div class="absolute inset-0 bg-brand-gold opacity-10 mix-blend-overlay"></div>
         <!-- Decorative Pattern -->
         <svg class="absolute inset-0 w-full h-full text-white opacity-5" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
             <polygon points="0,100 0,0 100,0" />
         </svg>
         <h2 class="relative z-10 text-3xl font-bold text-brand-white text-center px-6 leading-tight max-w-lg">
           "Music is the strongest form of magic."
         </h2>
      </div>
      
      <div class="p-8 md:p-12">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div>
            <h3 class="text-2xl font-bold text-brand-purple mb-4 flex items-center gap-2">
              <svg class="w-6 h-6 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              The Mission
            </h3>
            <p class="text-gray-600 leading-relaxed mb-6">
              Organized entirely by volunteers, Rhapsody is an annual initiative where 100% of proceeds are donated to the comprehensive care and holistic treatment of underprivileged cancer patients. 
            </p>
            <p class="text-gray-600 leading-relaxed">
              We bring together incredible local artists and musicians, creating an environment that celebrates life, fosters connection, and directly funds lifesaving medical grants for those who need it most.
            </p>
          </div>

          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 class="text-xl font-bold text-brand-purple mb-6 border-b border-gray-200 pb-4">Event Details</h3>
            
            <ul class="space-y-6">
              <li class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <p class="font-bold text-gray-900">Date & Time</p>
                  <p class="text-gray-600 text-sm mt-1">Saturday, December 12th, 2026<br/>6:00 PM Onwards</p>
                </div>
              </li>
              
              <li class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0 text-brand-gold">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <div>
                  <p class="font-bold text-gray-900">Venue</p>
                  <p class="text-gray-600 text-sm mt-1">The Grand Auditorium<br/>City Central Cultural Hub</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div class="mt-12 text-center pt-8 border-t border-gray-100">
           <a href="/buy" class="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-full bg-brand-purple hover:bg-brand-purple-light text-white transition-colors shadow-lg">
             Support the Cause & Book Tickets
           </a>
        </div>
      </div>
    </div>
  </div>
</div>
