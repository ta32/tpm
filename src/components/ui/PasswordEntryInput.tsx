import styles from './PasswordEntryInput.module.scss';
import React, { useState } from 'react';
import ToolTip from 'components/ui/ToolTip';

interface TextInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  mandatory?: boolean;
  defaultValue?: string | undefined;
  errMsg?: string;
}

export default function PasswordEntryInput({ label, name, placeholder, defaultValue, mandatory, type, errMsg }: TextInputProps) {
  const [inputValue, setInputValue] = useState<string>(defaultValue ?? '');
  const [showToolTip, setShowToolTip] = useState<boolean>(false);

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.currentTarget.checkValidity()) {
      setShowToolTip(false);
    } else {
      setShowToolTip(true);
    }
  };

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.currentTarget.checkValidity()) {
      setShowToolTip(false);
    }
    setInputValue(e.currentTarget.value);
  };

  const renderInput = () => {
    const msg = errMsg ?? '';
    const inputElement = (
      <input
        data-cy={`input-${name.toLowerCase()}`}
        autoComplete="off"
        autoCorrect="off"
        name={name}
        className={`${name.toLowerCase()}-input ${styles.input} ${showToolTip ? styles.invalid : ''}`}
        type={type ?? 'text'}
        placeholder={placeholder ?? ''}
        value={inputValue != null ? inputValue : ''}
        required={mandatory}
        onInvalid={handleInvalid}
        onChange={onChange}
      />
    );
    if (mandatory) {
      return (
        <ToolTip text={msg} position={'right'} mode={'manual'} active={showToolTip} width={'150px'}>
          {inputElement}
        </ToolTip>
      );
    }
    return inputElement;
  };

  return (
    <>
      <div className={styles.label}>{label}</div>
      {renderInput()}
    </>
  );
}
