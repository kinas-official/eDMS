<script lang="ts">
  import { dev } from '$app/environment';
  import { goto } from '$app/navigation';
  import { documents, addDocument } from '$lib/documents/store';
  import { currentUser, login, logout } from '$lib/auth/store';

  /**
   * Dev scratch page. It used to sign in a mock admin unconditionally, which
   * would walk straight past the admin guard in production, so the seeding
   * controls are dev-only now.
   */
  function seed() {
    login({ id: '1', username: 'admin', role: 'admin', department: 'IT' });
    addDocument({
      id: crypto.randomUUID(),
      name: 'Sample.pdf',
      size: 102400,
      mime: 'application/pdf',
      ownerId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    });
  }
</script>

{#if dev}
  <div class="space-y-4 p-6 text-sm">
    <p class="text-muted-foreground">
      Dev scratch page. Signed in as: {$currentUser?.username ?? 'nobody'}
    </p>

    <div class="flex flex-wrap gap-2">
      <button class="border-border/60 rounded-lg border px-3 py-2" on:click={seed}>Seed Data</button>
      <button class="border-border/60 rounded-lg border px-3 py-2" on:click={logout}>Sign out</button>
      <button class="border-border/60 rounded-lg border px-3 py-2" on:click={() => goto('/admin')}>
        Go to admin
      </button>
    </div>

    <ul class="list-inside list-disc">
      {#each $documents as doc}
        <li>{doc.name} — {doc.status}</li>
      {/each}
    </ul>
  </div>
{:else}
  <div class="flex min-h-screen items-center justify-center">
    <a class="border-border/60 rounded-lg border px-4 py-2 text-sm" href="/login">Sign in</a>
  </div>
{/if}
