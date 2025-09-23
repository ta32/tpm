import React from 'react';
import PasswordEntryInput from 'components/ui/PasswordEntryInput';
import styles from 'components/dashboard/PasswordManager/PasswordTable/PasswordEntry/ExpandedEntry.module.scss';

interface TextInputProps {
  name: string;
  label: string;
  placeholder?: string;
  mandatory?: boolean;
  defaultValue?: string | undefined;
  errMsg?: string;
}

export default function TextInput({ label, name, placeholder, defaultValue, mandatory, errMsg }: TextInputProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <PasswordEntryInput
          name={name}
          label={label}
          placeholder={placeholder}
          defaultValue={defaultValue}
          mandatory={mandatory}
          errMsg={errMsg}
        ></PasswordEntryInput>
      </div>
    </div>
  );
}
