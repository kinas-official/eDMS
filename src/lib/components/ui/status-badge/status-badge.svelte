<script lang="ts" module>
	import { cn } from "$lib/lib/utils.js";
	import { tv, type VariantProps } from "tailwind-variants";

	export const statusBadgeVariants = tv({
		base: "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
		variants: {
			tone: {
				neutral: "bg-muted text-muted-foreground border-transparent",
				info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
				warning:
					"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
				success:
					"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
				destructive:
					"bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
			},
		},
		defaultVariants: {
			tone: "neutral",
		},
	});

	export type StatusBadgeTone = VariantProps<typeof statusBadgeVariants>["tone"];

	const STATUS_TONES: Record<string, StatusBadgeTone> = {
		draft: "neutral",
		pending: "warning",
		reviewed: "info",
		approved: "success",
		active: "success",
		rejected: "destructive",
		inactive: "neutral",
	};

	export function toneForStatus(status: string): StatusBadgeTone {
		return STATUS_TONES[status.toLowerCase()] ?? "neutral";
	}
</script>

<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		status,
		tone,
		class: className,
		children,
	}: {
		status?: string;
		tone?: StatusBadgeTone;
		class?: string;
		children?: Snippet;
	} = $props();

	const resolvedTone = $derived(tone ?? (status ? toneForStatus(status) : "neutral"));
</script>

<span class={cn(statusBadgeVariants({ tone: resolvedTone }), className)}>
	{#if children}
		{@render children()}
	{:else}
		{status}
	{/if}
</span>
