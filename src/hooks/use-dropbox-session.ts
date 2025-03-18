import { useEffect, useRef, useState } from 'react';
import { useUser, useUserDispatch } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { connectDropbox, hasRedirectedFromAuth } from 'lib/dropbox';
import { APP_URL } from 'lib/constants';

export enum DropboxSessionStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export function useDropboxSession(): DropboxSessionStatus {
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
  const isConnected = useRef(false);
  const [status, setStatus] = useState(DropboxSessionStatus.NOT_CONNECTED);
  useEffect(() => {
    const locationSearch = window.location.search;
    let codeVerifier = window.sessionStorage.getItem('codeVerifier');
    if (user.status === UserStatus.OFFLINE && hasRedirectedFromAuth(locationSearch) && codeVerifier !== null && !isConnected.current) {
      setStatus(DropboxSessionStatus.CONNECTING);
      connectDropbox(APP_URL, codeVerifier, locationSearch)
        .then(({ dbc, name }) => {
          userDispatch({
            type: 'DROPBOX_USER_LOGGED_IN',
            userName: name,
            dbc,
          });
          setStatus(DropboxSessionStatus.CONNECTED);
          isConnected.current = true;
        }).catch((error) => {
        console.error(error);
        window.sessionStorage.clear();
      });
    }
  }, [user.status, userDispatch]);
  return status;
}