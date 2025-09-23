import React from 'react';
import MultiSelect from 'components/ui/MultiSelect';
import styles from 'components/dashboard/PasswordManager/PasswordTable/PasswordEntry/ExpandedEntry.module.scss';
import { getTags } from 'contexts/reducers/tag-entries.reducer';
import { useTagEntries } from 'contexts/tag-entries.context';

interface TagInputProps {
  name: string;
  label: string;
  initialTags?: string[];
}

export default function TagInput({ name, label, initialTags }: TagInputProps) {
  const tagEntries = useTagEntries();

  const tags = getTags(tagEntries)
    .filter((tag) => tag.id != '0')
    .map((tag) => ({ label: tag.title, value: tag.id }));

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <label className={styles.label}>{label}</label>
        <MultiSelect name={name} className={styles.input} selectedValues={initialTags} items={tags} />
      </div>
    </div>
  );
}
