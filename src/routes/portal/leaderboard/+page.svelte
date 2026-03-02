<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Leaderboard | Organiser Portal</title>
</svelte:head>

<div class="py-12 px-4 sm:px-6 lg:px-8 relative min-h-[calc(100vh-80px)] bg-brand-purple">
  <div class="max-w-7xl mx-auto pt-4 relative z-10">
    <div class="mb-12 text-center">
      <div class="inline-block bg-brand-gold/20 border border-brand-gold/30 text-brand-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 shadow-inner">
        Performance Tracking
      </div>
      <h1 class="text-3xl font-extrabold text-brand-white sm:text-4xl tracking-tight">Organiser Leaderboard</h1>
      <p class="mt-4 text-brand-white/60 font-light text-lg max-w-2xl mx-auto">
        Track your progress and see how you rank against other organisers in our mission to support cancer care.
      </p>
    </div>

    <div class="max-w-5xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div class="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
        <div class="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-brand-gold/10 to-transparent flex items-center gap-3">
          <div class="p-2 bg-brand-gold/20 rounded-lg text-brand-gold">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          </div>
          <h3 class="text-xl font-bold text-brand-white">Top Performers</h3>
        </div>
        
        <div class="p-8">
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each data.leaderboard as ranks, index}
              <div class="relative bg-brand-purple-dark/40 rounded-2xl border border-white/5 p-6 hover:bg-brand-purple-dark/60 transition-all group overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 rotate-45 {index === 0 ? 'bg-yellow-400/10' : index === 1 ? 'bg-gray-300/10' : index === 2 ? 'bg-amber-600/10' : 'bg-white/5'}"></div>
                
                <div class="flex items-center gap-4 relative z-10 mb-6">
                    <div class="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-xl ring-2 {index === 0 ? 'bg-yellow-400 text-brand-purple ring-yellow-300' : index === 1 ? 'bg-gray-300 text-brand-purple ring-gray-200' : index === 2 ? 'bg-amber-600 text-brand-white ring-amber-500' : 'bg-brand-purple text-brand-white ring-white/10'}">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 class="font-bold text-brand-white text-lg group-hover:text-brand-gold transition-colors">{ranks.full_name}</h4>
                      <p class="text-[10px] font-black text-brand-gold uppercase tracking-widest opacity-80">{ranks.role}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-white/5">
                  <div>
                    <p class="text-[10px] text-brand-white/40 font-bold uppercase tracking-wider mb-1">Total Sales</p>
                    <p class="text-2xl font-black text-brand-white">{ranks.confirmed_tickets} <span class="text-xs font-medium text-brand-gold/60">/ {ranks.target_qty} goal</span></p>
                  </div>
                </div>
                <!-- Per-category targets -->
                {#if data.categoryTotals.length > 0}
                  <div class="mt-4 space-y-2 relative z-10">
                    {#each data.categoryTotals as cat}
                      {@const detail = data.salesBreakdown.find(s => s.organiser_id === ranks.user_id && s.category_id === cat.category_id)}
                      {@const sold = detail?.tickets_sold || 0}
                      {@const catTarget = detail?.organiser_category_target || 0}
                      {#if catTarget > 0}
                        <div>
                          <div class="flex justify-between text-[10px] font-bold text-brand-white/50 mb-0.5">
                            <span>{cat.category_name}</span>
                            <span class="{sold >= catTarget ? 'text-green-400' : 'text-brand-gold'}">{sold} / {catTarget}</span>
                          </div>
                          <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              class="h-full {sold >= catTarget ? 'bg-green-400' : index === 0 ? 'bg-yellow-400' : 'bg-brand-gold'} rounded-full transition-all"
                              style="width: {Math.min(100, catTarget > 0 ? Math.round((sold / catTarget) * 100) : 0)}%"
                            ></div>
                          </div>
                        </div>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
          
          {#if !data.leaderboard || data.leaderboard.length === 0}
            <div class="text-center py-20 bg-brand-purple-dark/30 rounded-2xl border border-dashed border-white/10">
              <p class="text-brand-white/50 font-medium">The race hasn't started yet! Sales will appear here once confirmed.</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
