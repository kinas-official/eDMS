<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { AlertTriangle } from "lucide-svelte";
	import { fade, scale } from "svelte/transition";
	import { quintOut } from "svelte/easing";

	let {
		open = false,
		title = "Are you sure?",
		description = "",
		confirmText = "Delete",
		cancelText = "Cancel",
		variant = "destructive",
		onConfirm,
		onCancel,
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: "destructive" | "default";
		onConfirm?: () => void;
		onCancel?: () => void;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === "Escape") onCancel?.();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
	>
		<div
			class="bg-card border-border/60 w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
			transition:scale={{ duration: 150, start: 0.95, easing: quintOut }}
			role="alertdialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="confirm-dialog-title"
		>
			<div class="flex items-start gap-3">
				{#if variant === "destructive"}
					<div class="bg-destructive/10 text-destructive flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
						<AlertTriangle class="h-5 w-5" />
					</div>
				{/if}
				<div class="flex-1 pt-0.5">
					<h2 id="confirm-dialog-title" class="text-base font-semibold tracking-tight">{title}</h2>
					{#if description}
						<p class="text-muted-foreground mt-1 text-sm">{description}</p>
					{/if}
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-2">
				<Button variant="outline" onclick={() => onCancel?.()}>{cancelText}</Button>
				<Button variant={variant === "destructive" ? "destructive" : "default"} onclick={() => onConfirm?.()}>
					{confirmText}
				</Button>
			</div>
		</div>
	</div>
{/if}
