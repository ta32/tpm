import Styles from './TagModal.module.scss';
import Colors from 'styles/colors.module.scss';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useTagEntries } from 'contexts/tag-entries.context';
import { getTagTitle, TagsStatus } from 'contexts/reducers/tag-entries.reducer';
import { SELECTABLE_TAG_ICONS, SELECTABLE_TAG_NAMES } from 'lib/images';

interface Tag {
  title: string;
  icon: string;
}

interface TagModalProps {
  mode: 'ADD' | 'EDIT' | 'REMOVE' | 'CLOSED';
  tagId?: string;
  onClosed: () => void;
  onSubmit: (tag: Tag) => void;
}

export default function TagModal({ onClosed, onSubmit, mode, tagId }: TagModalProps) {
  const tagEntries = useTagEntries();
  const [tagIconIndex, setTagIconIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);

  let error = '';
  if (tagEntries.status === TagsStatus.ERROR) {
    error = 'tag already exists';
  }

  const handleLeftClick = () => {
    if (!showControls) {
      setShowControls(true);
    }
    setTagIconIndex((tagIconIndex + SELECTABLE_TAG_NAMES.length - 1) % SELECTABLE_TAG_NAMES.length);
  };

  const handleRightClick = () => {
    if (!showControls) {
      setShowControls(true);
    }
    setTagIconIndex((tagIconIndex + 1) % SELECTABLE_TAG_NAMES.length);
  };

  const handleClose = () => {
    setShowControls(false);
    onClosed();
  };

  const handleDiscard = () => {
    setShowControls(false);
    onClosed();
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setShowControls(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tagIcon = SELECTABLE_TAG_NAMES[tagIconIndex];
    const form = e.currentTarget;
    const formData = new FormData(form);
    const tagTitle = formData.get('title') as string;
    const newTag: Tag = { title: tagTitle, icon: tagIcon };
    onSubmit(newTag);
  };

  const tagIcon = SELECTABLE_TAG_NAMES[tagIconIndex];
  const showControlsClass = showControls || mode === 'REMOVE' ? '' : Styles.hidden;
  const modalClass = mode !== 'CLOSED' ? Styles.modal_fade_in : Styles.modal_fade_out;
  const modalBackdropClass = mode !== 'CLOSED' ? Styles.modal_backdrop : Styles.modal_backdrop_inactive;
  const modalDialogClass = mode !== 'CLOSED' ? Styles.modal_dialog : Styles.modal_dialog_inactive;

  const submitDialogText = (mode: string) => {
    switch (mode) {
      case 'ADD':
        return 'Submit';
      case 'EDIT':
        return 'Save';
      case 'REMOVE':
        return 'Yes, Remove';
      default:
        return 'Submit';
    }
  };
  const discardDialogText = (mode: string) => {
    if (mode === 'REMOVE') {
      return 'No';
    }
    return 'Discard';
  };
  const tagTitle = tagId && getTagTitle(tagEntries, tagId);
  const chevronVisibility = mode === 'ADD' || mode === 'EDIT' ? '' : Styles.none;

  const tagIconSvg = SELECTABLE_TAG_ICONS.get(SELECTABLE_TAG_NAMES[tagIconIndex]);
  return (
    // TODO: refactor to use a modal component
    <>
      <div className={modalBackdropClass} />
      <div className={modalClass}>
        <div className={modalDialogClass}>
          {error && (
            <div className={Styles.notification_popup}>
              <span className={Styles.notification_text}>{error}</span>
            </div>
          )}
          <form className={`${Styles.modal_content} ${error ? Styles.error : ''}`} onSubmit={handleSubmit}>
            <div className={Styles.modal_body}>
              <div className={Styles.avatar}>
                <a className={`${Styles.chevron_left} ${chevronVisibility}`} onClick={handleLeftClick} />
                <div className={Styles.icon}>{tagIconSvg && tagIconSvg({ fill: Colors.blue_dark, width: '60' })}</div>
                <a className={`${Styles.chevron_right} ${chevronVisibility}`} onClick={handleRightClick} />
              </div>
              <span className={Styles.title}>
                {mode === 'ADD' && (
                  <input
                    type="text"
                    name="title"
                    autoComplete="off"
                    placeholder="New tag title"
                    onInput={handleInput}
                  />
                )}
                {mode === 'EDIT' && (
                  <input type="text" name="title" autoComplete="off" defaultValue={tagTitle} onInput={handleInput} />
                )}
                {mode === 'REMOVE' && (
                  <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{`Remove ${tagTitle}`}</span>
                )}
              </span>
              <button type="reset" className={Styles.close_icon} onClick={handleClose} />
            </div>
            <div className={`${Styles.tag_controls} ${showControlsClass}`}>
              <button type="submit" className={mode !== 'REMOVE' ? Styles.green : Styles.red}>
                {submitDialogText(mode)}
              </button>
              <button type="reset" className={mode !== 'REMOVE' ? Styles.red : Styles.blank} onClick={handleDiscard}>
                {discardDialogText(mode)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
