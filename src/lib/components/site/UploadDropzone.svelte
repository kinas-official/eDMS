<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { UploadCloud } from 'lucide-svelte';
  import { fileExtension, parseAllowedTypes } from '$lib/settings/types';

  /** Free-text extension list from Settings, e.g. ".pdf, .docx". Empty = allow anything. */
  export let allowedFileTypes = '';
  /** Max size per file in MB. `null` or 0 = no limit. */
  export let maxSizeMb: number | null = null;

  let inputEl: HTMLInputElement;
  let isDragging = false;

  type Rejection = { file: File; reason: string };

  const dispatch = createEventDispatcher<{ select: File[]; reject: Rejection[] }>();

  $: allowed = parseAllowedTypes(allowedFileTypes);
  $: acceptAttr = allowed.join(',');

  function rejectionReason(file: File): string | null {
    if (allowed.length && !allowed.includes(fileExtension(file.name))) {
      return `${fileExtension(file.name) || 'This file type'} is not allowed (${allowed.join(', ')})`;
    }
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      return `${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the ${maxSizeMb} MB limit`;
    }
    return null;
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;

    const accepted: File[] = [];
    const rejected: Rejection[] = [];

    for (const file of Array.from(fileList)) {
      const reason = rejectionReason(file);
      if (reason) rejected.push({ file, reason });
      else accepted.push(file);
    }

    if (rejected.length) dispatch('reject', rejected);
    if (accepted.length) dispatch('select', accepted);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false; // reset dragging state
    handleFiles(event.dataTransfer?.files ?? null);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleClick() {
    inputEl.click();
  }
</script>

<div
  class={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2
         border-dashed text-sm transition ${
           isDragging
             ? 'border-primary bg-primary/5 text-primary'
             : 'border-primary/50 text-muted-foreground hover:border-primary'
         }`}
  on:click={handleClick}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragenter={() => (isDragging = true)}
  on:dragleave={() => (isDragging = false)}
>
  <slot>
    <UploadCloud class="mb-2 h-6 w-6" />
    Drag &amp; drop documents here or click to upload
    {#if allowed.length || maxSizeMb}
      <span class="mt-1 text-xs opacity-80">
        {allowed.length ? allowed.join(', ') : 'Any type'}{maxSizeMb ? ` · up to ${maxSizeMb} MB` : ''}
      </span>
    {/if}
  </slot>

  <input
    bind:this={inputEl}
    type="file"
    class="hidden"
    multiple
    accept={acceptAttr || undefined}
    on:change={(e) => handleFiles((e.target as HTMLInputElement).files)}
  />
</div>
