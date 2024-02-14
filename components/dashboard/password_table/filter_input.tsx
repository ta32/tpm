import React, { ChangeEvent, FormEvent, } from 'react'
import styles from "./filter_input.module.scss";
import Image from 'next/image'
import { getUiIconPath, UI_CLOSE, UI_MORE } from '../../../lib/icons'

interface FilterInputProps {
  placeholder: string;
  onChangeCallback: (value: string) => void;
}

export default function FilterInput({ placeholder, onChangeCallback }: FilterInputProps) {

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    onChangeCallback(formData.get("filter") as string);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChangeCallback(e.target.value);
  }

  const closeButtonSize = parseInt(styles.close_button_size);

  return (
    <span className={styles.filter}>
      <form onSubmit={onSubmit}>
        <div className={styles.filter_wrapper}>
          <input
            name="filter"
            className={styles.filter}
            type="text"
            placeholder={placeholder}
            onChange={onChange}
          />
            <Image
              className={`${styles.icon_white} ${styles.clear_button}`}
              src={getUiIconPath(UI_CLOSE)}
              alt={'close'}
              height={closeButtonSize}
              width={closeButtonSize}
            />
        </div>
      </form>
    </span>
  );
}
