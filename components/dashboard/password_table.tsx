import React, { useCallback, useEffect, useState } from "react";
import styles from "./password_table.module.scss";
import FilterInput from "./password_table/filter_input";
import TableEntry from "./password_table/table_entry";
import {
  usePasswordEntries,
  usePasswordEntriesDispatch,
} from "../../contexts/password_entries";
import { readAppFile, saveAppFile } from "../../lib/dropbox";
import { fromState } from "../../lib/storage";
import { appFileName } from "../../lib/appfile";
import { decryptAppData, encryptAppData } from "../../lib/trezor";
import {
  getSafePasswordEntries,
  PasswordEntriesStatus,
} from "../../contexts/reducers/password_entries";
import {
  useTagEntries,
  useTagEntriesDispatch,
} from "../../contexts/tag_entries";
import { TagsStatus } from "../../contexts/reducers/tag_entries";
import { Dropbox } from "dropbox";

interface PasswordTableProps {
  accountName: string;
  dbc: Dropbox;
  masterPublicKey: string;
  appDataEncryptionKey: Uint8Array;
}

export default function PasswordTable({
  dbc,
  masterPublicKey,
  appDataEncryptionKey,
  accountName,
}: PasswordTableProps) {
  const tagEntries = useTagEntries();
  const tagEntriesDispatch = useTagEntriesDispatch();
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const [rev, setRev] = useState("");
  const [newEntry, setNewEntry] = useState(false);
  const [filter, setFilter] = useState("");
  const passwordSyncStatus = passwordEntries.status;

  useEffect(() => {
    const pullData =
      passwordSyncStatus == PasswordEntriesStatus.UNINITIALIZED ||
      passwordSyncStatus == PasswordEntriesStatus.SAVED;
    if (pullData) {
      readAppFile(masterPublicKey, dbc)
        .then((result) => {
          if (result.initialized) {
            if (result.data === undefined) {
              // TODO: handle error
              console.error("Could not read app data");
              return;
            }
            decryptAppData(result.data, appDataEncryptionKey)
              .then((appData) => {
                if (appData === undefined) {
                  // TODO: handle error
                  console.error("Could not decrypt app data");
                  return;
                }
                setRev(result.rev);
                tagEntriesDispatch({ type: "SYNC_TAGS", tags: appData.tags });
                passwordEntriesDispatch({
                  version: appData.version,
                  type: "SYNC",
                  entries: appData.entries,
                });
              })
              .catch((e) => {
                console.log(e);
              });
          } else {
            passwordEntriesDispatch({ version: 0, type: "SYNC", entries: [] });
          }
        })
        .catch((e) => {
          // TODO: handle error
          console.log(e);
        });
    }
  }, [
    appDataEncryptionKey,
    dbc,
    masterPublicKey,
    passwordSyncStatus,
    tagEntriesDispatch,
    passwordEntriesDispatch,
  ]);

  useEffect(() => {
    const pushData =
      passwordEntries.status === PasswordEntriesStatus.SAVE_REQUIRED ||
      tagEntries.status === TagsStatus.SAVE_REQUIRED;
    if (pushData) {
      const latestVersion = passwordEntries.version + 1;
      const appData = fromState(passwordEntries, tagEntries, latestVersion);
      appFileName(masterPublicKey).then((appFileName) => {
        encryptAppData(appData, appDataEncryptionKey).then((appDataEnc) => {
          if (appDataEnc === undefined) {
            // TODO: handle error
            console.error("Could not encrypt app data");
            return;
          }
          saveAppFile(dbc, appDataEnc, appFileName, rev).then((rev) => {
            setRev(rev);
            passwordEntriesDispatch({
              type: "UPLOADED_ENTRIES",
              version_uploaded: appData.version,
            });
            tagEntriesDispatch({ type: "UPLOADED_TAGS" });
            setNewEntry(false);
          });
        });
      });
    }
  }, [
    appDataEncryptionKey,
    dbc,
    masterPublicKey,
    passwordEntries,
    rev,
    tagEntries,
    tagEntriesDispatch,
    passwordEntriesDispatch,
  ]);

  const handleAddEntry = useCallback(() => {
    setNewEntry(true);
  }, []);

  const handleDiscardEntry = useCallback(() => {
    setNewEntry(false);
  }, []);

  const handleSaveCallback = useCallback(() => {
    setNewEntry(false);
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setFilter(filter);
  }, [filter]);

  let entries = getSafePasswordEntries(passwordEntries);
  if (filter !== "") {
    entries = entries.filter((entry) => {
      return entry.title.includes(filter);
    });
  }
  return (
    <div className={styles.container}>
      <div className={styles.start_bar}>
        <div className={styles.col1}>
          <button onClick={handleAddEntry} className={styles.add_btn}>
            Add entry
          </button>
          <div className={styles.filter_container}>
            <FilterInput placeholder={"Quick filter ..."} onChangeCallback={handleFilterChange}/>
          </div>
        </div>
        <div className={styles.col2}>
          <button className={styles.grey_btn}>Sort</button>
          <button className={styles.drop_box_btn}>{accountName}</button>
        </div>
      </div>
      <div className={styles.dashboard}>
        {
          <TableEntry
            mode={newEntry ? { type: "NEW_ENTRY" } : { type: "HIDDEN" }}
            key={"newEntry"}
            onDiscardCallback={handleDiscardEntry}
            onSavedCallback={handleSaveCallback}
          />
        }
        {entries.map((entry) => {
          return (
            <TableEntry
              mode={{ type: "VIEW_ENTRY", entry: entry }}
              key={entry.key}
              onSavedCallback={handleSaveCallback}
            />
          );
        })}
      </div>
      {passwordEntries.status == PasswordEntriesStatus.ERROR && (
        <div className={styles.notification_error}>
          Error loading password entries
        </div>
      )}
    </div>
  );
}
