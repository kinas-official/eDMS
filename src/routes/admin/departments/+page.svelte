<script lang="ts">
	import { Building2, Users, Plus, Pencil, Trash2, Table, Grid } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	interface User {
		id: number;
		name: string;
		email: string;
	}

	interface Department {
		id: number;
		name: string;
		description: string;
		members: User[];
		createdAt: string;
	}

	// Mock data
	let departments: Department[] = [
		{
			id: 1,
			name: 'HR',
			description: 'Human Resources',
			createdAt: '2024-12-10',
			members: [
				{ id: 1, name: 'Jane Santos', email: 'jane@company.com' },
				{ id: 2, name: 'Mark Reyes', email: 'mark@company.com' }
			]
		},
		{
			id: 2,
			name: 'IT',
			description: 'Information Technology',
			createdAt: '2024-12-12',
			members: [{ id: 3, name: 'Paul Cruz', email: 'paul@company.com' }]
		},
		{
			id: 3,
			name: 'Finance',
			description: 'Finance & Accounting',
			createdAt: '2024-12-15',
			members: []
		}
	];

	let search = '';
	let viewMode: 'table' | 'cards' = 'table';

	// Modal state
	let showCreate = false;
	let showEdit: Department | null = null;

	// New / edit form
	let formName = '';
	let formDescription = '';

	function openCreate() {
		formName = '';
		formDescription = '';
		showCreate = true;
	}

	function createDepartment() {
		departments = [
			...departments,
			{
				id: Date.now(),
				name: formName,
				description: formDescription,
				createdAt: new Date().toISOString().split('T')[0],
				members: []
			}
		];
		showCreate = false;
	}

	function openEdit(dep: Department) {
		showEdit = dep;
		formName = dep.name;
		formDescription = dep.description;
	}

	function saveEdit() {
		if (!showEdit) return;
		departments = departments.map((d) =>
			d.id === showEdit!.id ? { ...d, name: formName, description: formDescription } : d
		);
		showEdit = null;
	}

	function removeDepartment(id: number) {
		if (!confirm('Delete this department?')) return;
		departments = departments.filter((d) => d.id !== id);
	}

	$: filteredDepartments = departments.filter((d) =>
		d.name.toLowerCase().includes(search.toLowerCase())
	);
</script>


<div class="min-h-screen space-y-6 p-6 bg-background"> 
<!-- Search + View -->
<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
	<input
		type="text"
		placeholder="Search department..."
		bind:value={search}
		class="w-full rounded-md border px-3 py-2 text-sm md:w-64"
	/>

	<div class="flex gap-2">
		<Button
			variant={viewMode === 'table' ? 'default' : 'outline'}
			size="sm"
			onclick={() => (viewMode = 'table')}
		>
			<Table class="h-4 w-4" />
			Table
		</Button>

		<Button
			variant={viewMode === 'cards' ? 'default' : 'outline'}
			size="sm"
			onclick={() => (viewMode = 'cards')}
		>
			<Grid class="h-4 w-4" />
			Cards
		</Button>
	</div>

	<Button onclick={openCreate}>
		<Plus class="h-4 w-4" />
		New Department
	</Button>
</div>

<!-- Empty State -->
{#if filteredDepartments.length === 0}
	<div class="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
		No departments found.
	</div>
{/if}

<!-- TABLE VIEW -->
<!-- TABLE VIEW -->
{#if viewMode === 'table' && filteredDepartments.length}
  <div class="bg-card overflow-x-auto rounded-xl border">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 border-b">
        <tr>
          <th class="px-4 py-3 text-left">Name</th>
          <th class="px-4 py-3">Info</th>
          <th class="px-4 py-3 text-center">Members</th>
          <th class="px-4 py-3 text-center">Created</th>
          <th class="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredDepartments as dep}
          <tr class="hover:bg-muted border-b">
            <td class="px-4 py-3 font-medium">{dep.name}</td>
            <td class="px-4 py-3 text-sm text-muted-foreground text-center">{dep.description}</td>
            <td class="px-4 py-3 text-center">{dep.members.length}</td>
            <td class="px-4 py-3 text-center">{dep.createdAt}</td>
            <td class="flex justify-end gap-2 px-4 py-3">
              <button on:click={() => openEdit(dep)}>
                <Pencil class="h-4 w-4" />
              </button>
              <button class="text-destructive hover:text-destructive/80" on:click={() => removeDepartment(dep.id)}>
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}


<!-- CARD VIEW -->
<!-- CARD VIEW -->
{#if viewMode === 'cards'}
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    {#each filteredDepartments as dep}
      <div class="bg-card rounded-xl border p-4 shadow">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">{dep.name}</h3>
          <div class="flex gap-2">
            <button on:click={() => openEdit(dep)}>
              <Pencil class="h-4 w-4" />
            </button>
            <button class="text-destructive hover:text-destructive/80" on:click={() => removeDepartment(dep.id)}>
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Info Section -->
        <p class="text-muted-foreground mt-1 text-sm">
          {dep.description}
        </p>

        <div class="mt-3 flex items-center gap-2 text-sm">
          <Users class="h-4 w-4" />
          {dep.members.length} members
        </div>
      </div>
    {/each}
  </div>
{/if}
</div>

<!-- CREATE / EDIT MODAL -->
{#if showCreate || showEdit}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-card w-full max-w-md rounded-xl p-6">
			<h2 class="mb-4 text-lg font-semibold">
				{showEdit ? 'Edit Department' : 'Create Department'}
			</h2>

			<div class="space-y-3">
				<input
					placeholder="Department name"
					bind:value={formName}
					class="w-full rounded-md border px-3 py-2 text-sm"
				/>

				<textarea
					placeholder="Description"
					bind:value={formDescription}
					class="w-full rounded-md border px-3 py-2 text-sm"
				/>
			</div>

			<div class="mt-4 flex justify-end gap-2">
				<Button variant="outline" onclick={() => ((showCreate = false), (showEdit = null))}>
					Cancel
				</Button>
				<Button onclick={showEdit ? saveEdit : createDepartment}>Save</Button>
			</div>
		</div>
	</div>
{/if}
