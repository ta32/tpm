'use client';
import React, { useState } from 'react';
import SidePanel from './PasswordManager/SidePanel';
import PasswordTable from './PasswordManager/PasswordTable';
import StatusModal from './PasswordManager/StatusModal';
import PinModal from 'components/ui/PinModal';
import BridgeDownModal from 'components/ui/BridgeDownModal';
import styles from './PasswordManager.module.scss';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { useUser, useUserDispatch } from 'contexts/user.context';
import TrezorConnect, { UI } from '@trezor/connect-web';


export default function PasswordManager() {
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
      <BridgeDownModal show={user.status == UserStatus.ONLINE_NO_TREZOR}/>
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
