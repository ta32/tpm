import {} from '../contexts/use-password-entries';
import { getSafePasswordEntries, PasswordEntries } from '../contexts/reducers/password-entries-reducer';
import { getTags, TagEntry, TagEntries } from '../contexts/reducers/tag-entries-reducer';
import { SafePasswordEntry } from './trezor';
import { uniqueId } from './utils';
import entry from 'next/dist/server/typescript/rules/entry';
import { FROM_TREZOR_ICON_KEY_TO_TAG_NAME, TAG_SOCIAL } from './images';

const MODEL_VERSION = 1;

export interface AppData {
  entries: SafePasswordEntry[];
  version: number;
  tags: TagEntry[];
  modelVersion: number;
}

export interface TrezorAppData {
  version: string;
  extVersion: string;
  config: {
    orderType: string;
  };
  tags: {
    [key: string]: {
      title: string;
      icon: string;
    };
  };
  entries: {
    [key: string]: {
      title: string;
      username: string;
      password: {
        type: string;
        data: number[];
      };
      nonce: string;
      tags: number[];
      safe_note: {
        type: string;
        data: number[];
      };
      note: string;
      success: boolean;
      export: boolean;
    };
  };
}

export interface MergeAppData {
  passwordEntries: SafePasswordEntry[];
  tags: TagEntry[];
  conflicts: SafePasswordEntry[];
}
/**
 * Merge the current app data with the new data from the Trezor device.
 *
 * ------------------------------ NOTE ------------------------------
 * When merging entries, you must _NOT_ change the title or username of an entry.
 * The title and the username are used to for the entryKey for decryption.
 * Decryption will fail with a different entryKey.
 */
export function mergeAppData(appData: AppData, newData: TrezorAppData, getUniqueId: () => string = uniqueId ): MergeAppData {
  // Merge tags
  const tags: TagEntry[] = [];
  const conflicts: SafePasswordEntry[] = [];
  for (const key in newData.tags) {
    const tag = newData.tags[key];
    const existingTag = appData.tags.find((t) => t.title === tag.title);
    if (!existingTag && tag.title !== 'All') {
      const newIconName: string = FROM_TREZOR_ICON_KEY_TO_TAG_NAME.get(tag.icon) || TAG_SOCIAL;
      const newId = getUniqueId();
      tags.push({
        id: newId,
        title: tag.title,
        icon:newIconName
      });
    }
  }
  const allTags = appData.tags.concat(tags);
  // merge entries
  const passwordEntries: SafePasswordEntry[] = [];
  for (const key in newData.entries) {
    const entry = newData.entries[key];
    const existingEntry = appData.entries.find((e) => e.title === entry.title);
    const newEntry: SafePasswordEntry = {
      key: getUniqueId(),
      item: entry.title,
      title: entry.title,
      username: entry.username,
      safeKey: entry.nonce,
      passwordEnc: new Uint8Array(entry.password.data),
      secretNoteEnc: new Uint8Array(entry.safe_note.data),
      tags: entry.tags.map((tagId) => {
        const tag = allTags.find((t) => t.title === newData?.tags[tagId]?.title || '');
        return tag ? tag.id : '';
      }),
      legacyMode: true,
      createdDate: Date.now(),
      lastModifiedDate: Date.now(),
    }
    if (!existingEntry) {
      passwordEntries.push(newEntry);
    } else {
      newEntry.metaTitle = 'conflict-' + newEntry.title;
      conflicts.push(newEntry);
    }
  }
  return {
    passwordEntries,
    tags,
    conflicts,
  }
}

export function fromState(passwordState: PasswordEntries, tagState: TagEntries, newVersion: number): AppData {
  const entries = getSafePasswordEntries(passwordState);
  const tags = getTags(tagState);
  return {
    entries: entries,
    version: newVersion,
    tags: tags,
    modelVersion: MODEL_VERSION,
  };
}

export function serializeObject<T>(obj: T): Uint8Array {
  const json = JSON.stringify(obj, (key, value) => {
    if (value instanceof Uint8Array) {
      return {
        type: 'Uint8Array',
        data: Array.from(value),
      };
    }
    return value;
  });
  return new TextEncoder().encode(json);
}

export function deserializeObject<T>(data: ArrayBuffer): T {
  const json = new TextDecoder().decode(data);
  return deserializeWithTypedArrays(json);
}

function deserializeWithTypedArrays<T>(data: string): T {
  return JSON.parse(data, (key, value) => {
    if (value && value.type === 'Uint8Array') {
      return new Uint8Array(value.data);
    }
    return value;
  });
}
