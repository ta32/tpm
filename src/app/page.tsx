'use client';
import { useEffect, useRef, useState } from 'react';
import { connectDropbox, getAuthUrl, hasRedirectedFromAuth } from 'lib/dropbox';
import Home from 'components/app/Home';
import { useUser, useUserDispatch } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { useRouter } from 'next/navigation';
import { Routes, useLocation } from 'contexts/location.context';
import { APP_URL } from 'lib/constants';
import { useTrezorUiEvents } from '../hooks/use-trezor-ui-events';
import { useTrezorDeviceEvents } from '../hooks/use-trezor-device-events';
import { DropboxSessionStatus, useDropboxSession } from '../hooks/use-dropbox-session';
export default function App() {
  const router = useRouter();
  const [location, _] = useLocation();
  const [userDispatch] = useUserDispatch();
  const dropboxStatus = useDropboxSession();
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
      initialLoadingStatus={dropboxStatus !== DropboxSessionStatus.NOT_CONNECTED}
      handleDropBoxSignIn={handleDropBoxSignIn}
      handleLogout={handleLogout}>
    </Home>
  );
}
