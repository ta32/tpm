import React from "react";
import styles from "./dashboard.module.scss";
import SidePanel from "../components/dashboard/side_panel";
import PasswordTable from "../components/dashboard/password_table";
import LoaderModal from "../components/dashboard/loader_modal";
import { useUser } from "../contexts/user";

export default function Dashboard() {
  const user = useUser();
  return (
    <div className={styles.dashboardLayout}>
      <SidePanel />
      <section className={styles.content}>
        {user.dbc !== null && user.device !== null && (
          <PasswordTable
            dbc={user.dbc}
            accountName={user.dropboxAccountName}
            masterPublicKey={user.device.masterKey}
            appDataEncryptionKey={user.device.encryptionKey}
          />
        )}
        <LoaderModal />
      </section>
    </div>
  );
}
