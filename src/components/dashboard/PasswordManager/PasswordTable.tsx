import React, { useContext, useEffect, useState } from 'react';
import styles from './PasswordTable.module.scss';
import Colors from 'styles/colors.module.scss';
import FilterInput from './PasswordTable/FilterInput';
import TableEntry from './PasswordTable/TableEntry';
import ImportPasswordsModal from './PasswordTable/ImportPasswordsModal';
import { usePasswordEntries, usePasswordEntriesDispatch } from 'contexts/password-entries.context';
import { fromState } from 'lib/storage';
import { appFileName } from 'lib/appfile';
import { getSafePasswordEntries, PasswordEntriesStatus } from 'contexts/reducers/password-entries.reducer';
import { DEFAULT_TAGS, useTagEntries, useTagEntriesDispatch } from 'contexts/tag-entries.context';
import { TagsStatus } from 'contexts/reducers/tag-entries.reducer';
import { Dropbox } from 'dropbox';
import DropdownMenu from 'components/ui/DropdownMenu';
import SortIcon from 'components/svg/ui/SortIcon';
import NoSearchIcon from 'components/svg/ui/NoSearchIcon';
import { IMAGE_FILE } from 'lib/images';

import { Routes, useLocation } from 'contexts/location.context';
import { DependenciesContext } from 'contexts/deps.context';

interface PasswordTableProps {
  selectedTag: string;
  accountName: string;
  dbc: Dropbox;
  masterPublicKey: string;
  appDataEncryptionKey: Uint8Array;
}

enum SortType {
  TITLE,
  DATE,
  UPDATED,
}

