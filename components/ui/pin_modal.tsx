import React from 'react'
import Modal from './modal'
import PinDialog from '../index/pin_dialog'

interface PinDialogProps {
  submitCallback: (pin: string) => void;
}
export default function PinModal({ submitCallback }: PinDialogProps) {
  return (
    <div>
      <Modal active={true} style={{
        backgroundColor: "#1A2942",
        width: "40%",
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
          <PinDialog submitCallback={submitCallback} />
      </Modal>
    </div>
  )
}
