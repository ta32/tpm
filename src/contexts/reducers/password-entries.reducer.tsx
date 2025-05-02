// MODEL
import { uniqueId } from 'lib/utils';
import { SafePasswordEntry } from 'lib/trezor';

export enum PasswordEntriesStatus {
  UNINITIALIZED,
  SYNCED,
  SAVED,
  SAVE_REQUIRED,
  ERROR,
}
export interface PasswordEntries {
  entries: Record<string, SafePasswordEntry>;
  version: number;
  status: PasswordEntriesStatus;
  lastError: string;
}
function structuredClone(state: PasswordEntries): PasswordEntries {
  return {
    ...state,
    entries: { ...state.entries },
  };
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
        let newEntries: PasswordEntries = {
          entries: {},
          status: PasswordEntriesStatus.SYNCED,
          version: action.version,
          lastError: '',
        };
        for (const entry of action.entries) {
          newEntries.entries[entry.key] = entry;
        }
        return { ...newEntries };
      }
      if (state.status === PasswordEntriesStatus.SAVED) {
        if (action.version === state.version) {
          // check items
          for (const entry of action.entries) {
            if (state.entries[entry.key] === undefined) {
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
            lastError: `new version is older than current version, new version: ${action.version} old version: ${state.version}`,
          };
        }
        let newEntries: PasswordEntries = {
          entries: {},
          status: PasswordEntriesStatus.SYNCED,
          version: action.version,
          lastError: '',
        };
        for (const entry of action.entries) {
          newEntries.entries[entry.key] = entry;
        }
        return { ...newEntries };
      }
      if (state.status === PasswordEntriesStatus.SYNCED) {
        return {
          ...state
        }
      }
      // internal error
      return {
        ...state,
        status: PasswordEntriesStatus.ERROR,
        lastError: 'Synced called when state is: ' + state.status + ' action version is: ' + action.version + ' state version is: ' + state.version,
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
      let newEntries: PasswordEntries = structuredClone(state);
      let nextKey = uniqueId();
      newEntries.entries[nextKey] = {
        ...action.entry,
        key: nextKey,
        createdDate: Date.now(),
        lastModifiedDate: Date.now()
      };
      return { ...newEntries, status: PasswordEntriesStatus.SAVE_REQUIRED };
    }
    case 'REMOVE_ENTRY': {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return {
          ...state,
          status: PasswordEntriesStatus.ERROR,
          lastError: 'Cannot remove entry from un-synced state',
        };
      }
      let newEntries: PasswordEntries = structuredClone(state);
      delete newEntries.entries[action.key];
      return { ...newEntries, status: PasswordEntriesStatus.SAVE_REQUIRED };
    }
    case 'UPDATE_ENTRY': {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return {
          ...state,
          status: PasswordEntriesStatus.ERROR,
          lastError: 'Cannot update entry in un-synced state',
        };
      }
      let newEntries: PasswordEntries = structuredClone(state);
      const updatedEntry = action.entry;
      updatedEntry.key = action.key;
      updatedEntry.lastModifiedDate = Date.now();
      newEntries.entries[action.key] = updatedEntry;
      return { ...newEntries, status: PasswordEntriesStatus.SAVE_REQUIRED };
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
      let newEntries: PasswordEntries = { ...state };
      for (const entry of action.entries) {
        let nextKey = uniqueId();
        newEntries.entries[nextKey] = { ...entry, key: nextKey };
      }
      return { ...newEntries, status: PasswordEntriesStatus.SAVE_REQUIRED };
    }
  }
}

export function getSafePasswordEntries(state: PasswordEntries): SafePasswordEntry[] {
  const entries: SafePasswordEntry[] = [];
  for (const [key, value] of Object.entries(state.entries)) {
    let entry = value as SafePasswordEntry;
    entries.push(entry);
  }
  return entries;
}
