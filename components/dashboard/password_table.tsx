import React, { useCallback, useEffect, useState } from 'react'
import styles from './password_table.module.scss'
import Colors from '../../styles/colors.module.scss'
import FilterInput from './password_table/filter_input'
import TableEntry from './password_table/table_entry'
import { usePasswordEntries, usePasswordEntriesDispatch, } from '../../contexts/password_entries'
import { readAppFile, saveAppFile } from '../../lib/dropbox'
import { fromState } from '../../lib/storage'
import { appFileName } from '../../lib/appfile'
import { decryptAppData, encryptAppData } from '../../lib/trezor'
import { getSafePasswordEntries, PasswordEntriesStatus, } from '../../contexts/reducers/password_entries'
import { useTagEntries, useTagEntriesDispatch, } from '../../contexts/tag_entries'
import { TagsStatus } from '../../contexts/reducers/tag_entries'
import { Dropbox } from 'dropbox'
import DropdownMenu from '../ui/dropdown_menu'
import SortIcon from '../../svg/ui/sort_icon'
import NoSearchIcon from '../../svg/ui/nosearch_icon'
import { IMAGE_FILE } from '../../lib/Images'


interface PasswordTableProps {
  accountName: string;
  dbc: Dropbox;
  masterPublicKey: string;
  appDataEncryptionKey: Uint8Array;
}

enum SortType {
  TITLE,
  DATE,
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
  const [sortType, setSortType] = useState(SortType.TITLE);

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

  const handleSortFilter = useCallback((index: number) => {
      setSortType(index); // Enum variants need to be listed in the same order in the dropdown
    },
    [sortType]);

  let entries = getSafePasswordEntries(passwordEntries);
  if (filter !== "") {
    entries = entries.filter((entry) => {
      return entry.title.includes(filter);
    });
  }
  // apply the sort (default is by title)
  entries.sort((a, b) => {
    switch (sortType) {
      case SortType.TITLE:
        return a.title.localeCompare(b.title);
      case SortType.DATE:
        return b.createdDate - a.createdDate;
    }
  });
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
          <DropdownMenu xOffset={-20} yOffset={40} initSelectedKey={0}
            button={
              <button className={styles.sort_btn}>
                <SortIcon className={styles.icon_over_button} width="1rem" fill={Colors.grey_content_bg}/>
                Sort
              </button>
            }
            onClickCallback={handleSortFilter}
          >
            <div className={styles.dropdown_button}>Title</div>
            <div className={styles.dropdown_button}>Date</div>
          </DropdownMenu>

          <button className={styles.drop_box_btn}
          style={{
            backgroundSize: '1rem 1rem',
            backgroundImage: `url(${IMAGE_FILE.DROPBOX_GREY.path()})`,
            backgroundPosition: '20px center',
            backgroundRepeat: 'no-repeat',
          }}
          >
            {accountName}
          </button>
        </div>
      </div>
      <div className={styles.dashboard}>
        {
          <TableEntry
            row={newEntry ? { type: "NEW_ENTRY" } : { type: "HIDDEN" }}
            key={"newEntry"}
            onDiscardCallback={handleDiscardEntry}
            onSavedCallback={handleSaveCallback}
          />
        }
        {entries.map((entry) => {
          return (
            <TableEntry
              row={{ type: "VIEW_ENTRY", entry: entry }}
              key={entry.key}
              onSavedCallback={handleSaveCallback}
            />
          );
        })}
        {entries.length == 0 && filter !== "" && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
            <NoSearchIcon width={300} />
            <div>
              <h1 className={styles.heading}>No results.</h1>
              <p className={styles.subheading}>Try a different filter.</p>
            </div>
          </div>
        )}
      </div>
      {passwordEntries.status == PasswordEntriesStatus.ERROR && (
        <div className={styles.notification_error}>
          Error loading password entries
        </div>
      )}
    </div>
  );
}
