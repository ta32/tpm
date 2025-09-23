import React, { useContext, useState } from 'react';
import { getTag } from 'contexts/reducers/tag-entries.reducer';
import { IMAGE_FILE, SELECTABLE_TAG_ICONS } from 'lib/images';
import styles from './ClosedEntry.module.scss';
import Image from 'next/image';
import Colors from 'styles/colors.module.scss';
import { useTagEntries } from 'contexts/tag-entries.context';
import { ClearPasswordEntry, SafePasswordEntry } from 'lib/trezor';
import ToolTip from 'components/ui/ToolTip';
import { useUser } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { DependenciesContext } from 'contexts/deps.context';

enum STATUS {
  DECRYPTING_ENTRY,
  DECRYPTING_PASSWORD,
  DEFAULT,
}

interface ClosedEntryProps {
  onLockChange: (status: boolean) => void;
  locked: boolean;
  safeEntry: SafePasswordEntry;
  onOpenEntry: (entry: ClearPasswordEntry) => void;
}

export default function ClosedEntry({ onLockChange, safeEntry, onOpenEntry, locked }: ClosedEntryProps) {
  const { trezor } = useContext(DependenciesContext);
  const { decryptFullEntry } = trezor();
  const [status, setStatus] = useState(STATUS.DEFAULT);
  const [user] = useUser();
  const tagEntries = useTagEntries();
  const [copiedUsername, setCopiedUsername] = useState(false);
  const requiresTrezorAck = user.status === UserStatus.TREZOR_REQ_CONFIRMATION;

  const handleCopyUsername = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard', err);
      });
  };

  const handleCopyPassword = () => {
    setStatus(STATUS.DECRYPTING_PASSWORD);
    onLockChange(true);
    decryptFullEntry(safeEntry, safeEntry.legacyMode).then((clearEntry) => {
      if (clearEntry != null) {
        navigator.clipboard.writeText(clearEntry.password).then(() => {
          setTimeout(() => {
            navigator.clipboard.writeText('').catch(() => {
              console.error('Failed to clear clipboard');
            });
          }, 10000);
        });
      }
      setStatus(STATUS.DEFAULT);
      onLockChange(false);
    });
  };

  const handleEditEntry = () => {
    setStatus(STATUS.DECRYPTING_ENTRY);
    onLockChange(true);
    decryptFullEntry(safeEntry, safeEntry.legacyMode).then((clearEntry) => {
      if (clearEntry != null) {
        onOpenEntry(clearEntry);
      } else {
        setStatus(STATUS.DEFAULT);
        onLockChange(false);
      }
    });
  };

  const renderLockedEntryIcon = (tagId: string) => {
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
    const { avatarClassName, className, iconPath, TagIcon } =
      status === STATUS.DEFAULT ? stateStyles.DEFAULT : stateStyles.UNLOCKING;
    return (
      <div className={avatarClassName}>
        {iconPath && <Image className={className} src={iconPath} height={50} width={50} alt="avatar" />}
        {TagIcon && <TagIcon width={50} fill={Colors.white}></TagIcon>}
      </div>
    );
  };
  const renderAccountInfo = () => {
    const title = safeEntry.metaTitle ?? safeEntry.title;
    if (status != STATUS.DEFAULT) {
      const msg = requiresTrezorAck ? 'Look at Trezor!' : 'Unlocking...';
      const actionMsg = status === STATUS.DECRYPTING_ENTRY ? 'Editing Entry' : 'Copying Password to clipboard';
      return (
        <div className={styles.account_info}>
          <strong className={styles.title}>{msg}</strong>
          <div className={styles.credentials}>
            <div data-cy={'closed-entry-action-msg'} className={styles.label}>
              {actionMsg}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div data-cy={`closed-entry-${safeEntry.key}`} className={styles.account_info}>
          <label data-cy={'closed-entry-title-' + safeEntry.title} className={styles.title}>
            {title}
          </label>
          <div className={styles.credentials}>
            <ToolTip text={copiedUsername ? 'Copied!' : 'Copy username'} position={'bottom'}>
              <div
                className={`${styles.label} ${styles.clickable}`}
                onClick={() => handleCopyUsername(safeEntry.username)}
              >
                {safeEntry.username}
              </div>
            </ToolTip>
            {!locked && (
              <ToolTip
                text={'Copy password'}
                position={'bottom'}
                dataCy={'closed-entry-password-copy-wrapper-' + safeEntry.key}
              >
                <input
                  data-cy={'closed-entry-password-copy-' + safeEntry.key}
                  onClick={handleCopyPassword}
                  className={styles.password_shadow}
                  title={'Copy to clipboard'}
                  type="password"
                  value={'password'}
                  readOnly
                />
              </ToolTip>
            )}
          </div>
        </div>
      );
    }
  };
  return (
    <div className={styles.container}>
      {renderLockedEntryIcon(safeEntry.tags[0] ?? '')}
      {renderAccountInfo()}
      {!locked && (
        <div className={styles.account_info_controls}>
          <button
            data-cy={`closed-entry-edit-button-${safeEntry.title}`}
            className={styles.edit_btn}
            onClick={handleEditEntry}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
