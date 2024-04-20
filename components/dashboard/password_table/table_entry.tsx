import React, { FormEvent, useEffect, useState } from "react";
import styles from "./table_entry.module.scss";
import Image from "next/image";
import { IoAddCircleOutline } from "react-icons/io5";
import EntryInput from "./table_entry/entry_input";
import { useUser } from "../../../contexts/user";
import {
  ClearPasswordEntry,
  decryptFullEntry,
  encryptFullEntry,
} from "../../../lib/trezor";
import {
  usePasswordEntries,
  usePasswordEntriesDispatch,
} from "../../../contexts/password_entries";
import {
  PasswordEntriesStatus,
  SafePasswordEntry,
} from "../../../contexts/reducers/password_entries";
import { getUiIconPath } from '../../../lib/Images'

interface Init {
  type: "INIT";
}
interface Decrypting {
  type: "DECRYPTING";
}
interface Decrypted {
  type: "DECRYPTED";
  clearEntry: ClearPasswordEntry;
}
interface FormSubmitted {
  type: "FORM_SUBMITTED";
  formData: FormData;
}
interface Error {
  type: "ERROR";
  error: string;
}
type EntryState = Init | Decrypting | Decrypted | FormSubmitted | Error;

interface FormData {
  item: string;
  title: string;
  username: string;
  password: string;
  secretNote: string;
  tags: string;
}

interface NewEntry {
  type: "NEW_ENTRY";
}
interface ViewEntry {
  type: "VIEW_ENTRY";
  entry: SafePasswordEntry;
}
interface Hidden {
  type: "HIDDEN";
}

