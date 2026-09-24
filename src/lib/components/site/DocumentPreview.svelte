<script lang="ts">
	import { FileQuestion, FileX, LoaderCircle } from '@lucide/svelte';
	import { docxToHtml, previewKind } from '$lib/documents/preview';

	/** Big text files would lock up the page; show the start and offer the download. */
	const MAX_TEXT_CHARS = 200_000;

	let { file, class: className = '' }: { file: File | null; class?: string } = $props();

	const kind = $derived(file ? previewKind(file) : null);

	let url = $state<string | null>(null);
	let html = $state<string | null>(null);
	let text = $state<string | null>(null);
	let loading = $state(false);
	let failed = $state(false);

	$effect(() => {
		const current = file;
		const currentKind = kind;

		url = html = text = null;
		failed = false;
		loading = false;
		if (!current) return;

		if (currentKind === 'pdf' || currentKind === 'image') {
			const objectUrl = URL.createObjectURL(current);
			url = objectUrl;
			return () => URL.revokeObjectURL(objectUrl);
		}

		if (currentKind !== 'docx' && currentKind !== 'text') return;

		// Switching files mid-conversion must not let the old result land.
		let cancelled = false;
		loading = true;

		const work =
			currentKind === 'docx'
				? docxToHtml(current).then((result) => {
						if (!cancelled) html = result;
					})
				: current.text().then((result) => {
						if (!cancelled) {
							text =
								result.length > MAX_TEXT_CHARS
									? `${result.slice(0, MAX_TEXT_CHARS)}\n\n… (truncated — download the file to see the rest)`
									: result;
						}
					});

		work
			.catch(() => {
				if (!cancelled) failed = true;
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class={`flex min-h-0 flex-col ${className}`}>
	{#if !file}
		<div class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-sm">
			<FileX class="h-10 w-10 opacity-40" />
			No file to preview.
		</div>
	{:else if loading}
		<div class="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm">
			<LoaderCircle class="h-4 w-4 animate-spin" />
			Loading preview…
		</div>
	{:else if failed}
		<div class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-sm">
			<FileX class="h-10 w-10 opacity-40" />
			This file could not be read. It may be damaged.
		</div>
	{:else if kind === 'pdf' && url}
		<iframe src={url} title={file.name} class="min-h-[60vh] w-full flex-1 rounded-lg border-0 bg-white"></iframe>
	{:else if kind === 'image' && url}
		<div class="flex flex-1 items-center justify-center">
			<img src={url} alt={file.name} class="max-h-full max-w-full rounded-lg object-contain shadow-sm" />
		</div>
	{:else if html !== null}
		<!-- Rendered as a white page in both themes: Word content assumes dark ink on white. -->
		<article class="docx-preview mx-auto w-full max-w-3xl rounded-lg bg-white px-10 py-12 text-sm leading-relaxed text-neutral-900 shadow-sm">
			{@html html}
		</article>
	{:else if text !== null}
		<pre class="bg-card border-border/60 mx-auto w-full max-w-4xl rounded-lg border p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap">{text}</pre>
	{:else}
		<div class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm">
			<FileQuestion class="h-10 w-10 opacity-40" />
			<p>Preview isn't available for this file type.</p>
			<p class="text-xs">Download the file to open it in another app.</p>
		</div>
	{/if}
</div>

<style>
	.docx-preview :global(h1) {
		font-size: 1.6em;
		font-weight: 700;
		margin: 0 0 0.75em;
	}

	.docx-preview :global(h2) {
		font-size: 1.3em;
		font-weight: 600;
		margin: 1.25em 0 0.5em;
	}

	.docx-preview :global(h3),
	.docx-preview :global(h4) {
		font-size: 1.1em;
		font-weight: 600;
		margin: 1em 0 0.5em;
	}

	.docx-preview :global(p) {
		margin: 0 0 0.75em;
	}

	.docx-preview :global(ul),
	.docx-preview :global(ol) {
		margin: 0 0 0.75em 1.5em;
	}

	.docx-preview :global(ul) {
		list-style: disc;
	}

	.docx-preview :global(ol) {
		list-style: decimal;
	}

	.docx-preview :global(a) {
		color: #2563eb;
		text-decoration: underline;
	}

	.docx-preview :global(img) {
		max-width: 100%;
		height: auto;
	}

	.docx-preview :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0 0 1em;
	}

	.docx-preview :global(th),
	.docx-preview :global(td) {
		border: 1px solid #d4d4d4;
		padding: 0.4rem 0.6rem;
		vertical-align: top;
	}
</style>
