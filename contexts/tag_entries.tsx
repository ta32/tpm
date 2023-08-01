import React, { createContext, Dispatch, useReducer } from 'react'
import { TagEntries, TagsAction, tagsReducer, TagsStatus } from './reducers/tag_entries'
import { ALL_ICON, BITCOIN_ICON, SOCIAL_ICON } from '../lib/icons'

const initialTageEntries: TagEntries = {
  '0': {
    id: '0',
    title: 'ALL',
    icon: ALL_ICON,
  },
  '1': {
    id: '1',
    title: 'Bitcoin',
    icon: BITCOIN_ICON,
  },
  '2': {
    id: '2',
    title: 'Social Media',
    icon: SOCIAL_ICON,
  },
  status: TagsStatus.UNINITIALIZED,
  lastError: ""
}

const TagsContext = createContext<TagEntries|undefined>(undefined);
const TagsDispatchContext = createContext<Dispatch<TagsAction>|undefined>(undefined);

export function TagEntriesProvider ({children}: {children: React.ReactNode}) {
  const[tagEntries, dispatchTags] = useReducer(tagsReducer, initialTageEntries);
  return (
    <TagsContext.Provider value={tagEntries}>
      <TagsDispatchContext.Provider value={dispatchTags}>
        {children}
      </TagsDispatchContext.Provider>
    </TagsContext.Provider>
  )
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
