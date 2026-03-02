<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Login | Rhapsody</title>
</svelte:head>

<div class="min-h-[calc(100vh-80px)] bg-brand-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
  
  <div class="absolute inset-0 z-0">
    <div class="absolute -top-32 -left-40 w-96 h-96 rounded-full bg-brand-purple-light opacity-5 blur-3xl text-brand-purple"></div>
    <div class="absolute top-20 right-0 w-80 h-80 rounded-full bg-brand-gold opacity-10 blur-3xl"></div>
  </div>

  <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-brand-purple tracking-tight">
      Welcome Back
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Access your tickets or manage the fundraiser
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
    <div class="bg-white py-8 px-4 shadow-2xl shadow-brand-purple/10 sm:rounded-3xl sm:px-10 border border-gray-100">
      
      {#if form?.error}
        <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700 font-medium">{form.error}</p>
            </div>
          </div>
        </div>
      {/if}

      <form 
        class="space-y-6" 
        method="POST" 
        action="?/login"
        use:enhance={() => {
          loading = true;
          return async ({ result, update }) => {
            if (result.type === 'error') {
               loading = false;
               return;
            }
            await update();
            loading = false;
          };
        }}
      >
        <div>
          <label for="phone" class="block text-sm font-bold text-gray-700">Mobile Number</label>
          <div class="mt-1">
            <input id="phone" name="phone" type="tel" autocomplete="tel" required class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-purple focus:border-brand-purple sm:text-sm transition-colors text-gray-900 bg-gray-50 focus:bg-white" placeholder="98765 43210">
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-bold text-gray-700">Password</label>
          <div class="mt-1">
            <input id="password" name="password" type="password" autocomplete="current-password" required class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-purple focus:border-brand-purple sm:text-sm transition-colors text-gray-900 bg-gray-50 focus:bg-white" placeholder="••••••••">
          </div>
        </div>

        <div>
          <button type="submit" disabled={loading} class="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md text-sm font-bold text-brand-white bg-brand-purple hover:bg-brand-purple-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none">
            {#if loading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            {:else}
              Sign in
            {/if}
          </button>
        </div>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-500">
         Don't have an account? <a href="/login" class="font-bold text-brand-gold hover:text-brand-purple transition-colors">Contact standard booking.</a>
      </div>
    </div>
  </div>
</div>
