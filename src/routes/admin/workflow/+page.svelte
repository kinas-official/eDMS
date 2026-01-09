<script lang="ts">
  import { FileText, Users, UserCheck, Pencil, Trash2, Table, Grid, Plus } from 'lucide-svelte';

  interface User {
    id: number;
    name: string;
    department: string;
  }

  interface WorkflowItem {
    id: string;
    title: string;
    department: string;
    status: 'Draft' | 'Pending' | 'Reviewed' | 'Approved';
    assignedTo?: User;
    createdAt: string;
  }

  const users: User[] = [
    { id: 1, name: 'Jane Santos', department: 'HR' },
    { id: 2, name: 'Mark Reyes', department: 'HR' },
    { id: 3, name: 'Paul Cruz', department: 'IT' },
    { id: 4, name: 'Anna Lim', department: 'Finance' }
  ];

  let workflowItems: WorkflowItem[] = [
    { id: 'HR-091', title: 'Employee Handbook', department: 'HR', status: 'Draft', createdAt: '2024-12-20' },
        { id: 'HR-091', title: 'Employee Handbook', department: 'HR', status: 'Draft', createdAt: '2024-12-20' },
    { id: 'FIN-014', title: 'Budget Proposal Q1', department: 'Finance', status: 'Pending', createdAt: '2024-12-21' },
    { id: 'IT-332', title: 'Server Upgrade', department: 'IT', status: 'Reviewed', createdAt: '2024-12-18' }
  ];

  const stages: WorkflowItem['status'][] = ['Draft', 'Pending', 'Reviewed', 'Approved'];

  // Filters
  let filterDept: string = 'All';
  let filterStatus: string = 'All';
  let viewMode: 'table' | 'cards' = 'table';

  // Drag-and-drop
  let draggedItem: WorkflowItem | null = null;

  function handleDragStart(item: WorkflowItem) {
    draggedItem = item;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(stage: WorkflowItem['status']) {
    if (draggedItem) {
      workflowItems = workflowItems.map(i =>
        i.id === draggedItem!.id ? { ...i, status: stage } : i
      );
      draggedItem = null;
    }
  }

  // Assign modal
  let assignModal: WorkflowItem | null = null;
  let selectedUser: number | null = null;

  function openAssign(item: WorkflowItem) {
    assignModal = item;
    selectedUser = item.assignedTo?.id ?? null;
  }

  function saveAssign() {
    if (assignModal && selectedUser != null) {
      const user = users.find(u => u.id === selectedUser);
      workflowItems = workflowItems.map(i =>
        i.id === assignModal!.id ? { ...i, assignedTo: user } : i
      );
    }
    assignModal = null;
    selectedUser = null;
  }

  // Filtered items
  $: filteredItems = workflowItems.filter(item => 
    (filterDept === 'All' || item.department === filterDept) &&
    (filterStatus === 'All' || item.status === filterStatus)
  );

  // Add workflow modal
let addModal = false;

let newWorkflow: {
  title: string;
  department: string;
  status: WorkflowItem['status'];
} = {
  title: '',
  department: 'HR',
  status: 'Draft'
};

function openAddWorkflow() {
  addModal = true;
}

function saveWorkflow() {
  if (!newWorkflow.title.trim()) return;

  const newItem: WorkflowItem = {
    id: `${newWorkflow.department}-${Math.floor(Math.random() * 1000)}`,
    title: newWorkflow.title,
    department: newWorkflow.department,
    status: newWorkflow.status,
    createdAt: new Date().toISOString().split('T')[0]
  };

  workflowItems = [newItem, ...workflowItems];

  // reset
  newWorkflow = { title: '', department: 'HR', status: 'Draft' };
  addModal = false;
}

</script>

<div class="min-h-screen space-y-6 p-6 bg-background">
  <!-- Filters + View Toggle -->
  <div class="flex flex-wrap gap-4 items-center justify-between">
    <div class="flex gap-2 flex-wrap">
      <select bind:value={filterDept} class="rounded-md border px-3 py-2 text-sm">
        <option>All</option>
        <option>HR</option>
        <option>Finance</option>
        <option>IT</option>
      </select>

      <select bind:value={filterStatus} class="rounded-md border px-3 py-2 text-sm">
        <option>All</option>
        <option>Draft</option>
        <option>Pending</option>
        <option>Reviewed</option>
        <option>Approved</option>
      </select>
    </div>

    <button
  class="flex items-center gap-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
  on:click={openAddWorkflow}
>
  <Plus class="h-4 w-4" />
  Add Workflow
</button>


    <div class="flex gap-2">
      <button
        class="flex items-center gap-1 rounded-md border px-3 py-2 text-sm"
        class:bg-primary={viewMode === 'table'}
        class:text-white={viewMode === 'table'}
        on:click={() => viewMode = 'table'}
      >
        <Table class="h-4 w-4" /> Table
      </button>

      <button
        class="flex items-center gap-1 rounded-md border px-3 py-2 text-sm"
        class:bg-primary={viewMode === 'cards'}
        class:text-white={viewMode === 'cards'}
        on:click={() => viewMode = 'cards'}
      >
        <Grid class="h-4 w-4" /> Pipeline
      </button>
    </div>
  </div>

  <!-- Empty state -->
  {#if filteredItems.length === 0}
    <div class="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
      No workflow items found.
    </div>
  {/if}

  <!-- Table view -->
  {#if viewMode === 'table' && filteredItems.length}
   <div class="bg-card overflow-x-auto rounded-xl border">
  <table class="w-full text-sm table-auto">
    <thead class="bg-muted/50 border-b">
      <tr>
        <th class="px-4 py-3 text-left  gap-1">
        Title
        </th>
        <th class="px-4 py-3 text-center  gap-1">
          Department
        </th>
        <th class="px-4 py-3 text-center  gap-1">
          Status
        </th>
        <th class="px-4 py-3 text-center  gap-1">
          Assigned
        </th>
        <th class="px-4 py-3 text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each filteredItems as item}
        <tr class="hover:bg-muted border-b">
          <td class="px-4 py-3 font-medium">{item.title}</td>
          <td class="px-4 py-3 text-center">{item.department}</td>
          <td class="px-4 py-3 text-center">{item.status}</td>
          <td class="px-4 py-3 text-center">{item.assignedTo?.name ?? '-'}</td>
          <td class="px-4 py-3 flex justify-end gap-2">
            <button class="text-white flex items-center gap-1 bg-black p-2 rounded-md border" on:click={() => openAssign(item)}>
              <UserCheck class="h-4 w-4" /> Assign
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

  {/if}

  <!-- Card / Pipeline view -->
 {#if viewMode === 'cards' && filteredItems.length}
  <div class="flex gap-4 overflow-x-auto pb-4">
    {#each stages as stage}
      <div
        class="w-80 bg-card rounded-xl p-4 flex-shrink-0 border border-2"
        on:dragover={handleDragOver}
        on:drop={() => handleDrop(stage)}
      >
        <h3 class="font-semibold mb-4 text-center">{stage}</h3>
        <div class="flex flex-col gap-3 min-h-[200px]">
          {#each filteredItems.filter(i => i.status === stage) as item}
            <div
              class="bg-white rounded-md p-3 shadow cursor-move hover:bg-gray-100 border flex flex-col gap-2"
              draggable="true"
              on:dragstart={() => handleDragStart(item)}
            >
              <div class="flex justify-between items-center">
                <p class="font-medium">{item.title}</p>
                <span class="text-xs text-muted-foreground flex items-center gap-1">
                  <Users class="h-3 w-3" /> {item.assignedTo?.name ?? 'Unassigned'}
                </span>
              </div>
              <p class="text-xs text-muted-foreground">{item.department}</p>
              <button
                class="text-white flex items-center gap-1 bg-black p-2 rounded-md border text-sm mt-2"
                on:click={() => openAssign(item)}
              >
                <UserCheck class="h-4 w-4" /> Assign
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
{/if}

</div>

{#if addModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-card w-full max-w-md rounded-xl p-6">
      <h2 class="mb-4 text-lg font-semibold">Add Workflow</h2>

      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Title</label>
          <input
            type="text"
            bind:value={newWorkflow.title}
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Document title"
          />
        </div>

        <div>
          <label class="text-sm font-medium">Department</label>
          <select
            bind:value={newWorkflow.department}
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option>HR</option>
            <option>Finance</option>
            <option>IT</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium">Initial Status</label>
          <select
            bind:value={newWorkflow.status}
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {#each stages as stage}
              <option value={stage}>{stage}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button
          class="rounded-md border px-3 py-2 text-sm"
          on:click={() => (addModal = false)}
        >
          Cancel
        </button>

        <button
          class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          on:click={saveWorkflow}
        >
          Create
        </button>
      </div>
    </div>
  </div>
{/if}


<!-- Assign Modal -->
{#if assignModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-card w-full max-w-md rounded-xl p-6">
      <h2 class="mb-4 text-lg font-semibold">Assign Document</h2>
      <div class="space-y-3">
        <select bind:value={selectedUser} class="w-full rounded-md border px-3 py-2 text-sm">
          <option value={null}>Select user</option>
          {#each users.filter(u => u.department === assignModal!.department) as user}
            <option value={user.id}>{user.name}</option>
          {/each}
        </select>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button class="rounded-md border px-3 py-2 text-sm" on:click={() => (assignModal = null, selectedUser = null)}>
          Cancel
        </button>
        <button class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm" on:click={saveAssign}>
          Save
        </button>
      </div>
    </div>
  </div>
{/if}

