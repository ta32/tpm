import styles from './index.module.scss';
import Image from 'next/image';
import TrezorConnect, {
  DEVICE,
  DeviceEventMessage,
  TransportEventMessage,
  UI,
  UiEventMessage,
} from '@trezor/connect-web';
import { useCallback, useEffect, useState } from 'react';
import { DropboxAuth, DropboxResponse, users } from 'dropbox';
import { connectDropbox, hasRedirectedFromAuth } from '../lib/dropbox';
import { getDevices, getEncryptionKey, initTrezor } from '../lib/trezor';
import Layout from '../components/index/Layout';
import PinDialog from '../components/index/PinDialog';
import { useUser, useUserDispatch } from '../contexts/use-user';
import { UserStatus } from '../contexts/reducers/user-reducer';
import { IMAGE_FILE } from '../lib/images';
import { useRouter } from 'next/router';

const APP_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  : 'http://localhost:3000/';
// Trezor bridge whitelists localhost and trezor.io domains
const TRUSTED_HOSTS = ['localhost', 'trezor.io'];
// App key from dropbox app console. This is not secret.
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const STORAGE = 'tpmDropboxToken';
const LOGOUT_URL = 'https://www.dropbox.com/logout';
const ADDRS_PATH = '/';

let trezorConnectInit = false;

