import styles from './PasswordEntryInput.module.scss';
import React, { useEffect, useState } from 'react';
import ToolTip from 'components/ui/ToolTip';
import { value } from '@trezor/utxo-lib/lib/payments/lazy';

interface PasswordEntryInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  mandatory?: boolean;
  value?: string;
  defaultValue?: string | undefined;
  errMsg?: string;
  onInputValueChange?: (value: string) => void;
}

export default function PasswordEntryInput({
  label,
  name,
  placeholder,
  value,
  defaultValue,
  mandatory,
  type,
  errMsg,
  onInputValueChange
}: PasswordEntryInputProps) {
  const [inputValue, setInputValue] = useState<string>(defaultValue ?? '');
  const [showToolTip, setShowToolTip] = useState<boolean>(false);

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    setShowToolTip(!e.currentTarget.checkValidity());
  };

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.currentTarget.checkValidity()) {
      setShowToolTip(false);
    }
    if (onInputValueChange) {
      onInputValueChange(e.currentTarget.value);
    } else {
      setInputValue(e.currentTarget.value);
    }
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
        value={value? value : inputValue}
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
