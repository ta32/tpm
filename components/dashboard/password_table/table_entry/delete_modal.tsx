import React from 'react';
import Modal from 'components/ui/modal'
import Styles from './delete_modal.module.scss'
import Colors from 'styles/colors.module.scss'
import DeleteIcon from 'svg/ui/delete_icon'
import CloseIcon from 'svg/ui/close_icon'


interface DeleteModalProps {
  entryName: string;
  show: boolean;
  submitCallback: () => void;
  cancelCallback: () => void;
}

export default function DeleteModal({
  entryName,
  show,
  submitCallback,
  cancelCallback,
}: DeleteModalProps) {

  return (
    <Modal show={show} xOffset={50} yOffset={10} style={{
      minWidth: '330px',
      maxWidth: '750px',
      padding: '0px',
    }}>
      <>
        <div className={Styles.modal_body}>
          <div className={Styles.icon}>
            <DeleteIcon fill={Colors.blue_dark}/>
          </div>
          <div className={Styles.title}>
            <span>{`Remove ${entryName}?`}</span>
          </div>
          <button type="button" onClick={cancelCallback}>
            <CloseIcon width={30} fill={Colors.grey_font}/>
          </button>
        </div>
        <div className={`${Styles.tag_controls}`}>
          <button type="button" className={Styles.red} onClick={submitCallback}>
          Yes, Remove
          </button>
          <button type="button" className={Styles.blank} onClick={cancelCallback}>
            No
          </button>
        </div>
      </>
    </Modal>
  );
}
