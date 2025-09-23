import Modal from './Modal';
import Styles from './BridgeDownModal.module.scss';

interface BridgeDownModalProps {
  show: boolean;
}
export default function BridgeDownModal({ show }: BridgeDownModalProps) {
  return (
    <Modal
      dataCy={'bridge-modal'}
      show={show}
      xOffset={50}
      yOffset={10}
      style={{ minWidth: '330px', maxWidth: '550px', backgroundColor: 'white', borderRadius: '8px' }}
    >
      <div>
        <div className={Styles.modal_body}>
          <h1 className={Styles.heading}>Trezor Bridge Unavailable</h1>
          <p className={Styles.content}>
            The Trezor Suite application must run in the background for the Trezor bridge API to be available.
          </p>
        </div>
      </div>
    </Modal>
  );
}