export default function PasswordTable({
  dbc,
  masterPublicKey,
  appDataEncryptionKey,
  accountName,
  selectedTag,
}: PasswordTableProps) {
  const { dropbox, trezor } = useContext(DependenciesContext);
  const { readAppFile, saveAppFile } = dropbox();
  const { decryptAppData, encryptAppData } = trezor();
  const [_, setLocation] = useLocation();
  const tagEntries = useTagEntries();
  const tagEntriesDispatch = useTagEntriesDispatch();
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const [rev, setRev] = useState('');
  const [lockEntries, setLockEntries] = useState(false);
  const [newEntry, setNewEntry] = useState(false);
  const [importPassword, setImportPassword] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortType, setSortType] = useState(SortType.TITLE);
  const passwordSyncStatus = passwordEntries.status;

  useEffect(() => {
    const pullData =
      passwordSyncStatus == PasswordEntriesStatus.UNINITIALIZED || passwordSyncStatus == PasswordEntriesStatus.SAVED;
    if (pullData) {
      readAppFile(masterPublicKey, dbc)
        .then((result) => {
          if (result.initialized) {
            if (result.data === undefined) {
              // TODO: handle error
              console.error('Could not read app data');
              return;
            }
            decryptAppData(result.data, appDataEncryptionKey)
              .then((appData) => {
                if (appData === undefined) {
                  // TODO: handle error
                  console.error('Could not decrypt app data');
                  return;
                }
                setRev(result.rev);
                tagEntriesDispatch({ type: 'SYNC_TAGS', tags: appData.tags });
                passwordEntriesDispatch({
                  version: appData.version,
                  type: 'SYNC',
                  entries: appData.entries,
                });
              })
              .catch((e) => {
                console.log(e);
              });
          } else {
            tagEntriesDispatch({ type: 'SYNC_TAGS', tags: [] });
            passwordEntriesDispatch({ version: 0, type: 'SYNC', entries: [] });
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
    readAppFile,
    decryptAppData,
  ]);

  useEffect(() => {
    const pushData =
      passwordEntries.status === PasswordEntriesStatus.SAVE_REQUIRED || tagEntries.status === TagsStatus.SAVE_REQUIRED;
    if (pushData) {
      const latestVersion = passwordEntries.version + 1;
      const appData = fromState(passwordEntries, tagEntries, latestVersion);
      appFileName(masterPublicKey).then((appFileName) => {
        encryptAppData(appData, appDataEncryptionKey).then((appDataEnc) => {
          if (appDataEnc === undefined) {
            // TODO: handle error
            console.error('Could not encrypt app data');
            return;
          }
          saveAppFile(dbc, appDataEnc, appFileName, rev).then((rev) => {
            setRev(rev);
            passwordEntriesDispatch({
              type: 'UPLOADED_ENTRIES',
              version_uploaded: appData.version,
            });
            tagEntriesDispatch({ type: 'UPLOADED_TAGS' });
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
    encryptAppData,
    saveAppFile,
  ]);

  const handleAddEntry = () => {
    setLockEntries(true);
    setNewEntry(true);
  };

  const handleDiscardEntry = () => {
    setNewEntry(false);
  };

  const handleSave = () => {
    setNewEntry(false);
  };

  const handleFilterChange = (filter: string) => {
    setFilter(filter);
  };

  const handleSortFilter = (index: number) => {
    setSortType(index); // SORT_TYPE Enum variants need to be listed in the same order in the dropdown
  };

  const onLockChange = (status: boolean) => {
    // when editing an entry, lock all other entries
    setLockEntries(status);
  };

  const onCancelImportPassword = () => {
    setImportPassword(false);
  };

  const handleUserMenuClick = (index: number) => {
    switch (index) {
      case 0:
        setLocation(Routes.HOME);
        break;
      case 1:
        setImportPassword(true);
        break;
    }
  };

  let entries = getSafePasswordEntries(passwordEntries);
  if (filter !== '') {
    entries = entries.filter((entry) => {
      const title = entry.metaTitle ?? entry.title;
      return title.toLowerCase().includes(filter.toLowerCase());
    });
  }
  if (selectedTag !== '' && selectedTag !== DEFAULT_TAGS.ALL) {
    entries = entries.filter((entry) => {
      return entry.tags.includes(selectedTag);
    });
  }
  // apply the sort (default is by title)
  entries.sort((a, b) => {
    switch (sortType) {
      case SortType.TITLE:
        return a.title.localeCompare(b.title);
      case SortType.DATE:
        return b.createdDate - a.createdDate;
      case SortType.UPDATED:
        return b.lastModifiedDate - a.lastModifiedDate;
    }
  });
  return (
    <div className={styles.container}>
      <ImportPasswordsModal
        appDataEncryptionKey={appDataEncryptionKey}
        show={importPassword}
        onCanceled={onCancelImportPassword}
      />
      <div className={styles.start_bar}>
        <div className={styles.col1}>
          <button data-cy={'password-table-add-entry'} onClick={handleAddEntry} className={styles.add_btn}>
            Add entry
          </button>
          <div className={styles.filter_container}>
            <FilterInput placeholder={'Quick filter ...'} onChangeCallback={handleFilterChange} />
          </div>
        </div>
        <div className={styles.col2}>
          <DropdownMenu
            xOffset={-20}
            yOffset={20}
            itemWidth={'200px'}
            isSelectable={true}
            initSelectedKey={0}
            button={
              <button className={styles.sort_btn}>
                <SortIcon className={styles.icon_over_button} width="1rem" fill={Colors.grey_content_bg} />
                Sort
              </button>
            }
            onClickCallback={handleSortFilter}
          >
            <div className={styles.dropdown_button}>Title</div>
            <div className={styles.dropdown_button}>Date</div>
            <div className={styles.dropdown_button}>Updated</div>
          </DropdownMenu>
          <DropdownMenu
            xOffset={-20}
            yOffset={20}
            itemWidth={'200px'}
            isSelectable={false}
            onClickCallback={handleUserMenuClick}
            button={
              <button
                data-cy={'password-table-account-name'}
                className={styles.drop_box_btn}
                style={{
                  backgroundSize: '1rem 1rem',
                  backgroundImage: `url(${IMAGE_FILE.DROPBOX_GREY.path()})`,
                  backgroundPosition: '20px center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {accountName}
              </button>
            }
          >
            <div className={styles.dropdown_button}>Switch user</div>
            <div data-cy={'password-table-import-passwords'} className={styles.dropdown_button}>
              Import passwords
            </div>
          </DropdownMenu>
        </div>
      </div>
      <div className={styles.dashboard}>
        {
          <TableEntry
            locked={false}
            row={{ type: 'NEW_ENTRY' }}
            hidden={!newEntry}
            key={'newEntry'}
            onDiscardCallback={handleDiscardEntry}
            onSavedCallback={handleSave}
            onLockChange={onLockChange}
          />
        }
        {entries.map((entry) => {
          return (
            <TableEntry
              locked={lockEntries}
              row={{ type: 'VIEW_ENTRY', entry: entry }}
              key={entry.key}
              onSavedCallback={handleSave}
              onLockChange={onLockChange}
            />
          );
        })}
        {entries.length == 0 && (filter !== '' || selectedTag !== DEFAULT_TAGS.ALL) && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
            }}
          >
            <NoSearchIcon width={300} />
            <div>
              <h1 className={styles.heading}>No results.</h1>
              <p className={styles.subheading}>Try a different filter or tag.</p>
            </div>
          </div>
        )}
      </div>
      {passwordEntries.status == PasswordEntriesStatus.ERROR && (
        <div className={styles.notification_error}>Error loading password entries: {passwordEntries.lastError}</div>
      )}
    </div>
  );
}
