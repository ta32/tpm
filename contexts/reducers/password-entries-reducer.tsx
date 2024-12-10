// MODEL
import { uniqueId } from 'lib/utils';
import { SafePasswordEntry } from '../../lib/trezor';

export enum PasswordEntriesStatus {
  UNINITIALIZED,
  SYNCED,
  SAVED,
  SAVE_REQUIRED,
  ERROR,
}
export interface PasswordEntries {
  [key: string]: SafePasswordEntry | number | string;
  version: number;
  status: PasswordEntriesStatus;
  lastError: string;
}
// ACTIONS
export interface Sync {
  type: 'SYNC';
  entries: SafePasswordEntry[];
  version: number;
}
export interface AddEntry {
  type: 'ADD_ENTRY';
  entry: SafePasswordEntry;
}
export interface BulkAddEntries {
  type: 'BULK_ADD_ENTRIES';
  entries: SafePasswordEntry[];
}
export interface RemoveEntry {
  type: 'REMOVE_ENTRY';
  key: string;
}
export interface UpdateEntry {
  type: 'UPDATE_ENTRY';
  key: string;
  entry: SafePasswordEntry;
}
export interface UploadEntries {
  type: 'UPLOADED_ENTRIES';
  version_uploaded: number;
}

export type PasswordEntriesAction = Sync | AddEntry | BulkAddEntries | RemoveEntry | UpdateEntry | UploadEntries;

export function passwordEntriesReducer(state: PasswordEntries, action: PasswordEntriesAction): PasswordEntries {
  switch (action.type) {
    case 'SYNC': {
      if (state.status === PasswordEntriesStatus.UNINITIALIZED) {
        let new_entries: PasswordEntries = {
          status: PasswordEntriesStatus.SYNCED,
          version: action.version,
          lastError: '',
        };
        for (const entry of action.entries) {
          new_entries[entry.key] = entry;
        }
        return { ...new_entries };
      }
      if (state.status === PasswordEntriesStatus.SAVED) {
        if (action.version === state.version) {
          // check items
          for (const entry of action.entries) {
            if (state[entry.key] === undefined) {
              return {
                ...state,
                status: PasswordEntriesStatus.ERROR,
                lastError: 'new entries do not match current entries',
              };
            }
          }
          return { ...state, status: PasswordEntriesStatus.SYNCED };
        }
        if (action.version < state.version) {
          return {
            ...state,
            status: PasswordEntriesStatus.ERROR,
            lastError: 'new version is older than current version',
          };
        }
        let new_entries: PasswordEntries = {
          status: PasswordEntriesStatus.SYNCED,
          version: action.version,
          lastError: '',
        };
        for (const entry of action.entries) {
          new_entries[entry.key] = entry;
        }
        return { ...new_entries };
      }
      // internal error - e.g. neighbor trying to dispatch sync action at the same time as another component
      return {
        ...state,
        status: PasswordEntriesStatus.ERROR,
        lastError: 'Synced called in state: ' + state.status + ' action version is: ' + action.version,
      };
    }
    case 'ADD_ENTRY': {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return {
          ...state,
          status: PasswordEntriesStatus.ERROR,
          lastError: 'Cannot add entry to un-synced state',
        };
      }
      let new_entries: PasswordEntries = { ...state };
      let nextKey = uniqueId();
      new_entries[nextKey] = { ...action.entry, key: nextKey, createdDate: Date.now(), lastModifiedDate: Date.now() };
      return { ...new_entries, status: PasswordEntriesStatus.SAVE_REQUIRED };
    }
    case 'REMOVE_ENTRY': {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return {
          ...state,
          status: PasswordEntriesStatus.ERROR,
          lastError: 'Cannot remove entry from un-synced state',
        };
      }
      let new_entries: PasswordEntries = { ...state };
      delete new_entries[action.key];
      return { ...new_entries, status: PasswordEntriesStatus.SAVE_REQUIRED };
    }
    case 'UPDATE_ENTRY': {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return {
          ...state,
          status: PasswordEntriesStatus.ERROR,
          lastError: 'Cannot update entry in un-synced state',
        };
      }
      let new_entries: PasswordEntries = { ...state };
      const updatedEntry = action.entry;
      updatedEntry.key = action.key;
      updatedEntry.lastModifiedDate = Date.now();
      new_entries[action.key] = updatedEntry;
      return { ...new_entries, status: PasswordEntriesStatus.SAVE_REQUIRED };
    }
    case 'UPLOADED_ENTRIES': {
      return {
        ...state,
        version: action.version_uploaded,
        status: PasswordEntriesStatus.SAVED,
      };
    }
    case 'BULK_ADD_ENTRIES': {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return {
          ...state,
          status: PasswordEntriesStatus.ERROR,
          lastError: 'Cannot add entries to un-synced state',
        };
      }
      let new_entries: PasswordEntries = { ...state };
      for (const entry of action.entries) {
        let nextKey = uniqueId();
        new_entries[nextKey] = { ...entry, key: nextKey };
      }
      return { ...new_entries, status: PasswordEntriesStatus.SAVE_REQUIRED };
    }
  }
}

export function getSafePasswordEntries(state: PasswordEntries): SafePasswordEntry[] {
  const entries: SafePasswordEntry[] = [];
  for (const [key, value] of Object.entries(state)) {
    let entry = value as SafePasswordEntry;
    if (entry.item) {
      entries.push(entry);
    }
  }
  return entries;
}
