import React from 'react'
import Styles from './modal.module.scss'

interface ModalProps {
  children: React.ReactElement;
  active: boolean;
  backgroundColor?: string;
  style?: React.CSSProperties;
}

export default function Modal({children, active, style}: ModalProps) {
  if (!active) {
    return null
  }
  return (
    <>
      <div className={Styles.modal_backdrop}/>
      <div className={Styles.modal_content} style={style}>
        {children}
      </div>
    </>
  )
}
