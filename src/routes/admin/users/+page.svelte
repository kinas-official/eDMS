<script lang="ts">
	import { Users, Building2, Plus, Pencil, Trash2, Table, Grid } from 'lucide-svelte';

	interface User {
		id: number;
		name: string;
		email: string;
		password: string;
		department: string;
		status: 'Active' | 'Inactive';
		createdAt: string;
	}

	// Mock users
	let users: User[] = [
		{
			id: 1,
			name: 'Jane Santos',
			email: 'jane@company.com',
			password: 'test123',
			department: 'HR',
			status: 'Active',
			createdAt: '2024-12-01'
		},
		{
			id: 2,
			name: 'Mark Reyes',
			email: 'mark@company.com',
			password: 'test123',
			department: 'IT',
			status: 'Active',
			createdAt: '2024-12-05'
		},
		{
			id: 3,
			name: 'Paul Cruz',
			email: 'paul@company.com',
			password: 'test123',
			department: 'Finance',
			status: 'Inactive',
			createdAt: '2024-12-10'
		}
	];

	let search = '';
	let filterDept = 'All';
	let filterStatus = 'All';
	let viewMode: 'table' | 'cards' = 'table';

	// Modal state
	let showCreate = false;
	let showEdit: User | null = null;

	// Form fields
	let formName = '';
	let formEmail = '';
	let formPassword = '';
	let formDept = '';
	let formStatus: 'Active' | 'Inactive' = 'Active';

	function openCreate() {
		formName = '';
		formEmail = '';
		formPassword = '';
		formDept = '';
		formStatus = 'Active';
		showCreate = true;
	}

	function createUser() {
		users = [
			...users,
			{
				id: Date.now(),
				name: formName,
				email: formEmail,
				department: formDept,
				password: formPassword,
				status: formStatus,
				createdAt: new Date().toISOString().split('T')[0]
			}
		];
		showCreate = false;
	}

	function openEdit(user: User) {
		showEdit = user;
		formName = user.name;
		formEmail = user.email;
		formPassword = user.password;
		formDept = user.department;
		formStatus = user.status;
	}

	function saveEdit() {
		if (!showEdit) return;
		users = users.map((u) =>
			u.id === showEdit!.id
				? {
						...u,
						name: formName,
						email: formEmail,
						password: formPassword,
						department: formDept,
						status: formStatus
					}
				: u
		);
		showEdit = null;
	}

	function removeUser(id: number) {
		if (!confirm('Delete this user?')) return;
		users = users.filter((u) => u.id !== id);
	}

	$: filteredUsers = users.filter(
		(u) =>
			(u.name.toLowerCase().includes(search.toLowerCase()) ||
				u.email.toLowerCase().includes(search.toLowerCase())) &&
			(filterDept === 'All' || u.department === filterDept) &&
			(filterStatus === 'All' || u.status === filterStatus)
	);
</script>

<div class="min-h-screen space-y-6 p-6 bg-background">
<!-- Search + Filters + View -->
<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
	<input
		type="text"
		placeholder="Search users..."
		bind:value={search}
		class="w-full rounded-md border px-3 py-2 text-sm md:w-64"
	/>

	<div class="flex gap-2">
		<select bind:value={filterDept} class="rounded-md border px-2 py-2 text-sm">
			<option>All</option>
			<option>HR</option>
			<option>IT</option>
			<option>Finance</option>
			<option>Legal</option>
		</select>

		<select bind:value={filterStatus} class="rounded-md border px-2 py-2 text-sm">
			<option>All</option>
			<option>Active</option>
			<option>Inactive</option>
		</select>
	</div>

	<div class="flex gap-2">
		<button
			class="flex items-center gap-1 rounded-md border px-3 py-2 text-sm"
			class:bg-primary={viewMode === 'table'}
			class:text-white={viewMode === 'table'}
			on:click={() => (viewMode = 'table')}
		>
			<Table class="h-4 w-4" /> Table
		</button>

		<button
			class="flex items-center gap-1 rounded-md border px-3 py-2 text-sm"
			class:bg-primary={viewMode === 'cards'}
			class:text-white={viewMode === 'cards'}
			on:click={() => (viewMode = 'cards')}
		>
			<Grid class="h-4 w-4" /> Cards
		</button>
	</div>

	<button
		class="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-4 py-2"
		on:click={openCreate}
	>
		<Plus class="h-4 w-4" /> New User
	</button>
