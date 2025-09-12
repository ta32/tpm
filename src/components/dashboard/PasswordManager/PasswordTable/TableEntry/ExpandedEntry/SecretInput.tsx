import React, { useState } from 'react';
import styles from './EntryInput.module.scss';
import LabeledInput from 'components/ui/LabeledInput';
import { ClearPasswordEntry } from 'lib/trezor';
import VisibilityIcon from 'components/svg/ui/VisibilityIcon';
import Colors from 'styles/colors.module.scss';

interface SecretInputProps {
  name: string;
  entry?: ClearPasswordEntry | null
}

export default function SecretInput({name, entry }: SecretInputProps) {
  const [showSecret, setShowSecret] = useState(false);
  const handleToggleShowSecret = () => {
    setShowSecret(!showSecret);
  };
  const defaultValue = entry?.safeNote ?? '';
  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <LabeledInput type={"secret"} label={'Secret Note'} name={name} placeholder={''} defaultValue={defaultValue}></LabeledInput>
      </div>
      <button type={'button'} className={styles.control_btn} onClick={handleToggleShowSecret}>
        <VisibilityIcon fill={Colors.black} />
      </button>
    </div>
  )
}
