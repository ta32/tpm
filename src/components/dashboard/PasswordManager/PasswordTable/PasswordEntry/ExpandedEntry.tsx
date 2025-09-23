import React, { FormEvent, useState } from 'react';
import styles from './ExpandedEntry.module.scss';
import Image from 'next/image';
import { IMAGE_FILE, SELECTABLE_TAG_ICONS } from 'lib/images';
import DeleteIcon from 'components/svg/ui/DeleteIcon';
import { ClearPasswordEntry } from 'lib/trezor';
import DeleteModal from './ExpandedEntry/DeleteModal';
import { usePasswordEntriesDispatch } from 'contexts/password-entries.context';
import { getTag } from 'contexts/reducers/tag-entries.reducer';
import { useTagEntries } from 'contexts/tag-entries.context';
import Colors from 'styles/colors.module.scss';
import TextInput from './ExpandedEntry/TextInput';
import SecretInput from './ExpandedEntry/SecretInput';
import PasswordInput from './ExpandedEntry/PasswordInput';
import TagInput from './ExpandedEntry/TagInput';

interface ExpandedEntryProps {
  entry: ClearPasswordEntry | null;
  saving: boolean;
  handleDiscardEntry: () => void;
  onLockChange: (status: boolean) => void;
  onSubmitNewEntry: (entry: ClearPasswordEntry, formToReset: EventTarget & HTMLFormElement) => void;
}
export default function ExpandedEntry({
  handleDiscardEntry,
  saving,
  entry,
  onSubmitNewEntry,
  onLockChange,
}: ExpandedEntryProps) {
  const [changed, setChanged] = useState(false);
  const tagEntries = useTagEntries();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const passwordEntriesDispatch = usePasswordEntriesDispatch();

  const handleSubmitEntry = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newEntry: ClearPasswordEntry = {
      key: '', // key is determined by the reducer for new entries
      item: formData.get('item') as string,
      title: formData.get('title') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      safeNote: formData.get('safeNote') as string,
      tags: JSON.parse(formData.get('tags') as string),
      lastModifiedDate: parseInt(formData.get('lastModifiedDate') as string),
      createdDate: parseInt(formData.get('createdDate') as string),
    };
    if (e.currentTarget.checkValidity()) {
      if (newEntry.title == '') {
        newEntry.title = newEntry.item;
      }
      onSubmitNewEntry(newEntry, form);
    }
  };

  const handleChange = () => {
    setChanged(true);
  };

  const handleRemoveEntryConfirm = () => {
    if (entry?.key) {
      passwordEntriesDispatch({
        type: 'REMOVE_ENTRY',
        key: entry?.key,
      });
    }
    onLockChange(false);
    setShowDeleteModal(false);
  };

  const handleCancelRemoveEntry = () => {
    setShowDeleteModal(false);
  };

  const handleRemoveEntry = () => {
    setShowDeleteModal(true);
  };

  const renderIcon = (tagId: string) => {
    const tag = getTag(tagEntries, tagId);
    const TagIcon = SELECTABLE_TAG_ICONS.get(tag?.icon ?? '');
    return (
      <div className={styles.avatar_expanded}>
        <Image src={IMAGE_FILE.TRANSPARENT_PNG.path()} height={100} width={100} alt="avatar" />
        {TagIcon && <TagIcon width={100} fill={Colors.white} />}
      </div>
    );
  };

  return (
    <>
      {entry?.title && (
        <DeleteModal
          data-cy={'delete-modal'}
          entryName={entry.title}
          show={showDeleteModal}
          submitCallback={handleRemoveEntryConfirm}
          cancelCallback={handleCancelRemoveEntry}
        />
      )}
      <form className={styles.entry} onSubmit={handleSubmitEntry} noValidate={false} onChange={handleChange}>
        {renderIcon(entry?.tags[0] ?? '')}
        <div className={styles.account_info}>
          <TextInput
            name="item"
            label="Item/URL *"
            defaultValue={entry?.item}
            mandatory={true}
            errMsg="Item is mandatory"
          />
          <TextInput name="title" label="Title" defaultValue={entry?.title} />
          <TextInput name="username" label="Username" defaultValue={entry?.username} />
          <PasswordInput name={'password'} entry={entry} onPasswordGenerated={handleChange} />
          <TagInput name={'tags'} label={'Tags'} initialTags={entry?.tags} />
          <SecretInput name={'safeNote'} entry={entry} />
          {entry?.title && (
            <div className={styles.layout}>
              <div className={styles.container}>
                <span className={styles.label}>Actions</span>
                <button
                  data-cy={'expanded-entry-remove-password'}
                  className={styles.remove_button}
                  onClick={handleRemoveEntry}
                  type="button"
                >
                  <DeleteIcon className={styles.delete_icon} width={15}></DeleteIcon>
                  <span>REMOVE ENTRY</span>
                </button>
              </div>
            </div>
          )}
        </div>
        {changed && (
          <div className={styles.account_info_controls}>
            <button data-cy={'submit-password-entry'} type="submit" disabled={saving} className={styles.save_btn}>
              {saving ? 'Saving' : 'Save'}
            </button>
            <button type="reset" className={styles.discard_btn} onClick={handleDiscardEntry}>
              Discard
            </button>
          </div>
        )}
        {!changed && (
          <div className={styles.account_info_controls}>
            <button type="reset" className={styles.discard_btn} onClick={handleDiscardEntry}>
              Close
            </button>
          </div>
        )}
      </form>
    </>
  );
}