</div>

<!-- Empty State -->
{#if filteredUsers.length === 0}
	<div class="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
		No users found.
	</div>
{/if}

<!-- Table View -->
{#if viewMode === 'table' && filteredUsers.length}
	<div class="bg-card overflow-x-auto rounded-xl border">
		<table class="w-full text-sm">
			<thead class="bg-muted/50 border-b">
				<tr>
					<th class="px-4 py-3 text-left">Name</th>
					<th class="px-4 py-3">Email</th>
					<th class="px-4 py-3 text-center">Department</th>
					<th class="px-4 py-3 text-center">Status</th>
					<th class="px-4 py-3 text-center">Created</th>
					<th class="px-4 py-3 text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredUsers as user}
					<tr class="hover:bg-muted border-b">
						<td class="px-4 py-3 font-medium">{user.name}</td>
						<td class="text-muted-foreground px-4 py-3 text-center text-sm">{user.email}</td>
						<td class="px-4 py-3 text-center">{user.department}</td>
						<td class="px-4 py-3 text-center">{user.status}</td>
						<td class="px-4 py-3 text-center">{user.createdAt}</td>
						<td class="flex justify-end gap-2 px-4 py-3">
							<button on:click={() => openEdit(user)}>
								<Pencil class="h-4 w-4" />
							</button>
							<button class="text-red-500" on:click={() => removeUser(user.id)}>
								<Trash2 class="h-4 w-4" />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<!-- Card View -->
{#if viewMode === 'cards'}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		{#each filteredUsers as user}
			<div class="bg-card rounded-xl border p-4 shadow">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold">{user.name}</h3>
					<div class="flex gap-2">
						<button on:click={() => openEdit(user)}>
							<Pencil class="h-4 w-4" />
						</button>
						<button class="text-red-500" on:click={() => removeUser(user.id)}>
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				</div>

				<p class="text-muted-foreground mt-1 text-sm">{user.email}</p>
				<p class="mt-2 text-sm">
					<Building2 class="inline h-4 w-4" />
					{user.department}
				</p>
				<p class="mt-1 text-sm">{user.status}</p>
			</div>
		{/each}
	</div>
{/if}
</div>

<!-- CREATE / EDIT MODAL -->
{#if showCreate || showEdit}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-card w-full max-w-md rounded-xl p-6">
			<h2 class="mb-4 text-lg font-semibold">{showEdit ? 'Edit User' : 'Create User'}</h2>

			<div class="space-y-3">
				<input
					placeholder="Name"
					bind:value={formName}
					type="string"
					class="w-full rounded-md border px-3 py-2 text-sm"
				/>
				<input
					placeholder="Email"
					bind:value={formEmail}
					type="email"
					class="w-full rounded-md border px-3 py-2 text-sm"
				/>
				<select bind:value={formDept} class="w-full rounded-md border px-3 py-2 text-sm">
					<option value="" disabled selected>Select department</option>
					<option>HR</option>
					<option>IT</option>
					<option>Finance</option>
					<option>Legal</option>
				</select>

				<input
					placeholder="Password"
					bind:value={formPassword}
					type="password"
					class="w-full rounded-md border px-3 py-2 text-sm"
				/>
				<select bind:value={formStatus} class="w-full rounded-md border px-3 py-2 text-sm">
					<option>Active</option>
					<option>Inactive</option>
				</select>
			</div>

			<div class="mt-4 flex justify-end gap-2">
				<button
					class="rounded-md border px-3 py-2 text-sm"
					on:click={() => ((showCreate = false), (showEdit = null))}
				>
					Cancel
				</button>
				<button
					class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
					on:click={showEdit ? saveEdit : createUser}
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}
