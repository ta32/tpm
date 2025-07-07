import { describe, expect } from '@jest/globals';
import {
  AddEntry,
  getSafePasswordEntries,
  PasswordEntries,
  PasswordEntriesAction,
  passwordEntriesReducer,
  PasswordEntriesStatus,
  RemoveEntry,
  Sync,
  UpdateEntry,
  UploadEntries,
} from './password-entries.reducer';
import { uniqueId } from 'lib/utils';
import { SafePasswordEntry } from 'lib/trezor';

jest.mock('lib/utils');
const mUniqueId = jest.mocked(uniqueId);
const mDateNow = jest.spyOn(Date, 'now');

const INITIAL_ENTRIES: PasswordEntries = {
  entries: {},
  status: PasswordEntriesStatus.UNINITIALIZED,
  version: 0,
  lastError: '',
};

function entry(num: number): SafePasswordEntry {
  return {
    key: `key${num}`,
    item: `item${num}`,
    title: `title${num}`,
    username: `username${num}`,
    passwordEnc: new Uint8Array([num]),
    secretNoteEnc: new Uint8Array([num]),
    safeKey: `safeKey${num}`,
    tags: [`tag${num}`],
    createdDate: 0,
    lastModifiedDate: 0,
    legacyMode: false,
  };
}

function callPasswordEntriesReducerWithSnapshots(state: PasswordEntries, action: PasswordEntriesAction) {
  const initialStateBefore = JSON.stringify(state);
  const actual = passwordEntriesReducer(state, action);
  const initialStateAfter = JSON.stringify(state);
  return { initialStateBefore, actual, initialStateAfter };
}

describe('Get safe password entries', () => {
  it('Get safe password entries', () => {
    let initialState: PasswordEntries = INITIAL_ENTRIES;
    initialState.entries.key1 = entry(1);
    initialState.entries.key2 = entry(2);
    initialState.entries.key3 = entry(3);

    const actualEntries = getSafePasswordEntries(initialState);
    expect(actualEntries).toEqual([entry(1), entry(2), entry(3)]);
  });
});

describe('Uploading and Synchronization', () => {
  it('Uploading entries sets state to un-synced', () => {
    const initialState: PasswordEntries = {
      ...INITIAL_ENTRIES,
      entries: {
        key1: entry(1),
      },
      version: 2,
      status: PasswordEntriesStatus.SAVE_REQUIRED,
    };

    const action: UploadEntries = {
      type: 'UPLOADED_ENTRIES',
      version_uploaded: 3,
    };

    const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
      initialState,
      action
    );

    const expectedUploadState: PasswordEntries = {
      version: 3,
      status: PasswordEntriesStatus.SAVED,
      entries: {
        key1: entry(1),
      },
      lastError: '',
    };
    expect(actual.version).toEqual(expectedUploadState.version);
    expect(actual.status).toEqual(expectedUploadState.status);
    expect(actual.entries.key1).toEqual(expectedUploadState.entries.key1);
    expect(initialStateBefore).toEqual(initialStateAfter);
  });

  it('Passwords must be re-synced after uploading', () => {
    const UPLOADED_VERSION = 2;
    const initialState: PasswordEntries = {
      ...INITIAL_ENTRIES,
      entries: {
        key1: entry(1),
      },
      version: UPLOADED_VERSION,
      status: PasswordEntriesStatus.SAVED,
    };

    const action: Sync = {
      type: 'SYNC',
      entries: [entry(1)],
      version: UPLOADED_VERSION,
    };

    const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
      initialState,
      action
    );

    const expectedState: PasswordEntries = {
      ...initialState,
      status: PasswordEntriesStatus.SYNCED,
    };
    expectedState.entries.key1 = entry(1);
    expect(actual.version).toEqual(expectedState.version);
    expect(actual.status).toEqual(expectedState.status);
    expect(actual.entries.key1).toEqual(expectedState.entries.key1);
    expect(initialStateBefore).toEqual(initialStateAfter);
  });
});

