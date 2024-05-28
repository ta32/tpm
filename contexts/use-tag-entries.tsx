import React, { createContext, Dispatch, useReducer } from 'react';
import { TagEntries, TagsAction, tagsReducer, TagsStatus } from './reducers/tag-entries-reducer';
import { TAG_ALL, TAG_BITCOIN, TAG_SOCIAL } from '../lib/images';

const ALL_ID = '0';
const BITCOIN_ID = '1';
const SOCIAL_ID = '2';
export const enum DEFAULT_TAGS {
  ALL = ALL_ID,
  BITCOIN = BITCOIN_ID,
  SOCIAL = SOCIAL_ID,
}
const initialTageEntries: TagEntries = {
  [ALL_ID]: {
    id: ALL_ID,
    title: 'ALL',
    icon: TAG_ALL,
  },
  [BITCOIN_ID]: {
    id: BITCOIN_ID,
    title: 'Bitcoin',
    icon: TAG_BITCOIN,
  },
  [SOCIAL_ID]: {
    id: SOCIAL_ID,
    title: 'Social Media',
    icon: TAG_SOCIAL,
  },
  status: TagsStatus.UNINITIALIZED,
  lastError: '',
};

const TagsContext = createContext<TagEntries | undefined>(undefined);
const TagsDispatchContext = createContext<Dispatch<TagsAction> | undefined>(undefined);

export function TagEntriesProvider({ children }: { children: React.ReactNode }) {
  const [tagEntries, dispatchTags] = useReducer(tagsReducer, initialTageEntries);
  return (
    <TagsContext.Provider value={tagEntries}>
      <TagsDispatchContext.Provider value={dispatchTags}>{children}</TagsDispatchContext.Provider>
    </TagsContext.Provider>
  );
}

export function useTagEntries() {
  const tags = React.useContext(TagsContext);
  if (!tags) {
    throw new Error('TagsContext must provide tags');
  }
  return tags;
}

export function useTagEntriesDispatch() {
  const dispatch = React.useContext(TagsDispatchContext);
  if (!dispatch) {
    throw new Error('TagsDispatchContext must be used within a TagsProvider');
  }
  return dispatch;
}
