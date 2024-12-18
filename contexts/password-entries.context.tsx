import React, { createContext, Dispatch, useContext, useReducer } from 'react';
import {
  PasswordEntries,
  PasswordEntriesAction,
  passwordEntriesReducer,
  PasswordEntriesStatus,
} from './reducers/password-entries.reducer';

const initialEntries: PasswordEntries = {
  status: PasswordEntriesStatus.UNINITIALIZED,
  version: 0,
  lastError: '',
};

const PasswordEntriesContext = createContext<PasswordEntries | undefined>(undefined);
const PasswordEntriesDispatchContext = createContext<Dispatch<PasswordEntriesAction> | undefined>(undefined);

export function PasswordEntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, dispatch] = useReducer(passwordEntriesReducer, initialEntries);
  return (
    <PasswordEntriesContext.Provider value={entries}>
      <PasswordEntriesDispatchContext.Provider value={dispatch}>{children}</PasswordEntriesDispatchContext.Provider>
    </PasswordEntriesContext.Provider>
  );
}

export function usePasswordEntries() {
  const entries = useContext(PasswordEntriesContext);
  if (!entries) {
    throw new Error('PasswordEntriesContext must provide entries');
  }
  return entries;
}

export function usePasswordEntriesDispatch() {
  const dispatch = useContext(PasswordEntriesDispatchContext);
  if (!dispatch) {
    throw new Error('PasswordEntriesDispatchContext must be used within a PasswordEntriesProvider');
  }
  return dispatch;
}
