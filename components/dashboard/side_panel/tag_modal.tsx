import Styles from './tag_modal.module.scss'
import Image from 'next/image'
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import { useTagEntries } from '../../../contexts/tag_entries'
import { getTagTitle, TagsStatus } from '../../../contexts/reducers/tag_entries'
import { getTagIconPath, TAG_ICONS } from '../../../lib/icons'

interface Tag {
  title: string;
  icon: string;
}

interface TagModalProps {
  mode: "ADD" | "EDIT" | "REMOVE" | "CLOSED";
  tagId?: string;
  onClosed: () => void;
  onSubmit: (tag: Tag) => void;
  onDiscard: () => void;
}

export default function TagModal({onClosed, onSubmit, onDiscard, mode, tagId}: TagModalProps) {
  const tagEntries = useTagEntries();
  const [error, setError] = useState("");
  const [tagIconIndex, setTagIconIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [submitForm, setSubmitForm] = useState<HTMLFormElement | null>(null);

  useEffect(() => {
    if (submitForm) {
      if(tagEntries.status === TagsStatus.ERROR) {
        setError("tag already exists");
      } else {
        submitForm.reset();
        setSubmitForm(null);
      }
    }
  }, [submitForm, tagEntries.status]);

  const handleLeftClick = () => {
    setTagIconIndex((tagIconIndex + TAG_ICONS.length - 1) % TAG_ICONS.length);
  }

  const handleRightClick = () => {
    setTagIconIndex((tagIconIndex + 1) % TAG_ICONS.length);
  }

  const handleClose = () => {
    setError("");
    setShowControls(false);
    onClosed();
  }

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setShowControls(true);
  }

  const handleDiscard = () => {
    setError("");
    setShowControls(false);
    onDiscard();
  }

  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tagIcon = TAG_ICONS[tagIconIndex];
    const form = e.currentTarget;
    const formData = new FormData(form);
    const tagTitle = formData.get("title") as string;
    const newTag: Tag = {title: tagTitle, icon: tagIcon};
    onSubmit(newTag);
    setSubmitForm(form);
  }, [onSubmit, tagIconIndex]);

  const tagIcon = TAG_ICONS[tagIconIndex];
  const showControlsClass = showControls || mode === "REMOVE" ? "" : Styles.hidden;
  const modalClass = mode !== "CLOSED" ? Styles.modal_fade_in : Styles.modal_fade_out;
  const modalBackdropClass = mode !== "CLOSED" ? Styles.modal_backdrop : Styles.modal_backdrop_inactive;
  const modalDialogClass = mode !== "CLOSED" ? Styles.modal_dialog : Styles.modal_dialog_inactive;

  const submitDialogText = (mode: string) => {
    switch(mode) {
      case "ADD":
        return "Submit";
      case "EDIT":
        return "Save";
      case "REMOVE":
        return "Yes, Remove";
      default:
        return "Submit";
    }
  }
  const discardDialogText = (mode: string) => {
    if (mode === "REMOVE") {
      return "No";
    }
    return "Discard";
  }
  const tagTitle = tagId && getTagTitle(tagEntries, tagId);
  const chevronVisibility = mode === "ADD" || mode === "EDIT" ? "" : Styles.none;
  return (
    <>
      <div className={modalBackdropClass}/>
      <div className={modalClass}>
        <div className={modalDialogClass}>
          {error &&
            <div className={Styles.notification_popup}>
              <span className={Styles.notification_text}>{error}</span>
            </div>}
          <form className={`${Styles.modal_content} ${error ? Styles.error : ''}`} onSubmit={handleSubmit}>
            <div className={Styles.modal_body}>
              <div className={Styles.avatar}>
                <a className={`${Styles.chevron_left} ${chevronVisibility}`} onClick={handleLeftClick} />
                <Image className={Styles.filter_icon} src={getTagIconPath(tagIcon)} alt={"test"} height={60} width={60}></Image>
                <a className={`${Styles.chevron_right} ${chevronVisibility}`} onClick={handleRightClick} />
              </div>
              <span className={Styles.title}>
                {mode === "ADD" &&
                  <input type="text" name="title" autoComplete="off" placeholder="New tag title" onInput={handleInput}/>
                }
                {mode === "EDIT" &&
                  <input type="text" name="title" autoComplete="off" defaultValue={tagTitle} onInput={handleInput}/>
                }
                {mode === "REMOVE" &&
                  <span style={{overflow: 'hidden', whiteSpace: 'nowrap'}}>{`Remove ${tagTitle}`}</span>
                }
              </span>
              <button type="reset" className={Styles.close_icon} onClick={handleClose}/>
            </div>
            <div className={`${Styles.tag_controls} ${showControlsClass}`}>
              <button type="submit" className={mode !== "REMOVE" ? Styles.green: Styles.red}>{submitDialogText(mode)}</button>
              <button type="reset" className={mode !== "REMOVE" ? Styles.red: Styles.blank} onClick={handleDiscard}>{discardDialogText(mode)}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
