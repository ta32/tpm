import { getSafePasswordEntries, PasswordEntries } from 'contexts/reducers/password-entries.reducer';
import { getTags, TagEntries, TagEntry } from 'contexts/reducers/tag-entries.reducer';
import { SafePasswordEntry } from './trezor';
import { uniqueId } from './utils';
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
  tags: TrezorTags;
  entries: {
    [key: string]: TrezorEntry;
  };
}
interface TrezorTags {
  [key: string]: {
    title: string;
    icon: string;
  };
}
interface TrezorEntry {
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
export function mergeAppData(
  appData: AppData,
  trezorAppData: TrezorAppData,
  getUniqueId: () => string = uniqueId
): MergeAppData {
  // Merge tags
  const newTags: TagEntry[] = [];
  const conflicts: SafePasswordEntry[] = [];
  for (const key in trezorAppData.tags) {
    const tag = trezorAppData.tags[key];
    const existingTag = appData.tags.find((t) => t.title === tag.title);
    if (!existingTag && tag.title !== 'All') {
      const newIconName: string = FROM_TREZOR_ICON_KEY_TO_TAG_NAME.get(tag.icon) || TAG_SOCIAL;
      const newId = getUniqueId();
      newTags.push({
        id: newId,
        title: tag.title,
        icon: newIconName,
      });
    }
  }
  const allTags = appData.tags.concat(newTags);
  // merge entries
  const passwordEntries: SafePasswordEntry[] = [];
  for (const key in trezorAppData.entries) {
    const trezorEntry = trezorAppData.entries[key];
    const existingEntry = appData.entries.find((e) => e.title === trezorEntry.title);
    const newEntry: SafePasswordEntry = {
      key: getUniqueId(),
      item: trezorEntry.title,
      title: trezorEntry.title,
      username: trezorEntry.username,
      safeKey: trezorEntry.nonce,
      passwordEnc: new Uint8Array(trezorEntry.password.data),
      secretNoteEnc: new Uint8Array(trezorEntry.safe_note.data),
      tags: mapTagsToNewTagIds(trezorEntry, trezorAppData.tags, allTags),
      legacyMode: true,
      createdDate: Date.now(),
      lastModifiedDate: Date.now(),
    };
    if (!existingEntry) {
      passwordEntries.push(newEntry);
    } else {
      newEntry.metaTitle = 'conflict-' + newEntry.title;
      conflicts.push(newEntry);
    }
  }
  return {
    passwordEntries,
    tags: newTags,
    conflicts,
  };
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

function mapTagsToNewTagIds(entry: TrezorEntry, trezorTags: TrezorTags, allTags: TagEntry[]): string[] {
  let tagsIds: string[] = [];
  for (const tagId of entry.tags) {
    const oldTag = trezorTags[tagId];
    const tag = findTagIdByTitle(allTags, oldTag.title);
    if (tag) {
      tagsIds.push(tag.id);
    }
  }
  return tagsIds;
}

function findTagIdByTitle(allTags: TagEntry[], title: string): TagEntry | undefined {
  return allTags.find((tag) => tag.title === title);
}
