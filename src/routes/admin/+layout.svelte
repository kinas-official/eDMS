
<script lang="ts">
	import '@friendofsvelte/tipex/styles/index.css';
  import { LayoutDashboard, Folder, Users, Clock, Settings, LogOut, Building } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';
  import { fly, fade } from 'svelte/transition';

  let isCollapsed = false;
  const currentPath = derived(page, ($page) => $page.url.pathname);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Documents', icon: Folder, href: '/admin/documents' },
    { label: 'Departments', icon: Building, href: '/admin/departments' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Workflow', icon: Clock, href: '/admin/workflow' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' }
  ];
</script>

<div class="flex min-h-screen">
  <!-- Sidebar -->
  <aside class={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-56'} flex flex-col border-r border-gray-800 bg-black text-white`}>
    <div class="flex items-center gap-4 border-b border-gray-800 p-4">
      <LayoutDashboard class="h-8 w-8" />
      {#if !isCollapsed}<span class="text-xl font-semibold">rDMS Admin</span>{/if}
    </div>

    <nav class="flex-1 space-y-1 p-2 text-sm">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-4 rounded-md px-4 py-3 hover:bg-gray-800"
          class:bg-gray-900={$currentPath === item.href}
        >
          <item.icon class="h-6 w-6" />
          {#if !isCollapsed}<span>{item.label}</span>{/if}
        </a>
      {/each}
    </nav>

    <div class="border-t border-gray-800 p-2">
      <button class="flex w-full items-center gap-4 rounded-md px-4 py-3 hover:bg-gray-800" on:click={() => (isCollapsed = !isCollapsed)}>
        <LayoutDashboard class="h-6 w-6" />
        {#if !isCollapsed}<span>Collapse</span>{/if}
      </button>
      <button class="mt-1 flex w-full items-center gap-4 rounded-md px-4 py-3 text-red-500 hover:bg-gray-800">
        <LogOut class="h-6 w-6" />
        {#if !isCollapsed}<span>Logout</span>{/if}
      </button>
    </div>
  </aside>

  <!-- Page Content -->
  <main class="bg-muted flex-1 overflow-y-auto p-6">
    <!-- Header -->
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">
          {#if $currentPath === '/admin'}Dashboard{/if}
          {#if $currentPath === '/admin/documents'}Documents{/if}
          {#if $currentPath === '/admin/departments'}Departments{/if}
          {#if $currentPath === '/admin/users'}Users{/if}
          {#if $currentPath === '/admin/workflow'}Workflow{/if}
        </h1>
        <p class="text-muted-foreground text-sm">
          {#if $currentPath === '/admin'}Enterprise Document Management Overview{/if}
          {#if $currentPath === '/admin/documents'}Manage all uploaded documents{/if}
          {#if $currentPath === '/admin/departments'}Manage departments and assigned personnel{/if}
          {#if $currentPath === '/admin/users'}User management and roles{/if}
          {#if $currentPath === '/admin/workflow'}Workflow overview and approvals{/if}
        </p>
      </div>
    </header>

    <!-- Animated Slot -->
    <div in:fly={{ y: 10, duration: 200 }} out:fade={{ duration: 150 }}>
      <slot />
    </div>
  </main>
</div>
