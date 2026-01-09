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

<div class="min-h-screen space-y-6 p-6 bg-background">
	

	<!-- Quick Actions -->
	<div class="mb-10 grid grid-cols-2 gap-4 font-bold md:grid-cols-1">
		<h1 class="font-bold">Quick Actions</h1>
		<QuickActions actions={quickActions} />
	</div>

	<!-- KPI Cards + KPI Chart -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
		<div class="grid grid-cols-1 gap-4 md:col-span-4 md:grid-cols-4">
			<div class="bg-card rounded-xl border p-4 shadow">
				<div class="flex items-center gap-4">
					<FileText class="h-8 w-8" />
					<div>
						<p class="text-muted-foreground text-sm">Total Documents</p>
						<p class="text-xl font-bold">{kpis.documents}</p>
					</div>
				</div>
			</div>
			<div class="bg-card rounded-xl border p-4 shadow">
				<div class="flex items-center gap-4">
					<Users class="h-8 w-8" />
					<div>
						<p class="text-muted-foreground text-sm">Active Employees</p>
						<p class="text-xl font-bold">{kpis.employees}</p>
					</div>
				</div>
			</div>
			<div class="bg-card rounded-xl border p-4 shadow">
				<div class="flex items-center gap-4">
					<Clock class="h-8 w-8" />
					<div>
						<p class="text-muted-foreground text-sm">Pending Reviews</p>
						<p class="text-xl font-bold">{kpis.pending}</p>
					</div>
				</div>
			</div>
			<div class="bg-card rounded-xl border p-4 shadow">
				<div class="flex items-center gap-4">
					<AlertTriangle class="h-8 w-8" />
					<div>
						<p class="text-muted-foreground text-sm">Overdue</p>
						<p class="text-xl font-bold">{kpis.overdue}</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Charts + Activity -->
	<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
		<div class="bg-card rounded-xl border p-4 shadow md:col-span-2">
			<h2 class="mb-4 text-lg font-semibold">Weekly Document Activity</h2>
			<div class="h-64">
				<canvas bind:this={activityChart}></canvas>
			</div>
		</div>

		<div class="bg-card rounded-xl border p-4 shadow md:col-span-1">
			<h2 class="mb-4 text-lg font-semibold">Department Load</h2>
			<div class="h-64">
				<canvas bind:this={departmentChart}></canvas>
			</div>
		</div>

		<div class="bg-card rounded-xl border p-4 shadow md:col-span-1">
			<h3 class="mb-2 text-lg font-semibold">KPI Overview</h3>
			<div class="h-64">
				<canvas bind:this={kpiChart}></canvas>
			</div>
		</div>
	</div>
</div>
