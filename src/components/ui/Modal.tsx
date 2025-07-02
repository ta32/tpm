import React from 'react';
import Styles from './Modal.module.scss';

interface ModalProps {
  children: React.ReactElement;
  show: boolean;
  backgroundColor?: string;
  dataCy?: string;
  style?: React.CSSProperties;
  xOffset: number;
  yOffset: number;
}

export default function Modal({ children, show, style, xOffset, yOffset, dataCy }: ModalProps) {
  const display = show ? 'block' : 'none';
  const pos = { left: xOffset + '%', top: yOffset + '%' };
  const modalState = show ? Styles.modal_active : Styles.modal_hidden;
  return (
    <>
      <div className={Styles.modal_backdrop} style={{ display: display }} />
      <div data-cy={dataCy} className={`${Styles.modal_content} ${modalState}`} style={{ ...style, ...pos }}>
        {children}
      </div>
    </>
  );
}
