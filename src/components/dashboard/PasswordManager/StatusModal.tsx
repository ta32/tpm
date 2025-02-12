import React, { useState } from 'react';
import { useTagEntries } from 'contexts/tag-entries.context';
import { usePasswordEntries } from 'contexts/password-entries.context';
import { PasswordEntriesStatus } from 'contexts/reducers/password-entries.reducer';
import { TagsStatus } from 'contexts/reducers/tag-entries.reducer';
import ProgressModal from 'components/ui/ProgressModal';

// TODO Maybe this component should be removed?

export default function StatusModal() {
  const tagEntries = useTagEntries();
  const passwordEntries = usePasswordEntries();

  const saveRequired =
    passwordEntries.status === PasswordEntriesStatus.SAVE_REQUIRED || tagEntries.status === TagsStatus.SAVE_REQUIRED;

  const saved = passwordEntries.status === PasswordEntriesStatus.SAVED || tagEntries.status === TagsStatus.SAVED;

  const active = saveRequired || saved;

  return <ProgressModal active={active} progress={saveRequired} />;
}
