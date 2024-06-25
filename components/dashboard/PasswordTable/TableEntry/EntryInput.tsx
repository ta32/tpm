import React, { useState } from 'react';
import styles from './EntryInput.module.scss';
import MultiSelect from 'components/ui/MultiSelect';
import { useTagEntries } from 'contexts/use-tag-entries';
import { getTags } from 'contexts/reducers/tag-entries-reducer';
import generatePassword from 'lib/password';

interface EntryInputProps {
  label: string;
  name: string;
  placeholder: string;
  defaultValue: string | null;
  type: 'text' | 'password' | 'secret' | 'tags';
}
export default function EntryInput({ label, name, placeholder, defaultValue, type }: EntryInputProps) {
  const tagEntries = useTagEntries();
  const [inputValue, setInputValue] = useState<string | null>(defaultValue);
  const [showSecret, setShowSecret] = useState(false);

  const handleToggleShowPassword = () => {
    setShowSecret(!showSecret);
  };

  const handleGeneratePassword = () => {
    const password = generatePassword(16);
    setInputValue(password);
  };

  const passwordInputType = showSecret ? 'text' : 'password';
  const selectedValues = defaultValue ? defaultValue.split(' ') : undefined;
  const tags = getTags(tagEntries)
    .filter((tag) => tag.id != '0')
    .map((tag) => ({ label: tag.title, value: tag.id }));

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <label className={styles.label}>{label}</label>
        {type === 'tags' && (
          <MultiSelect name={name} className={styles.input} selectedValues={selectedValues} items={tags} />
        )}
        {type != 'tags' && (
          <input
            autoComplete="off"
            autoCorrect="off"
            name={name}
            className={styles.input}
            type={type == 'text' ? 'text' : passwordInputType}
            placeholder={placeholder}
            defaultValue={inputValue != null ? inputValue : ''}
          />
        )}
      </div>
      {type === 'password' && (
        <div className={styles.container_row_no_wrap}>
          <button type={'button'} className={styles.control_btn} onClick={handleToggleShowPassword}>
            +
          </button>
          <button type={'button'} className={styles.control_btn} onClick={handleGeneratePassword}>
            #
          </button>
        </div>
      )}
      {type === 'secret' && (
        <button type={'button'} className={styles.control_btn} onClick={handleToggleShowPassword}>
          #
        </button>
      )}
    </div>
  );
}
