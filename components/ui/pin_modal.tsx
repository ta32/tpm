import React from 'react'
import Modal from './modal'
import PinDialog from '../index/pin_dialog'

interface PinDialogProps {
  show: boolean;
  submitCallback: (pin: string) => void;
}
export default function PinModal({ submitCallback, show }: PinDialogProps) {
  return (
    <Modal show={show} xOffset={50} yOffset={10} style={{
        backgroundColor: "#1A2942",
        minWidth: '330px',
        maxWidth: '550px',
      }}>
          <PinDialog submitCallback={submitCallback} />
    </Modal>
  )
}
