import React, { useState } from 'react';
import styles from './EntryInput.module.scss';
import MultiSelect from 'components/ui/MultiSelect';
import { useTagEntries } from '../../../../contexts/use-tag-entries';
import { getTags } from '../../../../contexts/reducers/tag-entries-reducer';

interface EntryInputProps {
  label: string;
  name: string;
  placeholder: string;
  defaultValue: string | null;
  type: 'text' | 'password' | 'secret' | 'tags';
}
export default function EntryInput({ label, name, placeholder, defaultValue, type }: EntryInputProps) {
  const tagEntries = useTagEntries();
  const [showSecret, setShowSecret] = useState(false);

  const handleToggleShowPassword = () => {
    setShowSecret(!showSecret);
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
            defaultValue={defaultValue != null ? defaultValue : ''}
          />
        )}
      </div>
      {type === 'password' && (
        <div className={styles.container_row_no_wrap}>
          <button type={'button'} className={styles.control_btn} onClick={handleToggleShowPassword}>
            +
          </button>
          <button type={'button'} className={styles.control_btn}>
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
