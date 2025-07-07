// MODEL

import { uniqueId } from 'lib/utils';

export interface TagEntries {
  entries: Record<string, TagEntry>;
  status: TagsStatus;
  lastError: string;
}

function structuredClone(state: TagEntries): TagEntries {
  return {
    ...state,
    entries: { ...state.entries },
  };
}

export enum TagsStatus {
  UNINITIALIZED,
  SYNCED,
  SAVE_REQUIRED,
  SAVED,
  ERROR,
}

export interface TagEntry {
  id: string;
  title: string;
  icon: string;
}

// ACTIONS
export interface AddTag {
  type: 'ADD_TAG';
  title: string;
  icon: string;
}

export interface BulkAddTags {
  type: 'BULK_ADD_TAGS';
  tags: TagEntry[];
}

export interface RemoveTag {
  type: 'REMOVE_TAG';
  tagId: string;
}
export interface UpdateTag {
  type: 'UPDATE_TAG';
  tagId: string;
  title: string;
  icon: string;
}
export interface UploadedTags {
  type: 'UPLOADED_TAGS';
}
export interface SyncTags {
  type: 'SYNC_TAGS';
  tags?: TagEntry[];
}

export interface ClearError {
  type: 'CLEAR_ERROR';
}

export type TagsAction = AddTag | BulkAddTags | RemoveTag | UpdateTag | UploadedTags | SyncTags | ClearError;

export function tagsReducer(state: TagEntries, action: TagsAction): TagEntries {
  switch (action.type) {
    case 'ADD_TAG': {
      if (state.status == TagsStatus.SAVE_REQUIRED) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot add until new tag is saved',
        };
      }
      const newEntries = structuredClone(state);
      const tagId = uniqueId();
      if (titleExists(state, action.title)) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot add duplicate tag',
        };
      }
      if (newEntries.status == TagsStatus.UNINITIALIZED) {
        return {
          ...state,
          status: TagsStatus.UNINITIALIZED,
          lastError: 'Cannot add tag when not synced',
        };
      }
      newEntries.status = TagsStatus.SAVE_REQUIRED;
      newEntries.lastError = '';
      newEntries.entries[tagId] = { title: action.title, icon: action.icon, id: tagId };
      return newEntries;
    }
    case 'REMOVE_TAG': {
      if (state.status == TagsStatus.SAVE_REQUIRED) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot add until new tag is saved',
        };
      }
      const tagId = action.tagId;
      if (state.entries[tagId] === undefined) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot remove tag that does not exist',
        };
      }
      const newEntries: TagEntries = {
        entries: {},
        status: TagsStatus.SAVE_REQUIRED,
        lastError: '',
      };
      const tags = getTags(state);
      const tagsWithoutRemoved = tags.filter((tag) => tag.id !== tagId);
      for (const tag of tagsWithoutRemoved) {
        newEntries.entries[tag.id] = tag;
      }
      return newEntries;
    }
    case 'UPDATE_TAG': {
      if (state.status == TagsStatus.SAVE_REQUIRED) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot add until new tag is saved',
        };
      }
      const newEntries = structuredClone(state);
      const oldTagId = action.tagId;
      if (newEntries.entries[oldTagId] === undefined) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot update tag that does not exist',
        };
      }
      if (tagTitleIsDuplicated(state, action.tagId, action.title)) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot update tag to a duplicate',
        };
      }
      newEntries.status = TagsStatus.SAVE_REQUIRED;
      newEntries.entries[action.tagId] = {
        ...newEntries.entries[oldTagId],
        title: action.title,
        icon: action.icon,
      };
      return newEntries;
    }
    case 'UPLOADED_TAGS': {
      return { ...state, status: TagsStatus.SAVED };
    }
    case 'SYNC_TAGS': {
      const tags = action.tags;
      if (tags === undefined) {
        return { ...state, status: TagsStatus.SYNCED };
      }
      const newTagEntries: TagEntries = {
        ...structuredClone(state),
        status: TagsStatus.SYNCED,
        lastError: '',
      };
      for (const tag of tags) {
        const tagId = tag.id;
        newTagEntries.entries[tagId] = tag;
      }
      return newTagEntries;
    }
    case 'CLEAR_ERROR': {
      return { ...state, status: TagsStatus.SYNCED, lastError: '' };
    }
    case 'BULK_ADD_TAGS': {
      const newEntries = structuredClone(state);
      for (const tag of action.tags) {
        if (titleExists(state, tag.title)) {
          return {
            ...state,
            status: TagsStatus.ERROR,
            lastError: 'Cannot add duplicate tag',
          };
        }
        newEntries.entries[tag.id] = { title: tag.title, icon: tag.icon, id: tag.id };
      }
      newEntries.status = TagsStatus.SAVE_REQUIRED;
      newEntries.lastError = '';
      return newEntries;
    }
    default:
      return state;
  }
}

export function getTags(state: TagEntries): TagEntry[] {
  const tags: TagEntry[] = [];
  for (const [key, value] of Object.entries(state.entries)) {
    let entry = value as TagEntry;
    if (entry.title) {
      tags.push(entry);
    }
  }
  return tags;
}

export function getTag(state: TagEntries, tagId: string): TagEntry | undefined {
  return state.entries[tagId] as TagEntry;
}

export function getTagTitle(state: TagEntries, tagId: string): string {
  const tags = getTags(state);
  const tag = tags.find((tag) => tag.id === tagId);
  if (tag) {
    return tag.title;
  }
  return '';
}

function titleExists(state: TagEntries, title: string): boolean {
  const tags = getTags(state);
  const existingTag = tags.find((tag) => tag.title === title);
  return existingTag !== undefined;
}
function tagTitleIsDuplicated(state: TagEntries, tagId: string, title: string): boolean {
  const tags = getTags(state);
  const existingTag = tags.find((tag) => tag.title === title && tag.id !== tagId);
  return existingTag != undefined;
}
