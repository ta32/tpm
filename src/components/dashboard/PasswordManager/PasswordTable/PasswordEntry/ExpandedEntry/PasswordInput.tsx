import React, { useState } from 'react';
import PasswordEntryInput from 'components/ui/PasswordEntryInput';
import { ClearPasswordEntry } from 'lib/trezor';
import VisibilityIcon from 'components/svg/ui/VisibilityIcon';
import ToolTip from 'components/ui/ToolTip';
import RefreshIcon from 'components/svg/ui/RefreshIcon';
import generatePassword from 'lib/password';
import Colors from 'styles/colors.module.scss';
import styles from 'components/dashboard/PasswordManager/PasswordTable/PasswordEntry/ExpandedEntry.module.scss';

interface PasswordInputProps {
  name: string;
  onPasswordGenerated?: () => void;
  entry?: ClearPasswordEntry | null;
}
export default function PasswordInput({ name, entry, onPasswordGenerated }: PasswordInputProps) {
  const defaultValue = entry?.password ?? '';
  const [inputValue, setInputValue] = useState<string>(defaultValue);
  const [showSecret, setShowSecret] = useState(false);
  const handleToggleShowPassword = () => {
    setShowSecret(!showSecret);
  };
  const handleGeneratePassword = () => {
    if (onPasswordGenerated) {
      onPasswordGenerated();
    }
    const password = generatePassword(16);
    setInputValue(password);
  };

  const onInputValueChange = (value: string) => {
    setInputValue(value);
  };

  const passwordInputType = showSecret ? 'text' : 'password';

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <PasswordEntryInput
          type={passwordInputType}
          label={'Password'}
          name={name}
          placeholder={''}
          value={inputValue}
          onInputValueChange={onInputValueChange}
        ></PasswordEntryInput>
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
  );
}
