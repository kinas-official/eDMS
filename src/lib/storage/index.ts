/**
 * This file used to declare a second, conflicting `StorageAdapter`
 * (`save`/`load`/`remove`) that nothing implemented — `browserStorage` has
 * always implemented the `get`/`set`/`remove` interface in `adapter.ts`.
 * Re-export the real one so `$lib/storage` and `$lib/storage/adapter` agree.
 */
export type { StorageAdapter } from './adapter';
export { browserStorage } from './browser';
