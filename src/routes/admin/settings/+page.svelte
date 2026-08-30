<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { ConfirmDialog } from '$lib/components/ui/confirm-dialog';
	import { themePreference, setTheme, type ThemePreference } from '$lib/theme';
	import { Sun, Moon, Monitor, Trash2 } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	// General
	let orgName = 'Acme Corporation';
	let supportEmail = 'support@acme.com';
	let defaultDepartment = 'HR';
	let timezone = 'UTC';

	// Documents
	let maxUploadSizeMb = 25;
	let allowedFileTypes = '.pdf, .docx, .xlsx, .txt';
	let enableVersioning = true;
	let requireApproval = true;

	// Notifications
	let notifySubmitted = true;
	let notifyAssigned = true;
	let weeklyDigest = false;

	// Security
	let sessionTimeout = '30';
	let require2fa = false;

	const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	];

	let saved = false;
	let saveTimeout: ReturnType<typeof setTimeout>;

	function saveSettings() {
		saved = true;
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => (saved = false), 2500);
	}

	let showClearLogsConfirm = false;

	function clearActivityLogs() {
		showClearLogsConfirm = false;
	}
</script>

<div class="divide-border/60 divide-y">
	<!-- General -->
	<section class="pb-6">
		<h2 class="text-sm font-semibold tracking-tight">General</h2>
		<p class="text-muted-foreground mt-1 text-sm">Basic information about your organization.</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1.5 block text-sm font-medium" for="org-name">Organization name</label>
				<input
					id="org-name"
					type="text"
					bind:value={orgName}
					class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
				/>
			</div>
			<div>
				<label class="mb-1.5 block text-sm font-medium" for="support-email">Support email</label>
				<input
					id="support-email"
					type="email"
					bind:value={supportEmail}
					class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
				/>
			</div>
			<div>
				<label class="mb-1.5 block text-sm font-medium" for="default-department">Default department</label>
				<select
					id="default-department"
					bind:value={defaultDepartment}
					class="border-border/60 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs"
				>
					<option>HR</option>
					<option>Finance</option>
					<option>IT</option>
					<option>Legal</option>
				</select>
			</div>
			<div>
				<label class="mb-1.5 block text-sm font-medium" for="timezone">Time zone</label>
				<select
					id="timezone"
					bind:value={timezone}
					class="border-border/60 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs"
				>
					<option>UTC</option>
					<option>America/New_York</option>
					<option>America/Los_Angeles</option>
					<option>Asia/Manila</option>
					<option>Europe/London</option>
				</select>
			</div>
		</div>
	</section>

	<!-- Appearance -->
	<section class="py-6">
		<h2 class="text-sm font-semibold tracking-tight">Appearance</h2>
		<p class="text-muted-foreground mt-1 text-sm">Choose how rDMS looks on this device.</p>

		<div class="mt-4 flex gap-2">
			{#each themeOptions as option}
				<Button
					variant={$themePreference === option.value ? 'default' : 'outline'}
					size="sm"
					onclick={() => setTheme(option.value)}
				>
					<option.icon class="h-4 w-4" />
					{option.label}
				</Button>
			{/each}
		</div>
	</section>

	<!-- Document Management -->
	<section class="py-6">
		<h2 class="text-sm font-semibold tracking-tight">Document Management</h2>
		<p class="text-muted-foreground mt-1 text-sm">Defaults applied to newly uploaded documents.</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1.5 block text-sm font-medium" for="max-upload">Max upload size (MB)</label>
				<input
					id="max-upload"
					type="number"
					min="1"
					bind:value={maxUploadSizeMb}
					class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
				/>
			</div>
			<div>
				<label class="mb-1.5 block text-sm font-medium" for="allowed-types">Allowed file types</label>
				<input
					id="allowed-types"
					type="text"
					bind:value={allowedFileTypes}
					class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
				/>
			</div>
		</div>

		<div class="mt-4 space-y-3">
			<div class="border-border/60 flex items-center justify-between gap-4 rounded-lg border p-4">
				<div>
					<p class="text-sm font-medium">Enable versioning</p>
					<p class="text-muted-foreground text-sm">Keep a history of every change made to a document.</p>
				</div>
				<Switch bind:checked={enableVersioning} />
			</div>
			<div class="border-border/60 flex items-center justify-between gap-4 rounded-lg border p-4">
				<div>
					<p class="text-sm font-medium">Require approval before publish</p>
					<p class="text-muted-foreground text-sm">New documents stay in Draft until an approver signs off.</p>
				</div>
				<Switch bind:checked={requireApproval} />
			</div>
		</div>
	</section>

	<!-- Notifications -->
	<section class="py-6">
		<h2 class="text-sm font-semibold tracking-tight">Notifications</h2>
		<p class="text-muted-foreground mt-1 text-sm">Choose what you get emailed about.</p>

		<div class="mt-4 space-y-3">
			<div class="border-border/60 flex items-center justify-between gap-4 rounded-lg border p-4">
				<div>
					<p class="text-sm font-medium">Document submitted for review</p>
					<p class="text-muted-foreground text-sm">Get notified when a document enters your queue.</p>
				</div>
				<Switch bind:checked={notifySubmitted} />
			</div>
			<div class="border-border/60 flex items-center justify-between gap-4 rounded-lg border p-4">
				<div>
					<p class="text-sm font-medium">Workflow assigned to you</p>
					<p class="text-muted-foreground text-sm">Get notified when someone assigns you a workflow item.</p>
				</div>
				<Switch bind:checked={notifyAssigned} />
			</div>
			<div class="border-border/60 flex items-center justify-between gap-4 rounded-lg border p-4">
				<div>
					<p class="text-sm font-medium">Weekly summary digest</p>
					<p class="text-muted-foreground text-sm">A weekly email recapping activity across all departments.</p>
				</div>
				<Switch bind:checked={weeklyDigest} />
			</div>
		</div>
	</section>

	<!-- Security -->
	<section class="py-6">
		<h2 class="text-sm font-semibold tracking-tight">Security</h2>
		<p class="text-muted-foreground mt-1 text-sm">Session and authentication policies.</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1.5 block text-sm font-medium" for="session-timeout">Session timeout</label>
				<select
					id="session-timeout"
					bind:value={sessionTimeout}
					class="border-border/60 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs"
				>
					<option value="15">15 minutes</option>
					<option value="30">30 minutes</option>
					<option value="60">1 hour</option>
					<option value="480">8 hours</option>
				</select>
			</div>
		</div>

		<div class="mt-4">
			<div class="border-border/60 flex items-center justify-between gap-4 rounded-lg border p-4">
				<div>
					<p class="text-sm font-medium">Require two-factor authentication for admins</p>
					<p class="text-muted-foreground text-sm">Admin accounts must verify with a second factor at sign-in.</p>
				</div>
				<Switch bind:checked={require2fa} />
			</div>
		</div>
	</section>

	<!-- Danger Zone -->
	<section class="pt-6">
		<h2 class="text-destructive text-sm font-semibold tracking-tight">Danger Zone</h2>
		<p class="text-muted-foreground mt-1 text-sm">Irreversible actions — proceed with caution.</p>

		<div class="border-destructive/30 bg-destructive/5 mt-4 flex items-center justify-between gap-4 rounded-lg border p-4">
			<div>
				<p class="text-sm font-medium">Clear activity log</p>
				<p class="text-muted-foreground text-sm">Permanently deletes the system-wide activity history.</p>
			</div>
			<Button variant="destructive" size="sm" onclick={() => (showClearLogsConfirm = true)}>
				<Trash2 class="h-4 w-4" />
				Clear log
			</Button>
		</div>
	</section>
</div>

<!-- Save bar -->
<div class="border-border/60 mt-6 flex items-center justify-end gap-3 border-t pt-6">
	{#if saved}
		<p class="text-muted-foreground text-sm" transition:fade={{ duration: 150 }}>Settings saved</p>
	{/if}
	<Button onclick={saveSettings}>Save Changes</Button>
</div>

<ConfirmDialog
	open={showClearLogsConfirm}
	title="Clear activity log?"
	description="This will permanently delete the system-wide activity history. This cannot be undone."
	confirmText="Clear log"
	onConfirm={clearActivityLogs}
	onCancel={() => (showClearLogsConfirm = false)}
/>
