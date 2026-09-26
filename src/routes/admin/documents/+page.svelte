<script lang="ts">
	import {
		FileText,
		Table,
		Grid,
		Eye,
		Settings,
		Trash2,
		X,
		Upload,
		Pencil,
		CircleCheck,
		CircleX,
		RotateCcw,
		Plus,
		Archive,
		History,
		ArrowRight,
		ChevronDown,
		Download,
		FileX
	} from '@lucide/svelte';
	import UploadDropzone from '$lib/components/site/UploadDropzone.svelte';
	import DocumentPreview from '$lib/components/site/DocumentPreview.svelte';
	import { docxToText, formatFileSize, previewKind } from '$lib/documents/preview';
	import { diffWords } from 'diff';
	import { Button } from '$lib/components/ui/button';
	import { StatusBadge } from '$lib/components/ui/status-badge';
	import { ConfirmDialog } from '$lib/components/ui/confirm-dialog';
	import { departmentNames } from '$lib/departments/store';
	import { settings } from '$lib/settings/store';
	import { toAcceptAttribute } from '$lib/settings/types';
	import { logActivity as recordActivity } from '$lib/activity/store';
	import type { ActivityAction, ActivityLog } from '$lib/activity/types';
	import { currentUser } from '$lib/auth/store';
	import { can } from '$lib/permissions';

	/** Files the dropzone turned away, shown until the next successful upload. */
	let uploadErrors: string[] = [];

	function handleReject(event: CustomEvent<{ file: File; reason: string }[]>) {
		uploadErrors = event.detail.map((r) => `${r.file.name} — ${r.reason}`);
	}

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

	let showModal = false;
	let currentFile: File | null = null;

	// Form fields for modal
	let title = '';
	let department = '';
	let status: DocumentStatus = 'Draft';
	let description = '';

	function handleSelect(event: CustomEvent<File[]>) {
		uploadErrors = [];
		currentFile = event.detail[0];
		showModal = true;

		// Pre-fill from the filename and the organization defaults in Settings.
		title = currentFile.name;
		department = $settings.general.defaultDepartment;
		status = initialStatus();
		description = '';
	}

	/**
	 * With approval required a new document must start as a Draft; with it off an
	 * admin can publish straight away.
	 */
	function initialStatus(): DocumentStatus {
		return $settings.documents.requireApproval ? 'Draft' : 'Approved';
	}

	function cancelUpload() {
		showModal = false;
		currentFile = null;
	}

	// ---- Preview --------------------------------------------------------------
	// Kept separate from `activeModal` so it can open on top of Manage (from a
	// Change History card) and drop back to it when closed.

	let previewDocId: string | null = null;
	let previewVersionId: string | null = null;

	$: previewDoc = previewDocId ? (documents.find((d) => d.id === previewDocId) ?? null) : null;
	$: allPreviewVersions = previewDoc?.versions ?? [];
	$: previewVersions = allPreviewVersions.filter((v) => v.file);
	$: previewVersion =
		previewVersions.find((v) => v.id === previewVersionId) ?? previewVersions.at(-1) ?? null;

	function openPreview(doc: DocumentItem, versionId: string | null = null) {
		previewDocId = doc.id;
		previewVersionId = versionId;
	}

	function closePreview() {
		previewDocId = null;
		previewVersionId = null;
	}

	function versionLabel(version: DocumentVersion) {
		return `v${allPreviewVersions.findIndex((v) => v.id === version.id) + 1}`;
	}

	async function downloadVersion(version: DocumentVersion) {
		if (!version.file) return;
		const { saveAs } = await import('file-saver');
		saveAs(version.file, version.fileName ?? version.file.name);
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && previewDocId) closePreview();
	}

	/**
	 * The Manage form edits these copies, never `activeDoc` itself, so typing
	 * doesn't change the list and Cancel really discards.
	 */
	let editTitle = '';
	let editDepartment = '';
	let editStatus: DocumentStatus = 'Draft';

	function manageDocument(doc: DocumentItem) {
		activeDoc = doc;
		activeModal = 'manage';
		activeTab = 'edit';
		editTitle = doc.title;
		editDepartment = doc.department;
		editStatus = doc.status;
		updatedFile = null;
		updatedFileText = undefined;
	}

	function closeModal() {
		activeModal = null;
		activeDoc = null;
		updatedFile = null;
		updatedFileText = undefined;
	}

	let docPendingDelete: DocumentItem | null = null;

	function requestDeleteDocument(doc: DocumentItem) {
		docPendingDelete = doc;
	}

	function deleteDocument(doc: DocumentItem) {
		documents = documents.map((d) =>
			d.id === doc.id ? { ...d, deletedAt: new Date().toISOString() } : d
		);

		logActivity(doc, 'deleted');
	}

	function confirmDeleteDocument() {
		if (docPendingDelete) deleteDocument(docPendingDelete);
		docPendingDelete = null;
	}

	function restoreDocument(doc: DocumentItem) {
		documents = documents.map((d) => (d.id === doc.id ? { ...d, deletedAt: null } : d));
		logActivity(doc, 'restored');
	}

	type ActiveModal = 'manage' | null;

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
		fileName?: string; // set when this version uploaded a file
		fileText?: string; // text extracted from DOCX/plain text for diffing
	};

	// `ActivityLog` now comes from $lib/activity/types — the shared audit log.

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

	// Reactive so the template re-evaluates them when the signed-in user changes.
	$: canEdit = (doc: DocumentItem) => {
		if (doc.deletedAt) return false;
		if (!can($currentUser, 'upload')) return false;
		if (doc.status === 'Approved') return false;
		return true;
	};

	$: canDelete = (doc: DocumentItem) => {
		if (!can($currentUser, 'delete')) return false;
		if (doc.deletedAt) return false;
		return true;
	};

	/**
	 * Text used for the content diff in Change History. PDFs, images etc. return
	 * null: read as text they'd come through as binary noise.
	 */
	async function extractFileText(file: File): Promise<string | null> {
		const kind = previewKind(file);
		try {
			if (kind === 'docx') return await docxToText(file);
			if (kind === 'text') return await file.text();
		} catch {
			// Unreadable file: still accept the upload, just without a content diff.
		}
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
			editor: actor,
			snapshot: {
				title: doc.title,
				department: doc.department,
				status: doc.status
			},
			file,
			fileName: file?.name,
			fileText: fileText ?? undefined // convert null -> undefined
		};

		doc.versions = [...(doc.versions ?? []), snapshot];
		return snapshot;
	}

	async function handleFileUpdate(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;

		updatedFile = input.files[0];
		updatedFileText = (await extractFileText(updatedFile)) ?? undefined;
	}

	// Submit form for new document
	async function submitForm() {
		if (!currentFile) return;

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
		logActivity(newDoc, 'created', `Uploaded ${currentFile.name}`);

		// Reset modal
		showModal = false;
		currentFile = null;
		title = '';
		department = '';
		status = initialStatus();
		description = '';
	}

	/**
	 * Writes to the shared, persisted audit log and mirrors the entry onto the
	 * document's own trail. The per-document trail is part of version history, so
	 * it follows the "Enable versioning" setting; the system log always records.
	 */
	function logActivity(doc: DocumentItem, action: ActivityAction, details?: string) {
		const entry = recordActivity(action, {
			actor,
			details,
			target: doc.title,
			targetId: doc.id
		});

		// Look the document up by id rather than mutating `doc`: callers often hold
		// a copy that has already been replaced in `documents`.
		if ($settings.documents.enableVersioning) {
			documents = documents.map((d) =>
				d.id === doc.id ? { ...d, activity: [...(d.activity ?? []), entry] } : d
			);
		}
	}

	$: actor = $currentUser?.username ?? 'Unknown';

	/**
	 * Returns HTML showing GitHub-style diff between two strings
	 * Additions = green, Deletions = red
	 */
	function diffHtml(prev: string, curr: string) {
		const diffs = diffWords(prev || '', curr || '');

		return diffs
			.map((part) => {
				// The text is user-supplied (titles, file contents) and goes into {@html}.
				const value = escapeHtml(part.value);
				if (part.added) {
					return `<span class="diff-add">${value}</span>`;
				} else if (part.removed) {
					return `<span class="diff-remove">${value}</span>`;
				} else {
					return value;
				}
			})
			.join('');
	}

	function escapeHtml(text: string) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	let updatedFile: File | null = null;
	let updatedFileText: string | undefined;

	const FIELD_LABELS = { title: 'Title', department: 'Department', status: 'Status' } as const;
	type TrackedField = keyof typeof FIELD_LABELS;
	const TRACKED_FIELDS = Object.keys(FIELD_LABELS) as TrackedField[];

	function formatTime(iso: string) {
		return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	}

	/** The tracked fields that differ between two versions, in display order. */
	function versionChanges(prev: DocumentVersion, curr: DocumentVersion) {
		return TRACKED_FIELDS.filter(
			(field) => field in curr.snapshot && prev.snapshot[field] !== curr.snapshot[field]
		).map((field) => ({
			field,
			before: String(prev.snapshot[field] ?? ''),
			after: String(curr.snapshot[field] ?? '')
		}));
	}

	const ACTION_STYLES: Record<ActivityAction, { icon: typeof Pencil; class: string }> = {
		created: { icon: Plus, class: 'bg-blue-500/15 text-blue-600 dark:text-blue-300' },
		edited: { icon: Pencil, class: 'bg-muted text-muted-foreground' },
		approved: { icon: CircleCheck, class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' },
		rejected: { icon: CircleX, class: 'bg-red-500/15 text-red-600 dark:text-red-300' },
		deleted: { icon: Trash2, class: 'bg-red-500/15 text-red-600 dark:text-red-300' },
		restored: { icon: RotateCcw, class: 'bg-blue-500/15 text-blue-600 dark:text-blue-300' },
		archived: { icon: Archive, class: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
		purged: { icon: Trash2, class: 'bg-red-500/15 text-red-600 dark:text-red-300' }
	};

	let replaceFileInput: HTMLInputElement;

	function clearReplacementFile() {
		updatedFile = null;
		updatedFileText = undefined;
		if (replaceFileInput) replaceFileInput.value = '';
	}


	function saveDocumentChanges() {
		if (!activeDoc) return;

		const original = activeDoc;
		const next = { title: editTitle.trim(), department: editDepartment, status: editStatus };
		if (!next.title) return;

		const changed = (Object.keys(next) as (keyof typeof next)[]).filter(
			(field) => original[field] !== next[field]
		);

		if (!changed.length && !updatedFile) {
			closeModal();
			return;
		}

		const now = new Date().toISOString();
		let versions = original.versions ?? [];

		if ($settings.documents.enableVersioning) {
			// Seeded documents (and ones created while versioning was off) have no
			// history yet. Record where they started so this edit shows as a diff
			// instead of becoming the "initial version".
			if (!versions.length) {
				versions = [
					{
						id: crypto.randomUUID(),
						timestamp: original.createdAt ? new Date(original.createdAt).toISOString() : now,
						editor: 'System',
						snapshot: {
							title: original.title,
							department: original.department,
							status: original.status
						}
					}
				];
			}

			versions = [
				...versions,
				{
					id: crypto.randomUUID(),
					timestamp: now,
					editor: actor,
					snapshot: next,
					file: updatedFile ?? undefined,
					fileName: updatedFile?.name,
					fileText: updatedFileText
				}
			];
		}

		documents = documents.map((d) => (d.id === original.id ? { ...d, ...next, versions } : d));

		const details = [
			...changed.map((field) => `${FIELD_LABELS[field]}: ${original[field]} → ${next[field]}`),
			...(updatedFile ? [`File replaced with ${updatedFile.name}`] : [])
		].join('; ');

		logActivity(original, 'edited', details);

		if (changed.includes('status') && (next.status === 'Approved' || next.status === 'Rejected')) {
			logActivity(original, next.status === 'Approved' ? 'approved' : 'rejected');
		}

		closeModal();
	}
</script>

<div class="space-y-6">
	<!-- Drag-and-Drop Upload -->
	{#if can($currentUser, 'upload')}
		<UploadDropzone
			on:select={handleSelect}
			on:reject={handleReject}
			allowedFileTypes={$settings.documents.allowedFileTypes}
			maxSizeMb={$settings.documents.maxUploadSizeMb}
		/>
	{/if}

	{#if uploadErrors.length}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
			<p class="font-medium">
				{uploadErrors.length}
				{uploadErrors.length === 1 ? 'file was' : 'files were'} not accepted
			</p>
			<ul class="mt-1 list-inside list-disc space-y-0.5">
				{#each uploadErrors as error}
					<li>{error}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Filters + View Toggle -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex flex-col gap-2 md:flex-row md:items-center">
			<input
				type="text"
				placeholder="Search documents..."
				bind:value={search}
				class="border-border/60 focus-visible:ring-ring/50 rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
			/>
			<div class="flex items-center gap-2">
				<label for="doc-filter-department" class="text-muted-foreground shrink-0 text-xs font-medium">Department</label>
				<select id="doc-filter-department" bind:value={selectedDepartment} class="border-border/60 rounded-lg border bg-transparent px-2 py-2 text-sm shadow-xs">
					<option>All</option>
					{#each $departmentNames as name (name)}
						<option>{name}</option>
					{/each}
				</select>
			</div>
			<div class="flex items-center gap-2">
				<label for="doc-filter-status" class="text-muted-foreground shrink-0 text-xs font-medium">Status</label>
				<select id="doc-filter-status" bind:value={selectedStatus} class="border-border/60 rounded-lg border bg-transparent px-2 py-2 text-sm shadow-xs">
					<option>All</option>
					<option>Draft</option>
					<option>Pending</option>
					<option>Approved</option>
					<option>Rejected</option>
				</select>
			</div>
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
			<div class="bg-card border-border/60 overflow-x-auto rounded-xl border shadow-sm">
				<table class="w-full text-center text-sm">
					<thead class="border-border/60 border-b">
						<tr>
							<th class="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide uppercase">ID</th>
							<th class="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide uppercase">Title</th>
							<th class="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide uppercase">Department</th>
							<th class="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide uppercase">Status</th>
							<th class="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide uppercase">Date</th>
							<th class="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide uppercase">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredDocuments as doc}
							<tr class="hover:bg-muted/50 border-border/60 border-b transition-colors">
								<td class="text-muted-foreground px-4 py-3.5">{doc.id}</td>
								<td class="px-4 py-3.5 font-medium">
									<button class="hover:underline" on:click={() => openPreview(doc)}>{doc.title}</button>
								</td>
								<td class="px-4 py-3.5">{doc.department}</td>
								<td class="px-4 py-3.5"><StatusBadge status={doc.status} /></td>
								<td class="text-muted-foreground px-4 py-3.5">{doc.createdAt}</td>
								<td class="px-4 py-3.5">
									<div class="inline-flex gap-2">
										<!-- View -->
										<button
											class="hover:bg-muted hover:border-foreground/20 border-border/60 flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-y-px hover:shadow-sm"
											on:click={() => openPreview(doc)}
										>
											<Eye class="mr-1 h-3.5 w-3.5" /> View
										</button>

										<!-- Manage -->
										<button
											class="hover:bg-muted hover:border-foreground/20 border-border/60 flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-y-px hover:shadow-sm"
											on:click={() => manageDocument(doc)}
										>
											<Settings class="mr-1 h-3.5 w-3.5" />
											Manage
										</button>

										<!-- Delete -->
										<button
											disabled={!canDelete(doc)}
											class="border-destructive/40 text-destructive flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-y-px hover:border-destructive hover:bg-destructive/10 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
											on:click={() => requestDeleteDocument(doc)}
										>
											<Trash2 class="mr-1 h-3.5 w-3.5" /> Delete
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
					<div class="bg-card border-border/60 flex flex-col rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
						<button class="text-left font-semibold tracking-tight hover:underline" on:click={() => openPreview(doc)}>
							{doc.title}
						</button>
						<p class="text-muted-foreground mt-0.5 text-sm">{doc.id}</p>
						<div class="mt-4 flex items-center justify-between text-sm">
							<span class="text-muted-foreground">{doc.department}</span>
							<StatusBadge status={doc.status} />
						</div>
						<p class="text-muted-foreground mt-3 text-xs">{doc.createdAt}</p>
						<div class="border-border/60 mt-4 flex gap-2 border-t pt-4">
							<Button variant="outline" size="sm" class="flex-1" onclick={() => openPreview(doc)}>
								<Eye class="h-3.5 w-3.5" /> View
							</Button>
							<Button variant="outline" size="sm" class="flex-1" onclick={() => manageDocument(doc)}>
								<Settings class="h-3.5 w-3.5" /> Manage
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div
			class="text-muted-foreground bg-card border-border/60 flex h-80 flex-col items-center justify-center gap-2 rounded-xl border text-center shadow-sm"
		>
			<FileText class="h-12 w-12 opacity-40" />
			<h1 class="text-sm font-medium">No documents found matching your filters.</h1>
		</div>
	{/if}
</div>

<!-- Modal with preview + extra info -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="max-h-[90vh] w-full max-w-[1200px] overflow-auto bg-card border-border/60 rounded-2xl border p-6 shadow-2xl">
			<h2 class="mb-4 text-lg font-semibold">Document Details</h2>

			<!-- Modal Preview -->
			<div class="border-border/60 bg-muted/40 mb-4 h-[50vh] overflow-auto rounded-xl border p-3">
				<DocumentPreview file={currentFile} class="h-full" />
			</div>

			<!-- Metadata Inputs -->
			<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label class="mb-1.5 block text-sm font-medium" for="new-doc-title">Title</label>
					<input
						id="new-doc-title"
						type="text"
						bind:value={title}
						class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
            required
					/>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium" for="new-doc-department">Department</label>
					<select id="new-doc-department" bind:value={department} class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2" required>
						<option value="" disabled>Select department</option>
						{#each $departmentNames as name (name)}
							<option>{name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium" for="new-doc-status">Status</label>
					<select
						id="new-doc-status"
						bind:value={status}
						disabled={$settings.documents.requireApproval}
						class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2 disabled:opacity-60"
						required
					>
						<option>Draft</option>
						<option>Pending</option>
						<option>Approved</option>
						<option>Rejected</option>
					</select>
					{#if $settings.documents.requireApproval}
						<p class="text-muted-foreground mt-1.5 text-xs">
							Locked to Draft because “Require approval before publish” is on in Settings.
						</p>
					{/if}
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium" for="new-doc-description">Description</label>
					<input
						id="new-doc-description"
						type="text"
						bind:value={description}
						class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
            required
					/>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={cancelUpload}>Cancel</Button>
				<Button onclick={submitForm}>Save</Button>
			</div>
		</div>
	</div>
{/if}

{#if activeModal === 'manage' && activeDoc}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="max-h-[90vh] w-full max-w-[1000px] overflow-auto bg-card border-border/60 rounded-2xl border p-6 shadow-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Manage Document</h2>
				<button class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1.5 text-sm transition-colors" on:click={closeModal} aria-label="Close">
					<X class="h-4 w-4" />
				</button>
			</div>

			{#if !canEdit(activeDoc)}
				<div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
					This document is locked and read-only.
				</div>
			{/if}

			<!-- Tabs -->
			<div class="mb-4 flex border-border/60 border-b">
				<button
					class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors"
					class:border-primary={activeTab === 'edit'}
					class:text-primary={activeTab === 'edit'}
					class:text-muted-foreground={activeTab !== 'edit'}
					on:click={() => (activeTab = 'edit')}
				>
					Edit
				</button>
				{#if $settings.documents.enableVersioning}
					<button
						class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors"
						class:border-primary={activeTab === 'history'}
						class:text-primary={activeTab === 'history'}
						class:text-muted-foreground={activeTab !== 'history'}
						on:click={() => (activeTab = 'history')}
					>
						Change History
					</button>
				{/if}
				<button
					class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors"
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
							<label class="mb-1.5 block text-sm font-medium" for="manage-doc-title">Title</label>
							<input
								id="manage-doc-title"
								class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
								bind:value={editTitle}
								disabled={!canEdit(activeDoc)}
                required
							/>
						</div>

						<div>
							<label class="mb-1.5 block text-sm font-medium" for="manage-doc-department">Department</label>
							<select
								id="manage-doc-department"
								class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
								bind:value={editDepartment}
								disabled={!canEdit(activeDoc)}
                required
							>
								{#each $departmentNames as name (name)}
									<option>{name}</option>
								{/each}
								{#if !$departmentNames.includes(activeDoc.department)}
									<!-- Keep a department that has since been deleted selectable. -->
									<option>{activeDoc.department}</option>
								{/if}
							</select>
						</div>

						<div>
							<label class="mb-1.5 block text-sm font-medium" for="manage-doc-status">Status</label>
							<select
								id="manage-doc-status"
								class="border-border/60 focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-shadow focus-visible:ring-2"
								bind:value={editStatus}
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
									<p class="mb-1.5 text-sm font-medium">
										{$settings.documents.enableVersioning ? 'Upload new file' : 'Replace file'}
									</p>

									<div class="relative">
										<label
											for="doc-replace-file"
											class={`group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-3 pr-12 transition-colors focus-within:ring-ring/50 focus-within:ring-2 ${
												updatedFile
													? 'border-primary/50 bg-primary/5'
													: 'border-border hover:border-primary/50 hover:bg-muted/50'
											}`}
										>
											<input
												id="doc-replace-file"
												bind:this={replaceFileInput}
												type="file"
												accept={toAcceptAttribute($settings.documents.allowedFileTypes) || undefined}
												on:change={handleFileUpdate}
												class="sr-only"
											/>
											<span
												class="bg-muted text-muted-foreground group-hover:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
											>
												{#if updatedFile}
													<FileText class="h-5 w-5" />
												{:else}
													<Upload class="h-5 w-5" />
												{/if}
											</span>
											<span class="min-w-0 flex-1">
												<span class="block truncate text-sm font-medium">
													{updatedFile ? updatedFile.name : 'Choose a file'}
												</span>
												<span class="text-muted-foreground block text-xs">
													{#if updatedFile}
														{formatFileSize(updatedFile.size)} · click to choose a different file
													{:else}
														Click to browse{$settings.documents.enableVersioning
															? ' · saving creates a new version'
															: ''}
													{/if}
												</span>
											</span>
										</label>

										{#if updatedFile}
											<button
												type="button"
												aria-label="Remove selected file"
												class="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1.5 transition-colors"
												on:click={clearReplacementFile}
											>
												<X class="h-4 w-4" />
											</button>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				{#if activeTab === 'history' && $settings.documents.enableVersioning}
					{#if activeDoc.versions?.length}
						{@const versions = activeDoc.versions}
						<!-- Newest first; each card is compared with the version before it. -->
						<ol class="space-y-4">
							{#each versions.map((version, index) => ({ version, index })).reverse() as { version, index } (version.id)}
								{@const prev = index > 0 ? versions[index - 1] : null}
								{@const changes = prev ? versionChanges(prev, version) : []}
								{@const isCurrent = index === versions.length - 1}
								<li class="relative pl-10">
									{#if index > 0}
										<span class="bg-border absolute top-8 -bottom-4 left-[13px] w-px" aria-hidden="true"></span>
									{/if}
									<span
										class={`bg-card absolute top-0.5 left-0 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
											isCurrent ? 'border-primary text-foreground' : 'border-border text-muted-foreground'
										}`}
									>
										v{index + 1}
									</span>

									<div class="border-border/60 bg-card rounded-xl border p-4">
										<div class="flex flex-wrap items-center justify-between gap-2">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium">
													{prev ? `Edited by ${version.editor}` : 'Initial version'}
												</span>
												{#if isCurrent}
													<StatusBadge tone="info">Current</StatusBadge>
												{/if}
											</div>
											<div class="flex items-center gap-3">
												<time class="text-muted-foreground text-xs" datetime={version.timestamp}>
													{formatTime(version.timestamp)}
												</time>
												{#if version.file}
													{@const doc = activeDoc}
													<Button variant="outline" size="sm" onclick={() => openPreview(doc, version.id)}>
														<Eye class="h-3.5 w-3.5" /> Preview
													</Button>
												{/if}
											</div>
										</div>

										{#if !prev || changes.length || version.fileName}
											<dl class="mt-3 grid grid-cols-[6.5rem_1fr] items-center gap-x-3 gap-y-2 text-sm">
												{#if !prev}
													{#each TRACKED_FIELDS as field (field)}
														<dt class="text-muted-foreground text-xs">{FIELD_LABELS[field]}</dt>
														<dd>
															{#if field === 'status'}
																<StatusBadge status={String(version.snapshot.status)} />
															{:else}
																{version.snapshot[field]}
															{/if}
														</dd>
													{/each}
												{:else}
													{#each changes as change (change.field)}
														<dt class="text-muted-foreground text-xs">{FIELD_LABELS[change.field]}</dt>
														<dd class="flex min-w-0 flex-wrap items-center gap-2">
															{#if change.field === 'status'}
																<StatusBadge status={change.before} class="opacity-60" />
																<ArrowRight class="text-muted-foreground h-3.5 w-3.5 shrink-0" />
																<StatusBadge status={change.after} />
															{:else}
																<span class="diff-before">{change.before}</span>
																<ArrowRight class="text-muted-foreground h-3.5 w-3.5 shrink-0" />
																<span class="diff-after">{change.after}</span>
															{/if}
														</dd>
													{/each}
												{/if}
												{#if version.fileName}
													<dt class="text-muted-foreground text-xs">File</dt>
													<dd class="flex min-w-0 items-center gap-1.5">
														<FileText class="text-muted-foreground h-3.5 w-3.5 shrink-0" />
														<span class="truncate">{version.fileName}</span>
													</dd>
												{/if}
											</dl>
										{:else}
											<p class="text-muted-foreground mt-2 text-sm">No field changes.</p>
										{/if}

										{#if version.fileText}
											<details class="group border-border/60 mt-3 rounded-lg border" open={!!prev?.fileText}>
												<summary
													class="hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium select-none"
												>
													<FileText class="text-muted-foreground h-3.5 w-3.5" />
													{prev?.fileText ? 'Content changes' : 'File content'}
													<ChevronDown
														class="text-muted-foreground ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
													/>
												</summary>
												<div
													class="doc-diff border-border/60 max-h-64 overflow-auto border-t px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap"
												>
													{#if prev?.fileText}
														{@html diffHtml(prev.fileText, version.fileText)}
													{:else}
														{version.fileText}
													{/if}
												</div>
											</details>
										{/if}
									</div>
								</li>
							{/each}
						</ol>
					{:else}
						<div class="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
							<History class="h-8 w-8 opacity-40" />
							No changes yet.
						</div>
					{/if}
				{/if}

				{#if activeTab === 'timeline'}
					{#if activeDoc.activity?.length}
						{@const entries = [...activeDoc.activity].reverse()}
						<ol>
							{#each entries as log, i (log.id)}
								{@const style = ACTION_STYLES[log.action] ?? ACTION_STYLES.edited}
								{@const Icon = style.icon}
								<li class="relative flex gap-3 pb-5 last:pb-0">
									{#if i < entries.length - 1}
										<span class="bg-border absolute top-9 bottom-1 left-4 w-px" aria-hidden="true"></span>
									{/if}
									<span class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.class}`}>
										<Icon class="h-4 w-4" />
									</span>
									<div class="min-w-0 flex-1 pt-1">
										<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
											<p class="text-sm">
												<span class="font-medium capitalize">{log.action}</span>
												<span class="text-muted-foreground">by {log.actor}</span>
											</p>
											<time class="text-muted-foreground text-xs" datetime={log.timestamp}>
												{formatTime(log.timestamp)}
											</time>
										</div>
										{#if log.details}
											<ul class="text-muted-foreground mt-1 space-y-0.5 text-xs">
												{#each log.details.split('; ') as line}
													<li>{line}</li>
												{/each}
											</ul>
										{/if}
									</div>
								</li>
							{/each}
						</ol>
					{:else}
						<div class="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
							<CircleCheck class="h-8 w-8 opacity-40" />
							No activity yet.
						</div>
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

<svelte:window on:keydown={handleWindowKeydown} />

{#if previewDoc}
	<div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
		<button
			aria-label="Close preview"
			class="absolute inset-0 cursor-default bg-black/50"
			on:click={closePreview}
		></button>

		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="preview-title"
			class="bg-card border-border/60 relative flex h-[90vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
		>
			<header class="border-border/60 flex flex-wrap items-center gap-3 border-b px-5 py-3">
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<h2 id="preview-title" class="truncate text-base font-semibold">{previewDoc.title}</h2>
						<StatusBadge status={previewDoc.status} />
					</div>
					<p class="text-muted-foreground truncate text-xs">
						{previewDoc.id} · {previewDoc.department}
						{#if previewVersion?.file}
							· {previewVersion.fileName ?? previewVersion.file.name} · {formatFileSize(previewVersion.file.size)}
						{/if}
					</p>
				</div>

				{#if previewVersions.length > 1}
					<label class="sr-only" for="preview-version">Version</label>
					<select
						id="preview-version"
						value={previewVersion?.id}
						on:change={(e) => (previewVersionId = e.currentTarget.value)}
						class="border-border/60 focus-visible:ring-ring/50 rounded-lg border bg-transparent py-1.5 pr-8 pl-3 text-sm shadow-xs outline-none focus-visible:ring-2"
					>
						{#each [...previewVersions].reverse() as version (version.id)}
							<option value={version.id}>
								{versionLabel(version)} · {formatTime(version.timestamp)}{version === previewVersions.at(-1)
									? ' (latest)'
									: ''}
							</option>
						{/each}
					</select>
				{/if}

				{#if previewVersion?.file}
					{@const version = previewVersion}
					<Button variant="outline" size="sm" onclick={() => downloadVersion(version)}>
						<Download class="h-4 w-4" /> Download
					</Button>
				{/if}

				<button
					class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
					on:click={closePreview}
					aria-label="Close"
				>
					<X class="h-4 w-4" />
				</button>
			</header>

			<div class="bg-muted/40 min-h-0 flex-1 overflow-auto p-4">
				{#if previewVersion?.file}
					<DocumentPreview file={previewVersion.file} class="h-full" />
				{:else}
					{@const doc = previewDoc}
					<div class="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center text-sm">
						<FileX class="h-10 w-10 opacity-40" />
						<p class="text-foreground font-medium">No file attached</p>
						<p class="max-w-sm text-xs">
							This document has no uploaded file yet{canEdit(doc) ? '. Upload one from Manage.' : '.'}
						</p>
						{#if canEdit(doc)}
							<Button
								variant="outline"
								size="sm"
								class="mt-2"
								onclick={() => {
									closePreview();
									manageDocument(doc);
								}}
							>
								<Upload class="h-4 w-4" /> Upload a file
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<ConfirmDialog
	open={!!docPendingDelete}
	title="Delete document?"
	description={docPendingDelete ? `This will remove "${docPendingDelete.title}" from the active list. This can be undone by an admin.` : ''}
	confirmText="Delete"
	onConfirm={confirmDeleteDocument}
	onCancel={() => (docPendingDelete = null)}
/>

<style>
	/* Change history. Translucent fills so the same colours work in both themes. */
	.doc-diff :global(.diff-add),
	.doc-diff :global(.diff-remove) {
		padding: 0 2px;
		margin: 0 1px;
		border-radius: 3px;
	}

	.doc-diff :global(.diff-add) {
		background: rgb(34 197 94 / 0.16);
		color: rgb(21 128 61);
	}

	.doc-diff :global(.diff-remove) {
		background: rgb(239 68 68 / 0.14);
		color: rgb(185 28 28);
		text-decoration: line-through;
	}

	:global(.dark) .doc-diff :global(.diff-add) {
		color: rgb(134 239 172);
	}

	:global(.dark) .doc-diff :global(.diff-remove) {
		color: rgb(252 165 165);
	}

	.diff-before {
		color: var(--muted-foreground);
		text-decoration: line-through;
		text-decoration-color: rgb(239 68 68 / 0.6);
	}

	.diff-after {
		font-weight: 500;
	}

	summary::-webkit-details-marker {
		display: none;
	}
</style>