interface TableEntryProps {
  row: NewEntry | ViewEntry | Hidden;
  onDiscardCallback?: () => void;
  onSavedCallback: () => void;
}
export default function TableEntry({
  onDiscardCallback,
  onSavedCallback,
  row,
}: TableEntryProps) {
  const passwordEntries = usePasswordEntries();
  const passwordEntriesDispatch = usePasswordEntriesDispatch();
  const [entryState, setEntryState] = useState<EntryState>({ type: "INIT" });
  const [copiedUsername, setCopiedUsername] = useState(false);

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
    setEntryState({ type: "FORM_SUBMITTED", formData: newEntry });
    if (passwordEntries.status == PasswordEntriesStatus.SYNCED) {
      const clearEntry: ClearPasswordEntry = {
        key: "", // key is determined by the reducer for new entries
        item: newEntry.item,
        password: newEntry.password,
        safeNote: newEntry.secretNote,
        title: newEntry.title,
        username: newEntry.username,
        tags: newEntry.tags,
      };
      encryptFullEntry(clearEntry)
        .then((encryptedEntry) => {
          if (encryptedEntry) {
            if (row.type === "NEW_ENTRY" || row.type === "HIDDEN") {
              passwordEntriesDispatch({
                type: "ADD_ENTRY",
                entry: encryptedEntry,
              });
            }
            if (row.type === "VIEW_ENTRY") {
              passwordEntriesDispatch({
                type: "UPDATE_ENTRY",
                entry: encryptedEntry,
                key: row.entry.key,
              });
            }
          }
          setEntryState({ type: "INIT" });
          onSavedCallback();
        })
        .catch((err) => {
          setEntryState({ type: "ERROR", error: "Error encrypting entry" });
        });
    } else {
      setEntryState({
        type: "ERROR",
        error: "Password entries are not synced yet",
      });
    }
  };
  const handleDiscardEntry = () => {
    setEntryState({ type: "INIT" });
    if (onDiscardCallback) {
      onDiscardCallback();
    }
  };
  const handleEditEntry = () => {
    if (row.type === "VIEW_ENTRY") {
      setEntryState({ type: "DECRYPTING" });
      const safeEntry = row.entry;
      decryptFullEntry(safeEntry)
        .then((clearEntry) => {
          if (clearEntry != null) {
            setEntryState({ type: "DECRYPTED", clearEntry: clearEntry });
          }
        })
        .catch((err) => {
          setEntryState({ type: "ERROR", error: err });
        });
    }
    return; // edit is only possible when mode is VIEW_ENTRY
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy to clipboard', err);
    });
  };

  const expanded =
    row.type === "NEW_ENTRY" ||
    (row.type === "VIEW_ENTRY" &&
      (entryState.type === "DECRYPTED" ||
        entryState.type === "FORM_SUBMITTED"));
  const clearEntry =
    entryState.type === "DECRYPTED" ? entryState.clearEntry : null;
  const formData =
    entryState.type === "FORM_SUBMITTED" ? entryState.formData : null;

  const item = clearEntry?.item ?? formData?.item ?? "";
  const title = clearEntry?.title ?? formData?.title ?? "";
  const username = clearEntry?.username ?? formData?.username ?? "";
  const password = clearEntry?.password ?? formData?.password ?? "";
  const secretNote = clearEntry?.safeNote ?? formData?.secretNote ?? "";
  const tags = clearEntry?.tags ?? formData?.tags ?? "";
  return (
    <div className={styles.card}>
      {expanded && (
        <form className={styles.entry} onSubmit={handleSubmitEntry}>
          <div className={styles.avatar_expanded}>
            <Image
              src={getUiIconPath("transparent.png")}
              height={100}
              width={100}
              alt="avatar"
            />
            <IoAddCircleOutline className={styles.icon}></IoAddCircleOutline>
          </div>
          <div className={styles.account_info}>
            <EntryInput
              name="item"
              label={"Item"}
              placeholder={""}
              type={"text"}
              defaultValue={item}
            />
            <EntryInput
              name="title"
              label={"Title"}
              placeholder={""}
              type={"text"}
              defaultValue={title}
            />
            <EntryInput
              name="username"
              label={"Username"}
              placeholder={""}
              type={"text"}
              defaultValue={username}
            />
            <EntryInput
              name="password"
              label={"Password"}
              placeholder={""}
              type={"password"}
              defaultValue={password}
            />
            <EntryInput
              name="tags"
              label={"Tags"}
              placeholder={""}
              type={"tags"}
              defaultValue={tags}
            />
            <EntryInput
              name="secretNote"
              label={"Secrete Note"}
              placeholder={""}
              type={"secret"}
              defaultValue={secretNote}
            />
          </div>
          <div className={styles.account_info_controls}>
            <button
              type="submit"
              disabled={entryState.type === "FORM_SUBMITTED"}
              className={styles.save_btn}
            >
              {entryState.type === "FORM_SUBMITTED" ? "Saving" : "Save"}
            </button>
            <button
              type="reset"
              className={styles.discard_btn}
              onClick={handleDiscardEntry}
            >
              Discard
            </button>
          </div>
        </form>
      )}
      {!expanded && row.type === "VIEW_ENTRY" && (
        <div className={styles.entry}>
          <div className={styles.avatar_mini}>
            <Image
              src={getUiIconPath("transparent.png")}
              height={50}
              width={50}
              alt="avatar"
            />
            <IoAddCircleOutline className={styles.icon}></IoAddCircleOutline>
          </div>
          <div className={styles.account_info}>
            <label className={styles.title}>{row.entry.title}</label>
            <div className={styles.credentials}>
              <div className={styles.tooltip}>
                <div className={styles.label} onClick={() => copyToClipboard(row.entry.username)}>{row.entry.username}</div>
                <span className={styles.tooltip_text}>{copiedUsername? 'Copied!' : 'Copy username'}</span>
              </div>
              <div className={styles.tooltip}>
                <input
                  className={styles.password_shadow}
                  title={"Copy to clipboard"}
                  type="password"
                  disabled={true}
                  value={"password"}
                />
                <span className={styles.tooltip_text}>Copy password</span>
              </div>
            </div>
          </div>
          <div className={styles.account_info_controls}>
            <button className={styles.edit_btn} onClick={handleEditEntry}>
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
