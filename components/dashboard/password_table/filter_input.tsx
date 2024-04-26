import React, { ChangeEvent, FormEvent, useState, } from 'react'
import styles from "./filter_input.module.scss";
import Image from 'next/image'
import { getUiIconPath, UI_ICON } from '../../../lib/Images'

interface FilterInputProps {
  placeholder: string;
  onChangeCallback: (value: string) => void;
}

export default function FilterInput({ placeholder, onChangeCallback }: FilterInputProps) {
  const [filter, setFilter] = useState("")

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    onChangeCallback(formData.get("filter") as string);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    onChangeCallback(e.target.value);
  }

  const onClearFilter = () => {
    setFilter("");
    onChangeCallback("");
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
            value={filter}
            onChange={onChange}
          />
          {filter && (
            <Image
              className={`${styles.icon_white} ${styles.clear_button}`}
              src={getUiIconPath(UI_ICON.CLOSE)}
              alt={'close'}
              height={closeButtonSize}
              width={closeButtonSize}
              onClick={onClearFilter}
              style={{marginRight: '10px'}}
            />
          )}
        </div>
      </form>
    </span>
  );
}
