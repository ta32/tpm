import styles from './EntryInput.module.scss';
import React from 'react';
import LabeledInput from 'components/ui/LabeledInput';

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
        <LabeledInput name={name} label={label} placeholder={placeholder} defaultValue={defaultValue} mandatory={mandatory} errMsg={errMsg}></LabeledInput>
      </div>
    </div>
  );
}
