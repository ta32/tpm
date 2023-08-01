import React, { FormEvent, useEffect, useState } from 'react'
import styles from './table_entry.module.scss';
import Image from 'next/image';
import { IoAddCircleOutline } from 'react-icons/io5';
import EntryInput from './table_entry/entry_input'
import { useUser, useUserDispatch } from '../../../contexts/user'
import { encryptFullEntry, ClearPasswordEntry, decryptFullEntry } from '../../../lib/trezor'
import {
  usePasswordEntries,
  usePasswordEntriesDispatch
} from '../../../contexts/password_entries'
import { PasswordEntriesStatus, SafePasswordEntry } from '../../../contexts/reducers/password_entries'


interface FormData {
  item: string;
  title: string;
  username: string;
  password: string;
  secretNote: string;
  tags: string;
}

enum EntryStatus {
  INIT,
  DECRYPTING
}

interface TableEntryProps {
  style?: React.CSSProperties;
  entry: SafePasswordEntry | null;
  onDiscardCallback?: () => void;
  onSavedCallback?: () => void;
}
export default function TableEntry({ entry, onDiscardCallback, onSavedCallback, style }: TableEntryProps) {
  const user = useUser();
  const userDispatch = useUserDispatch();
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const [entryStatus, setEntryStatus] = useState<EntryStatus>(EntryStatus.INIT);
  const [clearEntry, setClearEntry] = useState<ClearPasswordEntry|null>(null);
  const [formData, setFormData] = useState<FormData|null>(null);
  const newEntry = entry == null;

  // decrypting entry and setting the clearEntry (triggered by editing entry)
  useEffect(() => {
    if (user.device == null) {
      return;
    }
    let device = user.device;
    const masterKey = user.device.masterKey;
    if (entryStatus === EntryStatus.DECRYPTING && entry != null && clearEntry == null) {
      decryptFullEntry(entry).then((clearEntry) => {
        if (clearEntry != null) {
          setClearEntry(clearEntry);
        }
      }).catch((err) => {
        console.log(err);
      });
    }
    setEntryStatus(EntryStatus.INIT);
  }, [user, entry, entryStatus, clearEntry]);

  // encrypting entry (triggered by saving entry)
  useEffect(() => {
    if (user.device == null) {
      return;
    }
    let device = user.device;
    const masterKey = user.device.masterKey;
    if (formData && passwordEntries.status == PasswordEntriesStatus.SYNCED) {
      const clearEntry: ClearPasswordEntry = {
        key: '', // key is determined by the reducer for new entries
        item: formData.item,
        password: formData.password,
        safeNote: formData.secretNote,
        title: formData.title,
        username: formData.username,
        tags: formData.tags
      }
      encryptFullEntry(clearEntry).then((encryptedEntry) => {
        if (encryptedEntry) {
          if (newEntry) {
            passwordEntriesDispatch({ type: 'ADD_ENTRY', entry: encryptedEntry });
          } else {
            passwordEntriesDispatch({ type: 'UPDATE_ENTRY', entry: encryptedEntry, key: entry.key });
          }
        } else {
          console.log("failed to encrypt");
        }
      }).catch((err) => {
        console.log(err);
      });
      setFormData(null);
      setClearEntry(null);
    }
  }, [formData, passwordEntries, user, passwordEntriesDispatch, newEntry, entry]);

  const handleSubmitEntry = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    form.reset();
    const newEntry: FormData = {
      item: formData.get("item") as string,
      title: formData.get("title") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      secretNote: formData.get("secretNote") as string,
      tags: formData.get("tags") as string,
    };
    setFormData(newEntry);
    if(onSavedCallback) {
      onSavedCallback();
    }

  }
  const handleDiscardEntry = () => {
    setClearEntry(null);
    setFormData(null);
    if(onDiscardCallback) {
      onDiscardCallback();
    }
  }

  const handleEditEntry = () => {
    if (entry == null) {
      return;
    }
    setEntryStatus(EntryStatus.DECRYPTING);
  }

  let item = clearEntry != null? clearEntry.item: null;
  let title = clearEntry != null? clearEntry.title: null;
  let username = clearEntry != null? clearEntry.username: null;
  let password = clearEntry != null? clearEntry.password: null;
  let secretNote = clearEntry != null? clearEntry.safeNote: null;
  let tags = clearEntry != null? clearEntry.tags: null;
  return (
    <div className={styles.card} key={entry?.key} style={style}>
      { (newEntry || clearEntry != null) &&
        <form className={styles.entry} onSubmit={handleSubmitEntry}>
          <div className={styles.avatar_expanded}>
            <Image src="/images/transparent.png" height={100} width={100} alt="avatar" />
            <IoAddCircleOutline className={styles.icon}></IoAddCircleOutline>
          </div>
          <div className={styles.account_info}>
            <EntryInput name="item" label={"Item"} placeholder={""} type={"text"} defaultValue={item}/>
            <EntryInput name="title" label={"Title"} placeholder={""} type={"text"} defaultValue={title}/>
            <EntryInput name="username" label={"Username"} placeholder={""} type={"text"} defaultValue={username}/>
            <EntryInput name="password" label={"Password"} placeholder={""} type={"password"} defaultValue={password}/>
            <EntryInput name="tags" label={"Tags"} placeholder={""} type={"tags"} defaultValue={tags}/>
            <EntryInput name="secretNote" label={"Secrete Note"} placeholder={""} type={"secret"} defaultValue={secretNote}/>
          </div>
          <div className={styles.account_info_controls}>
            <button type="submit" className={styles.save_btn}>Save</button>
            <button type="reset" className={styles.discard_btn} onClick={handleDiscardEntry}>Discard</button>
          </div>
        </form>
      }
      { (!newEntry && clearEntry == null) &&
        <div className={styles.entry} >
          <div className={styles.avatar_mini}>
            <Image src="/images/transparent.png" height={50} width={50} alt="avatar" />
            <IoAddCircleOutline className={styles.icon}></IoAddCircleOutline>
          </div>
          <div className={styles.account_info}>
            <label className={styles.title}>{entry.title}</label>
            <div className={styles.credentials}>
              <div className={styles.tooltip}>
                <div className={styles.label}>{entry.username}</div>
                <span className={styles.tooltip_text}>Copy username</span>
              </div>
              <div className={styles.tooltip}>
                <input className={styles.password_shadow} title={"Copy to clipboard"} type="password" disabled={true} value={"password"}/>
                <span className={styles.tooltip_text}>Copy password</span>
              </div>
            </div>
          </div>
          <div className={styles.account_info_controls}>
            <button className={styles.edit_btn} onClick={handleEditEntry}>Edit</button>
          </div>
        </div>
      }
    </div>
  )
};
