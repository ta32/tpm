import styles from "../styles/home.module.scss";
import Image from "next/image";
import TrezorConnect, {
  DeviceEventMessage,
  UI,
  DEVICE,
} from "@trezor/connect-web";
import { useEffect, useState, useCallback } from "react";
import { DropboxAuth, DropboxResponse, users } from "dropbox";
import { connectDropbox, hasRedirectedFromAuth } from "../lib/dropbox";
import { initTrezor, getDevices, getEncryptionKey } from "../lib/trezor";
import Layout from "../components/index/layout";
import PinDialog from "../components/index/pin_dialog";
import { useUser, useUserDispatch } from "../contexts/user";
import Router from "next/router";
import { UserStatus } from "../contexts/reducers/users";

const APP_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ?
  `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`:
  "http://localhost:3000/";
console.log("APP_URL: " + APP_URL);
// App key from dropbox app console. This is not secret.
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const STORAGE = "tpmDropboxToken";
const LOGOUT_URL = "https://www.dropbox.com/logout";
const ADDRS_PATH = "/";

let trezorConnectInit = false;

export default function Home() {
  const user = useUser();
  const userDispatch = useUserDispatch();

  const updateDevice = useCallback(
    (event: DeviceEventMessage) => {
      console.log("updateDevice callback");
      if (event.type === DEVICE.CONNECT) {
        console.log("device connected");
        getDevices()
          .then((device) => {
            if (device !== null) {
              userDispatch({ type: "ADD_DEVICE", device: device });
            }
          })
          .catch((error) => {
            console.log(error);
            return;
        });
      }
      if (event.type === DEVICE.DISCONNECT) {
        userDispatch({ type: "REMOVE_DEVICE" });
      }
    },
    [userDispatch]
  );

  useEffect(() => {
    let codeVerifier = window.sessionStorage.getItem("codeVerifier");
    if (
      user.status === UserStatus.OFFLINE &&
      hasRedirectedFromAuth() &&
      codeVerifier !== null
    ) {
      userDispatch({ type: "LOADING_DROPBOX_API_TOKEN" });
      connectDropbox(APP_URL, codeVerifier)
        .then((dbc) => {
          console.log("connected to dropbox");
          dbc
            .usersGetCurrentAccount()
            .then((dropBoxUser: DropboxResponse<users.FullAccount>) => {
              let name = dropBoxUser.result.name.display_name;
              userDispatch({
                type: "DROPBOX_USER_LOGGED_IN",
                userName: name,
                dbc,
              });
            })
            .catch((error) => {
              // TODO: handle error could not get current user account
              console.log(error);
            });
        })
        .catch((error) => {
          // TODO: handle error
          window.sessionStorage.clear();
          console.log(error);
        });
    }
    if (user.status === UserStatus.TPM_READY_TO_LOAD) {
      // navigate to the dashboard
      Router.push("/dashboard").catch((err) => console.log(err));
    }
  }, [user, userDispatch]);

  useEffect(() => {
    if(!trezorConnectInit) {
      console.log("initializing trezor");
      initTrezor(APP_URL, updateDevice)
        .catch((error) => {
        // FATAL ERROR
        console.log("Could not initialize trezor");
        console.log(error);
        return;
      });
    }
    console.log("trezor initialized OK");
    trezorConnectInit = true;
  }, [updateDevice]);

  const openPinDialog = () => {
    if (user.device === null) {
      console.error("wallet is not initialized");
      return;
    }
    // this will trigger the pin dialog to open on the hardware wallet
    getEncryptionKey(user.device.path).then((keyPair) => {
      if (keyPair !== null) {
        userDispatch({ type: "ACTIVATED_TMP_ON_DEVICE", keyPair });
      } else {
        // TODO: handle error -- user decided not to activate error or pin was wrong
      }
    });
    userDispatch({ type: "SHOW_PIN_DIALOG" });
  };
  const connectToDropbox = () => {
    if (APP_URL === undefined) {
      console.error("APP_URI is undefined");
      return;
    }
    const dbxAuth = new DropboxAuth({ clientId: CLIENT_ID });
    dbxAuth
      .getAuthenticationUrl(
        APP_URL,
        undefined,
        "code",
        "offline",
        undefined,
        undefined,
        true
      )
      .then((authUrl) => {
        window.sessionStorage.clear();
        window.sessionStorage.setItem(
          "codeVerifier",
          dbxAuth.getCodeVerifier()
        );
        window.location.href = authUrl as string;
      })
      .catch((error) => {
        console.log("error in dbxAuth.getAuthenticationUrl");
        console.log(error);
      });
  };
  const enterPin = (pin: string) => {
    userDispatch({ type: "DEVICE_PIN_ENTERED" });
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
  };

  return (
    <Layout>
      <Image src="/images/tpm-logo.svg" width={500} height={120} alt="" />
      <div className={styles.grid}>
        {user.status === UserStatus.OFFLINE && (
          <button className={styles.dropbox} onClick={connectToDropbox}>
            Sign in with Dropbox
          </button>
        )}
        {user.status === UserStatus.LOADING && (
          <span className={styles.spinner}></span>
        )}
        {user.status === UserStatus.ONLINE_NO_TREZOR && (
          <div className={styles.dropbox_user}>
            <Image
              src={"images/dropbox.svg"}
              alt={"signed in as dropbox user"}
              width={110}
              height={110}
            />
            <div className={styles.dropbox_user}>
              <span className={styles.dropbox_user}>Signed in as</span>
              <h3 className={styles.dropbox_user}>
                <b>{user.dropboxAccountName}</b>
              </h3>
              <span className={styles.connect_trezor}>
                <Image
                  src={"images/connect-trezor.svg"}
                  alt={"trezor-disconnected"}
                  width={20}
                  height={45}
                />
                <span>Connect TREZOR to continue</span>
              </span>
            </div>
          </div>
        )}
        {user.status === UserStatus.ONLINE_WITH_TREZOR && (
          <div className={styles.dropbox_user}>
            <Image
              src={"images/dropbox.svg"}
              alt={"signed in as dropbox user"}
              width={110}
              height={110}
            />
            <div>
              <span>Signed in as</span>
              <h3>
                <b>{user.dropboxAccountName}</b>
              </h3>
              <ul className={styles.dev_list}>
                <li key="1">
                  <a onClick={openPinDialog}>
                    <span
                      className={
                        user.device?.model == "1" ? styles.t1 : styles.t2
                      }
                    />
                    <span className="nav-label">
                      {user.device?.label || ""}
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}
        {user.status === UserStatus.SHOW_PIN_DIALOG && (
          <PinDialog submitCallback={enterPin}></PinDialog>
        )}
        {user.status === UserStatus.TREZOR_PIN_ENTERED && (
          <div className={styles.main}>
            <h1>Waking up ...</h1>
            <span className={styles.spinner}></span>
          </div>
        )}
      </div>
    </Layout>
  );
}
