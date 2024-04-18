import React from 'react'
import Modal from './modal'
import PinDialog from '../index/pin_dialog'

interface PinDialogProps {
  submitCallback: (pin: string) => void;
}
export default function PinModal({ submitCallback }: PinDialogProps) {
  return (
    <Modal active={true} style={{
        backgroundColor: "#1A2942",
        width: '100%',
        minWidth: '330px',
        maxWidth: '550px',
        padding: '10px',
        left: '50%',
        top: '10%',
      }}>
          <PinDialog submitCallback={submitCallback} />
    </Modal>
  )
}
