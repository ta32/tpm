import { describe, expect } from '@jest/globals';
import {
  AddEntry,
  getSafePasswordEntries,
  PasswordEntries,
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

function initialEntries(): PasswordEntries {
  return {
    status: PasswordEntriesStatus.UNINITIALIZED,
    version: 0,
    lastError: '',
  };
}

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
  };
}

describe('Get safe password entries', () => {
  test('Get safe password entries', () => {
    let initialState: PasswordEntries = initialEntries();
    initialState.key1 = entry(1);
    initialState.key2 = entry(2);
    initialState.key3 = entry(3);

    const actualEntries = getSafePasswordEntries(initialState);
    expect(actualEntries).toEqual([entry(1), entry(2), entry(3)]);
  });
});

describe('Uploading and Synchronization', () => {
  test('Uploading entries sets state to unsynced', () => {
    let initialState: PasswordEntries = initialEntries();
    initialState.key1 = entry(1);
    initialState.version = 2;
    initialState.status = PasswordEntriesStatus.SAVE_REQUIRED;

    const action: UploadEntries = {
      type: 'UPLOADED_ENTRIES',
      version_uploaded: 3,
    };
    const actualEntriesUpload = passwordEntriesReducer(initialState, action);

    const expectedUploadState: PasswordEntries = {
      version: 3,
      status: PasswordEntriesStatus.SAVED,
      key1: entry(1),
      lastError: '',
    };
    expect(actualEntriesUpload.version).toEqual(expectedUploadState.version);
    expect(actualEntriesUpload.status).toEqual(expectedUploadState.status);
    expect(actualEntriesUpload.key1).toEqual(expectedUploadState.key1);
  });

  test('Passwords must be re-synced after uploading', () => {
    const UPLOADED_VERSION = 2;
    let initialState: PasswordEntries = initialEntries();
    initialState.key1 = entry(1);
    initialState.version = UPLOADED_VERSION;
    initialState.status = PasswordEntriesStatus.SAVED;

    const action: Sync = {
      type: 'SYNC',
      entries: [entry(1)],
      version: UPLOADED_VERSION,
    };
    const actual = passwordEntriesReducer(initialState, action);

    const expectedState: PasswordEntries = {
      ...initialState,
      status: PasswordEntriesStatus.SYNCED,
    };
    expectedState.key1 = entry(1);
    expect(actual.version).toEqual(expectedState.version);
    expect(actual.status).toEqual(expectedState.status);
    expect(actual.key1).toEqual(expectedState.key1);
  });
});

test('Adding new entry to loaded database', () => {
  let initialState: PasswordEntries = {
    ...initialEntries(),
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
  };
  initialState.key1 = entry(1);

  let entry2 = { ...entry(2), key: 'value set by reducer when added' };
  const action: AddEntry = { type: 'ADD_ENTRY', entry: entry2 };
  mUniqueId.mockReturnValue('key2');
  mDateNow.mockReturnValue(0);

  // noinspection DuplicatedCode
  const actual = passwordEntriesReducer(initialState, action);

  // noinspection DuplicatedCode
  const expectedState: PasswordEntries = {
    version: 1,
    status: PasswordEntriesStatus.SAVE_REQUIRED,
    key1: entry(1),
    key2: entry(2),
    lastError: '',
  };

  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.key1).toEqual(expectedState.key1);
  expect(actual.key2).toEqual(expectedState.key2);
});

test('Should not add entry if database is not loaded', () => {
  const initialState: PasswordEntries = initialEntries();
  const action: AddEntry = { type: 'ADD_ENTRY', entry: entry(1) };

  const actual = passwordEntriesReducer(initialState, action);

  const expectedState: PasswordEntries = {
    version: 0,
    status: PasswordEntriesStatus.ERROR,
    lastError: '',
  };

  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
});

test('Do not override entries if version is lower', () => {
  let initialState: PasswordEntries = { ...initialEntries(), version: 1 };
  initialState.status = PasswordEntriesStatus.SAVED;
  initialState.item1 = entry(1);
  initialState.item2 = entry(2);

  const action: Sync = { type: 'SYNC', entries: [entry(1)], version: 0 };
  const actual = passwordEntriesReducer(initialState, action);

  const expectedState: PasswordEntries = {
    version: 1,
    status: PasswordEntriesStatus.ERROR,
    item1: entry(1),
    item2: entry(2),
    lastError: '',
  };
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.item1).toEqual(expectedState.item1);
  expect(actual.item2).toEqual(expectedState.item2);
});

test('Sync passwords from cloud action', () => {
  const initialState: PasswordEntries = initialEntries();
  const action: Sync = {
    type: 'SYNC',
    entries: [entry(1), entry(2)],
    version: 1,
  };

  // noinspection DuplicatedCode
  const actual = passwordEntriesReducer(initialState, action);

  const expectedState: PasswordEntries = {
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
    key1: entry(1),
    key2: entry(2),
    lastError: '',
  };
  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.key1).toEqual(expectedState.key1);
  expect(actual.key2).toEqual(expectedState.key2);
});

test('Update entry test', () => {
  const initialState: PasswordEntries = {
    ...initialEntries(),
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
  };
  const entry1 = entry(1);
  const entry2 = entry(2);
  initialState.key1 = entry1;
  initialState.key2 = entry2;

  const action: UpdateEntry = {
    type: 'UPDATE_ENTRY',
    entry: { ...entry1, title: 'new title' },
    key: entry1.key,
  };
  const actual = passwordEntriesReducer(initialState, action);

  const expectedState: PasswordEntries = {
    ...initialState,
    status: PasswordEntriesStatus.SAVE_REQUIRED,
    key1: { ...entry1, title: 'new title' },
    key2: entry2,
  };

  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.key1).toEqual(expectedState.key1);
  expect(actual.key2).toEqual(expectedState.key2);
});

test('Entry is removed by key', () => {
  const initialState: PasswordEntries = {
    ...initialEntries(),
    version: 1,
    status: PasswordEntriesStatus.SYNCED,
  };
  const entry1 = entry(1);
  const entry2 = entry(2);
  initialState.key1 = entry1;
  initialState.key2 = entry2;

  const action: RemoveEntry = { type: 'REMOVE_ENTRY', key: entry1.key };
  const actual = passwordEntriesReducer(initialState, action);

  const expectedState: PasswordEntries = {
    ...initialState,
    status: PasswordEntriesStatus.SAVE_REQUIRED,
  };
  delete expectedState.key1;

  expect(actual.version).toEqual(expectedState.version);
  expect(actual.status).toEqual(expectedState.status);
  expect(actual.key1).toBeUndefined();
  expect(actual.key2).toEqual(expectedState.key2);
});
