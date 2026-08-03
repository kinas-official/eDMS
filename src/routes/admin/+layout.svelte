
<script lang="ts">
	import '@friendofsvelte/tipex/styles/index.css';
  import { LayoutDashboard, Folder, Users, Clock, Settings, LogOut, Building, Menu, X } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let isCollapsed = false;
  let mobileOpen = false;
  const currentPath = derived(page, ($page) => $page.url.pathname);

  // Close the mobile drawer whenever navigation happens
  $: if ($currentPath) mobileOpen = false;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Documents', icon: Folder, href: '/admin/documents' },
    { label: 'Departments', icon: Building, href: '/admin/departments' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Workflow', icon: Clock, href: '/admin/workflow' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' }
  ];
</script>

<div class="bg-background flex min-h-screen">
  <!-- Mobile backdrop -->
  {#if mobileOpen}
    <button
      aria-label="Close menu"
      class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
      on:click={() => (mobileOpen = false)}
      transition:fade={{ duration: 200 }}
    ></button>
  {/if}

  <!-- Sidebar -->
  <aside
    class={`bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0 md:transition-[width] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'md:w-20' : 'md:w-56'}`}
  >
    <div class="border-sidebar-border flex items-center gap-4 border-b p-4">
      <LayoutDashboard class="text-sidebar-primary h-8 w-8 shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-6" />
      {#if !isCollapsed}<span class="text-xl font-semibold whitespace-nowrap">rDMS Admin</span>{/if}
      <button
        aria-label="Close menu"
        class="hover:bg-sidebar-accent ml-auto rounded-md p-1.5 transition-colors md:hidden"
        on:click={() => (mobileOpen = false)}
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-1 p-2 text-sm">
      {#each navItems as item (item.href)}
        {@const active = $currentPath === item.href}
        <a
          href={item.href}
          class="hover:bg-sidebar-accent relative flex items-center gap-4 rounded-md px-4 py-3 transition-all duration-200 hover:translate-x-0.5"
          class:bg-sidebar-accent={active}
          class:text-sidebar-primary={active}
        >
          {#if active}
            <span
              class="bg-sidebar-primary absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full"
              in:scale={{ duration: 200, easing: quintOut, start: 0.3 }}
            ></span>
          {/if}
          <item.icon class="h-6 w-6 shrink-0 transition-transform duration-200" />
          {#if !isCollapsed}<span class="whitespace-nowrap">{item.label}</span>{/if}
        </a>
      {/each}
    </nav>

    <div class="border-sidebar-border border-t p-2">
      <button
        class="hover:bg-sidebar-accent hidden w-full items-center gap-4 rounded-md px-4 py-3 transition-colors md:flex"
        on:click={() => (isCollapsed = !isCollapsed)}
      >
        <LayoutDashboard class={`h-6 w-6 shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        {#if !isCollapsed}<span class="whitespace-nowrap">Collapse</span>{/if}
      </button>
      <button class="hover:bg-sidebar-accent mt-1 flex w-full items-center gap-4 rounded-md px-4 py-3 text-red-400 transition-colors">
        <LogOut class="h-6 w-6 shrink-0" />
        {#if !isCollapsed}<span class="whitespace-nowrap">Logout</span>{/if}
      </button>
    </div>
  </aside>

  <!-- Page Content -->
  <main class="bg-muted flex-1 overflow-y-auto">
    <!-- Header -->
    <header class="bg-muted/80 sticky top-0 z-20 flex items-center gap-3 border-b p-4 backdrop-blur-sm md:border-none md:bg-transparent md:p-6 md:pb-0">
      <button
        aria-label="Open menu"
        class="hover:bg-accent hover:text-accent-foreground -ml-1 rounded-md p-2 transition-colors md:hidden"
        on:click={() => (mobileOpen = true)}
      >
        <Menu class="h-5 w-5" />
      </button>
      <div>
        <h1 class="text-lg font-semibold md:text-2xl">
          {#if $currentPath === '/admin'}Dashboard{/if}
          {#if $currentPath === '/admin/documents'}Documents{/if}
          {#if $currentPath === '/admin/departments'}Departments{/if}
          {#if $currentPath === '/admin/users'}Users{/if}
          {#if $currentPath === '/admin/workflow'}Workflow{/if}
        </h1>
        <p class="text-muted-foreground hidden text-sm md:block">
          {#if $currentPath === '/admin'}Enterprise Document Management Overview{/if}
          {#if $currentPath === '/admin/documents'}Manage all uploaded documents{/if}
          {#if $currentPath === '/admin/departments'}Manage departments and assigned personnel{/if}
          {#if $currentPath === '/admin/users'}User management and roles{/if}
          {#if $currentPath === '/admin/workflow'}Workflow overview and approvals{/if}
        </p>
      </div>
    </header>

    <!-- Animated Slot -->
    {#key $currentPath}
      <div class="p-4 md:p-6 md:pt-6" in:fly={{ y: 8, duration: 250, easing: quintOut }} out:fade={{ duration: 120 }}>
        <slot />
      </div>
    {/key}
  </main>
</div>
