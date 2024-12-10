import React, { useState } from 'react';
import styles from './TableEntry.module.scss';
import { ClearPasswordEntry, decryptFullEntry, encryptFullEntry, SafePasswordEntry } from 'lib/trezor';
import { usePasswordEntries, usePasswordEntriesDispatch } from 'contexts/use-password-entries';
import { PasswordEntriesStatus } from 'contexts/reducers/password-entries-reducer';
import { useUser } from 'contexts/use-user';
import { UserStatus } from 'contexts/reducers/user-reducer';
import { useTagEntries } from 'contexts/use-tag-entries';
import ClosedEntry from './TableEntry/ClosedEntry';
import ExpandedEntry from './TableEntry/ExpandedEntry';

interface Init {
  type: 'INIT';
}
interface Decrypting {
  type: 'DECRYPTING';
}
interface Decrypted {
  type: 'DECRYPTED';
}
interface Error {
  type: 'ERROR';
  error: string;
}
type EntryState = Init | Decrypting | Decrypted | Error;

interface NewEntry {
  type: 'NEW_ENTRY';
}
interface ViewEntry {
  type: 'VIEW_ENTRY';
  entry: SafePasswordEntry;
}
interface TableEntryProps {
  locked: boolean;
  hidden?: boolean;
  row: NewEntry | ViewEntry;
  onDiscardCallback?: () => void;
  onLockChange: (status: boolean) => void;
  onSavedCallback: () => void;
}
export default function TableEntry({
  hidden,
  locked,
  onLockChange,
  onDiscardCallback,
  onSavedCallback,
  row,
}: TableEntryProps) {
  const [user] = useUser();
  const tagEntries = useTagEntries();
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const [clearEntry, setClearEntry] = useState<ClearPasswordEntry | null>(null);
  const [entryState, setEntryState] = useState<EntryState>({ type: 'INIT' });
  const [saving, setSaving] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  const onSubmitNewEntry = (newEntry: ClearPasswordEntry, form: EventTarget & HTMLFormElement) => {
    setSaving(true);
    if (passwordEntries.status == PasswordEntriesStatus.SYNCED) {
      encryptFullEntry(newEntry)
        .then((encryptedEntry) => {
          if (encryptedEntry) {
            if (row.type === 'NEW_ENTRY') {
              passwordEntriesDispatch({
                type: 'ADD_ENTRY',
                entry: encryptedEntry,
              });
            }
            if (row.type === 'VIEW_ENTRY') {
              passwordEntriesDispatch({
                type: 'UPDATE_ENTRY',
                entry: encryptedEntry,
                key: row.entry.key,
              });
            }
          }
          setClearEntry(null);
          setEntryState({ type: 'INIT' });
          setSaving(false);
          form.reset();
          onSavedCallback();
          if (onLockChange) {
            onLockChange(false);
          }
        })
        .catch((err) => {
          setEntryState({ type: 'ERROR', error: 'Error encrypting entry' });
        })
        .finally(() => {});
    } else {
      setEntryState({
        type: 'ERROR',
        error: 'Password entries are not synced yet',
      });
    }
  };
  const handleDiscardEntry = () => {
    setEntryState({ type: 'INIT' });
    setClearEntry(null);
    if (onDiscardCallback) {
      onDiscardCallback();
    }
    if (onLockChange) {
      onLockChange(false);
    }
  };
  const handleEditEntry = () => {
    if (row.type === 'VIEW_ENTRY') {
      if (onLockChange) {
        onLockChange(true);
      }
      setEntryState({ type: 'DECRYPTING' });
      const safeEntry = row.entry;
      decryptFullEntry(safeEntry, safeEntry?.legacyMode || false)
        .then((clearEntry) => {
          if (clearEntry != null) {
            setEntryState({ type: 'DECRYPTED' });
            setClearEntry(clearEntry);
          } else {
            if (onLockChange) {
              onLockChange(false);
            }
            setEntryState({ type: 'INIT' });
          }
        })
        .catch((err) => {
          setEntryState({ type: 'ERROR', error: err });
        });
    }
    return; // Unreachable, edit is only possible when mode is VIEW_ENTRY
  };

  const handleCopyPassword = () => {
    if (row.type === 'VIEW_ENTRY') {
      setEntryState({ type: 'DECRYPTING' });
      const safeEntry = row.entry;
      decryptFullEntry(safeEntry, false)
        .then((clearEntry) => {
          if (clearEntry != null) {
            navigator.clipboard.writeText(clearEntry.password).then(() => {
              setTimeout(() => {
                navigator.clipboard.writeText('').catch(() => {
                  console.error('Failed to clear clipboard');
                });
              }, 10000);
            });
          }
        })
        .catch((err) => {
          setEntryState({ type: 'ERROR', error: err });
        });
    }
  };

  const handleCopyUsername = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard', err);
      });
  };

  const expanded =
    (!hidden && row.type === 'NEW_ENTRY') ||
    (row.type === 'VIEW_ENTRY' && (entryState.type === 'DECRYPTED' || clearEntry));
  const unlocking = entryState.type === 'DECRYPTING' && user.status === UserStatus.TREZOR_REQ_CONFIRMATION;

  return (
    <div className={`${styles.card} ${unlocking ? styles.unlocking : ''}`}>
      {expanded && (
        <ExpandedEntry
          entry={clearEntry}
          saving={saving}
          handleDiscardEntry={handleDiscardEntry}
          onSubmitNewEntry={onSubmitNewEntry}
          onLockChange={onLockChange}
        />
      )}
      {!expanded && row.type === 'VIEW_ENTRY' && (
        <div className={`${styles.entry} ${styles.highlight} ${unlocking ? styles.unlocking : ''}`}>
          <ClosedEntry
            unlocking={unlocking}
            locked={locked}
            entry={row.entry}
            handleCopyUsername={handleCopyUsername}
            handleCopyPassword={handleCopyPassword}
            handleEditEntry={handleEditEntry}
          ></ClosedEntry>
        </div>
      )}
    </div>
  );
}
