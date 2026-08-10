<script lang="ts" context="module">
  import type { ComponentType } from 'svelte';

  export interface QuickAction {
    label: string;
    icon: ComponentType;
    href?: string;
    onClick?: () => void;
  }
</script>

<script lang="ts">
  export let actions: QuickAction[] = [];
</script>

<div class="grid grid-cols-2 gap-3 md:grid-cols-5">
  {#each actions as action}
    {#if action.href}
      <a
        href={action.href}
        class="border-border/60 bg-card group flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span class="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-foreground/10">
          <action.icon class="h-4.5 w-4.5" />
        </span>
        <span class="text-sm font-medium">{action.label}</span>
      </a>
    {:else}
      <button
        type="button"
        on:click={action.onClick}
        class="border-border/60 bg-card group flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span class="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-foreground/10">
          <action.icon class="h-4.5 w-4.5" />
        </span>
        <span class="text-sm font-medium">{action.label}</span>
      </button>
    {/if}
  {/each}
</div>