it('Adding new entry to loaded database', () => {
  let initialState: PasswordEntries = {
    ...INITIAL_ENTRIES,
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
  };
  initialState.entries.key1 = entry(1);

  let entry2 = { ...entry(2), key: 'value set by reducer when added' };
  const action: AddEntry = { type: 'ADD_ENTRY', entry: entry2 };
  mUniqueId.mockReturnValue('key2');
  mDateNow.mockReturnValue(0);

  const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
    initialState,
    action
  );

  const expectedState: PasswordEntries = {
    version: 1,
    status: PasswordEntriesStatus.SAVE_REQUIRED,
    entries: {
      key1: entry(1),
      key2: entry(2),
    },
    lastError: '',
  };

  // noinspection DuplicatedCode
  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.entries.key1).toEqual(expectedState.entries.key1);
  expect(actual.entries.key2).toEqual(expectedState.entries.key2);
  expect(initialStateBefore).toEqual(initialStateAfter);
});

it('Should not add entry if database is not loaded', () => {
  const initialState: PasswordEntries = INITIAL_ENTRIES;
  const action: AddEntry = { type: 'ADD_ENTRY', entry: entry(1) };

  const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
    initialState,
    action
  );

  const expectedState: PasswordEntries = {
    entries: {},
    version: 0,
    status: PasswordEntriesStatus.ERROR,
    lastError: '',
  };

  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(initialStateBefore).toEqual(initialStateAfter);
});

it('Do not override entries if version is lower', () => {
  const initialState: PasswordEntries = {
    ...INITIAL_ENTRIES,
    entries: {
      item1: entry(1),
      item2: entry(2),
    },
    version: 1,
    status: PasswordEntriesStatus.SAVED,
  };
  const action: Sync = { type: 'SYNC', entries: [entry(1)], version: 0 };

  const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
    initialState,
    action
  );

  const expectedState: PasswordEntries = {
    version: 1,
    status: PasswordEntriesStatus.ERROR,
    entries: {
      item1: entry(1),
      item2: entry(2),
    },
    lastError: '',
  };
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.entries.item1).toEqual(expectedState.entries.item1);
  expect(actual.entries.item2).toEqual(expectedState.entries.item2);
  expect(initialStateBefore).toEqual(initialStateAfter);
});

it('Sync passwords from cloud action', () => {
  const initialState: PasswordEntries = INITIAL_ENTRIES;
  const action: Sync = {
    type: 'SYNC',
    entries: [entry(1), entry(2)],
    version: 1,
  };

  const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
    initialState,
    action
  );

  const expectedState: PasswordEntries = {
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
    entries: {
      key1: entry(1),
      key2: entry(2),
    },
    lastError: '',
  };

  // noinspection DuplicatedCode
  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.entries.key1).toEqual(expectedState.entries.key1);
  expect(actual.entries.key2).toEqual(expectedState.entries.key2);
  expect(initialStateBefore).toEqual(initialStateAfter);
});

it('Update entry test', () => {
  const initialState: PasswordEntries = {
    ...INITIAL_ENTRIES,
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
  };
  const entry1 = entry(1);
  const entry2 = entry(2);
  initialState.entries.key1 = entry1;
  initialState.entries.key2 = entry2;

  const action: UpdateEntry = {
    type: 'UPDATE_ENTRY',
    entry: { ...entry1, title: 'new title' },
    key: entry1.key,
  };

  const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
    initialState,
    action
  );

  const expectedState: PasswordEntries = {
    ...initialState,
    status: PasswordEntriesStatus.SAVE_REQUIRED,
    entries: {
      key1: { ...entry1, title: 'new title' },
      key2: entry2,
    },
  };

  // noinspection DuplicatedCode
  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.entries.key1).toEqual(expectedState.entries.key1);
  expect(actual.entries.key2).toEqual(expectedState.entries.key2);
  expect(initialStateBefore).toEqual(initialStateAfter);
});

it('Entry is removed by key', () => {
  const initialState: PasswordEntries = {
    ...INITIAL_ENTRIES,
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
  };
  const entry1 = entry(1);
  const entry2 = entry(2);
  initialState.entries.key1 = entry1;
  initialState.entries.key2 = entry2;

  const action: RemoveEntry = { type: 'REMOVE_ENTRY', key: entry1.key };
  const { initialStateBefore, actual, initialStateAfter } = callPasswordEntriesReducerWithSnapshots(
    initialState,
    action
  );

  const expectedState: PasswordEntries = {
    ...initialState,
    status: PasswordEntriesStatus.SAVE_REQUIRED,
  };
  delete expectedState.entries.key1;

  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.entries.key1).toBeUndefined();
  expect(actual.entries.key2).toEqual(expectedState.entries.key2);
  expect(initialStateBefore).toEqual(initialStateAfter);
});
