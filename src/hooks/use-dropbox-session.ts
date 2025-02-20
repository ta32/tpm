import { useEffect, useRef } from 'react';
import { useUser, useUserDispatch } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { connectDropbox, hasRedirectedFromAuth } from 'lib/dropbox';
import { APP_URL } from 'lib/constants';

export function useDropboxSession(): boolean {
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
  const isConnected = useRef(false);
  useEffect(() => {
    const locationSearch = window.location.search;
    let codeVerifier = window.sessionStorage.getItem('codeVerifier');
    if (user.status === UserStatus.OFFLINE && hasRedirectedFromAuth(locationSearch) && codeVerifier !== null && !isConnected.current) {
      connectDropbox(APP_URL, codeVerifier, locationSearch)
        .then(({ dbc, name }) => {
          userDispatch({
            type: 'DROPBOX_USER_LOGGED_IN',
            userName: name,
            dbc,
          });
          isConnected.current = true;
        }).catch((error) => {
        console.error(error);
        window.sessionStorage.clear();
      });
    }
  }, [user.status, userDispatch]);
  return isConnected.current;
}