'use client';
import { useEffect } from 'react';
import { getAuthUrl } from 'lib/dropbox';
import Home from 'components/app/Home';
import { useUserDispatch } from 'contexts/user.context';
import { useRouter } from 'next/navigation';
import { Routes, useLocation } from 'contexts/location.context';
import { APP_URL, DROPBOX_CLIENT_ID } from 'lib/constants';
import { useTrezorUiEvents } from 'hooks/use-trezor-ui-events';
import { useTrezorDeviceEvents } from 'hooks/use-trezor-device-events';
import { useDropboxSession } from 'hooks/use-dropbox-session';
import { useDropboxWindowOauthParams } from 'hooks/use-dropbox-window-oauth-params';
export default function App() {
  const router = useRouter();
  const [location, _] = useLocation();
  const [userDispatch] = useUserDispatch();
  const { search, codeVerifier } = useDropboxWindowOauthParams();
  const dropboxStatus = useDropboxSession(search, DROPBOX_CLIENT_ID, codeVerifier, );
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

  const handleDropBoxSignIn = () => {
    if (DROPBOX_CLIENT_ID === undefined) {
      console.error('DROPBOX_CLIENT_ID is undefined');
      return;
    }
    if (APP_URL === undefined) {
      console.error('APP_URI is undefined');
      return;
    }
    getAuthUrl(APP_URL, DROPBOX_CLIENT_ID)
      .then(({ authUrl, codeVerifier }) => {
        window.sessionStorage.clear();
        window.sessionStorage.setItem('codeVerifier', codeVerifier);
        window.location.href = authUrl as string;
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleLogout = () => {
    userDispatch({ type: 'LOGOUT' });
    window.sessionStorage.clear();
  };

  return (
    <Home
      dropboxArgs={{
        urlSearch: search,
        codeVerifier: codeVerifier,
      }}
      handleDropBoxSignIn={handleDropBoxSignIn}
      handleLogout={handleLogout}
    ></Home>
  );
}
