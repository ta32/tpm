import React, { useState } from 'react';
import { getTag, getTags } from 'contexts/reducers/tag-entries-reducer';
import { IMAGE_FILE, SELECTABLE_TAG_ICONS } from 'lib/images';
import styles from '../TableEntry.module.scss';
import Image from 'next/image';
import Colors from 'styles/colors.module.scss';
import { useTagEntries } from 'contexts/use-tag-entries';
import { SafePasswordEntry } from 'lib/trezor';
import ToolTip from 'components/ui/ToolTip';

interface ClosedEntryProps {
  unlocking: boolean;
  locked: boolean;
  entry: SafePasswordEntry;
  handleCopyUsername: (text: string) => void;
  handleCopyPassword: () => void;
  handleEditEntry: () => void;
}

export default function ClosedEntry({
  entry,
  handleCopyUsername,
  handleCopyPassword,
  handleEditEntry,
  unlocking,
  locked,
}: ClosedEntryProps) {
  const tagEntries = useTagEntries();
  const [copiedUsername, setCopiedUsername] = useState(false);

  const renderLockedEntryIcon = (unlocking: boolean, tagId: string) => {
    const tag = getTag(tagEntries, tagId);
    const tagIconSvg = SELECTABLE_TAG_ICONS.get(tag?.icon ?? '');
    const stateStyles = {
      UNLOCKING: {
        avatarClassName: styles.avatar_mini,
        className: styles.trezor_btn,
        iconPath: IMAGE_FILE.TREZOR_BUTTON.path(),
        TagIcon: undefined,
      },
      DEFAULT: {
        avatarClassName: `${styles.avatar_mini} ${styles.shaded}`,
        className: '',
        iconPath: undefined,
        TagIcon: tagIconSvg,
      },
    };
    const { avatarClassName, className, iconPath, TagIcon } = unlocking ? stateStyles.UNLOCKING : stateStyles.DEFAULT;
    return (
      <div className={avatarClassName}>
        {iconPath && <Image className={className} src={iconPath} height={50} width={50} alt="avatar" />}
        {TagIcon && <TagIcon width={50} fill={Colors.white}></TagIcon>}
      </div>
    );
  };
  const renderAccountInfo = (entry: SafePasswordEntry, unlocking: boolean) => {
    const title = entry.metaTitle ?? entry.title;
    if (unlocking) {
      return (
        <div className={styles.account_info}>
          <strong className={styles.title}>{'Look at Trezor!'}</strong>
          <div className={styles.credentials}>
            <div className={styles.label}>{'Editing entry'}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.account_info}>
          <label className={styles.title}>{title}</label>
          <div className={styles.credentials}>
            <ToolTip text={copiedUsername ? 'Copied!' : 'Copy username'} position={'bottom'}>
              <div className={`${styles.label} ${styles.clickable}`} onClick={() => handleCopyUsername(entry.username)}>
                {entry.username}
              </div>
            </ToolTip>
            <ToolTip text={'Copy password'} position={'bottom'}>
              <input onClick={handleCopyPassword}
                className={styles.password_shadow}
                title={'Copy to clipboard'}
                type="password"
                value={'password'}
                readOnly
              />
            </ToolTip>
          </div>
        </div>
      );
    }
  };
  return (
    <>
      {renderLockedEntryIcon(unlocking, entry.tags[0] ?? '')}
      {renderAccountInfo(entry, unlocking)}
      {!locked && (
        <div className={styles.account_info_controls}>
          <button className={styles.edit_btn} onClick={handleEditEntry}>
            Edit
          </button>
        </div>
      )}
    </>
  );
}
