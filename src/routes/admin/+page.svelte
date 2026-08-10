<script lang="ts">
	import {
		FileText,
		Users,
		Clock,
		AlertTriangle,
		Plus,
		FolderOpen,
		Settings,
		Upload
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	import QuickActions from '../../lib/components/site/QuickActions.svelte';

	const quickActions = [
		{ label: 'New Document', icon: Plus },
		{ label: 'Upload File', icon: Upload },
		{ label: 'View Documents', icon: FolderOpen },
		{ label: 'Manage Users', icon: Users },
		{ label: 'System Settings', icon: Settings }
	];

	const kpis = {
		documents: 1248,
		employees: 87,
		pending: 34,
		overdue: 5
	};

	const weeklyActivity = [120, 150, 130, 170, 160, 180, 200];

	const departmentLoad = {
		labels: ['HR', 'Finance', 'IT', 'Legal', 'Admin'],
		values: [220, 310, 180, 140, 90]
	};

	let kpiChart: HTMLCanvasElement;
	let activityChart: HTMLCanvasElement;
	let departmentChart: HTMLCanvasElement;

	onMount(async () => {
		const { default: Chart } = await import('chart.js/auto');

		new Chart(kpiChart, {
			type: 'bar',
			data: {
				labels: ['Documents', 'Users', 'Pending', 'Overdue'],
				datasets: [
					{
						data: Object.values(kpis)
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } }
			}
		});

		new Chart(activityChart, {
			type: 'line',
			data: {
				labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
				datasets: [
					{
						data: weeklyActivity,
						tension: 0.4,
						fill: true
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } }
			}
		});

		new Chart(departmentChart, {
			type: 'doughnut',
			data: {
				labels: departmentLoad.labels,
				datasets: [
					{
						data: departmentLoad.values
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false
			}
		});
	});
</script>

<div class="min-h-screen space-y-8 bg-background">
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

	<!-- Charts + Activity -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
		<div class="bg-card border-border/60 rounded-xl border p-5 shadow-sm md:col-span-2">
			<h2 class="mb-4 text-sm font-semibold tracking-tight">Weekly Document Activity</h2>
			<div class="h-64">
				<canvas bind:this={activityChart}></canvas>
			</div>
		</div>

		<div class="bg-card border-border/60 rounded-xl border p-5 shadow-sm md:col-span-1">
			<h2 class="mb-4 text-sm font-semibold tracking-tight">Department Load</h2>
			<div class="h-64">
				<canvas bind:this={departmentChart}></canvas>
			</div>
		</div>

		<div class="bg-card border-border/60 rounded-xl border p-5 shadow-sm md:col-span-1">
			<h3 class="mb-4 text-sm font-semibold tracking-tight">KPI Overview</h3>
			<div class="h-64">
				<canvas bind:this={kpiChart}></canvas>
			</div>
		</div>
	</div>
</div>
