<script lang="ts">
	import {
		FileText,
		Users,
		Clock,
		AlertTriangle,
		Plus,
		FolderOpen,
		Settings,
		Upload,
		TrendingUp
	} from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';

	import QuickActions from '../../lib/components/site/QuickActions.svelte';
	import {
		FONT_FAMILY,
		areaGradient,
		axisTicks,
		barValueLabelPlugin,
		chartTheme,
		compact,
		crosshairPlugin,
		doughnutCenterPlugin,
		onModeChange,
		tooltipStyle,
		withAlpha
	} from '$lib/charts/theme';

	const quickActions = [
		{ label: 'New Document', icon: Plus },
		{ label: 'Upload File', icon: Upload },
		{ label: 'View Documents', icon: FolderOpen },
		{ label: 'Manage Users', icon: Users },
		{ label: 'System Settings', icon: Settings, href: '/admin/settings' }
	];

	const kpis = {
		documents: 1248,
		employees: 87,
		pending: 34,
		overdue: 5
	};

	const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const weeklyActivity = [120, 150, 130, 170, 160, 180, 200];
	const previousWeekTotal = 985;

	const weeklyTotal = weeklyActivity.reduce((a, b) => a + b, 0);
	const weeklyDelta = Math.round(((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100);

	const departmentLoad = {
		labels: ['HR', 'Finance', 'IT', 'Legal', 'Admin'],
		values: [220, 310, 180, 140, 90]
	};
	const departmentTotal = departmentLoad.values.reduce((a, b) => a + b, 0);

	const documentTypes = {
		labels: ['Contracts', 'Invoices', 'Reports', 'Policies', 'Memos'],
		values: [386, 301, 245, 186, 130]
	};

	// The legend swatches are painted from the same slots the doughnut uses.
	let legendColors = $state(chartTheme('light').series);
	const legend = $derived(
		departmentLoad.labels.map((label, i) => ({
			label,
			value: departmentLoad.values[i],
			share: Math.round((departmentLoad.values[i] / departmentTotal) * 100),
			color: legendColors[i]
		}))
	);

	let typeChart: HTMLCanvasElement;
	let activityChart: HTMLCanvasElement;
	let departmentChart: HTMLCanvasElement;

	let Chart: any;
	let charts: any[] = [];
	let stopWatchingTheme: (() => void) | undefined;

	function render() {
		const t = chartTheme();
		legendColors = t.series;
		charts.forEach((c) => c.destroy());

		charts = [
			new Chart(activityChart, {
				type: 'line',
				data: {
					labels: weekdays,
					datasets: [
						{
							label: 'Documents',
							data: weeklyActivity,
							borderColor: t.accent,
							borderWidth: 2,
							cubicInterpolationMode: 'monotone',
							fill: true,
							backgroundColor: (ctx: any) =>
								ctx.chart.chartArea
									? areaGradient(ctx.chart.ctx, ctx.chart.chartArea, t.accent)
									: 'transparent',
							pointRadius: 0,
							pointHoverRadius: 5,
							pointHoverBackgroundColor: t.accent,
							pointHoverBorderColor: t.surface,
							pointHoverBorderWidth: 2,
							pointHitRadius: 24
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: { mode: 'index', intersect: false },
					layout: { padding: { top: 8 } },
					plugins: {
						legend: { display: false },
						tooltip: {
							...tooltipStyle(t),
							callbacks: { label: (c: any) => ` ${compact(c.parsed.y)} documents` }
						},
						edmsCrosshair: {
							color: t.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)'
						}
					},
					scales: {
						x: {
							grid: { display: false },
							border: { display: false },
							ticks: axisTicks(t)
						},
						y: {
							beginAtZero: true,
							grid: { color: t.grid, drawTicks: false },
							border: { display: false },
							ticks: axisTicks(t, { maxTicksLimit: 5, callback: (v: number) => compact(v) })
						}
					}
				},
				plugins: [crosshairPlugin]
			}),

			new Chart(departmentChart, {
				type: 'doughnut',
				data: {
					labels: departmentLoad.labels,
					datasets: [
						{
							data: departmentLoad.values,
							backgroundColor: t.series,
							// A 2px ring in the surface colour is the gap between slices —
							// separation without drawing borders around the marks.
							borderColor: t.surface,
							borderWidth: 2,
							hoverBorderColor: t.surface,
							hoverBorderWidth: 2,
							hoverOffset: 6
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '72%',
					layout: { padding: 6 },
					plugins: {
						legend: { display: false },
						tooltip: {
							...tooltipStyle(t),
							callbacks: {
								label: (c: any) =>
									` ${compact(c.parsed)} · ${Math.round((c.parsed / departmentTotal) * 100)}%`
							}
						},
						edmsDoughnutCenter: {
							value: compact(departmentTotal),
							label: 'Documents',
							ink: t.ink,
							muted: t.muted
						}
					}
				},
				plugins: [doughnutCenterPlugin]
			}),

			new Chart(typeChart, {
				type: 'bar',
				data: {
					labels: documentTypes.labels,
					datasets: [
						{
							label: 'Documents',
							data: documentTypes.values,
							backgroundColor: withAlpha(t.accent, 0.85),
							hoverBackgroundColor: t.accent,
							borderRadius: 4,
							borderSkipped: 'start',
							barThickness: 14
						}
					]
				},
				options: {
					indexAxis: 'y',
					responsive: true,
					maintainAspectRatio: false,
					// Room for the value set just past each bar tip.
					layout: { padding: { right: 44 } },
					plugins: {
						legend: { display: false },
						tooltip: {
							...tooltipStyle(t),
							callbacks: { label: (c: any) => ` ${compact(c.parsed.x)} documents` }
						},
						edmsBarValueLabel: { color: t.ink }
					},
					scales: {
						x: { display: false, beginAtZero: true, grid: { display: false } },
						y: { grid: { display: false }, border: { display: false }, ticks: axisTicks(t) }
					}
				},
				plugins: [barValueLabelPlugin]
			})
		];
	}

	onMount(async () => {
		Chart = (await import('chart.js/auto')).default;
		Chart.defaults.font.family = FONT_FAMILY;
		Chart.defaults.font.size = 11;
		Chart.defaults.animation.duration = 650;
		Chart.defaults.animation.easing = 'easeOutQuart';

		render();
		stopWatchingTheme = onModeChange(render);
	});

	onDestroy(() => {
		stopWatchingTheme?.();
		charts.forEach((c) => c.destroy());
		charts = [];
	});
</script>

<div class="space-y-8">
	<!-- Quick Actions -->
	<div class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">Quick Actions</h2>
		<QuickActions actions={quickActions} />
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
		<div class="bg-card border-border/60 group rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
			<div class="flex items-center gap-4">
				<div class="bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-foreground/10">
					<FileText class="h-5 w-5" />
				</div>
				<div>
					<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total Documents</p>
					<p class="text-2xl font-semibold tracking-tight">{kpis.documents}</p>
				</div>
			</div>
		</div>
		<div class="bg-card border-border/60 group rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
			<div class="flex items-center gap-4">
				<div class="bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-foreground/10">
					<Users class="h-5 w-5" />
				</div>
				<div>
					<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Active Employees</p>
					<p class="text-2xl font-semibold tracking-tight">{kpis.employees}</p>
				</div>
			</div>
		</div>
		<div class="bg-card border-border/60 group rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
			<div class="flex items-center gap-4">
				<div class="bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-foreground/10">
					<Clock class="h-5 w-5" />
				</div>
				<div>
					<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Pending Reviews</p>
					<p class="text-2xl font-semibold tracking-tight">{kpis.pending}</p>
				</div>
			</div>
		</div>
		<div class="bg-card border-border/60 group rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
			<div class="flex items-center gap-4">
				<div class="bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-foreground/10">
					<AlertTriangle class="h-5 w-5" />
				</div>
				<div>
					<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Overdue</p>
					<p class="text-2xl font-semibold tracking-tight">{kpis.overdue}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Charts -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
		<!-- Weekly activity -->
		<div class="bg-card border-border/60 rounded-xl border p-5 shadow-sm md:col-span-2">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 class="text-sm font-semibold tracking-tight">Weekly Document Activity</h2>
					<div class="mt-2 flex items-baseline gap-2.5">
						<span class="text-2xl font-semibold tracking-tight">{weeklyTotal.toLocaleString()}</span>
						<span class="inline-flex items-center gap-1 text-xs font-medium text-[#006300] dark:text-[#0ca30c]">
							<TrendingUp class="h-3.5 w-3.5" />
							{weeklyDelta}%
						</span>
					</div>
				</div>
				<span class="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">Last 7 days</span>
			</div>
			<div class="mt-4 h-56">
				<canvas bind:this={activityChart}></canvas>
			</div>
		</div>

		<!-- Department load -->
		<div class="bg-card border-border/60 flex flex-col rounded-xl border p-5 shadow-sm">
			<h2 class="text-sm font-semibold tracking-tight">Department Load</h2>
			<div class="mt-2 h-40">
				<canvas bind:this={departmentChart}></canvas>
			</div>
			<!-- The legend carries identity and the values, so the slices never rely on hue alone. -->
			<ul class="mt-4 space-y-1.5">
				{#each legend as item (item.label)}
					<li class="flex items-center gap-2.5 text-xs">
						<span class="h-2 w-2 shrink-0 rounded-full" style:background-color={item.color}></span>
						<span class="text-muted-foreground flex-1 truncate">{item.label}</span>
						<span class="font-medium tabular-nums">{item.value}</span>
						<span class="text-muted-foreground w-8 text-right tabular-nums">{item.share}%</span>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Documents by type -->
		<div class="bg-card border-border/60 flex flex-col rounded-xl border p-5 shadow-sm">
			<div class="flex items-baseline justify-between gap-3">
				<h2 class="text-sm font-semibold tracking-tight">Documents by Type</h2>
				<span class="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">All time</span>
			</div>
			<div class="mt-4 h-64">
				<canvas bind:this={typeChart}></canvas>
			</div>
		</div>
	</div>
</div>
