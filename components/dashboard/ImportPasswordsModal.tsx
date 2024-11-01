import React from 'react';
import Modal from '../ui/Modal';

interface ImportPasswordsModalProps {
  show: boolean;
  onCanceled: () => void;
}

export default function ImportPasswordsModal({show, onCanceled}: ImportPasswordsModalProps) {
  return (
    <Modal
      show={show}
      xOffset={50}
      yOffset={10}
      style={{
        backgroundColor: '#1A2942',
        minWidth: '330px',
        maxWidth: '550px',
      }}
    >
      <div>
        <div>
          <span>Import Passwords</span>
        </div>
        <div>
          <button type="button">
            Choose File
          </button>
        </div>
        <div>
          <button type="button">
            Import
          </button>
        </div>
        <div>
          <button type="button" onClick={onCanceled}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}