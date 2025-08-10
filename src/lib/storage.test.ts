import { it, expect } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'util';
import { AppData, deserializeObject, mergeAppData, serializeObject, TrezorAppData } from './storage';
import { withTrezorPasswordEntry } from './mocks';

// Node.Js polyfills for WebAPIs
Object.assign(global, { TextDecoder, TextEncoder });

const BITCOIN_DEFAULT_TAG_ID = '2a';
const SOCIAL_DEFAULT_TAG_ID = '1a';
// Default tags from the app
const INITIAL_APP_DATA: AppData = {
  entries: [],
  version: 0,
  tags: [
    {
      id: '0a',
      title: 'ALL',
      icon: 'ALL',
    },
    {
      id: SOCIAL_DEFAULT_TAG_ID,
      title: 'Social',
      icon: 'group',
    },
    {
      id: BITCOIN_DEFAULT_TAG_ID,
      title: 'Bitcoin',
      icon: 'bitcoin',
    },
  ],
  modelVersion: '0',
};
const INITIAL_APP_DATA_TAG_INDEX = INITIAL_APP_DATA.tags.length - 1;

// Default tags from Trezor
const TREZOR_SOCIAL_TAG_ID = '1b';
const TREZOR_BITCOIN_TAG_ID = '2b';
const INITIAL_APP_DATA_TREZOR: TrezorAppData = {
  version: '0',
  extVersion: '0',
  config: {
    orderType: '0',
  },
  tags: {
    '0b': {
      title: 'All',
      icon: 'home',
    },
    [TREZOR_SOCIAL_TAG_ID]: {
      title: 'Social',
      icon: 'person-stalker',
    },
    [TREZOR_BITCOIN_TAG_ID]: {
      title: 'Bitcoin',
      icon: 'social-bitcoin',
    },
  },
  entries: {},
};

describe('serialization tests', () => {
  it('should not lose typed arrays when serializing', () => {
    interface Item {
      key: string;
    }
    const items: Item[] = [{ key: 'key1' }, { key: 'key2' }];
    const obj = {
      key: 'key',
      items: items,
      values: new Uint8Array([1, 2, 3]),
    };

    const serialized = serializeObject(obj);
    const objActual = deserializeObject<any>(serialized);

    expect(objActual.key).toEqual(obj.key);
    expect(objActual.values).toEqual(obj.values);
    expect(ArrayBuffer.isView(objActual.values)).toEqual(true);
  });
});

