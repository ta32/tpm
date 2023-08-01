
// MODEL
export interface SafePasswordEntry {
  key: string;
  item: string;
  title: string;
  username: string;
  passwordEnc: Uint8Array;
  secretNoteEnc: Uint8Array;
  safeKey: string;
  tags: string;
}
export enum PasswordEntriesStatus {
  UNINITIALIZED,
  SYNCED,
  UNSYNCED,
  NEW_ENTRY,
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
  type: "SYNC"
  entries: SafePasswordEntry[];
  version: number;
}
export interface AddEntry {
  type: "ADD_ENTRY"
  entry: SafePasswordEntry;
}

export interface UpdateEntry {
  type: "UPDATE_ENTRY"
  key: string;
  entry: SafePasswordEntry;
}

export interface UploadEntries {
  type: "UPLOAD_ENTRIES"
  version_uploaded: number;
}

export type PasswordEntriesAction =  Sync | AddEntry | UpdateEntry | UploadEntries;

export function passwordEntriesReducer(state: PasswordEntries, action: PasswordEntriesAction) : PasswordEntries {
  switch (action.type) {
    case "SYNC": {
      if (state.status === PasswordEntriesStatus.UNINITIALIZED) {
        let new_entries: PasswordEntries = {
          status: PasswordEntriesStatus.SYNCED,
          version: action.version,
          lastError: ""
        }
        for (const entry of action.entries) {
          new_entries[entry.key] = entry;
        }
        return { ...new_entries };
      }
      if (state.status === PasswordEntriesStatus.UNSYNCED) {
        if (action.version === state.version) {
          // check items
          for (const entry of action.entries) {
            if (state[entry.key] === undefined) {
              return { ...state, status: PasswordEntriesStatus.ERROR, lastError: "new entries do not match current entries" };
            }
          }
          return { ...state, status: PasswordEntriesStatus.SYNCED };
        }
        if (action.version < state.version) {
          return { ...state, status: PasswordEntriesStatus.ERROR, lastError: "new version is older than current version" };
        }
        let new_entries: PasswordEntries = {
          status: PasswordEntriesStatus.SYNCED,
          version: action.version,
          lastError: ""
        }
        for (const entry of action.entries) {
          new_entries[entry.key] = entry;
        }
        return { ...new_entries };
      }
      // internal error - e.g. neighbor trying to dispatch sync action at the same time as another component
      return { ...state, status: PasswordEntriesStatus.ERROR, lastError: "Synced called in state: " + state.status + " action version is: " + action.version };
    }
    case "ADD_ENTRY": {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return { ...state, status: PasswordEntriesStatus.ERROR, lastError: "Cannot add entry to un-synced state" };
      }
      let new_entries: PasswordEntries = {...state};
      let nextKey = nextEntryKey(state);
      new_entries[nextKey] = { ...action.entry, key: nextKey };
      return { ...new_entries, status: PasswordEntriesStatus.NEW_ENTRY };
    }
    case "UPDATE_ENTRY": {
      if (state.status !== PasswordEntriesStatus.SYNCED) {
        return { ...state, status: PasswordEntriesStatus.ERROR, lastError: "Cannot update entry in un-synced state" };
      }
      let new_entries: PasswordEntries = {...state};
      const updatedEntry = action.entry;
      updatedEntry.key = action.key;
      new_entries[action.key] = updatedEntry;
      return { ...new_entries, status: PasswordEntriesStatus.NEW_ENTRY };
    }
    case "UPLOAD_ENTRIES": {
      return { ...state, version: action.version_uploaded, status: PasswordEntriesStatus.UNSYNCED };
    }
  }
}

export function getSafePasswordEntries(state: PasswordEntries) : SafePasswordEntry[] {
  const entries: SafePasswordEntry[] = [];
  for (const [key, value] of Object.entries(state)) {
    let entry = value as SafePasswordEntry;
    if (entry.item) {
      entries.push(entry);
    }
  }
  return entries;
}

function nextEntryKey(state: PasswordEntries): string {
  const entries = getSafePasswordEntries(state);
  if (entries.length === 0) {
    return 'key1';
  }
  const next = entries.length + 1;
  return 'key' + next;
}
