<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, Table, Grid, Eye, Settings, Trash2 } from 'lucide-svelte';
	import mammoth from 'mammoth';
	import UploadDropzone from '$lib/components/site/UploadDropzone.svelte';
	import { diffWords } from 'diff';
	import { Button } from '$lib/components/ui/button';
	import { StatusBadge } from '$lib/components/ui/status-badge';

	let role = 'admin';

	let systemActivity: ActivityLog[] = [];

	let documents: DocumentItem[] = [
		{
			id: 'HR-2024-091',
			title: 'Employee Handbook Update',
			department: 'HR',
			status: 'Approved',
			createdAt: '2024-12-20'
		},
		{
			id: 'FIN-2024-014',
			title: 'Budget Proposal Q1',
			department: 'Finance',
			status: 'Pending',
			createdAt: '2024-12-22'
		},
		{
			id: 'IT-REQ-332',
			title: 'Server Upgrade Request',
			department: 'IT',
			status: 'Rejected',
			createdAt: '2024-12-18'
		},
		{
			id: 'LEGAL-2024-055',
			title: 'Contract Review',
			department: 'Legal',
			status: 'Draft',
			createdAt: '2024-12-21'
		},
		{
			id: 'HR-2024-092',
			title: 'Holiday Policy Update',
			department: 'HR',
			status: 'Pending',
			createdAt: '2024-12-23'
		}
	];

	let search = '';
	let selectedDepartment = 'All';
	let selectedStatus = 'All';
	let viewMode: 'table' | 'cards' = 'table';

	$: filteredDocuments = documents.filter((doc) => {
		if (doc.deletedAt) return false;
		const matchesSearch =
			doc.title.toLowerCase().includes(search.toLowerCase()) ||
			doc.id.toLowerCase().includes(search.toLowerCase());
		const matchesDepartment = selectedDepartment === 'All' || doc.department === selectedDepartment;
		const matchesStatus = selectedStatus === 'All' || doc.status === selectedStatus;
		return matchesSearch && matchesDepartment && matchesStatus;
	});

	let files: File[] = [];
	let showModal = false;
	let currentFile: File | null = null;
	let filePreviewUrl: string | null = null;

	// Form fields for modal
	let title = '';
	let department = '';
	let status: DocumentStatus = 'Draft';
	let description = '';

	function handleSelect(event: CustomEvent<File[]>) {
		currentFile = event.detail[0];
		files.push(currentFile);

		// Create preview URL
		filePreviewUrl = URL.createObjectURL(currentFile);

		showModal = true;

		// Pre-fill title from filename
		title = currentFile.name;
		department = '';
		status = 'Draft';
		description = '';
	}

	let docxHtml: string | null = null;

	async function generateDocxPreview(file: File) {
		if (!file) return;

		if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
			const arrayBuffer = await file.arrayBuffer();

			const result = await mammoth.convertToHtml(
				{ arrayBuffer },
				{
					styleMap: [
						// Headings
						"p[style-name='Title'] => h1:fresh",
						"p[style-name='Heading 1'] => h2:fresh",
						"p[style-name='Heading 2'] => h3:fresh",
						// Text formatting
						'b => strong',
						'i => em',
						'u => u',
						"p[style-name='List Paragraph'] => ul > li:fresh",
						// Tables
						'table => table.fancy-table:fresh',
						'tr => tr:fresh',
						'tc => td:fresh'
					]
				}
			);

			docxHtml = result.value; // HTML content with headers, tables, bold, italic, lists, images
		} else {
			docxHtml = null;
		}
	}

	// Whenever a new file is selected
	$: if (currentFile) {
		generateDocxPreview(currentFile);
	}

	async function viewDocument(doc: DocumentItem) {
		activeDoc = doc;
		activeModal = 'view';

		// Reset
		viewPreviewUrl = null;
		viewDocxHtml = null;

		// TEMP: since no backend yet, reuse upload preview logic
		if (currentFile) {
			if (currentFile.type === 'application/pdf') {
				viewPreviewUrl = URL.createObjectURL(currentFile);
			}

			if (
				currentFile.type ===
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			) {
				const arrayBuffer = await currentFile.arrayBuffer();
				const result = await mammoth.convertToHtml(
					{ arrayBuffer },
					{
						styleMap: [
							"p[style-name='Title'] => h1:fresh",
							"p[style-name='Heading 1'] => h2:fresh",
							"p[style-name='Heading 2'] => h3:fresh",
							'table => table.fancy-table:fresh',
							'tr => tr:fresh',
							'tc => td:fresh'
						]
					}
				);

				viewDocxHtml = result.value;
			}
		}
	}

	function manageDocument(doc: DocumentItem, role = 'admin') {
		activeDoc = doc;
		activeModal = 'manage';
	}

	function closeModal() {
		activeModal = null;
		activeDoc = null;

		if (viewPreviewUrl) {
			URL.revokeObjectURL(viewPreviewUrl);
			viewPreviewUrl = null;
		}

		viewDocxHtml = null;
	}

	function deleteDocument(doc: DocumentItem) {
		if (!confirm(`Delete ${doc.title}?`)) return;

		documents = documents.map((d) =>
			d.id === doc.id ? { ...d, deletedAt: new Date().toISOString() } : d
		);

		logActivity(doc, 'deleted');
	}

	function restoreDocument(doc: DocumentItem) {
		doc.deletedAt = null;
		logActivity(doc, 'restored');
	}

	type ActiveModal = 'view' | 'manage' | null;

	let activeModal: ActiveModal = null;
	let activeDoc: DocumentItem | null = null;
	let activeTab: 'edit' | 'history' | 'timeline' = 'edit';

	type DocumentStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

	type DocumentVersion = {
		id: string;
		timestamp: string;
		editor: string;
		snapshot: Partial<DocumentItem>;
		file?: File; // optional, store actual file
		fileText?: string; // text extracted from DOCX/PDF for diffing
	};

	type ActivityLog = {
		id: string;
		action: 'created' | 'edited' | 'approved' | 'rejected' | 'deleted' | 'restored';
		actor: string;
		timestamp: string;
		details?: string;
	};

	type DocumentItem = {
		id: string;
		title: string;
		department: string;
		status: DocumentStatus;
		deletedAt?: string | null;
		createdAt?: string | null;
		versions?: DocumentVersion[];
		activity?: ActivityLog[];
	};

	const canEdit = (doc: DocumentItem, role = 'admin') => {
		if (doc.deletedAt) return false;
		if (role === 'viewer') return false;
		if (doc.status === 'Approved') return false;
		return true;
	};

	const canDelete = (doc: DocumentItem) => {
		if (role !== 'admin') return false;
		if (doc.deletedAt) return false;
		return true;
	};

	// Extract text from file (DOCX)
	async function extractFileText(file: File): Promise<string | null> {
		if (!file) return null;

		if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
			const arrayBuffer = await file.arrayBuffer();
			const result = await mammoth.extractRawText({ arrayBuffer });
			return result.value; // raw text from DOCX
		}

		// For other file types, you can return null or empty string
		return null;
	}

	// Create a new version of a document
	async function createVersion(doc: DocumentItem, file?: File): Promise<DocumentVersion> {
		let fileText: string | null = null;

		if (file) {
			fileText = await extractFileText(file);
		}

		const snapshot: DocumentVersion & { fileText?: string } = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			editor: 'Admin',
			snapshot: {
				title: doc.title,
				department: doc.department,
				status: doc.status
			},
			fileText: fileText ?? undefined // convert null -> undefined
		};

		doc.versions = [...(doc.versions ?? []), snapshot];
		return snapshot;
	}

	async function handleFileUpdate(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;

		updatedFile = input.files[0];

		// Extract text for diffing
		if (
			updatedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		) {
			const buffer = await updatedFile.arrayBuffer();
			const result = await mammoth.extractRawText({ arrayBuffer: buffer });
			updatedFileText = result.value;
		} else {
			updatedFileText = await updatedFile.text().catch(() => undefined);
		}
	}

	// Submit form for new document
	async function submitForm() {
		if (!currentFile) return;

		const fileText = await extractFileText(currentFile);

		const newDoc: DocumentItem = {
			id: `${department?.substring(0, 2).toUpperCase()}-${Date.now()}`,
			title,
			department,
			status,
			createdAt: new Date().toISOString().split('T')[0],
			versions: []
		};

		// Create initial version
		await createVersion(newDoc, currentFile);

		// Add to documents list
		documents = [newDoc, ...documents];

		// Reset modal
		showModal = false;
		if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
		filePreviewUrl = null;
		currentFile = null;
		title = '';
		department = '';
		status = 'Draft';
		description = '';
	}

	function saveChanges() {
		if (!activeDoc) return;

		const snapshot: DocumentVersion = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			editor: 'Admin',
			snapshot: {
				title: activeDoc.title,
				department: activeDoc.department,
				status: activeDoc.status
			}
		};

		documents = documents.map((doc) => {
			if (doc.id !== activeDoc!.id) return doc;

			return {
				...doc,
				title: activeDoc!.title,
				department: activeDoc!.department,
				status: activeDoc!.status,
				versions: [...(doc.versions ?? []), snapshot],
				activity: [
					...(doc.activity ?? []),
					{
						id: crypto.randomUUID(),
						action: 'edited',
						actor: 'Admin',
						timestamp: new Date().toISOString(),
						details: 'Metadata updated'
					}
				]
			};
		});

		// Status-based activity
		if (activeDoc.status === 'Approved') {
			logActivity(activeDoc, 'approved');
		}
		if (activeDoc.status === 'Rejected') {
			logActivity(activeDoc, 'rejected');
		}

		const original = documents.find((d) => d.id === activeDoc?.id);
		if (
			original &&
			original.title === activeDoc.title &&
			original.department === activeDoc.department &&
			original.status === activeDoc.status
		) {
			closeModal();
			return;
		}
	}

	function diffFields(prev: Partial<DocumentItem>, curr: Partial<DocumentItem>) {
		return Object.entries(curr).map(([key, value]) => ({
			field: key,
			before: prev[key as keyof DocumentItem],
			after: value,
			changed: prev[key as keyof DocumentItem] !== value
		}));
	}

	function logActivity(doc: DocumentItem, action: ActivityLog['action'], details?: string) {
		const entry: ActivityLog = {
			id: crypto.randomUUID(),
			action,
			actor: 'Admin',
			timestamp: new Date().toISOString(),
			details
		};

		systemActivity = [entry, ...systemActivity];

		doc.activity = [...(doc.activity ?? []), entry];
	}

	let viewPreviewUrl: string | null = null;
	let viewDocxHtml: string | null = null;

	/**
	 * Returns HTML showing GitHub-style diff between two strings
	 * Additions = green, Deletions = red
	 */
	function diffHtml(prev: string, curr: string) {
		const diffs = diffWords(prev || '', curr || '');

		return diffs
			.map((part) => {
				if (part.added) {
					return `<span style="background-color:#d4f8d4;color:#0a0;">${part.value}</span>`;
				} else if (part.removed) {
					return `<span style="background-color:#f8d4d4;color:#a00;text-decoration:line-through;">${part.value}</span>`;
				} else {
					return part.value;
				}
			})
			.join('');
	}

	let updatedFile: File | null = null;
	let updatedFileText: string | undefined;

	function saveDocumentChanges() {
		if (!activeDoc) return;

		const hasMetadataChange =
			activeDoc.title !== title ||
			activeDoc.department !== department ||
			activeDoc.status !== status;

		const hasFileChange = !!updatedFile;

		if (!hasMetadataChange && !hasFileChange) {
			showModal = false;
			return;
		}

		// Apply metadata updates
		activeDoc.title = title;
		activeDoc.department = department;
		activeDoc.status = status;

		// Create new version
		const newVersion: DocumentVersion & { fileText?: string } = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			editor: 'Admin',
			snapshot: {
				title,
				department,
				status
			},
			fileText: updatedFileText
		};

		activeDoc.versions = [...(activeDoc.versions ?? []), newVersion];

		// Optional: activity log
		logActivity(
			activeDoc,
			'edited',
			hasFileChange ? 'Updated document file' : 'Updated document metadata'
		);

		// Reset modal state
		updatedFile = null;
		updatedFileText = undefined;
		showModal = false;
	}
