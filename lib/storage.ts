import {  } from '../contexts/password_entries'
import { getSafePasswordEntries, PasswordEntries, SafePasswordEntry } from '../contexts/reducers/password_entries'
import { getTags, TagEntry, TagEntries } from '../contexts/reducers/tag_entries'

export interface AppData {
  entries: SafePasswordEntry[],
  version: number,
  tags: TagEntry[]
}

export function fromState(passwordState: PasswordEntries, tagState: TagEntries, newVersion: number): AppData {
  const entries = getSafePasswordEntries(passwordState);
  const tags = getTags(tagState);
  return {
    entries: entries,
    version: newVersion,
    tags: tags,
  }
}

export function serializeObject<T>(obj: T): Uint8Array {
  const json = JSON.stringify(obj, (key, value) => {
    if (value instanceof Uint8Array) {
      return {
        type: 'Uint8Array',
        data: Array.from(value)
      }
    }
    return value;
  });
  return new TextEncoder().encode(json);
}

export function deserializeObject<T>(data: ArrayBuffer): T {
  const json = new TextDecoder().decode(data);
  return deserializeWithTypedArrays(json);
}

export function deserializeWithTypedArrays<T>(data: string): T {
  return JSON.parse(data, (key, value) => {
    if (value && value.type === 'Uint8Array') {
      return new Uint8Array(value.data);
    }
    return value;
  })
}
