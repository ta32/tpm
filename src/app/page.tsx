'use client';
import { useEffect, useState } from 'react';
import { connectDropbox, getAuthUrl, hasRedirectedFromAuth } from 'lib/dropbox';
import Home from 'components/app/Home';
import { useUser, useUserDispatch } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { useRouter } from 'next/navigation';
import { Routes, useLocation } from 'contexts/location.context';
import { APP_URL } from 'lib/constants';
import { useTrezorUiEvents } from '../hooks/use-trezor-ui-events';
import { useTrezorDeviceEvents } from '../hooks/use-trezor-device-events';
export default function App() {
  const router = useRouter();
  const [location, _] = useLocation();
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
  const [redirectedFromOauth, setRedirectedFromOauth] = useState(false);
  // Link Trezor events to user context
  useTrezorUiEvents();
  // Link Trezor device events to user context
  useTrezorDeviceEvents();
  // Navigation
  useEffect(() => {
    if (location === Routes.DASHBOARD) {
      router.push('/dashboard');
    }
  }, [location, router]);

  useEffect(() => {
    const locationSearch = window.location.search;
    let codeVerifier = window.sessionStorage.getItem('codeVerifier');
    if (user.status === UserStatus.OFFLINE && hasRedirectedFromAuth(locationSearch) && codeVerifier !== null) {
      setRedirectedFromOauth(true);
      connectDropbox(APP_URL, codeVerifier, locationSearch)
        .then(({ dbc, name }) => {
          userDispatch({
            type: 'DROPBOX_USER_LOGGED_IN',
            userName: name,
            dbc,
          });
        }).catch((error) => {
        console.error(error);
        window.sessionStorage.clear();
      });
    }
  }, [user, userDispatch]);

  const handleDropBoxSignIn = () => {
    if (APP_URL === undefined) {
      console.error('APP_URI is undefined');
      return;
    }
    getAuthUrl(APP_URL).then(({authUrl, codeVerifier}) => {
      window.sessionStorage.clear();
      window.sessionStorage.setItem('codeVerifier', codeVerifier);
      window.location.href = authUrl as string;
    }).catch((error) => {
      console.error(error);
    });
  };

  const handleLogout = () => {
    userDispatch({ type: 'LOGOUT' });
    window.sessionStorage.clear();
  };

  return (
    <Home
      initialLoadingStatus={redirectedFromOauth}
      handleDropBoxSignIn={handleDropBoxSignIn}
      handleLogout={handleLogout}>
    </Home>
  );
}
