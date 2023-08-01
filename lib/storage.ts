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

export function fromString(result: string): AppData {
  try {
    return JSON.parse(result);
  }
  catch (e) {
    throw new Error("Error parsing entries");
  }
}

export function fromAppData(data: AppData): Blob {
  return new Blob([JSON.stringify(data)], {type: "text/plain;charset=utf-8"});
}

// TODO remove
export function serializeObject<T>(obj: T): Uint8Array {
  const json = JSON.stringify(obj, (key, value) => {
    if (value instanceof Uint8Array) {
      return Array.from(value);
    }
    return value;
  });
  return new TextEncoder().encode(json);
}

export function deserializeObjectWithUint8Arrays<T>(data: ArrayBuffer): T {
  const json = new TextDecoder().decode(data);
  return deserializeArraysToUint8Arrays(json);
}

export function deserializeObject<T>(data: ArrayBuffer): T {
  const json = new TextDecoder().decode(data);
  return JSON.parse(json);
}

export function deserializeArraysToUint8Arrays<T>(data: string): T {
  return JSON.parse(data, (key, value) => {
    if (Array.isArray(value)) {
      return new Uint8Array(value);
    }
    return value;
  })
}
