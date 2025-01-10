'use client';
import TrezorConnect, {
  DEVICE,
  DeviceEventMessage,
  TransportEventMessage,
  UI,
  UiEventMessage,
} from '@trezor/connect-web';
import { useEffect, useState } from 'react';
import { connectDropbox, getAuthUrl, hasRedirectedFromAuth } from 'lib/dropbox';
import { getDevices, getEncryptionKey, setTrezorEventHandlers } from 'lib/trezor';
import Home from 'components/app/Home';
import { useUser, useUserDispatch } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { useRouter } from 'next/navigation';
import { Routes, useLocation } from 'contexts/location.context';

const LOGOUT_URL = 'https://www.dropbox.com/logout';
const APP_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  : 'http://localhost:3000/';

export default function App() {
  const router = useRouter();
  const [location, setLocation] = useLocation();
  const [user, userRef] = useUser();
  const [userDispatch, userDispatchRef] = useUserDispatch();
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      connectDropbox(APP_URL, codeVerifier, locationSearch)
        .then(({ dbc, name }) => {
          setLoading(false);
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

  useEffect(() => {
    const transportEventCb = (event: TransportEventMessage) => {};
    const uiEventCb = (event: UiEventMessage) => {
      const user = userRef.current;
      const userDispatch = userDispatchRef.current;
      if (event.type === UI.REQUEST_PIN) {
        userDispatch({ type: 'SHOW_PIN_DIALOG' });
      } else if (event.type === UI.REQUEST_BUTTON) {
        userDispatch({ type: 'ASK_FOR_CONFIRMATION' });
      } else if (user.status === UserStatus.TREZOR_REQ_CONFIRMATION && event.type === UI.CLOSE_UI_WINDOW) {
        userDispatch({ type: 'CONFIRMATION_ENTERED' });
      } else {
        console.error('Unknown UI event', event);
      }
    };
    const updateDevice = (event: DeviceEventMessage) => {
      const userDispatch = userDispatchRef.current;
      if (event.type === DEVICE.CONNECT) {
        // TODO refactor - might not be require the call to get features (in getDevices)
        getDevices()
          .then((device) => {
            if (device !== null) {
              userDispatch({ type: 'ADD_DEVICE', device: device });
            }
          })
          .catch((error) => {
            console.error(error);
            return;
          });
      } else if (event.type === DEVICE.CONNECT_UNACQUIRED) {
        userDispatch({ type: 'ADD_DEVICE', device: null });
      }
      if (event.type === DEVICE.DISCONNECT) {
        userDispatch({ type: 'REMOVE_DEVICE' });
      }
    };
    setTrezorEventHandlers(updateDevice, transportEventCb, uiEventCb);
  }, [userDispatchRef, userRef]);

  const openDevice = () => {
    if (user.device === null) {
      console.error('wallet is not initialized');
      return;
    }
    getEncryptionKey(user.device.path).then((keyPair) => {
      if (keyPair !== null) {
        userDispatch({ type: 'ACTIVATED_TMP_ON_DEVICE', keyPair });
        setLoading(true);
        setLocation(Routes.DASHBOARD);
      } else {
        // TODO: handle error -- user decided not to activate error or pin was wrong
      }
    });
  };
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
  const enterPin = (pin: string) => {
    userDispatch({ type: 'DEVICE_PIN_ENTERED' });
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
  };

  const handleLogout = () => {
    userDispatch({ type: 'LOGOUT' });
    window.sessionStorage.clear();
  };

  return (
    <Home loading={loading}
          handleDropBoxSignIn={handleDropBoxSignIn}
          handleLogout={handleLogout}
          enterPin={enterPin}
          openDevice={openDevice}>
    </Home>
  );
}
