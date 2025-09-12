import React, { useState } from 'react';
import styles from './EntryInput.module.scss';
import LabeledInput from 'components/ui/LabeledInput';
import { ClearPasswordEntry } from 'lib/trezor';
import VisibilityIcon from 'components/svg/ui/VisibilityIcon';
import Colors from 'styles/colors.module.scss';
import ToolTip from 'components/ui/ToolTip';
import RefreshIcon from 'components/svg/ui/RefreshIcon';
import generatePassword from 'lib/password';

type DefaultTypes = string | string[] | null;

interface PasswordInputProps {
  name: string;
  onChanged?: () => void;
  entry?: ClearPasswordEntry | null;
}
export default function PasswordInput({name, entry, onChanged }: PasswordInputProps) {
  const defaultValue = entry?.password ?? '';
  const [inputValue, setInputValue] = useState<DefaultTypes>(defaultValue);
  const [showSecret, setShowSecret] = useState(false);
  const handleToggleShowPassword = () => {
    setShowSecret(!showSecret);
  };
  const handleGeneratePassword = () => {
    if (onChanged) {
      onChanged();
    }
    const password = generatePassword(16);
    setInputValue(password);
  };
  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <LabeledInput type={"password"} label={'Password'} name={name} placeholder={''} defaultValue={defaultValue}></LabeledInput>
      </div>
      <div className={styles.container_row_no_wrap}>
        <ToolTip text={'Show password'} position={'top'} width={'150px'}>
          <button type={'button'} className={styles.control_btn} onClick={handleToggleShowPassword}>
            <VisibilityIcon fill={Colors.black} />
          </button>
        </ToolTip>
        <ToolTip text={'Generate password'} position={'top'} width={'150px'}>
          <button type={'button'} className={styles.control_btn} onClick={handleGeneratePassword}>
            <RefreshIcon fill={Colors.black} />
          </button>
        </ToolTip>
      </div>
    </div>
  )
}
