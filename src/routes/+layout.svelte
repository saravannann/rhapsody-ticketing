<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import '../app.css';
  let { children, data } = $props();
  
  let menuOpen = $state(false);

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  afterNavigate(() => {
    menuOpen = false;
  });
</script>

<div class="flex flex-col min-h-screen">
  {#if data.session && data.profile?.full_name}
    <div class="bg-brand-purple-dark text-brand-white/80 py-2 border-b border-brand-white/5 relative z-[60]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end items-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
        <span class="text-brand-gold mr-2 animate-pulse">✦</span>
        Logged in as <span class="text-brand-gold ml-1">{data.profile.full_name}</span>
        {#if data.profile?.role === 'FrontDesk'}
          <span class="ml-2 px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold text-[9px] font-black uppercase tracking-widest">Front Desk</span>
        {/if}
      </div>
    </div>
  {/if}

  <nav class="bg-brand-purple text-brand-white shadow-xl sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <div class="flex items-center">
          <!-- FrontDesk logo links directly to scanner; everyone else goes home -->
          <a href={data.profile?.role === 'FrontDesk' ? '/scan' : '/'} class="flex-shrink-0 font-bold text-2xl tracking-widest text-brand-gold transition-transform hover:scale-105">
            RHAPSODY
          </a>
        </div>

        <!-- Desktop nav -->
        <div class="hidden md:block">
          <div class="ml-10 flex items-baseline space-x-8">
            {#if data.session}
              <div class="flex items-center gap-4">

                {#if data.profile?.role === 'FrontDesk'}
                  <!-- FrontDesk: only Scanner App -->
                  <a href="/scan" class="flex items-center gap-1.5 text-brand-gold hover:text-white text-sm font-bold transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Scanner App
                  </a>

                {:else}
                  <!-- All other roles: Home + role-specific links -->
                  <a href="/" class="hover:text-brand-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</a>
                  <a href="/tickets" class="text-brand-gold hover:text-white text-sm font-bold transition-colors">My Tickets</a>

                  {#if data.profile?.role === 'Admin'}
                    <a href="/admin/dashboard" class="text-brand-gold hover:text-white text-sm font-bold transition-colors">Admin Dashboard</a>
                    <a href="/buy" class="text-brand-gold hover:text-white text-sm font-bold transition-colors">Buy Tickets</a>
                  {:else if data.profile?.role === 'Organiser'}
                    <a href="/portal/book" class="text-brand-gold hover:text-white text-sm font-bold transition-colors">Buy Tickets</a>
                    <a href="/portal/leaderboard" class="text-brand-gold hover:text-white text-sm font-bold transition-colors">Leaderboard</a>
                  {/if}
                {/if}

                <form action="/login?/logout" method="POST">
                  <button type="submit" class="text-brand-white/80 hover:text-red-400 text-sm font-medium transition-colors">
                    Logout
                  </button>
                </form>
              </div>
            {:else}
              <a href="/" class="hover:text-brand-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</a>
              <a href="/login" class="bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-purple hover:from-white hover:to-brand-gold-light px-6 py-2 rounded-full text-sm font-bold transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_20px_rgba(212,175,55,0.6)]">
                Sign In
              </a>
            {/if}
          </div>
        </div>

        <!-- Mobile hamburger -->
        <div class="-mr-2 flex md:hidden">
          <button onclick={toggleMenu} type="button" class="inline-flex items-center justify-center p-2 rounded-md text-brand-white hover:text-brand-gold hover:bg-brand-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-purple focus:ring-brand-gold transition-colors" aria-controls="mobile-menu" aria-expanded={menuOpen}>
            <span class="sr-only">Open main menu</span>
            {#if !menuOpen}
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            {:else}
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    {#if menuOpen}
      <div class="md:hidden bg-brand-purple-dark border-t border-brand-purple-light/20" id="mobile-menu">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {#if data.session}

            {#if data.profile?.role === 'FrontDesk'}
              <!-- FrontDesk: Scanner App only -->
              <a href="/scan" class="flex items-center gap-2 text-brand-gold hover:text-white px-3 py-3 text-base font-bold transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scanner App
              </a>

            {:else}
              <a href="/" class="hover:text-brand-gold block px-3 py-2 rounded-md text-base font-medium transition-colors">Home</a>
              <a href="/tickets" class="block text-brand-gold hover:text-white px-3 py-2 text-base font-bold transition-colors">My Tickets</a>

              {#if data.profile?.role === 'Admin'}
                <a href="/admin/dashboard" class="block text-brand-gold hover:text-white px-3 py-2 text-base font-bold transition-colors">Admin Dashboard</a>
                <a href="/buy" class="block text-brand-gold hover:text-white px-3 py-2 text-base font-bold transition-colors">Buy Tickets</a>
              {:else if data.profile?.role === 'Organiser'}
                <a href="/portal/book" class="block text-brand-gold hover:text-white px-3 py-2 text-base font-bold transition-colors">Buy Tickets</a>
                <a href="/portal/leaderboard" class="block text-brand-gold hover:text-white px-3 py-2 text-base font-bold transition-colors">Leaderboard</a>
              {/if}
            {/if}

            <form action="/login?/logout" method="POST" class="mt-4">
              <button type="submit" class="w-full text-center border border-red-500/50 hover:bg-red-500/20 text-red-400 px-3 py-3 rounded-md text-base font-bold transition-colors">
                Logout
              </button>
            </form>

          {:else}
            <a href="/" class="hover:text-brand-gold block px-3 py-2 rounded-md text-base font-medium transition-colors">Home</a>
            <a href="/login" class="block w-full text-center mt-4 bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-purple px-3 py-3 rounded-md text-base font-bold shadow-lg">
              Sign In
            </a>
          {/if}
        </div>
      </div>
    {/if}
  </nav>

  <main class="flex-grow">
    {@render children()}
  </main>
  
  <footer class="bg-brand-purple-dark text-brand-white/60 py-10 border-t border-brand-purple-light/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm font-light">
      <p>&copy; 2026 <span class="text-brand-gold">Rhapsody Ticketing</span>. All rights reserved.</p>
    </div>
  </footer>
</div>
