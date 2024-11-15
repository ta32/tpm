import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import styles from './ImportPasswordsModal.module.scss';
import { decryptAppData, decryptTrezorAppData } from '../../lib/trezor';
import { fromState, mergeAppData } from '../../lib/storage';
import { useTagEntries, useTagEntriesDispatch } from '../../contexts/use-tag-entries';
import { usePasswordEntries, usePasswordEntriesDispatch } from '../../contexts/use-password-entries';
import Colors from 'styles/colors.module.scss';
import FolderIcon from 'components/svg/ui/FolderIcon';
import DoneIcon from '../svg/ui/DoneIcon';

interface ImportPasswordsModalProps {
  show: boolean;
  appDataEncryptionKey: Uint8Array;
  onCanceled: () => void;
}

export default function ImportPasswordsModal({show, onCanceled, appDataEncryptionKey}: ImportPasswordsModalProps) {
  const [dropped, setDropped] = useState(false);
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
    setDropped(true);
    event.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
    }
  };

  const handleCancel = () => {
    setDropped(false);
    setFile(undefined);
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
          {renderDropzoneContent(dropped)}
        </div>
        <div className={styles.controls}>
          <button className={importDisabled? styles.blank : styles.green} disabled={importDisabled} type="button" onClick={handleImport}>
            Load
          </button>
          <button className={styles.red} type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}