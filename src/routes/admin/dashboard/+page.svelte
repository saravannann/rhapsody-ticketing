<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  
  let { data, form } = $props();

  let activeTab = $state('queue');
  let isProcessingInfo = $state<{ id: string | null; error: string }>({ id: null, error: '' });

  // Manage Staff state
  type StaffUser = { id: string; full_name: string; role: string; user_category_targets: { category_id: string; target_qty: number }[] };
  let editingUser = $state<StaffUser | null>(null); // null = "Add New" mode

  function startEdit(user: StaffUser) {
    editingUser = user;
  }

  function startAdd() {
    editingUser = null;
  }

  function getCatTarget(user: StaffUser, categoryId: string): number {
    return user.user_category_targets?.find(t => t.category_id === categoryId)?.target_qty ?? 0;
  }

  async function approveTicket(id: string) {
    if (isProcessingInfo.id) return;
    
    isProcessingInfo = { id, error: '' };
    
    try {
      const res = await fetch(`/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: id, status: 'Booked' })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Approval failed');
      }
      
      await invalidateAll();
    } catch (err: any) {
      isProcessingInfo.error = err.message;
    } finally {
      isProcessingInfo = { id: null, error: '' };
    }
  }

  let organisers = $derived(Array.from(new Set(data.salesBreakdown.map(s => s.organiser_name))));
</script>

<svelte:head>
  <title>Admin Dashboard | Rhapsody</title>
</svelte:head>

<div class="min-h-[calc(100vh-80px)] bg-brand-white">
  <!-- Admin Header Section -->
  <div class="bg-brand-purple text-brand-white py-10 px-4 sm:px-6 lg:px-8 border-b-4 border-brand-gold">
    <div class="max-w-7xl mx-auto">
      <!-- Left: title -->
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="bg-brand-gold text-brand-purple px-2 py-1 rounded-md text-xs font-bold uppercase tracking-widest shadow-sm">
            Admin Portal
          </div>
          <span class="text-brand-purple-light bg-brand-white/10 px-3 py-1 rounded-full text-sm">
            {data.userProfile?.full_name || 'Administrator'}
          </span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight">Command Center</h1>

        <!-- Tab buttons -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            onclick={() => activeTab = 'queue'}
            class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap {activeTab === 'queue' ? 'bg-brand-gold text-brand-purple' : 'bg-brand-purple-dark text-brand-white/80 hover:bg-brand-purple-light'}"
          >
            Verification
            {#if data.pendingTickets?.length > 0}
              <span class="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{data.pendingTickets.length}</span>
            {/if}
          </button>
          <button
            onclick={() => activeTab = 'sales'}
            class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap {activeTab === 'sales' ? 'bg-brand-gold text-brand-purple' : 'bg-brand-purple-dark text-brand-white/80 hover:bg-brand-purple-light'}"
          >
            Sales Insight
          </button>
          <button
            onclick={() => activeTab = 'leaderboard'}
            class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap {activeTab === 'leaderboard' ? 'bg-brand-gold text-brand-purple' : 'bg-brand-purple-dark text-brand-white/80 hover:bg-brand-purple-light'}"
          >
            Leaderboard
          </button>
          <button
            onclick={() => activeTab = 'targets'}
            class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap {activeTab === 'targets' ? 'bg-brand-gold text-brand-purple' : 'bg-brand-purple-dark text-brand-white/80 hover:bg-brand-purple-light'}"
          >
            Event Targets
          </button>
          <button
            onclick={() => activeTab = 'users'}
            class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap {activeTab === 'users' ? 'bg-brand-gold text-brand-purple' : 'bg-brand-purple-dark text-brand-white/80 hover:bg-brand-purple-light'}"
          >
            Manage Staff
          </button>
        </div>
      </div>
    </div>
  </div>


  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    {#if isProcessingInfo.error}
       <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 shadow-sm rounded-r-lg">
         <div class="flex">
           <div class="flex-shrink-0">
             <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
             </svg>
           </div>
           <div class="ml-3">
             <p class="text-sm text-red-700 font-medium">Approval Failed: {isProcessingInfo.error}</p>
           </div>
         </div>
       </div>
    {/if}

    <!-- VERIFICATION QUEUE TAB -->
    {#if activeTab === 'queue'}
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 class="text-lg leading-6 font-bold text-brand-purple">Pending Payments</h3>
          <span class="text-sm font-medium text-gray-500">{data.pendingTickets?.length || 0} awaiting verification</span>
        </div>
        
        {#if !data.pendingTickets || data.pendingTickets.length === 0}
          <div class="text-center py-16 px-4">
            <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-bold text-gray-900 mb-1">You're all caught up!</h3>
            <p class="text-gray-500">There are no pending tickets requiring verification right now.</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Supporter</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category & Amount</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Referred By</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt</th>
                  <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                {#each data.pendingTickets as ticket (ticket.id)}
                  <tr class="hover:bg-brand-white/50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-brand-purple">{ticket.supporter_name}</span>
                        <span class="text-sm text-gray-500">{ticket.supporter_phone}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-brand-purple">{ticket.category}</span>
                        <span class="text-sm font-semibold text-brand-gold">₹{ticket.amount}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {#if ticket.referred_by_user}
                        <div class="flex items-center">
                          <div class="h-8 w-8 rounded-full bg-brand-purple-light/20 flex items-center justify-center text-brand-purple font-bold text-xs ring-2 ring-white">
                            {ticket.referred_by_user.full_name.charAt(0)}
                          </div>
                          <span class="ml-3 text-sm font-medium text-gray-900">{ticket.referred_by_user.full_name}</span>
                        </div>
                      {:else}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          Direct Public
                        </span>
                      {/if}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {#if ticket.receipt_path}
                        <a 
                           href="{data.supabaseUrl}/storage/v1/object/public/rhapsody-media/{ticket.receipt_path}" 
                           target="_blank"
                           class="text-brand-purple hover:text-brand-gold font-medium flex items-center gap-1 transition-colors"
                        >
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View Receipt
                        </a>
                      {:else}
                        <span class="text-gray-400 italic text-xs">No upload</span>
                      {/if}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onclick={() => approveTicket(ticket.id)}
                        disabled={isProcessingInfo.id === ticket.id}
                        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                      >
                        {#if isProcessingInfo.id === ticket.id}
                          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Processing...
                        {:else}
                          Approve
                        {/if}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
      
    <!-- EVENT TARGETS TAB -->
    {:else if activeTab === 'targets'}
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 class="text-lg leading-6 font-bold text-brand-purple italic flex items-center gap-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Overall Sales Targets
          </h3>
          <p class="text-xs text-gray-500 font-medium">Define goal for each ticket category</p>
        </div>
        
        <div class="p-8 max-w-4xl mx-auto">
          {#if form?.success && activeTab === 'targets'}
             <div class="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg inline-flex w-full items-center">
                <svg class="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                <p class="text-sm text-green-700 font-bold">Category targets updated successfully across the system.</p>
             </div>
          {/if}

          <form method="POST" action="?/updateCategoryTargets" use:enhance class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              {#each data.categoryTotals as category}
                <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-brand-gold/30 transition-colors">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <h4 class="font-bold text-brand-purple text-lg">{category.category_name}</h4>
                      <p class="text-xs text-gray-500">Goal management for {category.category_name}</p>
                    </div>
                    <span class="text-sm font-black text-brand-gold">₹{category.price}</span>
                  </div>
                  
                  <div>
                    <label for="target_{category.category_id}" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Target Quantity</label>
                    <div class="relative">
                      <input 
                        type="number" 
                        name="target_{category.category_id}" 
                        id="target_{category.category_id}" 
                        value={category.target_qty} 
                        min="0" 
                        required 
                        class="block w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl shadow-inner focus:ring-brand-purple focus:border-brand-purple text-gray-900 font-bold text-lg"
                      >
                      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 font-medium text-xs">
                        TICKETS
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <div class="pt-6 border-t border-gray-100 flex justify-end">
              <button type="submit" class="px-8 py-3 rounded-full text-sm font-bold text-brand-white bg-brand-purple hover:bg-brand-purple-light transition-all transform hover:-translate-y-0.5 shadow-lg">
                Update All Targets
              </button>
            </div>
          </form>
        </div>
      </div>

    <!-- SALES INSIGHT TAB -->
    {:else if activeTab === 'sales'}
      <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- High Level Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {#each data.categoryTotals as cat}
            <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div class="flex justify-between items-start mb-4">
                <div class="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
                   <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4v-3a2 2 0 00-2-2H5z" /></svg>
                </div>
                <span class="text-xs font-black text-gray-400 uppercase tracking-widest">{cat.category_name}</span>
              </div>
              <div>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black text-brand-purple">{cat.total_sold}</span>
                  <span class="text-xs text-gray-500 font-bold">/ {cat.target_qty}</span>
                </div>
                <div class="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                  <div class="h-full bg-brand-gold rounded-full" style="width: {Math.min(100, Math.round((cat.total_sold / cat.target_qty) * 100))}%"></div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Detailed Breakdown -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 class="text-lg leading-6 font-bold text-brand-purple italic">Organiser & Category Sales Mix</h3>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirmed Sales Only</span>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organiser</th>
                  {#each data.categoryTotals as cat}
                    <th scope="col" class="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{cat.category_name}</th>
                  {/each}
                  <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Contribution</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <!-- Group salesBreakdown by Organiser -->
                {#each organisers as name}
                  {@const orgSales = data.salesBreakdown.filter(s => s.organiser_name === name)}
                  {@const totalRev = orgSales.reduce((acc, s) => acc + Number(s.total_revenue), 0)}
                  <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full {name.includes('Misc') ? 'bg-gray-200' : 'bg-brand-purple-light/20'} flex items-center justify-center text-brand-purple font-bold text-xs">
                          {name.charAt(0)}
                        </div>
                        <span class="ml-3 text-sm font-bold {name.includes('Misc') ? 'text-gray-500' : 'text-brand-purple'}">{name}</span>
                      </div>
                    </td>
                    {#each data.categoryTotals as cat}
                      {@const detail = orgSales.find(s => s.category_id === cat.category_id)}
                      <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span class="text-sm font-black {detail?.tickets_sold > 0 ? 'text-brand-gold' : 'text-gray-300'}">
                          {detail?.tickets_sold || 0}
                        </span>
                      </td>
                    {/each}
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-brand-purple">
                      ₹{totalRev.toLocaleString()}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    <!-- MANAGE STAFF TAB -->
    {:else if activeTab === 'users'}
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 class="text-lg leading-6 font-bold text-brand-purple">Manage Staff</h3>
          <span class="text-sm font-medium text-gray-500">{data.staffUsers.length} staff member{data.staffUsers.length !== 1 ? 's' : ''}</span>
        </div>

        {#if form?.success && !form?.actionError}
          <!-- SUCCESS STATE -->
          <div class="p-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div class="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6 ring-8 ring-green-50">
              <svg class="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 class="text-2xl font-extrabold text-gray-900 mb-2">
              {form.action === 'updated' ? 'Staff Updated!' : 'Account Created!'}
            </h4>
            <p class="text-gray-500 max-w-sm mb-8">
              {form.action === 'updated'
                ? 'The staff member details and targets have been saved successfully.'
                : 'The new staff member has been onboarded and can log in immediately.'}
            </p>
            <button
              onclick={() => window.location.reload()}
              class="px-8 py-3 rounded-full text-sm font-bold text-brand-white bg-brand-purple hover:bg-brand-purple-light transition-all transform hover:-translate-y-0.5 shadow-lg"
            >
              Back to Staff List
            </button>
          </div>

        {:else}
          <!-- TWO-PANEL LAYOUT -->
          <div class="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            <!-- LEFT: Staff List -->
            <div class="lg:col-span-2 p-4">
              <!-- Add New Button -->
              <button
                onclick={startAdd}
                class="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-xl border-2 border-dashed text-sm font-bold transition-all
                  {editingUser === null ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' : 'border-gray-200 text-gray-500 hover:border-brand-purple/40 hover:text-brand-purple'}"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Add New Staff Member
              </button>

              <!-- Staff List -->
              <div class="space-y-2">
                {#if data.staffUsers.length === 0}
                  <p class="text-sm text-gray-400 text-center py-6">No staff added yet.</p>
                {:else}
                  {#each data.staffUsers as user}
                    <button
                      onclick={() => startEdit(user)}
                      class="w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all
                        {editingUser?.id === user.id ? 'border-brand-purple bg-brand-purple/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}"
                    >
                      <div class="h-9 w-9 rounded-full bg-brand-purple-light/20 flex items-center justify-center text-brand-purple font-bold text-sm shrink-0">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                        <p class="text-xs font-medium text-gray-400">{user.role}</p>
                      </div>
                      {#if editingUser?.id === user.id}
                        <svg class="h-4 w-4 text-brand-purple shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" /></svg>
                      {/if}
                    </button>
                  {/each}
                {/if}
              </div>
            </div>

            <!-- RIGHT: Add / Edit Form -->
            <div class="lg:col-span-3 p-6">
              <!-- Panel Title -->
              <div class="flex items-center gap-2 mb-5">
                {#if editingUser}
                  <div class="h-8 w-8 rounded-full bg-brand-purple-light/20 flex items-center justify-center text-brand-purple font-bold text-sm">
                    {editingUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p class="text-sm font-extrabold text-gray-900">Editing: {editingUser.full_name}</p>
                    <p class="text-xs text-gray-400">Modify details and targets below</p>
                  </div>
                {:else}
                  <p class="text-sm font-extrabold text-gray-900">New Staff Member</p>
                {/if}
              </div>

              {#if form?.actionError}
                <div class="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-center gap-2">
                  <svg class="h-4 w-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>
                  <p class="text-sm text-red-700 font-bold">{form.actionError}</p>
                </div>
              {/if}

              {#if editingUser}
                <!-- EDIT FORM -->
                <form method="POST" action="?/updateUser" use:enhance class="space-y-5">
                  <input type="hidden" name="user_id" value={editingUser.id} />

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="edit_full_name" class="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                      <input type="text" name="full_name" id="edit_full_name" required
                        value={editingUser.full_name}
                        class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-purple focus:border-brand-purple bg-gray-50 focus:bg-white text-gray-900">
                    </div>
                    <div>
                      <label for="edit_role" class="block text-xs font-bold text-gray-600 mb-1">Role</label>
                      <select name="role" id="edit_role" required
                        class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-purple focus:border-brand-purple bg-gray-50 focus:bg-white text-gray-900">
                        <option value="Organiser" selected={editingUser.role === 'Organiser'}>Organiser (Portal Access)</option>
                        <option value="FrontDesk" selected={editingUser.role === 'FrontDesk'}>Front Desk (Scanner Access)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <p class="text-xs font-bold text-gray-600 mb-2">Sales Targets <span class="font-normal text-gray-400">(per category)</span></p>
                    <div class="grid grid-cols-2 gap-3">
                      {#each data.categoryTotals as cat}
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <label for="edit_target_{cat.category_id}" class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                            {cat.category_name} <span class="text-brand-gold">₹{cat.price}</span>
                          </label>
                          <input type="number" name="target_{cat.category_id}" id="edit_target_{cat.category_id}" min="0"
                            value={getCatTarget(editingUser, cat.category_id)}
                            class="block w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-brand-purple focus:border-brand-purple text-gray-900 font-bold">
                        </div>
                      {/each}
                    </div>
                  </div>

                  <div class="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit" class="px-6 py-2.5 rounded-full text-sm font-bold text-brand-white bg-brand-purple hover:bg-brand-purple-light transition-all transform hover:-translate-y-0.5 shadow-md">
                      Save Changes
                    </button>
                  </div>
                </form>

              {:else}
                <!-- CREATE FORM -->
                <form method="POST" action="?/createUser" use:enhance class="space-y-5">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="full_name" class="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                      <input type="text" name="full_name" id="full_name" required
                        class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-purple focus:border-brand-purple bg-gray-50 focus:bg-white text-gray-900" placeholder="Jane Doe">
                    </div>
                    <div>
                      <label for="phone" class="block text-xs font-bold text-gray-600 mb-1">Mobile Number</label>
                      <input type="tel" name="phone" id="phone" required
                        class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-purple focus:border-brand-purple bg-gray-50 focus:bg-white text-gray-900" placeholder="98765 43210">
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="role" class="block text-xs font-bold text-gray-600 mb-1">Role</label>
                      <select name="role" id="role" required class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-purple focus:border-brand-purple bg-gray-50 focus:bg-white text-gray-900">
                        <option value="Organiser">Organiser (Portal Access)</option>
                        <option value="FrontDesk">Front Desk (Scanner Access)</option>
                      </select>
                    </div>
                    <div>
                      <label for="password" class="block text-xs font-bold text-gray-600 mb-1">Temporary Password</label>
                      <input type="text" name="password" id="password" required
                        class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-purple focus:border-brand-purple bg-gray-50 focus:bg-white text-gray-900" placeholder="Temp password">
                    </div>
                  </div>

                  <div>
                    <p class="text-xs font-bold text-gray-600 mb-2">Sales Targets <span class="font-normal text-gray-400">(per category)</span></p>
                    <div class="grid grid-cols-2 gap-3">
                      {#each data.categoryTotals as cat}
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <label for="target_{cat.category_id}" class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                            {cat.category_name} <span class="text-brand-gold">₹{cat.price}</span>
                          </label>
                          <input type="number" name="target_{cat.category_id}" id="target_{cat.category_id}" min="0" value="0"
                            class="block w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-brand-purple focus:border-brand-purple text-gray-900 font-bold">
                        </div>
                      {/each}
                    </div>
                  </div>

                  <div class="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit" class="px-6 py-2.5 rounded-full text-sm font-bold text-brand-white bg-brand-purple hover:bg-brand-purple-light transition-all transform hover:-translate-y-0.5 shadow-md">
                      Create Account
                    </button>
                  </div>
                </form>
              {/if}
            </div>
          </div>
        {/if}
      </div>

    <!-- LEADERBOARD TAB -->
    {:else if activeTab === 'leaderboard'}
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-brand-purple to-brand-purple-dark flex justify-between items-center">
          <h3 class="text-lg leading-6 font-bold text-brand-gold flex items-center gap-2">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            Top Organisers
          </h3>
        </div>
        
        <div class="p-6">
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each data.leaderboard as ranks, index}
              <div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group overflow-hidden">
                <!-- Rank medal coloring -->
                <div class="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 rotate-45 {index === 0 ? 'bg-yellow-400/20' : index === 1 ? 'bg-gray-300/30' : index === 2 ? 'bg-amber-600/20' : 'bg-brand-purple-light/5'}"></div>
                
                <div class="flex items-center justify-between mb-4 relative z-10">
                  <div class="flex items-center gap-3">
                    <div class="h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ring-4 {index === 0 ? 'bg-yellow-100 text-yellow-700 ring-yellow-400' : index === 1 ? 'bg-gray-100 text-gray-700 ring-gray-300' : index === 2 ? 'bg-orange-50 text-orange-700 ring-amber-600/50' : 'bg-brand-white text-brand-purple ring-brand-white/50 border border-gray-200'}">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-900 text-lg group-hover:text-brand-purple transition-colors">{ranks.full_name}</h4>
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{ranks.role}</p>
                    </div>
                  </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-100 relative z-10">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Category Breakdown</p>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                    {#each data.categoryTotals as cat}
                      {@const detail = (data.salesBreakdown || []).find(s => s.organiser_id === ranks.user_id && s.category_id === cat.category_id)}
                      <div class="flex items-center justify-between text-[11px] font-medium text-gray-600">
                        <span class="truncate pr-1">{cat.category_name}</span>
                        <span class="font-bold text-brand-purple shrink-0">{detail?.tickets_sold || 0}</span>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-100 relative z-10">
                  <div class="flex justify-between items-baseline mb-3">
                    <p class="text-xs text-gray-500 font-medium">Total Sales</p>
                    <p class="text-2xl font-black {index === 0 ? 'text-yellow-600' : 'text-brand-purple'}">{ranks.confirmed_tickets} <span class="text-xs font-medium text-gray-400">/ {ranks.target_qty} goal</span></p>
                  </div>
                  <!-- Per-category breakdown with individual targets -->
                  <div class="space-y-2">
                    {#each data.categoryTotals as cat}
                      {@const detail = (data.salesBreakdown || []).find(s => s.organiser_id === ranks.user_id && s.category_id === cat.category_id)}
                      {@const sold = detail?.tickets_sold || 0}
                      {@const catTarget = detail?.organiser_category_target || 0}
                      {#if catTarget > 0}
                        <div>
                          <div class="flex justify-between text-[10px] font-bold text-gray-500 mb-0.5">
                            <span>{cat.category_name}</span>
                            <span class="{sold >= catTarget ? 'text-green-600' : 'text-brand-purple'}">{sold} / {catTarget}</span>
                          </div>
                          <div class="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full {sold >= catTarget ? 'bg-green-500' : index === 0 ? 'bg-yellow-500' : 'bg-brand-gold'} rounded-full transition-all" style="width: {Math.min(100, catTarget > 0 ? Math.round((sold / catTarget) * 100) : 0)}%"></div>
                          </div>
                        </div>
                      {/if}
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
            
            {#if !data.leaderboard || data.leaderboard.length === 0}
               <div class="col-span-full py-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 No leaderboard data available yet. Start approving tickets!
               </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>
