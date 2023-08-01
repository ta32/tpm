import React, { useState } from 'react'
import { useTagEntries } from '../../contexts/tag_entries'
import { usePasswordEntries } from '../../contexts/password_entries'
import { PasswordEntriesStatus } from '../../contexts/reducers/password_entries'
import { TagsStatus } from '../../contexts/reducers/tag_entries'
import styles from './loader_modal.module.scss'
import Image from 'next/image'
import { getUiIconPath, UI_DONE } from '../../lib/icons'

export default function LoaderModal() {
  const tagEntries = useTagEntries();
  const passwordEntries = usePasswordEntries();

  const saveRequired = passwordEntries.status === PasswordEntriesStatus.SAVE_REQUIRED ||
                                tagEntries.status === TagsStatus.SAVE_REQUIRED;

  const saved = passwordEntries.status === PasswordEntriesStatus.SAVED ||
                tagEntries.status === TagsStatus.SAVED;

  const active = saveRequired || saved;

  return (
    <div className={`${styles.data_loader} ${ active ? styles.active : styles.hidden}`}>
      {saveRequired && (
        <div className={styles.label}>
          <span className={styles.spinner} />
          Saving
        </div>
      )}
      {saved && (
        <div className={styles.label}>
          <Image className={`${styles.icon} ${styles.ui_icon_white}`} src={getUiIconPath(UI_DONE)} alt={"done"} height={24} width={24} />
          Saved
        </div>
      )}
    </div>
  )
}
