<script lang="ts">
  import  Input  from '$lib/components/ui/input/input.svelte';
  import  Button  from '$lib/components/ui/button/button.svelte';
  import { login } from '$lib/auth/store';
  import { mockLogin } from '$lib/auth/mock';
  import { goto } from '$app/navigation';

  let username = '';
  let password = '';
  let loading = false;
  let error: string | null = null;

  async function handleLogin() {
    error = null;
    loading = true;
    try {
      const user = await mockLogin(username, password);
      login(user);
      goto(user.role === 'admin' ? '/admin' : '/admin/documents');
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="from-sidebar via-sidebar to-sidebar-accent animate-gradient-x flex min-h-screen items-center justify-center bg-gradient-to-br">
  <div class="border-sidebar-border bg-sidebar/90 text-sidebar-foreground w-full max-w-md space-y-6 rounded-2xl border p-10 shadow-2xl backdrop-blur-md">

    <!-- Logo / Title -->
    <div class="flex flex-col items-center">
      <div class="bg-sidebar-primary text-sidebar-primary-foreground mb-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold">
        eD
      </div>
      <h1 class="text-center text-3xl font-bold">Welcome to your Enterprise Document Management System</h1>
      <p class="text-sidebar-foreground/70 mt-5 text-sm">Please sign in to continue</p>
    </div>

    <!-- Login Form -->
    <form class="space-y-4" on:submit|preventDefault={handleLogin}>
      <Input bind:value={username} required placeholder="Enter your username" />
      <Input type="password" bind:value={password} required placeholder="Enter your password" />

      {#if error}
        <p class="text-destructive text-sm">{error}</p>
      {/if}

      <Button
        type="submit"
        class="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 w-full transition-transform hover:scale-[1.02]"
      >
        {loading ? 'Signing in…' : 'Login'}
      </Button>
    </form>

    <!-- Footer -->
    <p class="text-sidebar-foreground/50 mt-4 text-center text-xs">
      &copy; {new Date().getFullYear()} eDMS. All rights reserved.
    </p>
  </div>
</div>

<style>
  /* subtle animated gradient */
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 10s ease infinite;
  }
</style>
