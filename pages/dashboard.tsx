import React from "react";
import styles from "./dashboard.module.scss";
import SidePanel from "../components/dashboard/side_panel";
import PasswordTable from "../components/dashboard/password_table";
import StatusModal from "../components/dashboard/status_modal";
import { useUser, useUserDispatch } from '../contexts/user'
import PinModal from '../components/ui/pin_modal'
import TrezorConnect, { UI } from '@trezor/connect-web'
import { UserStatus } from '../contexts/reducers/users'

export default function Dashboard() {
  const user = useUser();
  const userDispatch = useUserDispatch();
  const enterPin = (pin: string) => {
    userDispatch({ type: "DEVICE_PIN_ENTERED" });
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
  };
  return (
    <div className={styles.dashboardLayout}>
      <SidePanel />
      {user.status === UserStatus.SHOW_PIN_DIALOG && (
        <PinModal submitCallback={enterPin} />
      )}
      <section className={styles.content}>
        {user.dbc !== null && user.device !== null && (
          <PasswordTable
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