export default function Home() {
  const router = useRouter();
  const user = useUser();
  const userDispatch = useUserDispatch();
  const [loading, setLoading] = useState(false);
  const [showLogoutUrl, setShowLogoutUrl] = useState(false);

  const uiEventCb = useCallback(
    (event: UiEventMessage) => {
      if (event.type === UI.REQUEST_PIN) {
        userDispatch({ type: 'SHOW_PIN_DIALOG' });
      }
    },
    [userDispatch]
  );

  const transportEventCb = useCallback((event: TransportEventMessage) => {}, []);
  const updateDevice = useCallback(
    (event: DeviceEventMessage) => {
      if (event.type === DEVICE.CONNECT) {
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
      }
      if (event.type === DEVICE.DISCONNECT) {
        userDispatch({ type: 'REMOVE_DEVICE' });
      }
    },
    [userDispatch]
  );

  useEffect(() => {
    let codeVerifier = window.sessionStorage.getItem('codeVerifier');
    if (user.status === UserStatus.OFFLINE && hasRedirectedFromAuth() && codeVerifier !== null) {
      setLoading(true);
      connectDropbox(APP_URL, codeVerifier)
        .then((dbc) => {
          dbc
            .usersGetCurrentAccount()
            .then((dropBoxUser: DropboxResponse<users.FullAccount>) => {
              setLoading(false);
              let name = dropBoxUser.result.name.display_name;
              userDispatch({
                type: 'DROPBOX_USER_LOGGED_IN',
                userName: name,
                dbc,
              });
            })
            .catch((error) => {
              // TODO: handle error could not get current user account
              console.error(error);
            });
        })
        .catch((error) => {
          // TODO: handle error
          window.sessionStorage.clear();
          console.error(error);
        });
    }
  }, [router, user, userDispatch]);

  useEffect(() => {
    if (!trezorConnectInit) {
      const trustedHost = TRUSTED_HOSTS.includes(window.location.hostname);
      initTrezor(APP_URL, trustedHost, updateDevice, transportEventCb, uiEventCb).catch((error) => {
        // FATAL ERROR
        console.error(error);
        return;
      });
    }
    trezorConnectInit = true;
  }, [updateDevice, transportEventCb, uiEventCb]);

  const loadDashboard = () => {
    setLoading(true);
    router.push('/dashboard').catch((err) => console.error(err));
  };

  const openDevice = () => {
    if (user.device === null) {
      console.error('wallet is not initialized');
      return;
    }
    getEncryptionKey(user.device.path).then((keyPair) => {
      if (keyPair !== null) {
        userDispatch({ type: 'ACTIVATED_TMP_ON_DEVICE', keyPair });
        loadDashboard();
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
    // TODO this auth logic shouldn't be here
    const dbxAuth = new DropboxAuth({ clientId: CLIENT_ID });
    dbxAuth
      .getAuthenticationUrl(APP_URL, undefined, 'code', 'offline', undefined, undefined, true)
      .then((authUrl) => {
        window.sessionStorage.clear();
        window.sessionStorage.setItem('codeVerifier', dbxAuth.getCodeVerifier());
        window.location.href = authUrl as string;
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const enterPin = (pin: string) => {
    userDispatch({ type: 'DEVICE_PIN_ENTERED' });
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
  };

  const handleShowLogoutUrl = () => {
    setShowLogoutUrl(!showLogoutUrl);
  };

  const handleLogout = () => {
    userDispatch({ type: 'LOGOUT' });
    window.sessionStorage.clear();
  };

  const trezorLogo = user.device?.model == '1' ? IMAGE_FILE.TREZOR_1.path() : IMAGE_FILE.TREZOR_2.path();
  const renderStorageSelection = () => {
    return (
      <button className={styles.dropbox} onClick={handleDropBoxSignIn}>
        <Image
          className={styles.icon_over_button}
          src={IMAGE_FILE.DROPBOX_BLUE.path()}
          width={30}
          height={30}
          alt={'sign in with dropbox'}
        />
        Sign in with Dropbox
      </button>
    );
  };
  const renderTrezorPanel = () => {
    return (
      <div className={styles.dropbox_user}>
        <Image src={IMAGE_FILE.DROPBOX.path()} alt={'signed in as dropbox user'} width={110} height={110} />
        <div className={styles.dropbox_user}>
          <span className={styles.dropbox_user}>Signed in as</span>
          <h3 className={styles.dropbox_user}>
            <b>{user.dropboxAccountName}</b>
          </h3>
          <span className={styles.connect_trezor}>
            <Image src={IMAGE_FILE.CONNECT_TREZOR.path()} alt={'trezor-disconnected'} width={20} height={45} />
            <span>Connect TREZOR to continue</span>
          </span>
        </div>
      </div>
    );
  };
  const renderTrezorList = () => {
    return (
      <div className={styles.dropbox_user}>
        <Image src={IMAGE_FILE.DROPBOX.path()} alt={'signed in as dropbox user'} width={110} height={110} />
        <div>
          <span>Signed in as</span>
          <h3 onClick={handleShowLogoutUrl}>
            <b>{user.dropboxAccountName}</b>
          </h3>
          {showLogoutUrl && (
            <a onClick={handleLogout} className={styles.logout_link} href={LOGOUT_URL} target="_blank" rel="noreferrer">
              <span>Logout and use a different account</span>
            </a>
          )}
          <ul className={styles.dev_list}>
            <li key="1">
              <a onClick={openDevice}>
                <span className={styles.trezor_logo} style={{ backgroundImage: `url(${trezorLogo})` }} />
                <span className={user.device?.model == '1' ? styles.t1 : styles.t2} />
                <span className="nav-label">{user.device?.label || ''}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  };
  const renderContent = () => {
    if (loading) {
      return <span className={styles.spinner}></span>;
    } else {
      switch (user.status) {
        case UserStatus.OFFLINE:
          return renderStorageSelection();
        case UserStatus.ONLINE_NO_TREZOR:
          return renderTrezorPanel();
        case UserStatus.ONLINE_WITH_TREZOR:
          return renderTrezorList();
        case UserStatus.TREZOR_ACTIVATED:
          return renderTrezorList();
        case UserStatus.TREZOR_REQ_PIN_AUTH:
          return <PinDialog submitCallback={enterPin}></PinDialog>;
        case UserStatus.TREZOR_PIN_ENTERED:
          return (
            <div className={styles.main}>
              <h1>Waking up ...</h1>
              <span className={styles.spinner}></span>
            </div>
          );
        default:
          return <> </>;
      }
    }
  };

  return (
    <Layout>
      <Image src={IMAGE_FILE.TPM_LOGO.path()} width={500} height={120} alt="" />
      <div className={styles.grid}>{renderContent()}</div>
    </Layout>
  );
}
