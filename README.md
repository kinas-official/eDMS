# eDMS (Enterprise Document Management System)

A modern, responsive **Enterprise Document Management System** built with **SvelteKit**, **TailwindCSS**, and **shadcn/ui**. Designed for LAN/offline use, this project demonstrates **user roles, department-aware permissions, document workflows, and audit logging** with a polished UI/UX.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Features

- **User Accounts**
  - Roles: `admin`, `editor`, `viewer`
  - Department-based access control
  - Login & logout
  - Create new user (admin-only)

- **Document Management**
  - Metadata tracking
  - Versioning
  - Soft deletes / archiving
  - Owner-based permissions

- **Access Control & Approval Workflow**
  - Request access for downloads or sharing
  - Admin or owner can approve/deny
  - Expiration dates on access

- **Audit & Logs**
  - Immutable access logs (view/download/share)
  - Department tracking
  - Admin audit logs

- **UI & UX**
  - TailwindCSS + shadcn/ui components
  - Gradient backgrounds, hover effects, subtle animations
  - Responsive design for desktop and mobile

- **Offline / LAN Capable**
  - Works locally without external internet dependency
  - Mock API ready to be replaced by backend integration

---

## Tech Stack

- **Frontend:** SvelteKit + TypeScript  
- **UI:** TailwindCSS + shadcn/ui  
- **State Management:** Svelte stores  
- **Server:** SvelteKit (`adapter-node`) serving the UI and `/api/*` for web and desktop clients  
- **Database:** SQLite via Drizzle ORM (migrations in `drizzle/`)  
- **Desktop:** Tauri 2  
- **Authentication:** Role-based with department awareness  

> The UI pages are still being moved from mock/localStorage data onto the server API.

---

## Getting Started

```sh
bun install
cp .env.example .env    # adjust paths / admin username if needed
bun run db:seed         # creates the database, default departments and the admin account
bun run dev
```

`db:seed` prints a generated admin password if `ADMIN_PASSWORD` is empty; sign in with it at `/login`. Re-running it is safe.
Run `bun run db:seed -- --demo` to also create `editor1` and `viewer1` (passwords printed) for trying out roles.

Other database commands:

- `bun run db:generate` — create a migration after changing `src/lib/server/db/schema.ts`
- `bun run db:studio` — browse the database

Migrations are applied automatically when the server starts.

### Production (LAN server)

```sh
bun run build
bun run start           # node build; set ORIGIN and PORT in .env
```

Check it's up at `/api/health`. Uploaded files are stored under `STORAGE_DIR`; keep `BODY_SIZE_LIMIT` above the max upload size in Settings (the Node default of 512K blocks most uploads).

### Documents API

All endpoints need a signed-in user and check the role's permissions (`view`, `upload`, `approve`, `delete`) on the server.

| Method | Path | |
| --- | --- | --- |
| `GET` | `/api/documents` | List; `search`, `status`, `departmentId`, `deleted=true`, `page`, `pageSize` |
| `POST` | `/api/documents` | Multipart upload: `file` plus optional `title`, `description`, `status`, `departmentId`, `note` |
| `GET` | `/api/documents/:id` | Document with all versions |
| `PATCH` | `/api/documents/:id` | JSON: `title`, `description`, `status`, `departmentId`, `assigneeId` |
| `DELETE` | `/api/documents/:id` | Soft delete |
| `POST` | `/api/documents/:id/restore` | Undo a soft delete |
| `POST` | `/api/documents/:id/versions` | Multipart: `file`, optional `note` |
| `GET` | `/api/documents/:id/download` | `version` (default latest), `inline=true` for previews |

---


## Project Structure

COMING SOON.

---

## Future Features

- Future Enhancements
- Real backend integration (SQLite/PostgreSQL)
- LAN-based file sharing & storage
- File encryption & version rollback
- Advanced audit dashboards
- Drag-and-drop document upload
- Email notifications for access approvals

---
