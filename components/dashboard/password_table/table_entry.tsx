import React, { FormEvent, useEffect, useState } from 'react'
import styles from './table_entry.module.scss'
import Image from 'next/image'
import { IoAddCircleOutline } from 'react-icons/io5'
import EntryInput from './table_entry/entry_input'
import { useUser } from '../../../contexts/user'
import { ClearPasswordEntry, decryptFullEntry, encryptFullEntry } from '../../../lib/trezor'
import { usePasswordEntries, usePasswordEntriesDispatch } from '../../../contexts/password_entries'
import { PasswordEntriesStatus, SafePasswordEntry } from '../../../contexts/reducers/password_entries'

interface Init {
  type: 'INIT';
}
interface Decrypting {
  type: 'DECRYPTING';
}
interface Decrypted {
  type: 'DECRYPTED';
  clearEntry: ClearPasswordEntry;
}
interface FormSubmitted {
  type: 'FORM_SUBMITTED';
  formData: FormData;
}
interface Error {
  type: 'ERROR';
  error: string;
}
type EntryState = Init | Decrypting | Decrypted | FormSubmitted  | Error

interface FormData {
  item: string;
  title: string;
  username: string;
  password: string;
  secretNote: string;
  tags: string;
}

interface NewEntry {
  type: 'NEW_ENTRY';
}
interface ViewEntry {
  type: 'VIEW_ENTRY';
  entry: SafePasswordEntry;
}
interface Hidden {
  type: 'HIDDEN';
}

interface TableEntryProps {
  mode: NewEntry  | ViewEntry | Hidden;
  onDiscardCallback?: () => void;
  onSavedCallback?: () => void;
}
export default function TableEntry({ onDiscardCallback, onSavedCallback, mode }: TableEntryProps) {
  const user = useUser();
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const [entryState, setEntryState] = useState<EntryState>({type: 'INIT'});

  useEffect(() => {
    if (entryState.type === 'DECRYPTING' && mode.type === 'VIEW_ENTRY') {
      const safeEntry = mode.entry;
      decryptFullEntry(safeEntry).then((clearEntry) => {
        if (clearEntry != null) {
          setEntryState({type: 'DECRYPTED', clearEntry: clearEntry});
        }
      }).catch((err) => {
        setEntryState({type: 'ERROR', error: err});
      });
    }
  }, [entryState, mode]);

  // encrypting entry (triggered by saving entry)
  useEffect(() => {
    if (entryState.type === 'FORM_SUBMITTED' && passwordEntries.status == PasswordEntriesStatus.SYNCED) {
      const formData = entryState.formData;
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
          if (mode.type === 'NEW_ENTRY' || mode.type === 'HIDDEN') {
            passwordEntriesDispatch({ type: 'ADD_ENTRY', entry: encryptedEntry });
          }
          if (mode.type === 'VIEW_ENTRY') {
            passwordEntriesDispatch({ type: 'UPDATE_ENTRY', entry: encryptedEntry, key: mode.entry.key });
          }
        }
      }).catch((err) => {
        setEntryState({type: 'ERROR', error: err});
      });
      setEntryState({type: 'INIT'});
    }
  }, [passwordEntries.status === PasswordEntriesStatus.SYNCED, user, passwordEntriesDispatch, entryState, mode]);

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
    setEntryState({type: 'FORM_SUBMITTED', formData: newEntry})
    if(onSavedCallback) {
      onSavedCallback();
    }

  }
  const handleDiscardEntry = () => {
    setEntryState({type: 'INIT'})
    if(onDiscardCallback) {
      onDiscardCallback();
    }
  }

  const handleEditEntry = () => {
    setEntryState({type: 'DECRYPTING'})
  }

  const expanded = mode.type === 'NEW_ENTRY' ||
                            mode.type === 'VIEW_ENTRY' && entryState.type === 'DECRYPTED'
  const clearEntry = entryState.type === 'DECRYPTED' ? entryState.clearEntry : null;

  return (
    <div className={styles.card} key={mode.type === 'VIEW_ENTRY' ? mode.entry.key : 'newEntry'}>
      { expanded &&
        <form className={styles.entry} onSubmit={handleSubmitEntry}>
          <div className={styles.avatar_expanded}>
            <Image src="/images/transparent.png" height={100} width={100} alt="avatar" />
            <IoAddCircleOutline className={styles.icon}></IoAddCircleOutline>
          </div>
          <div className={styles.account_info}>
            <EntryInput name="item" label={"Item"} placeholder={""} type={"text"} defaultValue={clearEntry?.item ?? null}/>
            <EntryInput name="title" label={"Title"} placeholder={""} type={"text"} defaultValue={clearEntry?.title ?? null}/>
            <EntryInput name="username" label={"Username"} placeholder={""} type={"text"} defaultValue={clearEntry?.username ?? null}/>
            <EntryInput name="password" label={"Password"} placeholder={""} type={"password"} defaultValue={clearEntry?.password ?? null}/>
            <EntryInput name="tags" label={"Tags"} placeholder={""} type={"tags"} defaultValue={clearEntry?.tags ?? null}/>
            <EntryInput name="secretNote" label={"Secrete Note"} placeholder={""} type={"secret"} defaultValue={clearEntry?.safeNote ?? null}/>
          </div>
          <div className={styles.account_info_controls}>
            <button type="submit" className={styles.save_btn}>Save</button>
            <button type="reset" className={styles.discard_btn} onClick={handleDiscardEntry}>Discard</button>
          </div>
        </form>
      }
      { (!expanded && mode.type === 'VIEW_ENTRY') &&
        <div className={styles.entry} >
          <div className={styles.avatar_mini}>
            <Image src="/images/transparent.png" height={50} width={50} alt="avatar" />
            <IoAddCircleOutline className={styles.icon}></IoAddCircleOutline>
          </div>
          <div className={styles.account_info}>
            <label className={styles.title}>{mode.entry.title}</label>
            <div className={styles.credentials}>
              <div className={styles.tooltip}>
                <div className={styles.label}>{mode.entry.username}</div>
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
