import React, { createContext, Dispatch, useContext, useReducer } from 'react'
import { User, UserAction, userReducer, UserStatus } from './reducers/users'
import { Dropbox } from 'dropbox'
export { type User } from './reducers/users';

const initialUser = {
  status: UserStatus.OFFLINE,
  device: null,
  dropboxAccountName: '',
  dbc: null,
  errorMsg: ''
};

// const initialUser: User = {
//   status: UserStatus.TPM_READY_TO_LOAD,
//   device: {
//     label: "test",
//     model: "test",
//     deviceId: "test",
//     path: "test",
//     masterKey: "test",
//     encryptionKey: new Uint8Array()
//   },
//   dropboxAccountName: 'test',
//   dbc: new Dropbox()
// }

const UserContext = createContext<User | undefined>(undefined);
const UserDispatchContext = createContext<Dispatch<UserAction> | undefined>(undefined);

export function UserProvider({children}: {children: React.ReactNode}) {
  const [user, dispatch] = useReducer(userReducer, initialUser);
  return (
    <UserContext.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  )
}
export function useUser() {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error('UserContext must provide a user');
  }
  return user;
}
export function useUserDispatch() {
  const dispatch = useContext(UserDispatchContext);
  if (!dispatch) {
    throw new Error('UserDispatchContext must be used within a UserProvider');
  }
  return dispatch;
}
