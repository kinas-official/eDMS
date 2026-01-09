<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {FileText, UploadCloud} from 'lucide-svelte';
  

  let inputEl: HTMLInputElement;
  let isDragging = false;

  const dispatch = createEventDispatcher<{ select: File[] }>();

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    dispatch('select', Array.from(fileList));
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
  class="flex flex-col h-32 cursor-pointer items-center justify-center rounded-xl border-2
         border-dashed border-primary/50 text-sm text-muted-foreground transition
         hover:border-primary"
  on:click={handleClick}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragenter={() => (isDragging = true)}
  on:dragleave={() => (isDragging = false)}
  class:border-primary={isDragging}
  class:bg-[#FFFFFF]={isDragging}  
  class:text-primary={isDragging}   
>
  <slot>
    <UploadCloud class="mb-2 h-6 w-6" />
    Drag & drop documents here or click to upload
</slot>

  <input
    bind:this={inputEl}
    type="file"
    class="hidden"
    multiple
    on:change={(e) => handleFiles((e.target as HTMLInputElement).files)}
  />
</div>
