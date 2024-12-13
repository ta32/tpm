import React, { useState } from 'react';
import Modal from 'components/ui/Modal';
import styles from './ImportPasswordsModal.module.scss';
import { decryptTrezorAppData, SafePasswordEntry } from 'lib/trezor';
import { fromState, mergeAppData } from 'lib/storage';
import { useTagEntries, useTagEntriesDispatch } from 'contexts/use-tag-entries';
import { usePasswordEntries, usePasswordEntriesDispatch } from 'contexts/use-password-entries';
import Colors from 'styles/colors.module.scss';
import FolderIcon from 'components/svg/ui/FolderIcon';
import { TagEntry } from 'contexts/reducers/tag-entries-reducer';

interface ImportedData {
  tags: TagEntry[];
  passwordEntries: SafePasswordEntry[];
  conflicts: SafePasswordEntry[];
}


interface ImportPasswordsModalProps {
  show: boolean;
  appDataEncryptionKey: Uint8Array;
  onCanceled: () => void;
}


export default function ImportPasswordsModal({show, onCanceled, appDataEncryptionKey}: ImportPasswordsModalProps) {
  const [dropped, setDropped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importFailed, setImportFailed] = useState(false);

  const [requestConfirmation, setRequestConfirmation] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData|undefined>(undefined);
  const [file, setFile] = useState<File|undefined>(undefined);
  const tagEntries = useTagEntries();
  const tagEntriesDispatch = useTagEntriesDispatch();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const passwordEntries = usePasswordEntries();
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    setDropped(true);
    event.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
    }
  };

  const handleCancel = () => {
    setRequestConfirmation(false);
    setImportedData(undefined);
    setLoading(false);
    setDropped(false);
    setFile(undefined);
    setImportFailed(false);
    onCanceled();
  };

  const handleImport = () => {
    if (file) {
      setLoading(true);
      file.arrayBuffer().then((buffer) => {
        const data = new Uint8Array(buffer)
        decryptTrezorAppData(data, appDataEncryptionKey).then((data) => {
          const currentData = fromState(passwordEntries, tagEntries, 0);
          if(data !== undefined) {
            const result = mergeAppData(currentData, data);
            const newTags = result.tags;
            const newEntries = result.passwordEntries;
            const conflictEntries = result.conflicts;
            setImportedData({tags: newTags, passwordEntries: newEntries, conflicts: conflictEntries});
            setRequestConfirmation(true);
          } else {
            setLoading(false);
          }
        }).catch(() => {
          setImportFailed(true);
          setRequestConfirmation(false);
          setLoading(false);
        });
      });
    }
  }
  const handleSave = () => {
    if(importedData) {
      const passwordEntries = importedData.passwordEntries;
      const conflicts = importedData.conflicts;
      const allEntries = passwordEntries.concat(conflicts);
      tagEntriesDispatch({type: 'BULK_ADD_TAGS', tags: importedData.tags});
      passwordEntriesDispatch({type: 'BULK_ADD_ENTRIES', entries: allEntries});
      setRequestConfirmation(false);
      setDropped(false);
      setFile(undefined);
      setLoading(false);
      onCanceled();
    }
  }
  const renderDropzoneContent = (dropped: boolean) => {
    if (dropped) {
      return (
        <div className={styles.dropped_content}>
          <FolderIcon fill={Colors.black} height={100} className={styles.icon} />
          <p>App file dropped</p>
        </div>
      );
    } else {
      return <p>Drag and drop your file here</p>;
    }
  };

  const renderDropzone = (dropped: boolean) => {
    return(
      <div>
        <p>You can only import trezor data if it was encrypted with the current device.</p>
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {renderDropzoneContent(dropped)}
        </div>
      </div>
    );
  };

  const renderConfirmationWindow = () => {
    const conflicts = importedData?.conflicts != undefined && importedData?.conflicts.length > 0;
    return (
      <div className={styles.import_confirmation}>
        {!conflicts && (
          <p>Imported data contains {importedData?.tags.length} new tags and
            new {importedData?.passwordEntries.length} entries</p>
        )}
        {conflicts && (
          <div>
            <p>Imported data contains {importedData?.tags.length} new tags and
              new {importedData?.passwordEntries.length} entries</p>
            <strong>There are {importedData.conflicts.length} entries with the same title</strong>
            <p>If you import these entries they will be pre-fixed with <strong>&#39;conflict&#39;</strong> so you can manually resolve
              the entries to keep</p>
            {renderConflictsList(importedData.conflicts)}
          </div>
        )}
      </div>
    );
  };

  const renderConflictsList = (conflicts: SafePasswordEntry[]) => {
    return (
      <div className={styles.conflicts_list}>
        {conflicts.map((entry, index) => (
          <p key={index}>
            <strong>Duplicate {entry.title}</strong> with user <strong>{entry.username}</strong>
          </p>
        ))}
      </div>
    );
  };

  const importDisabled = file === undefined || loading;
  const showDropzone = !requestConfirmation && !importFailed;

  const title = importFailed ? 'Import of passwords failed': 'Import Trezor password manager data';

  return (
    <Modal
      show={show}
      xOffset={50}
      yOffset={10}
      style={{
        backgroundColor: 'white',
        minWidth: '550px',
        maxWidth: '1000px',
      }}
    >
      <div className={styles.container}>
        <span className={styles.heading}>{title}</span>
        {importFailed && (
          <p className={styles.content}>You can only import trezor password manager app data encrypted with the same seed</p>
        )}
        {showDropzone && (
          renderDropzone(dropped)
        )}
        {requestConfirmation && (
          renderConfirmationWindow()
        )}
        <div className={styles.controls}>
          {requestConfirmation && (
            <button className={styles.green} type="button"
                    onClick={handleSave}>
              Save
            </button>
          )}
          {!requestConfirmation && !importFailed && (
            <button className={importDisabled ? styles.blank : styles.green} disabled={importDisabled} type="button"
                    onClick={handleImport}>
              Load
            </button>
          )}
          <button className={styles.red} type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}