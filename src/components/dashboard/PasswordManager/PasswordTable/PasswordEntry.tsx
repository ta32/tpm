import React, { useContext, useState } from 'react';
import styles from './PasswordEntry.module.scss';
import { ClearPasswordEntry, SafePasswordEntry } from 'lib/trezor';
import { usePasswordEntries, usePasswordEntriesDispatch } from 'contexts/password-entries.context';
import { PasswordEntriesStatus } from 'contexts/reducers/password-entries.reducer';
import ClosedEntry from './PasswordEntry/ClosedEntry';
import ExpandedEntry from './PasswordEntry/ExpandedEntry';
import { DependenciesContext } from 'contexts/deps.context';

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
export default function PasswordEntry({
  hidden,
  locked,
  onLockChange,
  onDiscardCallback,
  onSavedCallback,
  row,
}: TableEntryProps) {
  const { trezor } = useContext(DependenciesContext);
  const { encryptFullEntry } = trezor();
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const [clearEntry, setClearEntry] = useState<ClearPasswordEntry | null>(null);
  const [saving, setSaving] = useState(false);

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
          setSaving(false);
          form.reset();
          onSavedCallback();
          if (onLockChange) {
            onLockChange(false);
          }
        })
        .catch((err) => {
          console.error('Failed to encrypt entry');
        })
        .finally(() => {});
    } else {
      console.error('Password entries not synced failed to save entry');
    }
  };
  const handleDiscardEntry = () => {
    setClearEntry(null);
    if (onDiscardCallback) {
      onDiscardCallback();
    }
    if (onLockChange) {
      onLockChange(false);
    }
  };

  const onOpenEntry = (clearEntry: ClearPasswordEntry) => {
    setClearEntry(clearEntry);
  };

  const expanded = (!hidden && row.type === 'NEW_ENTRY') || (row.type === 'VIEW_ENTRY' && clearEntry);

  return (
    <div className={`${styles.card}`}>
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
        <div className={`${styles.entry} ${styles.highlight}`}>
          <ClosedEntry onLockChange={onLockChange} locked={locked} safeEntry={row.entry} onOpenEntry={onOpenEntry} />
        </div>
      )}
    </div>
  );
}
