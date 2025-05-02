import React, { createContext, Dispatch, useReducer } from 'react';
import { TagEntries, TagEntry, TagsAction, tagsReducer, TagsStatus } from './reducers/tag-entries.reducer';
import { TAG_ALL, TAG_BITCOIN, TAG_SOCIAL } from '../lib/images';

const ALL_ID = '0';
const SOCIAL_ID = '1';
const BITCOIN_ID = '2';
export const enum DEFAULT_TAGS {
  ALL = ALL_ID,
  BITCOIN = BITCOIN_ID,
  SOCIAL = SOCIAL_ID,
}
const defaultTagEntries: TagEntries = {
  entries: {
    [ALL_ID]: {
      id: ALL_ID,
      title: 'ALL',
      icon: TAG_ALL,
    },
    [SOCIAL_ID]: {
      id: SOCIAL_ID,
      title: 'Social',
      icon: TAG_SOCIAL,
    },
    [BITCOIN_ID]: {
      id: BITCOIN_ID,
      title: 'Bitcoin',
      icon: TAG_BITCOIN,
    },
  },
  status: TagsStatus.UNINITIALIZED,
  lastError: '',
};

const TagsContext = createContext<TagEntries | undefined>(undefined);
const TagsDispatchContext = createContext<Dispatch<TagsAction> | undefined>(undefined);

export function TagEntriesProvider({ children, initialTagEntries = defaultTagEntries }: { children: React.ReactNode, initialTagEntries?: TagEntries }) {
  const [tagEntries, dispatchTags] = useReducer(tagsReducer, initialTagEntries);
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