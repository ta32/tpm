import React, {
  createContext,
  Dispatch,
  MutableRefObject,
  RefObject,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { User, UserAction, userReducer, UserStatus } from './reducers/user.reducer';
import { Dropbox } from 'dropbox';
export { type User } from './reducers/user.reducer';

const defaultInitialUser = {
  status: UserStatus.OFFLINE,
  device: null,
  dropboxAccountName: '',
  dbc: null,
  errorMsg: '',
};

// State for testing Trezor connect without doing the dropbox auth flow
// const initialUser = {
//   status: UserStatus.ONLINE_NO_TREZOR,
//   device: null,
//   dropboxAccountName: "Ta32Mock",
//   dbc: null,
//   errorMsg: "",
// };

// State for testing the Dashboard page
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

// State for showing Trezor logo
// const initialUser: User = {
//   status: UserStatus.ONLINE_WITH_TREZOR,
//   device: {
//     label: "test",
//     model: "1",
//     deviceId: "test",
//     path: "test",
//     masterKey: "test",
//     encryptionKey: new Uint8Array()
//   },
//   dropboxAccountName: 'test',
//   dbc: new Dropbox()
// }

type UserContextType = [User];
type UserDispatchContextType = [Dispatch<UserAction>];

const UserContext = createContext<UserContextType | undefined>(undefined);
const UserDispatchContext = createContext<UserDispatchContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUser = defaultInitialUser,
}: {
  children: React.ReactNode;
  initialUser?: User;
}) {
  const [user, userDispatch] = useReducer(userReducer, initialUser);

  return (
    <UserContext.Provider value={[user]}>
      <UserDispatchContext.Provider value={[userDispatch]}>{children}</UserDispatchContext.Provider>
    </UserContext.Provider>
  );
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
