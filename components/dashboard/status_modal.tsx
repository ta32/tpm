import React, { useState } from "react";
import { useTagEntries } from "../../contexts/tag_entries";
import { usePasswordEntries } from "../../contexts/password_entries";
import { PasswordEntriesStatus } from "../../contexts/reducers/password_entries";
import { TagsStatus } from "../../contexts/reducers/tag_entries";
import styles from "./loader_modal.module.scss";
import Image from "next/image";
import ProgressModal from "../ui/progress_modal";

// Maybe this component should be removed?

export default function StatusModal() {
  const tagEntries = useTagEntries();
  const passwordEntries = usePasswordEntries();

  const saveRequired =
    passwordEntries.status === PasswordEntriesStatus.SAVE_REQUIRED ||
    tagEntries.status === TagsStatus.SAVE_REQUIRED;

  const saved =
    passwordEntries.status === PasswordEntriesStatus.SAVED ||
    tagEntries.status === TagsStatus.SAVED;

  const active = saveRequired || saved;

  return <ProgressModal active={active} progress={saveRequired} />;
}
