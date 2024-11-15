import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import styles from './ImportPasswordsModal.module.scss';
import { decryptAppData, decryptTrezorAppData } from '../../lib/trezor';
import { fromState, mergeAppData } from '../../lib/storage';
import { useTagEntries, useTagEntriesDispatch } from '../../contexts/use-tag-entries';
import { usePasswordEntries, usePasswordEntriesDispatch } from '../../contexts/use-password-entries';

interface ImportPasswordsModalProps {
  show: boolean;
  appDataEncryptionKey: Uint8Array;
  onCanceled: () => void;
}

export default function ImportPasswordsModal({show, onCanceled, appDataEncryptionKey}: ImportPasswordsModalProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
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
    event.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
    }
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
            const allEntries = newEntries.concat(conflictEntries);
            tagEntriesDispatch({type: 'BULK_ADD_TAGS', tags: newTags});
            passwordEntriesDispatch({type: 'BULK_ADD_ENTRIES', entries: allEntries});
            setLoading(false);
            onCanceled();
          } else {
            setLoading(false);
          }
        });
      });
    }
  }
  const importDisabled = file === undefined || loading;
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
        <span className={styles.heading}>Import Trezor password manager data</span>
        <p>You can only import trezor data if it was encrypted with the current device.</p>
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>Drag and drop your file here, or click to select files</p>
        </div>
        <div className={styles.controls}>
          <button className={importDisabled? styles.blank : styles.green} disabled={importDisabled} type="button" onClick={handleImport}>
            Import
          </button>
          <button className={styles.red} type="button" onClick={onCanceled}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}