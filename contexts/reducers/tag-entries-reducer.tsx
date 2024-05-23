// MODEL

import { uniqueId } from 'lib/utils';

export interface TagEntries {
  [key: string]: TagEntry | string | number;
  status: TagsStatus;
  lastError: string;
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

export type TagsAction = AddTag | RemoveTag | UpdateTag | UploadedTags | SyncTags | ClearError;

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
      const newEntries = { ...state };
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
      newEntries[tagId] = { title: action.title, icon: action.icon, id: tagId };
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
      if (state[tagId] === undefined) {
        return {
          ...state,
          status: TagsStatus.ERROR,
          lastError: 'Cannot remove tag that does not exist',
        };
      }
      const newEntries: TagEntries = {
        status: TagsStatus.SAVE_REQUIRED,
        lastError: '',
      };
      const tags = getTags(state);
      const tagsWithoutRemoved = tags.filter((tag) => tag.id !== tagId);
      for (const tag of tagsWithoutRemoved) {
        newEntries[tag.id] = tag;
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
      const newEntries = { ...state };
      const oldTagId = action.tagId;
      if (newEntries[oldTagId] === undefined) {
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
      newEntries[action.tagId] = {
        ...(newEntries[oldTagId] as TagEntry),
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
        ...state,
        status: TagsStatus.SYNCED,
        lastError: '',
      };
      for (const tag of tags) {
        const tagId = tag.id;
        newTagEntries[tagId] = tag;
      }
      return newTagEntries;
    }
    case 'CLEAR_ERROR': {
      return { ...state, status: TagsStatus.SYNCED, lastError: '' };
    }
    default:
      return state;
  }
}

export function getTags(state: TagEntries): TagEntry[] {
  const tags: TagEntry[] = [];
  for (const [key, value] of Object.entries(state)) {
    let entry = value as TagEntry;
    if (entry.title) {
      tags.push(entry);
    }
  }
  return tags;
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
