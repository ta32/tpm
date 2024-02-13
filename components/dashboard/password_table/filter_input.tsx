import React, { ChangeEvent, FormEvent, } from 'react'
import styles from "./filter_input.module.scss";

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

  return (
    <span className={styles.filter}>
      <form onSubmit={onSubmit}>
        <input
          name="filter"
          className={styles.filter}
          type="text"
          placeholder={placeholder}
          onChange={onChange}
        />
      </form>
    </span>
  );
}
