import React, { useState } from 'react';
import Layout from './Home/Layout';
import PinDialog from 'components/ui/PinDialog';
import Image from 'next/image';
import { IMAGE_FILE } from '../../lib/images';
import styles from './Home.module.scss';
import { UserStatus } from '../../contexts/reducers/user-reducer';
import DeviceIcon from '../svg/ui/DeviceIcon';
import Colors from '../../styles/colors.module.scss';
import { useUser } from '../../contexts/use-user';

const LOGOUT_URL = 'https://www.dropbox.com/logout';

interface HomeProps {
  loading: boolean;
  handleDropBoxSignIn: () => void;
  handleLogout: () => void;
  openDevice: () => void;
  enterPin: (pin: string) => void;
}
export default function Home({loading, handleDropBoxSignIn, handleLogout, openDevice, enterPin}: HomeProps) {
  const [user, userRef] = useUser();
  const [showLogoutUrl, setShowLogoutUrl] = useState(false);

  const handleShowLogoutUrl = () => {
    setShowLogoutUrl(!showLogoutUrl);
  };

  const trezorLogo = user.device?.model == '1' ? IMAGE_FILE.TREZOR_1.path() : IMAGE_FILE.TREZOR_2.path();
  const renderStorageSelection = () => {
    return (
      <button className={styles.dropbox} onClick={handleDropBoxSignIn} data-cy="storage-login">
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
      <Image unoptimized={true} src={IMAGE_FILE.TPM_LOGO.path()} width={500} height={120} alt="" />
      <div className={styles.grid}>{renderContent()}</div>
    </Layout>
  );
}
