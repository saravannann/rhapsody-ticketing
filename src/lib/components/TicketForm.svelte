<script lang="ts">
  interface Category {
    id: string;
    name: string;
    price: number;
    description: string;
    target_qty?: number;
    total_sold?: number;
    category_id?: string;  // category_totals_view uses category_id
    category_name?: string;
  }

  let { 
    referrerId = '', 
    isOrganiser = false, 
    categories: propCategories = [] 
  } = $props<{ 
    referrerId?: string; 
    isOrganiser?: boolean; 
    categories?: Category[];
  }>();

  let step = $state(1);
  let category = $state('');
  let quantity = $state(1);
  let basePrice = $state(0);
  let amount = $derived(basePrice * quantity);
  let supporterName = $state('');
  let supporterPhone = $state('');
  let receiptFile: File | null = $state(null);
  
  let isSubmitting = $state(false);
  let submitSuccess = $state(false);
  let submitError = $state('');

  // Normalise: category_totals_view uses category_id/category_name; ticket_categories uses id/name
  let activeCategories = $derived(
    (propCategories || []).map(c => ({
      ...c,
      id: c.id ?? c.category_id ?? '',
      name: c.name ?? c.category_name ?? ''
    }))
  );

  // Server already filters availability; expose remaining per category
  function remaining(cat: Category): number {
    if (!cat.target_qty) return Infinity;
    return Math.max(0, cat.target_qty - (cat.total_sold ?? 0));
  }

  function selectCategory(cat: Category) {
    category = cat.id;
    basePrice = cat.price;
    if (quantity < 1) quantity = 1;
  }

  function adjustQuantity(delta: number) {
    quantity = Math.max(1, quantity + delta);
  }

  function nextStep() {
    if (step === 1 && !category) return;
    if (step === 2 && (!supporterName || !supporterPhone)) return;
    step++;
  }

  function prevStep() {
    step--;
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      receiptFile = target.files[0];
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!receiptFile) {
        submitError = "Please upload a payment receipt";
        return;
    }
    
    isSubmitting = true;
    submitError = '';
    
    const formData = new FormData();
    formData.append('category', category);
    formData.append('quantity', quantity.toString());
    formData.append('amount', amount.toString());
    formData.append('supporter_name', supporterName);
    formData.append('supporter_phone', supporterPhone);
    formData.append('receipt', receiptFile);
    
    // Pass explicitly if on public page with a ref URL param.
    // If Organiser, interceptor will automatically handle this anyway.
    if (referrerId) {
        formData.append('referred_by', referrerId);
    }

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        submitSuccess = true;
      } else {
        submitError = data.error || 'Failed to submit ticket';
      }
    } catch (err) {
      submitError = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-xl mx-auto bg-brand-purple/40 backdrop-blur-md border border-brand-purple-light/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
  
  {#if submitSuccess}
     <div class="text-center py-10 animate-in fade-in zoom-in duration-500">
       <div class="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
         <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
       </div>
       <h2 class="text-2xl font-bold text-brand-gold mb-2">Successfully Booked!</h2>
       <p class="text-brand-white/70">Payment receipt uploaded and ticket is now pending verification.</p>
       <div class="mt-8">
         <button onclick={() => window.location.reload()} class="px-6 py-2 bg-brand-purple-dark border border-brand-purple-light/50 rounded-full text-brand-white text-sm font-medium hover:bg-brand-purple-light transition-colors">Book Another</button>
       </div>
     </div>
  {:else}
  <!-- Stepper Header -->
  <div class="flex items-center justify-between mb-8 relative">
    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-brand-purple-dark/80 -z-10 rounded-full"></div>
    <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-brand-gold to-brand-gold-light -z-10 rounded-full transition-all duration-500 ease-in-out" 
         style="width: {(step - 1) * 50}%"></div>
         
    {#each [1, 2, 3] as s}
        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 {step === s ? 'bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-purple shadow-[0_0_15px_rgba(212,175,55,0.6)] scale-110' : step > s ? 'bg-brand-gold text-brand-purple scale-100' : 'bg-brand-purple-dark text-brand-white/50 border border-brand-purple-light/40 scale-100'}">
            {s}
        </div>
    {/each}
  </div>

  <h2 class="text-xl sm:text-2xl font-bold text-center text-brand-white mb-8">
    {#if step === 1}
      Select Your Experience
    {:else if step === 2}
      {isOrganiser ? "Supporter's Details" : 'Your Details'}
    {:else if step === 3}
      Make Payment
    {/if}
  </h2>

  {#if submitError}
    <div class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center animate-in fade-in">
      {submitError}
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-6">
    <!-- Step 1: Category -->
    {#if step === 1}
      <div class="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
        <label class="block text-xs font-black uppercase tracking-widest text-brand-white/40 mb-3">Choose a Category</label>

        {#if activeCategories.length === 0}
          <!-- No categories available -->
          <div class="text-center py-10 px-4">
            <div class="w-14 h-14 rounded-full bg-brand-purple-dark/60 border border-brand-purple-light/20 flex items-center justify-center mx-auto mb-4">
              <svg class="h-7 w-7 text-brand-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-brand-white/70 mb-1">Tickets Sold Out</h3>
            <p class="text-sm text-brand-white/40">All ticket categories are currently sold out. Please check back later or contact us directly.</p>
          </div>
        {:else}
          {#each activeCategories as cat}
            {@const rem = remaining(cat)}
            <div 
              onclick={() => selectCategory(cat)}
              class="p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex justify-between items-center group {category === cat.id ? 'border-brand-gold bg-brand-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.15)] transform scale-[1.02]' : 'border-brand-purple-dark hover:border-brand-gold/50 bg-brand-purple-dark/40 hover:bg-brand-purple-dark/80'}"
              role="radio"
              aria-checked={category === cat.id}
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && selectCategory(cat)}
            >
              <div>
                <h3 class="text-lg font-bold text-brand-white group-hover:text-brand-gold transition-colors">{cat.name}</h3>
                <p class="text-sm text-brand-white/60 mt-1">{cat.description}</p>
                {#if rem !== Infinity && rem <= 20}
                  <p class="text-xs font-bold mt-1.5 {rem <= 5 ? 'text-red-400' : 'text-brand-gold/70'}">
                    {rem <= 5 ? '🔥' : '⚡'} Only {rem} left
                  </p>
                {/if}
              </div>
              <div class="text-xl font-extrabold text-brand-gold shrink-0 ml-4">₹{cat.price}</div>
            </div>
          {/each}
        {/if}

        {#if category}
          <div class="mt-10 p-6 bg-brand-purple-dark/60 rounded-2xl border border-brand-gold/20 animate-in fade-in zoom-in duration-300">
            <div class="flex items-center justify-between mb-6">
              <div>
                <p class="text-xs font-black uppercase tracking-widest text-brand-gold/80">Attendee Selection</p>
                <p class="text-brand-white text-sm font-medium mt-1">Choose the number of attendees</p>
              </div>
              
              <div class="flex items-center gap-4 bg-brand-purple-dark p-1 rounded-xl border border-brand-purple-light/20 shadow-inner">
                <button 
                  type="button"
                  onclick={() => adjustQuantity(-1)}
                  class="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-purple-light/10 text-brand-white hover:bg-brand-gold hover:text-brand-purple transition-all font-bold text-xl"
                  title="Decrease allocation"
                >
                  −
                </button>
                <input 
                  type="number" 
                  min="1" 
                  bind:value={quantity}
                  class="w-12 bg-transparent text-center text-xl font-black text-brand-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                  type="button"
                  onclick={() => adjustQuantity(1)}
                  class="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-purple-light/10 text-brand-white hover:bg-brand-gold hover:text-brand-purple transition-all font-bold text-xl"
                  title="Increase allocation"
                >
                  +
                </button>
              </div>
            </div>

            <div class="pt-4 border-t border-brand-purple-light/10 flex justify-between items-end">
                <p class="text-xs font-black uppercase tracking-widest text-brand-white/40">Total Contribution</p>
                <div class="text-right">
                    <p class="text-3xl font-black text-brand-gold">₹{amount}</p>
                </div>
            </div>
          </div>
        {/if}
      </div>
    
    <!-- Step 2: Supporter Details -->
    {:else if step === 2}
      <div class="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
          <label for="name" class="block text-sm font-medium text-brand-white/80 mb-2">Full Name</label>
          <input 
            type="text" 
            id="name" 
            bind:value={supporterName} 
            required 
            placeholder="John Doe"
            class="w-full bg-brand-purple-dark/60 border border-brand-purple-light/30 focus:border-brand-gold rounded-xl px-4 py-3 text-brand-white placeholder-brand-white/30 focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all" 
          />
        </div>
        <div>
          <label for="phone" class="block text-sm font-medium text-brand-white/80 mb-2">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            bind:value={supporterPhone} 
            required 
            placeholder="+91 98765 43210"
            class="w-full bg-brand-purple-dark/60 border border-brand-purple-light/30 focus:border-brand-gold rounded-xl px-4 py-3 text-brand-white placeholder-brand-white/30 focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all" 
          />
        </div>
      </div>
    
    <!-- Step 3: Payment & Receipt -->
    {:else if step === 3}
      <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        
        <div class="bg-gradient-to-br from-brand-purple-dark/80 to-brand-purple-dark/40 rounded-2xl p-6 border border-brand-purple-light/20 text-center relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-brand-gold opacity-10 rounded-full blur-2xl"></div>
            
            <h3 class="text-sm font-bold text-brand-white/80 mb-1 uppercase tracking-wider">Scan via UPI</h3>
            <p class="text-brand-gold font-extrabold text-4xl mb-6">₹{amount}</p>
            
            <div class="bg-white p-3 rounded-2xl inline-block mb-4 shadow-xl border border-white/20">
                <!-- Mock Stylish QR Code -->
                <svg viewBox="0 0 100 100" class="w-32 h-32">
                  <rect width="100" height="100" fill="#ffffff" rx="4"/>
                  <path d="M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z M40,10 h20 v5 h-20 z M40,25 h15 v5 h-15 z M40,40 h5 v20 h-5 z M50,40 h10 v5 h-10 z M65,40 h25 v5 h-25 z M10,40 h20 v5 h-20 z M10,55 h10 v5 h-10 z M25,55 h5 v35 h-5 z M40,70 h20 v5 h-20 z M40,85 h10 v5 h-10 z M70,70 h10 v20 h-10 z M85,70 h5 v20 h-5 z" fill="#3d1c47"/>
                </svg>
            </div>
            <p class="text-sm font-bold text-brand-white/90">rhapsody@ticketing</p>
        </div>

        <div>
          <label for="receipt" class="block text-sm font-medium text-brand-white/80 mb-2">Upload Payment Receipt</label>
          <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-purple-light/20 border-dashed rounded-xl hover:border-brand-gold/40 transition-colors bg-brand-purple-dark/30 group">
            <div class="space-y-2 text-center">
              <svg class="mx-auto h-12 w-12 text-brand-white/30 group-hover:text-brand-gold/70 transition-colors duration-300" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="flex text-sm text-brand-white/80 justify-center">
                <label for="receipt" class="relative cursor-pointer rounded-md font-medium text-brand-gold hover:text-brand-gold-light focus-within:outline-none">
                  <span>Upload a file</span>
                  <input id="receipt" name="receipt" type="file" class="sr-only" accept="image/*,.pdf" onchange={handleFileChange} required>
                </label>
              </div>
              <p class="text-xs text-brand-white/40">
                PNG, JPG, PDF up to 5MB
              </p>
              {#if receiptFile}
                <div class="bg-green-500/10 border border-green-500/30 rounded-lg py-1 px-3 inline-block mt-2">
                  <p class="text-xs font-bold text-green-400 truncate max-w-[200px]">{receiptFile.name}</p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Navigation Buttons -->
    <div class="flex justify-between pt-6 mt-6 border-t border-brand-purple-light/10">
      {#if step > 1}
        <button type="button" onclick={prevStep} class="px-6 py-2.5 rounded-full text-sm font-bold text-brand-white bg-brand-purple-dark hover:bg-brand-purple-light/30 transition-colors border border-brand-purple-light/20 shadow-sm">
          Back
        </button>
      {:else}
        <div></div>
      {/if}

      {#if step < 3}
        <button type="button" onclick={nextStep} class="px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-purple shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none" disabled={step === 1 && !category}>
          Continue
        </button>
      {:else}
        <button type="submit" disabled={isSubmitting || !receiptFile} class="px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-purple shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2">
            {#if isSubmitting}
                <svg class="animate-spin h-4 w-4 text-brand-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
            {:else}
                Confirm & Book
            {/if}
        </button>
      {/if}
    </div>
  </form>
  {/if}
</div>
