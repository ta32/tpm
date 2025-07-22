import React, { useContext, useState } from 'react';
import Layout from './Home/Layout';
import PinDialog from 'components/ui/PinDialog';
import DeviceIcon from 'components/svg/ui/DeviceIcon';
import BridgeDownModal from 'components/ui/BridgeDownModal';
import Image from 'next/image';
import { IMAGE_FILE } from 'lib/images';
import styles from './Home.module.scss';
import { UserStatus } from 'contexts/reducers/user.reducer';
import Colors from 'styles/colors.module.scss';
import { useUser, useUserDispatch } from 'contexts/user.context';
import { DependenciesContext } from 'contexts/deps.context';
import TrezorConnect, { UI } from '@trezor/connect-web';
import { Routes, useLocation } from 'contexts/location.context';
import { DropboxSessionStatus, useDropboxSession } from 'hooks/use-dropbox-session';
import { DROPBOX_CLIENT_ID } from 'lib/constants';
import { useTrezorTransportEvents } from 'hooks/use-trezor-transport-events';


const LOGOUT_URL = 'https://www.dropbox.com/logout';

interface DropBoxArgs {
  urlSearch: string;
  codeVerifier: string | null;
}

interface HomeProps {
  dropboxArgs: DropBoxArgs;
  handleDropBoxSignIn: () => void;
  handleLogout: () => void;
}
export default function Home({ handleDropBoxSignIn, handleLogout, dropboxArgs }: HomeProps) {
  const { trezor } = useContext(DependenciesContext);
  const [loading, setLoading] = useState(false);
  const [user] = useUser();
  const [_, setLocation] = useLocation();
  const [userDispatch] = useUserDispatch();
  const [showLogoutUrl, setShowLogoutUrl] = useState(false);
  const { urlSearch, codeVerifier } = dropboxArgs;
  const dropboxStatus = useDropboxSession(urlSearch, DROPBOX_CLIENT_ID, codeVerifier);

  // Link Trezor transport events to user context
  useTrezorTransportEvents();

  const { getEncryptionKey } = trezor();
  const handleShowLogoutUrl = () => {
    setShowLogoutUrl(!showLogoutUrl);
  };

  const enterPin = (pin: string) => {
    userDispatch({ type: 'DEVICE_PIN_ENTERED' });
    // TODO use dependency injection for TrezorConnect
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
  };

  const onClickDropboxSignIn = () => {
    setLoading(true);
    handleDropBoxSignIn();
  };

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

  const trezorLogo = user.device?.model == '1' ? IMAGE_FILE.TREZOR_1.path() : IMAGE_FILE.TREZOR_2.path();
  const renderStorageSelection = () => {
    return (
      <button className={styles.dropbox} onClick={onClickDropboxSignIn} data-cy="storage-login">
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
            <b data-cy={'dropbox-account-name'}>{user.dropboxAccountName}</b>
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
  const initialLoadingStatus = dropboxStatus !== DropboxSessionStatus.NOT_CONNECTED;
  const redirectedFromOauthAndLoading = initialLoadingStatus && user.status == UserStatus.OFFLINE;
  const renderContent = () => {
    if (loading || redirectedFromOauthAndLoading) {
      return <span data-cy={'home-page-spinner'} className={styles.spinner}></span>;
    } else {
      switch (user.status) {
        case UserStatus.TREZOR_BRIDGE_UNAVAILABLE:
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
        case UserStatus.TREZOR_REQ_CONFIRMATION:
          return (
            <div className={styles.main}>
              <div className={styles.device_logo}>
                <DeviceIcon width={50} fill={Colors.soft_white} />
              </div>
              <span className={styles.desc}>Follow the instructions on your</span>
              <span className={styles.desc}>
                <b>{user.device?.label}</b> device
              </span>
            </div>
          );
        case UserStatus.TREZOR_UNACQUIRED_DEVICE:
          return (
            <div className={styles.main}>
              <div className={styles.device_logo}>
                <DeviceIcon width={50} fill={Colors.soft_white} />
              </div>
              <span className={styles.desc}>Device is used elsewhere</span>
              <span className={styles.desc}>
                <b>Reconnect</b> your device
              </span>
            </div>
          );
        case UserStatus.TREZOR_PIN_ENTERED:
        case UserStatus.TREZOR_ENTERED_CONFIRMATION:
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
      <BridgeDownModal show={user.status == UserStatus.TREZOR_BRIDGE_UNAVAILABLE}/>
      <Image unoptimized={true} src={IMAGE_FILE.TPM_LOGO.path()} width={500} height={120} alt="" />
      <div className={styles.grid}>{renderContent()}</div>
    </Layout>
  );
}