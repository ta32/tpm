import React, { useState } from 'react';
import styles from './dashboard.module.scss';
import SidePanel from '../components/dashboard/SidePanel';
import PasswordTable from '../components/dashboard/PasswordTable';
import StatusModal from '../components/dashboard/StatusModal';
import { useUser, useUserDispatch } from '../contexts/use-user';
import PinModal from '../components/ui/PinModal';
import TrezorConnect, { UI } from '@trezor/connect-web';
import { UserStatus } from '../contexts/reducers/user-reducer';

export default function Dashboard() {
  const user = useUser();
  const userDispatch = useUserDispatch();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const handleTageSelect = (tagId: string) => {
    setSelectedTag(tagId);
  };
  const enterPin = (pin: string) => {
    userDispatch({ type: 'DEVICE_PIN_ENTERED' });
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
  };

  return (
    <div className={styles.dashboardLayout}>
      <SidePanel onSelectedTag={handleTageSelect} />
      <PinModal show={user.status === UserStatus.TREZOR_REQ_PIN_AUTH} submitCallback={enterPin} />
      <section className={styles.content}>
        {user.dbc !== null && user.device !== null && (
          <PasswordTable
            selectedTag={selectedTag}
            dbc={user.dbc}
            accountName={user.dropboxAccountName}
            masterPublicKey={user.device.masterKey}
            appDataEncryptionKey={user.device.encryptionKey}
          />
        )}
        <StatusModal />
      </section>
    </div>
  );
}
