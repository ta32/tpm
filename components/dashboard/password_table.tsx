import React, { useCallback, useEffect, useState } from 'react'
import styles from './password_table.module.scss'
import FilterInput from './password_table/filter_input'
import TableEntry from './password_table/table_entry'
import { useUser, useUserDispatch } from '../../contexts/user'
import { usePasswordEntries, usePasswordEntriesDispatch } from '../../contexts/password_entries'
import { readAppFile, saveAppFile } from '../../lib/dropbox'
import { fromState } from '../../lib/storage'
import { appFileName } from '../../lib/appfile'
import { decryptAppData, encryptAppData } from '../../lib/trezor'
import { getSafePasswordEntries, PasswordEntriesStatus } from '../../contexts/reducers/password_entries'
import { useTagEntries, useTagEntriesDispatch } from '../../contexts/tag_entries'
import { TagsStatus } from '../../contexts/reducers/tag_entries'

export default function PasswordTable() {
  const user = useUser();
  const tagEntries = useTagEntries();
  const tagEntriesDispatch = useTagEntriesDispatch();
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const userDispatch = useUserDispatch();
  const [rev, setRev] = useState('');
  const [newEntry, setNewEntry] = useState(false);

  useEffect(() => {
    if (user.dbc != null && user.device?.encryptionKey != null) {
      const encryptionKey = user.device.encryptionKey;
      if (passwordEntries.status == PasswordEntriesStatus.UNINITIALIZED || passwordEntries.status == PasswordEntriesStatus.SAVED) {
        readAppFile(user, user.dbc).then((result) => {
          if (result.initialized) {
            if (result.data === undefined) {
              // TODO: handle error
              console.error("Could not read app data");
              return;
            }
            decryptAppData(result.data, encryptionKey).then((appData) => {
              if (appData === undefined) {
                // TODO: handle error
                console.error("Could not decrypt app data");
                return;
              }
              setRev(result.rev);
              tagEntriesDispatch({ type: 'SYNC_TAGS', tags: appData.tags });
              passwordEntriesDispatch({ version: appData.version, type: 'SYNC', entries: appData.entries});
            }).catch((e) => {
              console.log(e);
            });
          } else {
            passwordEntriesDispatch({ version: 0, type: 'SYNC', entries: []});
          }
        }).catch((e) => {
          // TODO: handle error
          console.log(e);
        });
      }
    }
  }, [passwordEntries, passwordEntriesDispatch, user, tagEntries, tagEntriesDispatch]);

  useEffect(() => {
    if (user.dbc == null || user.device == null || user.device.encryptionKey == undefined) {
      return;
    }
    let dbc = user.dbc;
    const masterKey = user.device.masterKey;
    const appDataEncryptionKey = user.device.encryptionKey;
    if (passwordEntries.status === PasswordEntriesStatus.SAVE_REQUIRED || tagEntries.status === TagsStatus.SAVE_REQUIRED) {
      const latestVersion = passwordEntries.version + 1;
      const appData = fromState(passwordEntries, tagEntries, latestVersion);
      appFileName(masterKey).then((appFileName) => {
        encryptAppData(appData, appDataEncryptionKey).then( appDataEnc => {
          if(appDataEnc === undefined) {
            console.error("Could not encrypt app data");
            return;
          }
          saveAppFile(dbc, appDataEnc, appFileName, rev).then((rev) => {
            setRev(rev);
            passwordEntriesDispatch({ type: 'UPLOADED_ENTRIES', version_uploaded: appData.version });
            tagEntriesDispatch({ type: 'UPLOADED_TAGS' });
            setNewEntry(false);
          });
        })
      });
    }
  }, [passwordEntries, passwordEntriesDispatch, user, setNewEntry, rev, tagEntries, tagEntriesDispatch]);

  const handleAddEntry = useCallback(() => {
    setNewEntry(true);
  }, []);

  const handleDiscardEntry = useCallback (() => {
    setNewEntry(false);
  }, [])

  const handleSaveNewEntry = useCallback(() => {
    setNewEntry(false);
  }, [])

  const entries = getSafePasswordEntries(passwordEntries);
  for (const entry of entries) {
    entry.key
  }

  return (
    <div className={styles.container}>
      <div className={styles.start_bar}>
        <div className={styles.col1}>
          <button onClick={handleAddEntry} className={styles.add_btn}>Add entry</button>
          <div className={styles.filter_container}>
            <FilterInput />
          </div>
        </div>
        <div className={styles.col2}>
          <button className={styles.grey_btn}>Sort</button>
          <button className={styles.drop_box_btn}>{user.dropboxAccountName}</button>
        </div>
      </div>
      <div className={styles.dashboard}>
        {<TableEntry mode={newEntry? {type:'NEW_ENTRY'}: {type:'HIDDEN'}} key={"newEntry"} onDiscardCallback={handleDiscardEntry} onSavedCallback={handleSaveNewEntry} />}
        {entries.map((entry) => {
          return <TableEntry mode={{type: 'VIEW_ENTRY', entry: entry}} key={entry.key} />
        })}
      </div>
      {passwordEntries.status == PasswordEntriesStatus.ERROR &&
        <div className={styles.notification_error}>Error loading password entries</div>
      }
    </div>
  )
}
