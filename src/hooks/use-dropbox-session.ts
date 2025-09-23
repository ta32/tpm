import { useContext, useEffect, useRef, useState } from 'react';
import { useUser, useUserDispatch } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { APP_URL } from 'lib/constants';
import { DependenciesContext } from 'contexts/deps.context';

export enum DropboxSessionStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export function useDropboxSession(
  locationSearch: string,
  clientId: string | undefined,
  codeVerifier: string | null
): DropboxSessionStatus {
  const { dropbox } = useContext(DependenciesContext);
  const { connectDropbox, hasRedirectedFromAuth } = dropbox();
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
  const isConnected = useRef(false);
  const [status, setStatus] = useState(DropboxSessionStatus.NOT_CONNECTED);
  useEffect(() => {
    if (
      user.status === UserStatus.OFFLINE &&
      hasRedirectedFromAuth(locationSearch) &&
      clientId !== undefined &&
      codeVerifier !== null &&
      !isConnected.current
    ) {
      setStatus(DropboxSessionStatus.CONNECTING);
      connectDropbox(APP_URL, codeVerifier, locationSearch, clientId)
        .then(({ dbc, name }) => {
          userDispatch({
            type: 'DROPBOX_USER_LOGGED_IN',
            userName: name,
            dbc,
          });
          setStatus(DropboxSessionStatus.CONNECTED);
          isConnected.current = true;
        })
        .catch((error) => {
          console.error(error);
          window.sessionStorage.clear();
        });
    }
  }, [clientId, codeVerifier, connectDropbox, hasRedirectedFromAuth, locationSearch, user.status, userDispatch]);
  return status;
}