</script>

<div class="min-h-screen space-y-6 p-6">
	<!-- Drag-and-Drop Upload -->
	<UploadDropzone on:select={handleSelect} />

	<!-- Filters + View Toggle -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex flex-col gap-2 md:flex-row md:items-center">
			<input
				type="text"
				placeholder="Search documents..."
				bind:value={search}
				class="rounded-md border px-3 py-2 text-sm"
			/>
			<select bind:value={selectedDepartment} class="rounded-md border px-2 py-2 text-sm">
				<option>All</option>
				<option>HR</option>
				<option>Finance</option>
				<option>IT</option>
				<option>Legal</option>
			</select>
			<select bind:value={selectedStatus} class="rounded-md border px-2 py-2 text-sm">
				<option>All</option>
				<option>Draft</option>
				<option>Pending</option>
				<option>Approved</option>
				<option>Rejected</option>
			</select>
		</div>

		<!-- View Mode Buttons -->
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
	</div>

	<!-- Document Display -->
	{#if filteredDocuments.length > 0}
		{#if viewMode === 'table'}
			<div class="bg-card overflow-x-auto rounded-xl border">
				<table class="w-full text-center text-sm">
					<thead class="border-b">
						<tr>
							<th class="px-4 py-3">ID</th>
							<th class="px-4 py-3">Title</th>
							<th class="px-4 py-3">Department</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Date</th>
							<th class="px-4 py-3">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredDocuments as doc}
							<tr class="hover:bg-muted border-b">
								<td class="px-4 py-3">{doc.id}</td>
								<td class="px-4 py-3 font-medium">{doc.title}</td>
								<td class="px-4 py-3">{doc.department}</td>
								<td class="px-4 py-3"><StatusBadge status={doc.status} /></td>
								<td class="px-4 py-3">{doc.createdAt}</td>
								<td class="px-4 py-3">
									<div class="inline-flex gap-2">
										<!-- View -->
										<button
											class="hover:bg-muted hover:border-primary hover:text-primary flex rounded-md border
             px-2
             py-1 text-xs
             transition
             hover:-translate-y-[1px] hover:shadow-sm"
											on:click={() => viewDocument(doc)}
										>
											<Eye class="mr-1 h-4 w-4" /> View
										</button>

										<!-- Manage -->
										<button
											class="hover:bg-muted hover:border-primary hover:text-primary flex rounded-md border
             px-2
             py-1 text-xs
             transition hover:-translate-y-[1px] hover:shadow-sm
             "
											on:click={() => manageDocument(doc)}
										>
											<Settings class="mr-1 h-4 w-4" />
											Manage
										</button>

										<!-- Delete -->
										<button
											disabled={!canDelete(doc)}
											class="border-destructive/50 text-destructive flex rounded-md border px-2 py-1 text-xs
             transition
             hover:-translate-y-[1px] hover:border-destructive hover:bg-destructive/10
             hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
											on:click={() => deleteDocument(doc)}
										>
											<Trash2 class="mr-1 h-4 w-4" /> Delete
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if viewMode === 'cards'}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				{#each filteredDocuments as doc}
					<div class="bg-card rounded-xl border p-4 shadow transition hover:shadow-lg">
						<h3 class="font-semibold">{doc.title}</h3>
						<p class="text-muted-foreground text-sm">{doc.id}</p>
						<div class="mt-3 flex items-center justify-between text-sm">
							<span>{doc.department}</span>
							<StatusBadge status={doc.status} />
						</div>
						<p class="text-muted-foreground mt-2 text-xs">{doc.createdAt}</p>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div
			class="text-muted-foreground bg-card align- flex h-100 flex-col items-center justify-center rounded-xl border text-center"
		>
			<FileText class="h-16 w-16" />
			<h1>No documents found matching your filters.</h1>
		</div>
	{/if}
</div>

<!-- Modal with preview + extra info -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="max-h-[90vh] w-full max-w-[1200px] overflow-auto bg-card rounded-xl p-6 shadow-lg">
			<h2 class="mb-4 text-lg font-semibold">Document Details</h2>

			<!-- Modal Preview -->
			{#if filePreviewUrl || docxHtml}
				{#if currentFile}
					<div class="mb-4 max-h-[600px] overflow-auto border bg-muted/50 p-2">
						{#if currentFile.type.startsWith('image/')}
							<img src={filePreviewUrl} alt="Preview" class="mx-auto w-full object-contain" />
						{:else if currentFile.type === 'application/pdf'}
							<iframe src={filePreviewUrl} class="h-[600px] w-full border" />
						{:else if currentFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
							<div class="docx-preview">
								{@html docxHtml}
							</div>
						{:else}
							<p class="text-muted-foreground text-sm">Preview not available for this file type.</p>
						{/if}
					</div>
				{/if}
			{/if}

			<!-- Metadata Inputs -->
			<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm">Title</label>
					<input
						type="text"
						bind:value={title}
						class="w-full rounded-md border px-3 py-2 text-sm"
            required
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm">Department</label>
					<select bind:value={department} class="w-full rounded-md border px-3 py-2 text-sm" required>
						<option value="" disabled>Select department</option>
						<option>HR</option>
						<option>Finance</option>
						<option>IT</option>
						<option>Legal</option>
					</select>
				</div>

				<div>
					<label class="mb-1 block text-sm">Status</label>
					<select bind:value={status} class="w-full rounded-md border px-3 py-2 text-sm" required>
						<option>Draft</option>
						<option>Pending</option>
						<option>Approved</option>
						<option>Rejected</option>
					</select>
				</div>

				<div>
					<label class="mb-1 block text-sm">Description</label>
					<input
						type="text"
						bind:value={description}
						class="w-full rounded-md border px-3 py-2 text-sm"
            required
					/>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={() => (showModal = false)}>Cancel</Button>
				<Button onclick={submitForm}>Save</Button>
			</div>
		</div>
	</div>
{/if}

{#if activeModal === 'view' && activeDoc}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="max-h-[90vh] w-full max-w-[1200px] overflow-auto bg-card rounded-xl p-6 shadow-lg">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">{activeDoc.title}</h2>
				<button class="text-muted-foreground text-sm" on:click={closeModal}> Close </button>
			</div>

			<!-- Document preview -->
			<div class="h-[70vh] overflow-auto rounded-md border bg-muted/50 p-4">
				<!-- reuse your preview logic here -->
				{#if viewPreviewUrl}
					<iframe src={viewPreviewUrl} class="h-full w-full rounded-md border" />
				{:else if viewDocxHtml}
					<div class="docx-preview">
						{@html viewDocxHtml}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">No preview available.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if activeModal === 'manage' && activeDoc}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="max-h-[90vh] w-full max-w-[1000px] overflow-auto bg-card rounded-xl p-6 shadow-lg">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Manage Document</h2>
				<button class="text-muted-foreground text-sm" on:click={closeModal}> Close </button>
			</div>

			{#if !canEdit(activeDoc)}
				<div class="mb-4 rounded-md border bg-yellow-50 p-3 text-sm">
					This document is locked and read-only.
				</div>
			{/if}

			<!-- Tabs -->
			<div class="mb-4 flex border-b">
				<button
					class="-mb-px border-b-2 px-4 py-2 text-sm font-medium"
					class:border-primary={activeTab === 'edit'}
					class:text-primary={activeTab === 'edit'}
					class:text-muted-foreground={activeTab !== 'edit'}
					on:click={() => (activeTab = 'edit')}
				>
					Edit
				</button>
				<button
					class="-mb-px border-b-2 px-4 py-2 text-sm font-medium"
					class:border-primary={activeTab === 'history'}
					class:text-primary={activeTab === 'history'}
					class:text-muted-foreground={activeTab !== 'history'}
					on:click={() => (activeTab = 'history')}
				>
					Change History
				</button>
				<button
					class="-mb-px border-b-2 px-4 py-2 text-sm font-medium"
					class:border-primary={activeTab === 'timeline'}
					class:text-primary={activeTab === 'timeline'}
					class:text-muted-foreground={activeTab !== 'timeline'}
					on:click={() => (activeTab = 'timeline')}
				>
					Approval Timeline
				</button>
			</div>

			<!-- Tab Content -->
			<div class="mt-4">
				{#if activeTab === 'edit'}
					<div class="space-y-4">
						<div>
							<label class="mb-1 block text-sm">Title</label>
							<input
								class="w-full rounded-md border px-3 py-2 text-sm"
								bind:value={activeDoc.title}
								disabled={!canEdit(activeDoc)}
                required
							/>
						</div>

						<div>
							<label class="mb-1 block text-sm">Department</label>
							<select
								class="w-full rounded-md border px-3 py-2 text-sm"
								bind:value={activeDoc.department}
								disabled={!canEdit(activeDoc)}
                required
							>
								<option>HR</option>
								<option>Finance</option>
								<option>IT</option>
								<option>Legal</option>
							</select>
						</div>

						<div>
							<label class="mb-1 block text-sm">Status</label>
							<select
								class="w-full rounded-md border px-3 py-2 text-sm"
								bind:value={activeDoc.status}
								disabled={!canEdit(activeDoc)}
                required
							>
								<option>Draft</option>
								<option>Pending</option>
								<option>Approved</option>
								<option>Rejected</option>
							</select>
						</div>

						<div>
							{#if canEdit(activeDoc)}
								<div class="mb-4">
									<label class="mb-1 block text-sm font-medium">
										Upload New File (creates new version)
									</label>

									<input
										type="file"
										accept=".docx,.pdf,.txt"
										on:change={handleFileUpdate}
										class="text-xs"
									/>

									{#if updatedFile}
										<p class="text-muted-foreground mt-1 text-xs">
											Selected: {updatedFile.name}
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/if}

				{#if activeTab === 'history'}
					<h3 class="mb-2 text-sm font-medium">Change History</h3>

					{#if activeDoc.versions?.length}
						<ul class="space-y-4 text-xs">
							{#each activeDoc.versions as version, i}
								{#if i === 0}
									<!-- First version: show full snapshot -->
									<li class="border-l-2 border-border pl-2">
										<div class="text-sm font-medium">
											Initial version • {new Date(version.timestamp).toLocaleString()}
										</div>
										<div class="text-muted-foreground mt-1">
											{#each Object.entries(version.snapshot) as [key, value]}
												<div>
													<span class="font-semibold">{key}:</span>
													<span>{@html value}</span>
												</div>
											{/each}

											<!-- NEW: Show first file content if exists -->
											{#if version.fileText}
												<div class="doc-diff mt-2 overflow-auto border p-2 text-xs">
													{@html version.fileText}
													<!-- or diffHtml('', version.fileText) if you want diff from nothing -->
												</div>
											{/if}
										</div>
									</li>
								{:else}
									<!-- Subsequent versions: show diffs from previous version -->
									<li class="border-l-2 border-border pl-2">
										<div class="text-sm font-medium">
											Updated • {new Date(version.timestamp).toLocaleString()} • {version.editor}
										</div>
										<div class="mt-1">
											<!-- Metadata diffs -->
											{#each Object.entries(version.snapshot) as [key, value]}
												{#if diffFields( activeDoc.versions[i - 1]?.snapshot ?? {}, { [key]: value } )[0]?.changed}
													<div class="mb-1">
														<span class="font-semibold">{key}:</span>
														<span class="text-xs">
															{@html diffHtml(
																String(
																	diffFields(activeDoc.versions[i - 1]?.snapshot ?? {}, {
																		[key]: value
																	})[0].before || ''
																),
																String(value || '')
															)}
														</span>
													</div>
												{/if}
											{/each}

											<!-- NEW: Show file content diff -->
											{#if version.fileText}
												<div class="doc-diff mt-2 overflow-auto border p-2 text-xs">
													{@html diffHtml(
														activeDoc.versions[i - 1]?.fileText ?? '',
														version.fileText
													)}
												</div>
											{/if}
										</div>
									</li>
								{/if}
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground text-xs">No changes yet.</p>
					{/if}
				{/if}

				{#if activeTab === 'timeline'}
					<h3 class="mb-2 text-sm font-medium">Approval Timeline</h3>
					{#if activeDoc.activity?.length}
						<ul class="space-y-2 text-xs">
							{#each activeDoc.activity as log}
								<li>
									<div class="font-medium capitalize">{log.action}</div>
									<div class="text-muted-foreground">
										{new Date(log.timestamp).toLocaleString()} • {log.actor}
									</div>
									{#if log.details}
										<div class="text-muted-foreground text-[10px]">{log.details}</div>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground text-xs">No activity yet.</p>
					{/if}
				{/if}
			</div>

			<!-- Actions -->
			<div class="mt-6 flex justify-end gap-2">
				<Button variant="outline" onclick={closeModal}>Cancel</Button>
				<Button
					disabled={!canEdit(activeDoc) || activeTab !== 'edit'}
					onclick={saveDocumentChanges}
				>
					Save Changes
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.docx-preview table.fancy-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.docx-preview table.fancy-table th,
	.docx-preview table.fancy-table td {
		border: 1px solid #ccc;
		padding: 0.5rem;
	}

	.docx-preview h1,
	.docx-preview h2,
	.docx-preview h3 {
		margin: 0.5rem 0;
	}

	.docx-preview ul,
	.docx-preview ol {
		margin-left: 1.2rem;
	}
	.docx-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.docx-table th,
	.docx-table td {
		border: 1px solid #ccc; /* Add visible borders */
		padding: 0.5rem; /* Add spacing */
		text-align: left; /* Align text */
	}

	.docx-table th {
		background-color: #f3f3f3; /* Optional header background */
	}

	.docx-table tr:nth-child(even) td {
		background-color: #fafafa; /* Optional striped rows */
	}
</style>
