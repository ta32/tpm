import React from 'react'
import Styles from './modal.module.scss'

interface ModalProps {
  children: React.ReactElement;
  show: boolean;
  backgroundColor?: string;
  style?: React.CSSProperties;
  xOffset: number;
  yOffset: number
}

export default function Modal({children, show, style, xOffset, yOffset}: ModalProps) {
  const display = show ? 'block' : 'none'
  const pos = { left: xOffset + '%', top: yOffset + '%'}
  const modalState = show ? Styles.modal_active : Styles.modal_hidden;
  return (
    <>
      <div className={Styles.modal_backdrop} style={{display: display}}/>
      <div className={`${Styles.modal_content} ${modalState}`} style={{...style, ...pos}}>
        {children}
      </div>
    </>
  )
}