describe('merging trezor app data', () => {
  it('no conflict merge of app data', () => {
    // entries are put into the right tags
    let current = INITIAL_APP_DATA;
    let imported = {
      ...INITIAL_APP_DATA_TREZOR,
      tags: {
        ...INITIAL_APP_DATA_TREZOR.tags,
        '3b': {
          title: 'Tag1',
          icon: 'person', // --> should be "account_circle"
        },
        '4b': {
          title: 'Tag2',
          icon: 'star', // --> should be "grade"
        },
        '5b': {
          title: 'Tag3',
          icon: 'flag', // --> should be "label_important"
        },
      },
      entries: {
        '0': withTrezorPasswordEntry('item1', [TREZOR_BITCOIN_TAG_ID]), // bitcoin tag (default tag)
        '1': withTrezorPasswordEntry('item2', ['3b']), // tag1
      },
    };
    let i = INITIAL_APP_DATA_TAG_INDEX;
    let mUniqueId = jest.fn(() => {
      i++;
      return i.toString();
    });

    let result = mergeAppData(current, imported, mUniqueId);

    expect(result.passwordEntries.length).toEqual(2);
    expect(result.tags.length).toEqual(3); // returns the new tags
    expect(result.conflicts.length).toEqual(0);

    // check the new tags have the correct icon and new id
    expect(result.tags[0].icon).toEqual('account_circle');
    expect(result.tags[0].id).toEqual('3'); // new tag id
    expect(result.tags[1].icon).toEqual('grade');
    expect(result.tags[1].id).toEqual('4'); // new tag id
    expect(result.tags[2].icon).toEqual('label_important');
    expect(result.tags[2].id).toEqual('5'); // new tag id

    // check the entries are in the right tags
    expect(result.passwordEntries[0].tags).toEqual([BITCOIN_DEFAULT_TAG_ID]); // bitcoin default tag
    expect(result.passwordEntries[1].tags).toEqual(['3']); // new tag id
  });

  it('old app data has tags that are the same as the new app data', () => {
    // don't create new tags for tags that conflict
    // entries in the conflicting tags are merged into the existing tags
    let current = {
      ...INITIAL_APP_DATA,
      tags: [
        ...INITIAL_APP_DATA.tags,
        {
          id: '3a',
          title: 'Tag1',
          icon: 'account_circle',
        },
      ],
    };
    let imported = {
      ...INITIAL_APP_DATA_TREZOR,
      tags: {
        ...INITIAL_APP_DATA_TREZOR.tags,
        '3b': {
          title: 'Tag1',
          icon: 'person',
        },
        '4b': {
          title: 'New Bitcoin',
          icon: 'social-bitcoin',
        },
      },
      entries: {
        '0': withTrezorPasswordEntry('item1', ['3b']), // entry in the conflicting tag
        '1': withTrezorPasswordEntry('item2', ['4b']), // entry in the new tag
      },
    };

    let i = INITIAL_APP_DATA_TAG_INDEX + 1;
    let mUniqueId = jest.fn(() => {
      i++;
      return i.toString();
    });

    let result = mergeAppData(current, imported, mUniqueId);

    expect(result.passwordEntries.length).toEqual(2);
    expect(result.tags.length).toEqual(1); // Tag1 already exists, New Bitcoin is a new tag

    // check the tags have the correct icon
    expect(result.tags[0].icon).toEqual('bitcoin');

    // check the entries are in the right tags
    expect(result.passwordEntries[0].tags).toEqual(['3a']); // existing tag
    expect(result.passwordEntries[1].tags).toEqual(['4']); // new tag id
  });

  it('conflicting key of entries', () => {
    // don't create new tags for tags that conflict
    // entries in the conflicting tags are merged into the existing tags
    const TAG1_ID = '3a';
    let current = {
      ...INITIAL_APP_DATA,
      tags: [
        ...INITIAL_APP_DATA.tags,
        {
          id: TAG1_ID,
          title: 'Tag1',
          icon: 'account_circle',
        },
      ],
      entries: [
        withTrezorPasswordEntry('item1', ['2a']), // bitcoin default tag
        withTrezorPasswordEntry('item2', ['3a']),
      ],
    };
    const TAG1_ID_TREZOR = '3b';
    const NEW_BITCOIN_ID_TREZOR = '4b';
    let imported = {
      ...INITIAL_APP_DATA_TREZOR,
      tags: {
        ...INITIAL_APP_DATA_TREZOR.tags,
        [TAG1_ID_TREZOR]: {
          title: 'Tag1',
          icon: 'person',
        },
        [NEW_BITCOIN_ID_TREZOR]: {
          title: 'New Bitcoin',
          icon: 'social-bitcoin',
        },
      },
      entries: {
        '0': withTrezorPasswordEntry('item1', [TAG1_ID_TREZOR]), // entry in the conflicting tag
        '1': withTrezorPasswordEntry('item2', [NEW_BITCOIN_ID_TREZOR]), // entry in the new tag
      },
    };

    let i = INITIAL_APP_DATA_TAG_INDEX + 1;
    let mUniqueId = jest.fn(() => {
      i++;
      return i.toString();
    });

    let result = mergeAppData(current, imported, mUniqueId);

    expect(result.passwordEntries.length).toEqual(0);
    expect(result.conflicts.length).toEqual(2);
    expect(result.tags.length).toEqual(1); // Tag1 already exists, New Bitcoin is a new tag

    // check the tags have the correct icon
    expect(result.tags[0].icon).toEqual('bitcoin');

    // check the entries are in the right tags
    expect(result.conflicts[0].tags).toEqual([TAG1_ID]); // existing tag
    expect(result.conflicts[1].tags).toEqual(['4']); // new tag id
  });
});
