import React, { useState } from 'react';
import styles from './EntryInput.module.scss';
import MultiSelect from 'components/ui/MultiSelect';
import { useTagEntries } from 'contexts/use-tag-entries';
import { getTags } from 'contexts/reducers/tag-entries-reducer';
import generatePassword from 'lib/password';
import ToolTip from '../../../ui/ToolTip';

type DefaultTypes = string | string[] | null;
interface EntryInputProps {
  label: string;
  name: string;
  placeholder: string;
  mandatory?: boolean;
  invalid?: boolean;
  defaultValue: DefaultTypes;
  type: 'text' | 'password' | 'secret' | 'tags';
}
export default function EntryInput({
  label,
  name,
  placeholder,
  defaultValue,
  type,
  mandatory,
  invalid,
}: EntryInputProps) {
  const tagEntries = useTagEntries();
  const [inputValue, setInputValue] = useState<DefaultTypes>(defaultValue);
  const [showSecret, setShowSecret] = useState(false);

  const handleToggleShowPassword = () => {
    setShowSecret(!showSecret);
  };

  const handleGeneratePassword = () => {
    const password = generatePassword(16);
    setInputValue(password);
  };

  const getSelectedValues = (inputValue: string | string[] | null): string[] => {
    return Array.isArray(inputValue) ? inputValue : [''];
  };

  const passwordInputType = showSecret ? 'text' : 'password';

  const tags = getTags(tagEntries)
    .filter((tag) => tag.id != '0')
    .map((tag) => ({ label: tag.title, value: tag.id }));

  const renderInput = (mandatory: boolean) => {
    const inputElement = (
      <input
        autoComplete="off"
        autoCorrect="off"
        name={name}
        className={`${styles.input} ${invalid ? styles.invalid : ''}`}
        type={type == 'text' ? 'text' : passwordInputType}
        placeholder={placeholder}
        defaultValue={inputValue != null ? inputValue : ''}
        required={mandatory}
      />
    );
    if (mandatory) {
      return (
        <ToolTip text={'Item is mandatory'} position={'right'} mode={'manual'} active={invalid} width={'150px'}>
          {inputElement}
        </ToolTip>
      );
    }
    return inputElement;
  };

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <label className={styles.label}>{label}</label>
        {type === 'tags' && (
          <MultiSelect
            name={name}
            className={styles.input}
            selectedValues={getSelectedValues(inputValue)}
            items={tags}
          />
        )}
        {type != 'tags' && renderInput(mandatory ?? false)}
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
