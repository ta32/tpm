import React, { useState } from 'react';
import SidePanel from './DashboardContent/SidePanel';
import PasswordTable from './DashboardContent/PasswordTable';
import StatusModal from './DashboardContent/StatusModal';
import PinModal from 'components/ui/PinModal';
import styles from './DashboardContent.module.scss';
import { UserStatus } from 'contexts/reducers/user-reducer';
import { useUser, useUserDispatch } from 'contexts/use-user';
import TrezorConnect, { UI } from '@trezor/connect-web';


export default function DashboardContent() {
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
  const [selectedTag, setSelectedTag] = useState<string>('');

  const handleTageSelect = (tagId: string) => {
    setSelectedTag(tagId);
  };
  const enterPin = (pin: string) => {
    userDispatch({ type: 'DEVICE_PIN_ENTERED' });
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
  };

  return (
    <div>
      <SidePanel onSelectedTag={handleTageSelect} />
      <PinModal show={user.status === UserStatus.TREZOR_REQ_PIN_AUTH} submitCallback={enterPin} />
      <section className={styles.content}>
        {user.dbc !== null && user.device !== null && (
          <PasswordTable
            selectedTag={selectedTag}
            dbc={user.dbc}
            accountName={user.dropboxAccountName}
            masterPublicKey={user.device.appDataSeed}
            appDataEncryptionKey={user.device.appDataEncryptionKey}
          />
        )}
        <StatusModal />
      </section>
    </div>
  );
}